import {
  getLimitFillPrice,
  getTriggerPriority,
  getTriggerSide,
  isLimitTriggered,
  isStopLossTriggered,
  isTakeProfitTriggered,
  validateTriggerPrices,
} from "@/lib/trading-rules"
import type { PendingOrder } from "@/lib/types"

const baseOrder: PendingOrder = {
  id: "00000000-0000-0000-0000-000000000001",
  participant_id: "00000000-0000-0000-0000-000000000002",
  parent_order_id: null,
  position_id: null,
  symbol: "BTCUSDT",
  side: "LONG",
  type: "LIMIT",
  size: 1000,
  leverage: 10,
  trigger_price: 100,
  status: "PENDING",
  margin_reserved: 100,
  created_at: new Date().toISOString(),
  filled_at: null,
  cancelled_at: null,
}

describe("trading-rules", () => {
  it("uses limit-respecting fill prices", () => {
    expect(getLimitFillPrice(baseOrder, 101)).toBe(100)
    expect(getLimitFillPrice(baseOrder, 99)).toBe(99)
    expect(getLimitFillPrice({ ...baseOrder, side: "SHORT" }, 95)).toBe(100)
  })

  it("evaluates triggers correctly", () => {
    expect(isLimitTriggered(baseOrder, 99)).toBe(true)
    expect(isLimitTriggered(baseOrder, 101)).toBe(false)
    expect(isTakeProfitTriggered({ ...baseOrder, type: "TAKE_PROFIT", side: "SHORT" }, 101)).toBe(true)
    expect(isStopLossTriggered({ ...baseOrder, type: "STOP_LOSS", side: "LONG" }, 101)).toBe(true)
  })

  it("orders trigger priority as SL -> TP -> LIMIT", () => {
    expect(getTriggerPriority({ ...baseOrder, type: "STOP_LOSS" })).toBe(0)
    expect(getTriggerPriority({ ...baseOrder, type: "TAKE_PROFIT" })).toBe(1)
    expect(getTriggerPriority({ ...baseOrder, type: "LIMIT" })).toBe(2)
  })

  it("maps trigger side to opposite direction", () => {
    expect(getTriggerSide("LONG")).toBe("SHORT")
    expect(getTriggerSide("SHORT")).toBe("LONG")
  })

  it("validates trigger prices relative to entry", () => {
    expect(
      validateTriggerPrices({
        side: "LONG",
        referencePrice: 100,
        takeProfitPrice: 110,
        stopLossPrice: 90,
      }),
    ).toBeNull()

    expect(
      validateTriggerPrices({
        side: "LONG",
        referencePrice: 100,
        takeProfitPrice: 95,
        stopLossPrice: null,
      }),
    ).toBe("Take profit must be above entry for longs.")
  })
})
