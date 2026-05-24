import {
  formatJoinMonthYear,
  formatShareAssetLabel,
  formatUsdRounded,
  formatUsdTenCents,
} from "@/lib/format"

describe("formatJoinMonthYear", () => {
  it("returns month and year for valid ISO strings", () => {
    const result = formatJoinMonthYear("2025-01-15T12:00:00.000Z")
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2025/)
  })

  it("returns null for invalid dates", () => {
    expect(formatJoinMonthYear("not-a-date")).toBeNull()
  })
})

describe("formatUsdRounded", () => {
  it("rounds to the nearest dollar", () => {
    expect(formatUsdRounded(1830.4)).toBe("$1,830")
    expect(formatUsdRounded(-54488.49)).toBe("-$54,488")
  })
})

describe("formatUsdTenCents", () => {
  it("rounds to the nearest ten cents without trailing zeros", () => {
    expect(formatUsdTenCents(1711.7)).toBe("$1,711.7")
    expect(formatUsdTenCents(1830.58)).toBe("$1,830.6")
    expect(formatUsdTenCents(-54488.49)).toBe("-$54,488.5")
    expect(formatUsdTenCents(-60352)).toBe("-$60,352")
  })
})

describe("formatShareAssetLabel", () => {
  it("strips USDT suffix from crypto symbols", () => {
    expect(formatShareAssetLabel("BTCUSDT")).toBe("BTC")
  })

  it("uses market displayName for xyz equities", () => {
    expect(formatShareAssetLabel("xyz:NVDA")).toBe("NVDA")
  })

  it("strips xyz prefix when market is unknown", () => {
    expect(formatShareAssetLabel("xyz:UNKNOWN")).toBe("UNKNOWN")
  })
})
