import type { PendingOrder } from "@/lib/types"

/** Pending bracket TP/SL rows stay linked to a filled limit via parent_order_id. */
export const isPositionLinkedTrigger = (order: PendingOrder) =>
  order.position_id != null &&
  (order.type === "TAKE_PROFIT" || order.type === "STOP_LOSS")

/**
 * Open orders list rows:
 * - Top-level orders (limits, triggers set on an open position).
 * - Bracket TP/SL still tied to a filled limit (hidden while the limit is pending).
 */
export const getVisibleOpenOrders = (orders: PendingOrder[]) =>
  orders.filter((order) => !order.parent_order_id || isPositionLinkedTrigger(order))
