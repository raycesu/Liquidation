import { computeManualCloseEconomics } from "@/lib/trading-engine/close-position"
import { getTradeFeeForFill } from "@/lib/trading-fees"

describe("settlement close economics", () => {
  it("matches manual market close margin math", () => {
    const { fee } = getTradeFeeForFill({ notionalUsd: 5000, orderType: "MARKET" })
    const result = computeManualCloseEconomics({
      entryPrice: 60_000,
      livePrice: 62_000,
      side: "LONG",
      size: 5000,
      marginAllocated: 250,
      availableMargin: 9750,
      fee,
    })

    expect(result.realizedPnl).toBeGreaterThan(0)
    expect(result.nextAvailableMargin).toBe(9750 + 250 + result.realizedPnl - fee)
    expect(result.tradeDirection).toBe("CLOSE_LONG")
  })
})
