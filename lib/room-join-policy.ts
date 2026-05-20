import { getCompetitionPhase, isRoomSettled } from "@/lib/room-competition-status"
import type { Room } from "@/lib/types"

const HOUR_MS = 60 * 60 * 1000

export const getRoomJoinCutoff = (room: Room): Date | null => {
  if (room.late_join_hours === null) {
    return null
  }

  const startMs = new Date(room.start_date).getTime()

  if (room.late_join_hours === 0) {
    return new Date(startMs)
  }

  return new Date(startMs + room.late_join_hours * HOUR_MS)
}

export const isRoomJoinOpen = (room: Room, now: Date = new Date()): boolean => {
  if (isRoomSettled(room) || getCompetitionPhase(room, now) === "ended") {
    return false
  }

  const cutoff = getRoomJoinCutoff(room)

  if (!cutoff) {
    return true
  }

  return now.getTime() < cutoff.getTime()
}

export const formatLateJoinPolicy = (room: Room): string => {
  if (room.late_join_hours === null) {
    return "Open until competition ends"
  }

  if (room.late_join_hours === 0) {
    return "No late joiners — join before start"
  }

  const hoursLabel = room.late_join_hours === 1 ? "1 hour" : `${room.late_join_hours} hours`

  return `Late joins allowed for ${hoursLabel} after start`
}
