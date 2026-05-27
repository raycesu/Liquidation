import { floorToUsdCents, hasSufficientMarginUsd, requiredMarginUsd, toDecimal } from "@/lib/margin-utils"

describe("margin-utils", () => {
  it("floors to USD cents (never rounds up)", () => {
    expect(floorToUsdCents("1598.879").toFixed(2)).toBe("1598.87")
  })

  it("computes required margin and compares using floored cents", () => {
    const available = toDecimal("1598.87")
    const sizeUsd = toDecimal("63954.95")
    const leverage = 40

    const required = requiredMarginUsd(sizeUsd, leverage)

    expect(required.toFixed(2)).toBe("1598.87")
    expect(hasSufficientMarginUsd(available, required)).toBe(true)
  })

  it("fails when required margin exceeds available cents", () => {
    const available = toDecimal("1598.87")
    const sizeUsd = toDecimal("63955.20")
    const leverage = 40

    const required = requiredMarginUsd(sizeUsd, leverage)

    expect(required.toFixed(2)).toBe("1598.88")
    expect(hasSufficientMarginUsd(available, required)).toBe(false)
  })
})

