import { mapWithConcurrency } from "@/lib/concurrency"
import { runLiquidationEngineForRoom } from "@/lib/trading-engine/liquidate"
import { runOrderEngineForRoom } from "@/lib/trading-engine/run-order-engine"
import { getSql } from "@/lib/db"
import type { RunTradingEngineSummary, TradingEngineRoomSummary } from "@/lib/trading-engine/types"

export type { RunTradingEngineSummary, TradingEngineRoomSummary } from "@/lib/trading-engine/types"

const ACTIVE_ROOM_CONCURRENCY = 5

export const runTradingEngineForActiveRooms = async (): Promise<RunTradingEngineSummary> => {
  const sql = getSql()
  const activeRooms = (await sql`
    select id::text
    from rooms
    where is_active = true
  `) as { id: string }[]

  const rooms = await mapWithConcurrency(activeRooms, ACTIVE_ROOM_CONCURRENCY, async (room) => {
    const orderResult = await runOrderEngineForRoom(room.id, { revalidate: true })
    const liquidationResult = await runLiquidationEngineForRoom(room.id, { revalidate: true })

    const filledOrders = orderResult.ok ? orderResult.data.filledOrderIds.length : 0
    const cancelledOrders = orderResult.ok ? orderResult.data.cancelledOrderIds.length : 0
    const closedPositions = orderResult.ok ? orderResult.data.closedPositionIds.length : 0
    const liquidated = liquidationResult.ok ? liquidationResult.data.liquidated : 0

    return {
      roomId: room.id,
      filledOrders,
      cancelledOrders,
      closedPositions,
      liquidated,
    }
  })

  const totalFilledOrders = rooms.reduce((sum, room) => sum + room.filledOrders, 0)
  const totalCancelledOrders = rooms.reduce((sum, room) => sum + room.cancelledOrders, 0)
  const totalClosedPositions = rooms.reduce((sum, room) => sum + room.closedPositions, 0)
  const totalLiquidated = rooms.reduce((sum, room) => sum + room.liquidated, 0)

  return {
    processedRooms: activeRooms.length,
    totalFilledOrders,
    totalCancelledOrders,
    totalClosedPositions,
    totalLiquidated,
    rooms,
  }
}
