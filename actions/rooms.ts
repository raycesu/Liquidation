"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { requireOnboardedUser } from "@/lib/auth"
import { assertRoomJoinable } from "@/lib/competition-guards"
import { getSql, withUserContext } from "@/lib/db"
import { isPublicRoom } from "@/lib/room-visibility"
import { checkRateLimit } from "@/lib/rate-limit"
import { isUniqueViolation } from "@/lib/username"
import type { ActionResult, Room } from "@/lib/types"

const MAX_ROOM_DESCRIPTION_WORDS = 25

const normalizeRoomDescription = (description: string) => description.trim().replace(/\s+/g, " ")

const getDescriptionWordCount = (description: string) => description.split(/\s+/).filter(Boolean).length

const lateJoinHoursSchema = z.preprocess(
  (value) => {
    const raw = String(value ?? "").trim()

    if (raw.length === 0) {
      return null
    }

    return raw
  },
  z.union([
    z.null(),
    z.coerce
      .number()
      .int("Late join hours must be a whole number")
      .nonnegative("Late join hours cannot be negative"),
  ]),
)

const isPublicSchema = z.preprocess((value) => {
  const raw = String(value ?? "").trim().toLowerCase()

  return raw === "true" || raw === "on" || raw === "1"
}, z.boolean())

const createRoomSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters").max(80),
  startingBalance: z.coerce.number().positive("Starting balance must be positive").default(10000),
  startDate: z.string().min(1, "Choose a start date"),
  endDate: z.string().min(1, "Choose an end date"),
  lateJoinHours: lateJoinHoursSchema,
  isPublic: isPublicSchema,
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

const roomIdSchema = z.string().uuid("Invalid room")

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

const insertRoomParticipant = async (sql: ReturnType<typeof getSql>, room: Room, userId: string) => {
  await sql`
    insert into room_participants (room_id, user_id, available_margin)
    values (${room.id}, ${userId}, ${room.starting_balance})
    on conflict (room_id, user_id) do nothing
  `
}

const checkJoinRateLimit = (userId: string): ActionResult<void> => {
  const joinRateLimit = checkRateLimit(`join-room:${userId}`, { maxAttempts: 20, windowMs: 15 * 60_000 })

  if (!joinRateLimit.allowed) {
    const retryMinutes = Math.max(1, Math.ceil(joinRateLimit.retryAfterMs / 60_000))
    return {
      ok: false,
      error: `Too many join attempts. Try again in about ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
    }
  }

  return { ok: true, data: undefined }
}

const insertPrivateRoom = async (
  sql: ReturnType<typeof getSql>,
  values: {
    creatorId: string
    name: string
    description: string | null
    startingBalance: number
    startDate: string
    endDate: string
    lateJoinHours: number | null
  },
): Promise<Room | null> => {
  for (let attempt = 0; attempt < ROOM_CODE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const joinCode = generateJoinCode()
      const rooms = (await sql`
        insert into rooms (
          creator_id,
          name,
          description,
          is_public,
          join_code,
          starting_balance,
          start_date,
          end_date,
          is_active,
          late_join_hours
        )
        values (
          ${values.creatorId},
          ${values.name},
          ${values.description},
          false,
          ${joinCode},
          ${values.startingBalance},
          ${values.startDate},
          ${values.endDate},
          true,
          ${values.lateJoinHours}
        )
        returning
          id::text,
          creator_id,
          name,
          description,
          is_public,
          join_code,
          starting_balance::float8 as starting_balance,
          start_date::text,
          end_date::text,
          is_active,
          settled_at::text,
          late_join_hours,
          created_at::text
      `) as Room[]

      return rooms[0] ?? null
    } catch (error) {
      if (isUniqueViolation(error)) {
        continue
      }

      throw error
    }
  }

  return null
}

const insertPublicRoom = async (
  sql: ReturnType<typeof getSql>,
  values: {
    creatorId: string
    name: string
    description: string | null
    startingBalance: number
    startDate: string
    endDate: string
    lateJoinHours: number | null
  },
): Promise<Room | null> => {
  const rooms = (await sql`
    insert into rooms (
      creator_id,
      name,
      description,
      is_public,
      join_code,
      starting_balance,
      start_date,
      end_date,
      is_active,
      late_join_hours
    )
    values (
      ${values.creatorId},
      ${values.name},
      ${values.description},
      true,
      null,
      ${values.startingBalance},
      ${values.startDate},
      ${values.endDate},
      true,
      ${values.lateJoinHours}
    )
    returning
      id::text,
      creator_id,
      name,
      description,
      is_public,
      join_code,
      starting_balance::float8 as starting_balance,
      start_date::text,
      end_date::text,
      is_active,
      settled_at::text,
      late_join_hours,
      created_at::text
  `) as Room[]

  return rooms[0] ?? null
}

export const createRoom = async (
  _previousState: ActionResult<CreateRoomData>,
  formData: FormData,
): Promise<ActionResult<CreateRoomData>> => {
  const parsed = createRoomSchema.safeParse({
    name: formData.get("name"),
    startingBalance: formData.get("startingBalance"),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    lateJoinHours: formData.get("lateJoinHours"),
    isPublic: formData.get("isPublic"),
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

  if (parsed.data.lateJoinHours !== null) {
    const competitionMs = endDate.getTime() - startDate.getTime()
    const lateJoinMs = parsed.data.lateJoinHours * 60 * 60 * 1000

    if (lateJoinMs > competitionMs) {
      return {
        ok: false,
        error: "Late join window cannot be longer than the competition duration",
      }
    }
  }

  const user = await requireOnboardedUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to create a room" }
  }

  const setupResult = await withUserContext(user.id, async (): Promise<ActionResult<CreateRoomData>> => {
    const sql = getSql()
    const roomValues = {
      creatorId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      startingBalance: parsed.data.startingBalance,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      lateJoinHours: parsed.data.lateJoinHours,
    }

    const room = parsed.data.isPublic
      ? await insertPublicRoom(sql, roomValues)
      : await insertPrivateRoom(sql, roomValues)

    if (!room) {
      return { ok: false, error: "Unable to create room" }
    }

    const participants = (await sql`
      insert into room_participants (room_id, user_id, available_margin)
      values (${room.id}, ${user.id}, ${room.starting_balance})
      returning id::text
    `) as { id: string }[]

    if (!participants[0]) {
      return { ok: false, error: "Room created, but participant setup failed" }
    }

    return { ok: true, data: { roomId: room.id } }
  })

  if (!setupResult.ok) {
    return setupResult
  }

  revalidatePath("/dashboard")
  redirect(`/room/${setupResult.data.roomId}`)
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

  const rateLimitGuard = checkJoinRateLimit(user.id)

  if (!rateLimitGuard.ok) {
    return rateLimitGuard
  }

  return withUserContext(user.id, async () => {
    const sql = getSql()
    const rooms = (await sql`
      select
        id::text,
        creator_id,
        name,
        description,
        is_public,
        join_code,
        starting_balance::float8 as starting_balance,
        start_date::text as start_date,
        end_date::text as end_date,
        is_active,
        settled_at::text as settled_at,
        late_join_hours,
        created_at::text as created_at
      from rooms
      where join_code = ${parsedJoinCode.data}
      limit 1
    `) as Room[]
    const room = rooms[0]

    if (!room) {
      return { ok: false, error: "Room not found" }
    }

    if (isPublicRoom(room)) {
      return { ok: false, error: "This is a public room — join from the dashboard" }
    }

    const joinableGuard = assertRoomJoinable(room)

    if (!joinableGuard.ok) {
      return joinableGuard
    }

    await insertRoomParticipant(sql, room, user.id)

    revalidatePath(`/room/${room.id}`)
    revalidatePath("/dashboard")
    return { ok: true, data: { roomId: room.id } }
  })
}

export const joinPublicRoom = async (roomId: string): Promise<ActionResult<JoinRoomData>> => {
  const parsedRoomId = roomIdSchema.safeParse(roomId)

  if (!parsedRoomId.success) {
    return { ok: false, error: parsedRoomId.error.issues[0]?.message ?? "Invalid room" }
  }

  const user = await requireOnboardedUser()

  if (!user) {
    return { ok: false, error: "Sign in before joining a room" }
  }

  const rateLimitGuard = checkJoinRateLimit(user.id)

  if (!rateLimitGuard.ok) {
    return rateLimitGuard
  }

  return withUserContext(user.id, async () => {
    const sql = getSql()
    const rooms = (await sql`
      select
        id::text,
        creator_id,
        name,
        description,
        is_public,
        join_code,
        starting_balance::float8 as starting_balance,
        start_date::text as start_date,
        end_date::text as end_date,
        is_active,
        settled_at::text as settled_at,
        late_join_hours,
        created_at::text as created_at
      from rooms
      where id = ${parsedRoomId.data}
      limit 1
    `) as Room[]
    const room = rooms[0]

    if (!room) {
      return { ok: false, error: "Room not found" }
    }

    if (!isPublicRoom(room)) {
      return { ok: false, error: "This room is private — use the join code" }
    }

    const joinableGuard = assertRoomJoinable(room)

    if (!joinableGuard.ok) {
      return joinableGuard
    }

    await insertRoomParticipant(sql, room, user.id)

    revalidatePath(`/room/${room.id}`)
    revalidatePath("/dashboard")
    return { ok: true, data: { roomId: room.id } }
  })
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

export const joinPublicRoomAction = async (
  _previousState: ActionResult<JoinRoomData>,
  formData: FormData,
): Promise<ActionResult<JoinRoomData>> => {
  const roomId = String(formData.get("roomId") ?? "")
  const result = await joinPublicRoom(roomId)

  if (result.ok) {
    redirect(`/room/${result.data.roomId}`)
  }

  return result
}

export const removeRoomParticipant = async (
  roomId: string,
  targetUserId: string,
): Promise<ActionResult<void>> => {
  const parsedRoomId = roomIdSchema.safeParse(roomId)

  if (!parsedRoomId.success) {
    return { ok: false, error: parsedRoomId.error.issues[0]?.message ?? "Invalid room" }
  }

  if (!targetUserId.trim()) {
    return { ok: false, error: "Invalid participant" }
  }

  const user = await requireOnboardedUser()

  if (!user) {
    return { ok: false, error: "Sign in to manage participants" }
  }

  return withUserContext(user.id, async () => {
    const sql = getSql()
    const rooms = (await sql`
      select id::text, creator_id
      from rooms
      where id = ${parsedRoomId.data}
      limit 1
    `) as { id: string; creator_id: string }[]
    const room = rooms[0]

    if (!room) {
      return { ok: false, error: "Room not found" }
    }

    if (room.creator_id !== user.id) {
      return { ok: false, error: "Only the room creator can remove participants" }
    }

    if (targetUserId === user.id) {
      return { ok: false, error: "You cannot remove yourself from the room" }
    }

    const participants = (await sql`
      select id::text
      from room_participants
      where room_id = ${parsedRoomId.data}
        and user_id = ${targetUserId}
      limit 1
    `) as { id: string }[]
    const participant = participants[0]

    if (!participant) {
      return { ok: false, error: "Participant not found in this room" }
    }

    const openPositions = (await sql`
      select id::text
      from positions
      where participant_id = ${participant.id}
        and is_open = true
      limit 1
    `) as { id: string }[]

    if (openPositions[0]) {
      return {
        ok: false,
        error: "Close all open positions before removing this participant",
      }
    }

    await sql`
      delete from room_participants
      where id = ${participant.id}
    `

    revalidatePath(`/room/${parsedRoomId.data}`)
    revalidatePath("/dashboard")
    return { ok: true, data: undefined }
  })
}

export const removeRoomParticipantAction = async (
  _previousState: ActionResult<void>,
  formData: FormData,
): Promise<ActionResult<void>> => {
  const roomId = String(formData.get("roomId") ?? "")
  const targetUserId = String(formData.get("targetUserId") ?? "")
  return removeRoomParticipant(roomId, targetUserId)
}
