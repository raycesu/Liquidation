import { mapWithConcurrency } from "@/lib/concurrency"
import { getSql } from "@/lib/db"
import { runLiquidationEngineForRoom } from "@/lib/trading-engine/liquidate"
import { runFundingEngineForRoom } from "@/lib/trading-engine/run-funding-engine"
import { runOrderEngineForRoom } from "@/lib/trading-engine/run-order-engine"
import { runSettlementForDueRooms } from "@/lib/trading-engine/run-settlement"
import type { RunTradingEngineSummary, TradingEngineRoomSummary } from "@/lib/trading-engine/types"

export type { RunTradingEngineSummary, TradingEngineRoomSummary } from "@/lib/trading-engine/types"

const ACTIVE_ROOM_CONCURRENCY = 5

export const runTradingEngineForActiveRooms = async (): Promise<RunTradingEngineSummary> => {
  const settlement = await runSettlementForDueRooms()

  const sql = getSql()
  const nowIso = new Date().toISOString()
  const ongoingRooms = (await sql`
    select id::text
    from rooms
    where is_active = true
      and settled_at is null
      and start_date <= ${nowIso}::timestamptz
      and end_date > ${nowIso}::timestamptz
  `) as { id: string }[]

  const rooms = await mapWithConcurrency(ongoingRooms, ACTIVE_ROOM_CONCURRENCY, async (room) => {
    const orderResult = await runOrderEngineForRoom(room.id, { revalidate: true })
    const fundingResult = await runFundingEngineForRoom(room.id)
    const liquidationResult = await runLiquidationEngineForRoom(room.id, { revalidate: true })

    const filledOrders = orderResult.ok ? orderResult.data.filledOrderIds.length : 0
    const cancelledOrders = orderResult.ok ? orderResult.data.cancelledOrderIds.length : 0
    const closedPositions = orderResult.ok ? orderResult.data.closedPositionIds.length : 0
    const fundingApplied = fundingResult.applied
    const liquidated = liquidationResult.ok ? liquidationResult.data.liquidated : 0

    return {
      roomId: room.id,
      filledOrders,
      cancelledOrders,
      closedPositions,
      fundingApplied,
      liquidated,
    }
  })

  const totalFilledOrders = rooms.reduce((sum, room) => sum + room.filledOrders, 0)
  const totalCancelledOrders = rooms.reduce((sum, room) => sum + room.cancelledOrders, 0)
  const totalClosedPositions = rooms.reduce((sum, room) => sum + room.closedPositions, 0)
  const totalFundingApplied = rooms.reduce((sum, room) => sum + room.fundingApplied, 0)
  const totalLiquidated = rooms.reduce((sum, room) => sum + room.liquidated, 0)

  return {
    settlement,
    processedRooms: ongoingRooms.length,
    totalFilledOrders,
    totalCancelledOrders,
    totalClosedPositions,
    totalFundingApplied,
    totalLiquidated,
    rooms,
  }
}
