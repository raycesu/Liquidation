import {
  closedTradeRoePercent,
  computeDisplayEquity,
  computePnlPercent,
  isAccountBusted,
  maxOrNull,
  meanOrNull,
  pickTopTradesByPnl,
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

describe("pickTopTradesByPnl", () => {
  const baseRow = {
    room_id: "room-1",
    symbol: "BTCUSDT",
    side: "LONG" as const,
    leverage: 5,
    margin_allocated: 1000,
    entry_price: 80_000,
    close_price: 81_000,
    room_name: "Test",
  }

  it("sorts by realized PnL descending and returns at most 3", () => {
    const rows = [
      { ...baseRow, trade_id: "t1", realized_pnl: 50 },
      { ...baseRow, trade_id: "t2", realized_pnl: 300 },
      { ...baseRow, trade_id: "t3", realized_pnl: 120 },
      { ...baseRow, trade_id: "t4", realized_pnl: 200 },
    ]

    const top = pickTopTradesByPnl(rows)

    expect(top).toHaveLength(3)
    expect(top.map((t) => t.tradeId)).toEqual(["t2", "t4", "t3"])
  })

  it("skips trades with invalid margin", () => {
    const rows = [
      { ...baseRow, trade_id: "t1", realized_pnl: 500, margin_allocated: 0 },
      { ...baseRow, trade_id: "t2", realized_pnl: 100 },
    ]

    const top = pickTopTradesByPnl(rows)

    expect(top).toHaveLength(1)
    expect(top[0]?.tradeId).toBe("t2")
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
