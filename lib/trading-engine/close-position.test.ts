import {
  computeLiquidationRealizedPnl,
  computeManualCloseEconomics,
  getCloseTradeDirection,
  isPositionUnderwater,
} from "@/lib/trading-engine/close-position"

describe("getCloseTradeDirection", () => {
  it("maps position sides to close trade directions", () => {
    expect(getCloseTradeDirection("LONG")).toBe("CLOSE_LONG")
    expect(getCloseTradeDirection("SHORT")).toBe("CLOSE_SHORT")
  })
})

describe("computeManualCloseEconomics", () => {
  it("floors realized loss at margin allocated", () => {
    const result = computeManualCloseEconomics({
      entryPrice: 100,
      livePrice: 50,
      side: "LONG",
      size: 1000,
      marginAllocated: 100,
      availableMargin: 500,
    })

    expect(result.realizedPnl).toBe(-100)
    expect(result.nextAvailableMargin).toBe(500)
    expect(result.tradeDirection).toBe("CLOSE_LONG")
  })

  it("returns margin plus profit on winning close", () => {
    const result = computeManualCloseEconomics({
      entryPrice: 100,
      livePrice: 110,
      side: "LONG",
      size: 1000,
      marginAllocated: 100,
      availableMargin: 500,
    })

    expect(result.realizedPnl).toBe(100)
    expect(result.nextAvailableMargin).toBe(700)
  })

  it("deducts trade fee from available margin on close", () => {
    const result = computeManualCloseEconomics({
      entryPrice: 100,
      livePrice: 110,
      side: "LONG",
      size: 1000,
      marginAllocated: 100,
      availableMargin: 500,
      fee: 5,
    })

    expect(result.nextAvailableMargin).toBe(695)
  })
})

describe("computeLiquidationRealizedPnl", () => {
  it("returns full margin loss", () => {
    expect(computeLiquidationRealizedPnl(250)).toBe(-250)
  })
})

describe("isPositionUnderwater", () => {
  it("detects long liquidation at or below liquidation price", () => {
    expect(
      isPositionUnderwater({ side: "LONG", liquidation_price: 60_000 }, 60_000),
    ).toBe(true)
    expect(
      isPositionUnderwater({ side: "LONG", liquidation_price: 60_000 }, 59_999),
    ).toBe(true)
    expect(
      isPositionUnderwater({ side: "LONG", liquidation_price: 60_000 }, 60_001),
    ).toBe(false)
  })

  it("detects short liquidation at or above liquidation price", () => {
    expect(
      isPositionUnderwater({ side: "SHORT", liquidation_price: 60_000 }, 60_000),
    ).toBe(true)
    expect(
      isPositionUnderwater({ side: "SHORT", liquidation_price: 60_000 }, 60_001),
    ).toBe(true)
    expect(
      isPositionUnderwater({ side: "SHORT", liquidation_price: 60_000 }, 59_999),
    ).toBe(false)
  })
})
