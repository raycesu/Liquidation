import {
  computeTradeFee,
  getLiquidityRoleForFill,
  getTradeFeeForFill,
  MAKER_FEE_BPS,
  TAKER_FEE_BPS,
} from "@/lib/trading-fees"

describe("trading-fees", () => {
  it("computes maker and taker fees from notional", () => {
    expect(computeTradeFee(10_000, "MAKER")).toBe(10_000 * (MAKER_FEE_BPS / 10_000))
    expect(computeTradeFee(10_000, "TAKER")).toBe(10_000 * (TAKER_FEE_BPS / 10_000))
  })

  it("maps LIMIT to maker and market paths to taker", () => {
    expect(getLiquidityRoleForFill({ orderType: "LIMIT" })).toBe("MAKER")
    expect(getLiquidityRoleForFill({ orderType: "MARKET" })).toBe("TAKER")
    expect(getLiquidityRoleForFill({ orderType: "TAKE_PROFIT" })).toBe("TAKER")
    expect(getLiquidityRoleForFill({ orderType: "STOP_LOSS" })).toBe("TAKER")
  })

  it("returns no fee for liquidation", () => {
    expect(getLiquidityRoleForFill({ isLiquidation: true })).toBeNull()
    expect(getTradeFeeForFill({ notionalUsd: 10_000, isLiquidation: true })).toEqual({
      fee: 0,
      liquidityRole: null,
    })
  })
})
