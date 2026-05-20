import type { PositionSide } from "@/lib/types"

export const maintenanceMarginRate = 0.005

export const calculateRequiredMargin = (size: number, leverage: number) => size / leverage

export const getMaintenanceRequirement = (size: number) => maintenanceMarginRate * size

/** Isolated: collateral locked in the position must stay above maintenance. */
export const isMarginAboveMaintenance = (marginAllocated: number, size: number) =>
  marginAllocated > getMaintenanceRequirement(size)

export const computeOpenPositionMargin = (initialMargin: number, openFee: number) =>
  initialMargin - openFee

export const validatePositionMarginAfterFee = (
  positionMargin: number,
  size: number,
): string | null => {
  if (positionMargin <= 0) {
    return "Position margin too small after fees."
  }

  if (!isMarginAboveMaintenance(positionMargin, size)) {
    return "Position margin must exceed maintenance requirement after fees."
  }

  return null
}

export const calculateLiquidationPriceFromMargin = ({
  entryPrice,
  size,
  side,
  marginAllocated,
}: {
  entryPrice: number
  size: number
  side: PositionSide
  marginAllocated: number
}) => {
  if (size <= 0 || entryPrice <= 0) {
    return entryPrice
  }

  const marginRatio = marginAllocated / size

  if (side === "LONG") {
    return entryPrice * (1 - marginRatio + maintenanceMarginRate)
  }

  return entryPrice * (1 + marginRatio - maintenanceMarginRate)
}

/** Initial liquidation at open (no open fee). Prefer calculateLiquidationPriceFromMargin when fees apply. */
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

export const computePositionEquity = ({
  marginAllocated,
  entryPrice,
  livePrice,
  side,
  size,
}: {
  marginAllocated: number
  entryPrice: number
  livePrice: number
  side: PositionSide
  size: number
}) => marginAllocated + calculatePnl({ entryPrice, livePrice, side, size })

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

export type FundingMarginSettlement = {
  newMargin: number
  actualApplied: number
  liquidationPrice: number
  shouldLiquidate: boolean
  skipMarginUpdate: boolean
}

/** Apply hourly funding to isolated position margin (not available balance). */
export const settleFundingOnPositionMargin = ({
  marginAllocated,
  size,
  entryPrice,
  side,
  payment,
}: {
  marginAllocated: number
  size: number
  entryPrice: number
  side: PositionSide
  payment: number
}): FundingMarginSettlement => {
  const maintenance = getMaintenanceRequirement(size)
  const rawNewMargin = marginAllocated + payment

  if (rawNewMargin <= 0) {
    return {
      newMargin: marginAllocated,
      actualApplied: -marginAllocated,
      liquidationPrice: calculateLiquidationPriceFromMargin({
        entryPrice,
        size,
        side,
        marginAllocated,
      }),
      shouldLiquidate: true,
      skipMarginUpdate: true,
    }
  }

  const actualApplied = payment
  const newMargin = rawNewMargin
  const liquidationPrice = calculateLiquidationPriceFromMargin({
    entryPrice,
    size,
    side,
    marginAllocated: newMargin,
  })

  return {
    newMargin,
    actualApplied,
    liquidationPrice,
    shouldLiquidate: newMargin <= maintenance,
    skipMarginUpdate: false,
  }
}
