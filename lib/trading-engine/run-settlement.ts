import { mapWithConcurrency } from "@/lib/concurrency"
import { getSql } from "@/lib/db"
import { settleRoomCompetition } from "@/lib/trading-engine/settle-room"
import type { SettleRoomResult } from "@/lib/trading-engine/settle-room"
import type { RunSettlementSummary } from "@/lib/trading-engine/types"

const SETTLEMENT_CONCURRENCY = 3

export const runSettlementForDueRooms = async (now: Date = new Date()): Promise<RunSettlementSummary> => {
  const sql = getSql()
  const dueRooms = (await sql`
    select id::text
    from rooms
    where settled_at is null
      and (end_date <= ${now.toISOString()}::timestamptz or is_active = false)
  `) as { id: string }[]

  const rooms = await mapWithConcurrency(dueRooms, SETTLEMENT_CONCURRENCY, async (room) => {
    const result = await settleRoomCompetition(room.id, { revalidate: true, now })

    if (!result.ok) {
      return {
        roomId: room.id,
        ok: false,
        error: result.error,
        cancelledOrders: 0,
        closedPositions: 0,
      }
    }

    const data: SettleRoomResult = result.data

    return {
      roomId: room.id,
      ok: true,
      cancelledOrders: data.cancelledOrderIds.length,
      closedPositions: data.closedPositionIds.length,
    }
  })

  const settledRooms = rooms.filter((room) => room.ok).length
  const failedRooms = rooms.filter((room) => !room.ok).length

  return {
    dueRooms: dueRooms.length,
    settledRooms,
    failedRooms,
    rooms,
  }
}
