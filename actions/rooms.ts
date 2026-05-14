"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import type { ActionResult, Room } from "@/lib/types"

const createRoomSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters").max(80),
  startingBalance: z.coerce.number().positive("Starting balance must be positive").default(10000),
  endDate: z.string().min(1, "Choose an end date"),
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
    endDate: formData.get("endDate"),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid room details" }
  }

  const endDate = new Date(parsed.data.endDate)

  if (Number.isNaN(endDate.getTime()) || endDate <= new Date()) {
    return { ok: false, error: "End date must be in the future" }
  }

  const user = await requireCurrentUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to create a room" }
  }

  const sql = getSql()
  let room: Room | null = null

  for (let attempt = 0; attempt < ROOM_CODE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const joinCode = generateJoinCode()
      const rooms = (await sql`
        insert into rooms (creator_id, name, join_code, starting_balance, start_date, end_date, is_active)
        values (${user.id}, ${parsed.data.name}, ${joinCode}, ${parsed.data.startingBalance}, now(), ${endDate.toISOString()}, true)
        returning
          id::text,
          creator_id,
          name,
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

  const user = await requireCurrentUser()

  if (!user) {
    return { ok: false, error: "Sign in before joining a room" }
  }

  const sql = getSql()
  const rooms = (await sql`
    select id::text, starting_balance::float8 as starting_balance, is_active
    from rooms
    where join_code = ${parsedJoinCode.data}
    limit 1
  `) as Pick<Room, "id" | "starting_balance" | "is_active">[]
  const room = rooms[0]

  if (!room) {
    return { ok: false, error: "Room not found" }
  }

  if (!room.is_active) {
    return { ok: false, error: "This room is no longer active" }
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
