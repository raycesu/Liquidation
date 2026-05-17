import { computeFundingPayment, getFundingHourUtc } from "@/lib/funding"

describe("funding", () => {
  it("truncates to UTC hour boundary", () => {
    const date = new Date("2026-05-16T14:37:22.000Z")
    const hour = getFundingHourUtc(date)

    expect(hour.toISOString()).toBe("2026-05-16T14:00:00.000Z")
  })

  it("longs pay and shorts receive when rate is positive", () => {
    expect(computeFundingPayment("LONG", 10_000, 0.0001)).toBe(-1)
    expect(computeFundingPayment("SHORT", 10_000, 0.0001)).toBe(1)
  })

  it("reverses sign when rate is negative", () => {
    expect(computeFundingPayment("LONG", 10_000, -0.0001)).toBe(1)
    expect(computeFundingPayment("SHORT", 10_000, -0.0001)).toBe(-1)
  })
})
