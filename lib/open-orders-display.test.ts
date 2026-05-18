import { getVisibleOpenOrders } from "@/lib/open-orders-display"
import type { PendingOrder } from "@/lib/types"

const baseOrder: PendingOrder = {
  id: "order-1",
  participant_id: "participant-1",
  parent_order_id: null,
  position_id: null,
  symbol: "BTCUSDT",
  side: "LONG",
  type: "LIMIT",
  size: 1000,
  leverage: 5,
  trigger_price: 75000,
  status: "PENDING",
  margin_reserved: 200,
  created_at: "2026-05-17T00:00:00.000Z",
  filled_at: null,
  cancelled_at: null,
}

describe("getVisibleOpenOrders", () => {
  it("shows top-level limit orders", () => {
    expect(getVisibleOpenOrders([baseOrder])).toEqual([baseOrder])
  })

  it("hides bracket TP/SL while the parent limit is still pending", () => {
    const bracket: PendingOrder = {
      ...baseOrder,
      id: "tp-1",
      parent_order_id: "limit-1",
      type: "TAKE_PROFIT",
      trigger_price: 79000,
    }

    expect(getVisibleOpenOrders([baseOrder, bracket])).toEqual([baseOrder])
  })

  it("shows bracket TP/SL after the limit fills and links to a position", () => {
    const linkedTp: PendingOrder = {
      ...baseOrder,
      id: "tp-1",
      parent_order_id: "limit-1",
      position_id: "position-1",
      type: "TAKE_PROFIT",
      trigger_price: 79000,
    }
    const linkedSl: PendingOrder = {
      ...linkedTp,
      id: "sl-1",
      type: "STOP_LOSS",
      trigger_price: 75000,
    }

    expect(getVisibleOpenOrders([linkedTp, linkedSl])).toEqual([linkedTp, linkedSl])
  })

  it("shows triggers attached directly to a position", () => {
    const tp: PendingOrder = {
      ...baseOrder,
      id: "tp-1",
      position_id: "position-1",
      type: "TAKE_PROFIT",
      trigger_price: 88.75,
    }

    expect(getVisibleOpenOrders([tp])).toEqual([tp])
  })
})
