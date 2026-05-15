import { runLiquidationEngineForRoom } from "@/lib/trading-engine/liquidate"
import { runOrderEngineForRoom } from "@/lib/trading-engine/run-order-engine"
import { getSql } from "@/lib/db"
import type { RunTradingEngineSummary, TradingEngineRoomSummary } from "@/lib/trading-engine/types"

export type { RunTradingEngineSummary, TradingEngineRoomSummary } from "@/lib/trading-engine/types"

export const runTradingEngineForActiveRooms = async (): Promise<RunTradingEngineSummary> => {
  const sql = getSql()
  const activeRooms = (await sql`
    select id::text
    from rooms
    where is_active = true
  `) as { id: string }[]

  const rooms: TradingEngineRoomSummary[] = []
  let totalFilledOrders = 0
  let totalCancelledOrders = 0
  let totalClosedPositions = 0
  let totalLiquidated = 0

  for (const room of activeRooms) {
    const orderResult = await runOrderEngineForRoom(room.id, { revalidate: true })
    const liquidationResult = await runLiquidationEngineForRoom(room.id, { revalidate: true })

    const filledOrders = orderResult.ok ? orderResult.data.filledOrderIds.length : 0
    const cancelledOrders = orderResult.ok ? orderResult.data.cancelledOrderIds.length : 0
    const closedPositions = orderResult.ok ? orderResult.data.closedPositionIds.length : 0
    const liquidated = liquidationResult.ok ? liquidationResult.data.liquidated : 0

    totalFilledOrders += filledOrders
    totalCancelledOrders += cancelledOrders
    totalClosedPositions += closedPositions
    totalLiquidated += liquidated

    rooms.push({
      roomId: room.id,
      filledOrders,
      cancelledOrders,
      closedPositions,
      liquidated,
    })
  }

  return {
    processedRooms: activeRooms.length,
    totalFilledOrders,
    totalCancelledOrders,
    totalClosedPositions,
    totalLiquidated,
    rooms,
  }
}
