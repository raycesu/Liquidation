import type { Room } from "@/lib/types"

export type CompetitionPhase = "upcoming" | "ongoing" | "ended"

export const getCompetitionPhase = (room: Room, now: Date = new Date()): CompetitionPhase => {
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
