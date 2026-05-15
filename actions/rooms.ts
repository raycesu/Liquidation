"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { requireOnboardedUser } from "@/lib/auth"
import { assertRoomJoinable } from "@/lib/competition-guards"
import { getSql } from "@/lib/db"
import type { ActionResult, Room } from "@/lib/types"

const MAX_ROOM_DESCRIPTION_WORDS = 25

const normalizeRoomDescription = (description: string) => description.trim().replace(/\s+/g, " ")

const getDescriptionWordCount = (description: string) => description.split(/\s+/).filter(Boolean).length

const createRoomSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters").max(80),
  startingBalance: z.coerce.number().positive("Starting balance must be positive").default(10000),
  startDate: z.string().min(1, "Choose a start date"),
  endDate: z.string().min(1, "Choose an end date"),
  description: z
    .string()
    .transform((value) => {
      const description = normalizeRoomDescription(value)

      return description.length > 0 ? description : null
    })
    .refine(
      (description) => !description || getDescriptionWordCount(description) <= MAX_ROOM_DESCRIPTION_WORDS,
      `Description must be ${MAX_ROOM_DESCRIPTION_WORDS} words or fewer`,
    ),
})

const joinCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z0-9]{6}$/.test(value), "Enter a valid 6-character room code")

const ROOM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const ROOM_CODE_LENGTH = 6
const ROOM_CODE_MAX_ATTEMPTS = 8

type CreateRoomData = {
  roomId: string
}

type JoinRoomData = {
  roomId: string
}

const generateJoinCode = () =>
  Array.from({ length: ROOM_CODE_LENGTH }, () => {
    const index = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)
    return ROOM_CODE_ALPHABET.charAt(index)
  }).join("")

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === "23505"

export const createRoom = async (
  _previousState: ActionResult<CreateRoomData>,
  formData: FormData,
): Promise<ActionResult<CreateRoomData>> => {
  const parsed = createRoomSchema.safeParse({
    name: formData.get("name"),
    startingBalance: formData.get("startingBalance"),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    description: String(formData.get("description") ?? ""),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid room details" }
  }

  const startDate = new Date(parsed.data.startDate)
  const endDate = new Date(parsed.data.endDate)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { ok: false, error: "Choose valid competition dates" }
  }

  if (endDate <= startDate) {
    return { ok: false, error: "End date must be after the start date" }
  }

  if (endDate <= new Date()) {
    return { ok: false, error: "End date must be in the future" }
  }

  const user = await requireOnboardedUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to create a room" }
  }

  const sql = getSql()
  let room: Room | null = null

  for (let attempt = 0; attempt < ROOM_CODE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const joinCode = generateJoinCode()
      const rooms = (await sql`
        insert into rooms (creator_id, name, description, join_code, starting_balance, start_date, end_date, is_active)
        values (
          ${user.id},
          ${parsed.data.name},
          ${parsed.data.description},
          ${joinCode},
          ${parsed.data.startingBalance},
          ${startDate.toISOString()},
          ${endDate.toISOString()},
          true
        )
        returning
          id::text,
          creator_id,
          name,
          description,
          join_code,
          starting_balance::float8 as starting_balance,
          start_date::text,
          end_date::text,
          is_active,
          created_at::text
      `) as Room[]
      room = rooms[0] ?? null
      break
    } catch (error) {
      if (isUniqueViolation(error)) {
        continue
      }

      throw error
    }
  }

  if (!room) {
    return { ok: false, error: "Unable to create room" }
  }

  const participants = (await sql`
    insert into room_participants (room_id, user_id, available_margin, total_equity)
    values (${room.id}, ${user.id}, ${room.starting_balance}, ${room.starting_balance})
    returning id::text
  `) as { id: string }[]

  if (!participants[0]) {
    return { ok: false, error: "Room created, but participant setup failed" }
  }

  revalidatePath("/dashboard")
  redirect(`/room/${room.id}`)
}

export const joinRoom = async (joinCode: string): Promise<ActionResult<JoinRoomData>> => {
  const parsedJoinCode = joinCodeSchema.safeParse(joinCode)

  if (!parsedJoinCode.success) {
    return { ok: false, error: parsedJoinCode.error.issues[0]?.message ?? "Invalid room code" }
  }

  const user = await requireOnboardedUser()

  if (!user) {
    return { ok: false, error: "Sign in before joining a room" }
  }

  const sql = getSql()
  const rooms = (await sql`
    select
      id::text,
      creator_id,
      name,
      description,
      join_code,
      starting_balance::float8 as starting_balance,
      start_date::text as start_date,
      end_date::text as end_date,
      is_active,
      created_at::text as created_at
    from rooms
    where join_code = ${parsedJoinCode.data}
    limit 1
  `) as Room[]
  const room = rooms[0]

  if (!room) {
    return { ok: false, error: "Room not found" }
  }

  const joinableGuard = assertRoomJoinable(room)

  if (!joinableGuard.ok) {
    return joinableGuard
  }

  await sql`
    insert into room_participants (room_id, user_id, available_margin, total_equity)
    values (${room.id}, ${user.id}, ${room.starting_balance}, ${room.starting_balance})
    on conflict (room_id, user_id) do nothing
  `

  revalidatePath(`/room/${room.id}`)
  revalidatePath("/dashboard")
  return { ok: true, data: { roomId: room.id } }
}

export const joinRoomAction = async (
  _previousState: ActionResult<JoinRoomData>,
  formData: FormData,
): Promise<ActionResult<JoinRoomData>> => {
  const joinCode = String(formData.get("joinCode") ?? "")
  const result = await joinRoom(joinCode)

  if (result.ok) {
    redirect(`/room/${result.data.roomId}`)
  }

  return result
}
