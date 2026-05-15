"use server"

import { runLiquidationEngineForRoom } from "@/actions/liquidate"
import { runOrderEngineForRoom } from "@/actions/run-order-engine"
import { getSql } from "@/lib/db"

export type TradingEngineRoomSummary = {
  roomId: string
  filledOrders: number
  cancelledOrders: number
  closedPositions: number
  liquidated: number
}

export type RunTradingEngineSummary = {
  processedRooms: number
  totalFilledOrders: number
  totalCancelledOrders: number
  totalClosedPositions: number
  totalLiquidated: number
  rooms: TradingEngineRoomSummary[]
}

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
