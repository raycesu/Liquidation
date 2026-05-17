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
  fundingApplied: number
  liquidated: number
}

export type SettlementRoomSummary = {
  roomId: string
  ok: boolean
  error?: string
  cancelledOrders: number
  closedPositions: number
}

export type RunSettlementSummary = {
  dueRooms: number
  settledRooms: number
  failedRooms: number
  rooms: SettlementRoomSummary[]
}

export type RunTradingEngineSummary = {
  settlement: RunSettlementSummary
  processedRooms: number
  totalFilledOrders: number
  totalCancelledOrders: number
  totalClosedPositions: number
  totalFundingApplied: number
  totalLiquidated: number
  rooms: TradingEngineRoomSummary[]
}
