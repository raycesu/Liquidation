import {
  closedTradeRoePercent,
  computeDisplayEquity,
  computePnlPercent,
  isAccountBusted,
  maxOrNull,
  meanOrNull,
  placementRankForParticipant,
} from "@/lib/profile-stats"

describe("computeDisplayEquity", () => {
  it("sums margin and unrealized", () => {
    expect(computeDisplayEquity(1000, 250)).toBe(1250)
    expect(computeDisplayEquity(1000, -300)).toBe(700)
  })
})

describe("computePnlPercent", () => {
  it("returns percent vs starting balance", () => {
    expect(computePnlPercent(12_850, 10_000)).toBeCloseTo(28.5, 5)
  })

  it("returns 0 when starting balance is not positive", () => {
    expect(computePnlPercent(5000, 0)).toBe(0)
    expect(computePnlPercent(5000, -100)).toBe(0)
  })
})

describe("closedTradeRoePercent", () => {
  it("returns null when margin is too small", () => {
    expect(closedTradeRoePercent(10, 0)).toBeNull()
    expect(closedTradeRoePercent(10, 1e-9)).toBeNull()
  })

  it("computes ROE percentage", () => {
    expect(closedTradeRoePercent(285, 1000)).toBeCloseTo(28.5, 5)
    expect(closedTradeRoePercent(-50, 1000)).toBeCloseTo(-5, 5)
  })
})

describe("isAccountBusted", () => {
  it("is true when equity is zero and no open positions", () => {
    expect(isAccountBusted(0, false)).toBe(true)
    expect(isAccountBusted(1e-7, false)).toBe(true)
  })

  it("is false when there are open positions", () => {
    expect(isAccountBusted(0, true)).toBe(false)
  })

  it("is false when equity remains", () => {
    expect(isAccountBusted(100, false)).toBe(false)
  })
})

describe("meanOrNull and maxOrNull", () => {
  it("meanOrNull returns null for empty", () => {
    expect(meanOrNull([])).toBeNull()
  })

  it("meanOrNull averages", () => {
    expect(meanOrNull([10, 20, 30])).toBe(20)
  })

  it("maxOrNull returns null for empty", () => {
    expect(maxOrNull([])).toBeNull()
  })

  it("maxOrNull picks max", () => {
    expect(maxOrNull([-2, 5, 3])).toBe(5)
  })
})

describe("placementRankForParticipant", () => {
  it("returns 0 when participant missing", () => {
    expect(placementRankForParticipant([{ id: "a" }, { id: "b" }], "x")).toBe(0)
  })

  it("returns 1-based index in sorted list", () => {
    const sorted = [{ id: "a" }, { id: "b" }, { id: "c" }]
    expect(placementRankForParticipant(sorted, "a")).toBe(1)
    expect(placementRankForParticipant(sorted, "c")).toBe(3)
  })
})
