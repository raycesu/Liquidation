import type { PendingOrder, PositionSide } from "@/lib/types"

export const validateTriggerPrices = ({
  side,
  referencePrice,
  takeProfitPrice,
  stopLossPrice,
}: {
  side: PositionSide
  referencePrice: number
  takeProfitPrice: number | null | undefined
  stopLossPrice: number | null | undefined
}): string | null => {
  if (takeProfitPrice != null) {
    if (side === "LONG" && takeProfitPrice <= referencePrice) {
      return "Take profit must be above entry for longs."
    }

    if (side === "SHORT" && takeProfitPrice >= referencePrice) {
      return "Take profit must be below entry for shorts."
    }
  }

  if (stopLossPrice != null) {
    if (side === "LONG" && stopLossPrice >= referencePrice) {
      return "Stop loss must be below entry for longs."
    }

    if (side === "SHORT" && stopLossPrice <= referencePrice) {
      return "Stop loss must be above entry for shorts."
    }
  }

  return null
}

export const getLimitFillPrice = (order: PendingOrder, livePrice: number) => {
  if (order.side === "LONG") {
    return Math.min(livePrice, order.trigger_price)
  }

  return Math.max(livePrice, order.trigger_price)
}

export const isLimitTriggered = (order: PendingOrder, price: number) => {
  if (order.side === "LONG") {
    return price <= order.trigger_price
  }

  return price >= order.trigger_price
}

export const isTakeProfitTriggered = (order: PendingOrder, price: number) => {
  if (order.side === "LONG") {
    return price <= order.trigger_price
  }

  return price >= order.trigger_price
}

export const isStopLossTriggered = (order: PendingOrder, price: number) => {
  if (order.side === "LONG") {
    return price >= order.trigger_price
  }

  return price <= order.trigger_price
}

export const getTriggerSide = (positionSide: PositionSide): PositionSide =>
  positionSide === "LONG" ? "SHORT" : "LONG"

export const getTriggerPriority = (order: PendingOrder) => {
  if (order.type === "STOP_LOSS") {
    return 0
  }

  if (order.type === "TAKE_PROFIT") {
    return 1
  }

  return 2
}
