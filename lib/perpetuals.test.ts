import {
  calculateLiquidationPrice,
  calculateLiquidationPriceFromMargin,
  calculatePnl,
  calculateRequiredMargin,
  calculateRoe,
  computeOpenPositionMargin,
  floorRealizedPnl,
  getMaintenanceRequirement,
  settleFundingOnPositionMargin,
} from "@/lib/perpetuals"

describe("perpetuals math", () => {
  it("calculates required margin", () => {
    expect(calculateRequiredMargin(10000, 20)).toBe(500)
  })

  it("calculates long and short liquidation prices from leverage", () => {
    expect(calculateLiquidationPrice({ entryPrice: 65000, leverage: 20, side: "LONG" })).toBe(62075)
    expect(calculateLiquidationPrice({ entryPrice: 65000, leverage: 20, side: "SHORT" })).toBeCloseTo(67925)
  })

  it("matches leverage-based liq when margin is size/leverage", () => {
    const size = 10_000
    const leverage = 20
    const entryPrice = 65000
    const margin = calculateRequiredMargin(size, leverage)

    expect(
      calculateLiquidationPriceFromMargin({
        entryPrice,
        size,
        side: "LONG",
        marginAllocated: margin,
      }),
    ).toBe(calculateLiquidationPrice({ entryPrice, leverage, side: "LONG" }))
  })

  it("moves long liquidation price up when position margin falls", () => {
    const entryPrice = 100
    const size = 1000
    const highMargin = 100
    const lowMargin = 40

    const highLiq = calculateLiquidationPriceFromMargin({
      entryPrice,
      size,
      side: "LONG",
      marginAllocated: highMargin,
    })
    const lowLiq = calculateLiquidationPriceFromMargin({
      entryPrice,
      size,
      side: "LONG",
      marginAllocated: lowMargin,
    })

    expect(lowLiq).toBeGreaterThan(highLiq)
  })

  it("calculates live PnL and ROE", () => {
    const pnl = calculatePnl({
      entryPrice: 100,
      livePrice: 110,
      side: "LONG",
      size: 1000,
    })

    expect(pnl).toBe(100)
    expect(calculateRoe({ marginAllocated: 200, unrealizedPnl: pnl })).toBe(50)
  })

  it("floors realized losses at allocated margin", () => {
    expect(floorRealizedPnl(-700, 500)).toBe(-500)
  })

  it("deducts open fee from position margin", () => {
    expect(computeOpenPositionMargin(500, 2.5)).toBe(497.5)
  })

  it("applies funding to position margin and flags liquidation when below maintenance", () => {
    const size = 10_000
    const margin = 100
    const maintenance = getMaintenanceRequirement(size)
    const payment = -80

    const result = settleFundingOnPositionMargin({
      marginAllocated: margin,
      size,
      entryPrice: 100,
      side: "LONG",
      payment,
    })

    expect(result.actualApplied).toBe(payment)
    expect(result.newMargin).toBe(20)
    expect(result.shouldLiquidate).toBe(result.newMargin <= maintenance)
    expect(result.skipMarginUpdate).toBe(false)
  })

  it("skips margin update when funding would wipe position collateral", () => {
    const result = settleFundingOnPositionMargin({
      marginAllocated: 30,
      size: 10_000,
      entryPrice: 100,
      side: "LONG",
      payment: -50,
    })

    expect(result.skipMarginUpdate).toBe(true)
    expect(result.actualApplied).toBe(-30)
    expect(result.shouldLiquidate).toBe(true)
  })

  it("credits received funding to position margin", () => {
    const result = settleFundingOnPositionMargin({
      marginAllocated: 100,
      size: 10_000,
      entryPrice: 100,
      side: "SHORT",
      payment: 2,
    })

    expect(result.newMargin).toBe(102)
    expect(result.actualApplied).toBe(2)
    expect(result.skipMarginUpdate).toBe(false)
  })
})
