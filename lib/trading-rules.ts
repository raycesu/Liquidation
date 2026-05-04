import type { PendingOrder, PositionSide } from "@/lib/types"

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
