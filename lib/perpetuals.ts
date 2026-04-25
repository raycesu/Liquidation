import type { PositionSide } from "@/lib/types"

export const maintenanceMarginRate = 0.005

export const calculateRequiredMargin = (size: number, leverage: number) => size / leverage

export const calculateLiquidationPrice = ({
  entryPrice,
  leverage,
  side,
}: {
  entryPrice: number
  leverage: number
  side: PositionSide
}) => {
  if (side === "LONG") {
    return entryPrice * (1 - 1 / leverage + maintenanceMarginRate)
  }

  return entryPrice * (1 + 1 / leverage - maintenanceMarginRate)
}

export const calculatePnl = ({
  entryPrice,
  livePrice,
  side,
  size,
}: {
  entryPrice: number
  livePrice: number
  side: PositionSide
  size: number
}) => {
  if (side === "LONG") {
    return ((livePrice - entryPrice) / entryPrice) * size
  }

  return ((entryPrice - livePrice) / entryPrice) * size
}

export const calculateRoe = ({
  marginAllocated,
  unrealizedPnl,
}: {
  marginAllocated: number
  unrealizedPnl: number
}) => {
  if (marginAllocated <= 0) {
    return 0
  }

  return (unrealizedPnl / marginAllocated) * 100
}

export const floorRealizedPnl = (realizedPnl: number, marginAllocated: number) =>
  Math.max(realizedPnl, -marginAllocated)
