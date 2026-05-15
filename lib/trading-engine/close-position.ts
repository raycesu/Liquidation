import { calculatePnl, floorRealizedPnl } from "@/lib/perpetuals"
import type { PositionSide } from "@/lib/types"

export const getCloseTradeDirection = (side: PositionSide): "CLOSE_LONG" | "CLOSE_SHORT" =>
  side === "LONG" ? "CLOSE_LONG" : "CLOSE_SHORT"

export const computeManualCloseEconomics = ({
  entryPrice,
  livePrice,
  side,
  size,
  marginAllocated,
  availableMargin,
}: {
  entryPrice: number
  livePrice: number
  side: PositionSide
  size: number
  marginAllocated: number
  availableMargin: number
}) => {
  const rawPnl = calculatePnl({ entryPrice, livePrice, side, size })
  const realizedPnl = floorRealizedPnl(rawPnl, marginAllocated)
  const nextAvailableMargin = Math.max(0, availableMargin + marginAllocated + realizedPnl)

  return {
    realizedPnl,
    nextAvailableMargin,
    tradeDirection: getCloseTradeDirection(side),
  }
}

export const computeLiquidationRealizedPnl = (marginAllocated: number) => -marginAllocated

export const isPositionUnderwater = (
  position: { side: PositionSide; liquidation_price: number },
  livePrice: number,
) => {
  if (position.side === "LONG") {
    return livePrice <= position.liquidation_price
  }

  return livePrice >= position.liquidation_price
}
