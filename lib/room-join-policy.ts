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

export const formatLateJoinPolicyParts = (room: Room): { primary: string; secondary: string } => {
  if (room.late_join_hours === null) {
    return {
      primary: "Late joins allowed",
      secondary: "until end",
    }
  }

  if (room.late_join_hours === 0) {
    return {
      primary: "No late joiners",
      secondary: "Join before start",
    }
  }

  const hoursLabel = room.late_join_hours === 1 ? "1 hour" : `${room.late_join_hours} hours`

  return {
    primary: "Late joins allowed",
    secondary: `within ${hoursLabel} of start`,
  }
}

export const formatLateJoinPolicy = (room: Room): string => {
  const { primary, secondary } = formatLateJoinPolicyParts(room)

  if (!secondary) {
    return primary
  }

  if (room.late_join_hours === 0) {
    return `${primary} — ${secondary.toLowerCase()}`
  }

  if (room.late_join_hours !== null && room.late_join_hours > 0) {
    const hoursLabel = room.late_join_hours === 1 ? "1 hour" : `${room.late_join_hours} hours`

    return `Late joins allowed for ${hoursLabel} after start`
  }

  return `${primary} — ${secondary}`
}
