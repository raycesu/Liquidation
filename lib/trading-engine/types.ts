import type { Position, Trade } from "@/lib/types"

export type LinkedBracketTrigger = {
  orderId: string
  positionId: string
}

export type RunOrderEngineResult = {
  filledOrderIds: string[]
  cancelledOrderIds: string[]
  newPositions: Position[]
  closedPositionIds: string[]
  trades: Trade[]
  skippedSymbols: string[]
  skippedOrderIds: string[]
  linkedBracketTriggers: LinkedBracketTrigger[]
}

export type RunOrderEngineOptions = {
  participantId?: string
  revalidate?: boolean
}

export type RunLiquidationEngineResult = {
  liquidated: number
  liquidatedPositionIds: string[]
}

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
