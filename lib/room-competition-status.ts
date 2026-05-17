import type { Room } from "@/lib/types"

export type CompetitionPhase = "upcoming" | "ongoing" | "ended"

export const isRoomSettled = (room: Room) => room.settled_at != null

export const roomNeedsSettlement = (room: Room, now: Date = new Date()) => {
  if (isRoomSettled(room)) {
    return false
  }

  const t = now.getTime()
  const end = new Date(room.end_date).getTime()

  return t >= end || !room.is_active
}

export const getCompetitionPhase = (room: Room, now: Date = new Date()): CompetitionPhase => {
  if (isRoomSettled(room)) {
    return "ended"
  }

  const t = now.getTime()
  const start = new Date(room.start_date).getTime()
  const end = new Date(room.end_date).getTime()
  if (t >= end || !room.is_active) {
    return "ended"
  }
  if (t < start) {
    return "upcoming"
  }
  return "ongoing"
}
