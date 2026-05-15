import { getCompetitionPhase } from "@/lib/room-competition-status"
import { getSql, withUserContext } from "@/lib/db"
import type { ActionResult, Room, RoomParticipant } from "@/lib/types"

export const TRADING_CLOSED_MESSAGE = "Trading is only available while the competition is ongoing"
export const COMPETITION_ENDED_MESSAGE = "This competition has ended"

export const assertRoomTradingOpen = (room: Room, now: Date = new Date()): ActionResult<void> => {
  if (getCompetitionPhase(room, now) !== "ongoing") {
    return { ok: false, error: TRADING_CLOSED_MESSAGE }
  }

  return { ok: true, data: undefined }
}

export const assertRoomJoinable = (room: Room, now: Date = new Date()): ActionResult<void> => {
  if (getCompetitionPhase(room, now) === "ended") {
    return { ok: false, error: COMPETITION_ENDED_MESSAGE }
  }

  return { ok: true, data: undefined }
}

type RoomForParticipant = {
  room: Room
  participant: RoomParticipant
}

export const loadRoomForParticipant = async (
  roomId: string,
  userId: string,
): Promise<ActionResult<RoomForParticipant>> => {
  const rows = await withUserContext(userId, async () => {
    const sql = getSql()
    return (await sql`
    select
      rp.id::text,
      rp.room_id::text,
      rp.user_id,
      rp.available_margin::float8 as available_margin,
      rp.created_at::text,
      json_build_object(
        'id', r.id::text,
        'creator_id', r.creator_id,
        'name', r.name,
        'description', r.description,
        'join_code', r.join_code,
        'starting_balance', r.starting_balance::float8,
        'start_date', r.start_date::text,
        'end_date', r.end_date::text,
        'is_active', r.is_active,
        'created_at', r.created_at::text
      ) as room
    from room_participants rp
    join rooms r on r.id = rp.room_id
    where rp.room_id = ${roomId}
      and rp.user_id = ${userId}
    limit 1
  `) as (RoomParticipant & { room: Room | null })[]
  })

  const row = rows[0]

  if (!row?.room) {
    return { ok: false, error: "Participant not found" }
  }

  return {
    ok: true,
    data: {
      room: row.room,
      participant: {
        id: row.id,
        room_id: row.room_id,
        user_id: row.user_id,
        available_margin: row.available_margin,
        created_at: row.created_at,
      },
    },
  }
}
