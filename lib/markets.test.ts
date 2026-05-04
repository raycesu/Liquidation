import { getMaxLeverage, getMarket, isSupportedSymbol } from "@/lib/markets"

describe("markets snapshot", () => {
  it("includes BTC and xyz dex with Hyperliquid max leverage", () => {
    expect(isSupportedSymbol("BTCUSDT")).toBe(true)
    expect(isSupportedSymbol("xyz:TSLA")).toBe(true)
    expect(isSupportedSymbol("NOTREAL")).toBe(false)

    expect(getMaxLeverage("BTCUSDT")).toBe(40)
    expect(getMarket("BTCUSDT")?.tvSymbol).toBe("BINANCE:BTCUSDT.P")

    expect(getMaxLeverage("xyz:TSLA")).toBe(10)
    expect(getMarket("xyz:TSLA")?.priceSource).toBe("hyperliquid")
  })
})
