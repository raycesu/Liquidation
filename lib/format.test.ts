import { formatShareAssetLabel } from "@/lib/format"

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
