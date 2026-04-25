import {
  calculateLiquidationPrice,
  calculatePnl,
  calculateRequiredMargin,
  calculateRoe,
  floorRealizedPnl,
} from "@/lib/perpetuals"

describe("perpetuals math", () => {
  it("calculates required margin", () => {
    expect(calculateRequiredMargin(10000, 20)).toBe(500)
  })

  it("calculates long and short liquidation prices", () => {
    expect(calculateLiquidationPrice({ entryPrice: 65000, leverage: 20, side: "LONG" })).toBe(62075)
    expect(calculateLiquidationPrice({ entryPrice: 65000, leverage: 20, side: "SHORT" })).toBeCloseTo(67925)
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
})
