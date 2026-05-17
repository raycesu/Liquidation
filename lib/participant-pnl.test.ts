import {
  computePnlPercentFromTotalPnl,
  computeTotalPnl,
  placementRankForParticipant,
  scoreParticipantsByTotalPnl,
} from "@/lib/participant-pnl"

describe("computeTotalPnl", () => {
  it("sums realized and unrealized", () => {
    expect(computeTotalPnl(300, -50)).toBe(250)
  })
})

describe("computePnlPercentFromTotalPnl", () => {
  it("returns percent of starting balance from trade PnL", () => {
    expect(computePnlPercentFromTotalPnl(2850, 10_000)).toBeCloseTo(28.5, 5)
    expect(computePnlPercentFromTotalPnl(-461, 10_000)).toBeCloseTo(-4.61, 5)
  })

  it("returns 0 when starting balance is not positive", () => {
    expect(computePnlPercentFromTotalPnl(500, 0)).toBe(0)
  })
})

describe("scoreParticipantsByTotalPnl", () => {
  const participants = [
    { id: "a", available_margin: 9000, room_id: "r1" },
    { id: "b", available_margin: 11_000, room_id: "r1" },
  ]

  it("ranks by total PnL then available margin", () => {
    const realized = new Map([
      ["a", 500],
      ["b", 200],
    ])
    const unrealized = new Map([
      ["a", -100],
      ["b", 50],
    ])

    const ranked = scoreParticipantsByTotalPnl(participants, realized, unrealized)

    expect(ranked.map((row) => row.id)).toEqual(["a", "b"])
    expect(ranked[0]?.totalPnl).toBe(400)
    expect(ranked[1]?.totalPnl).toBe(250)
  })

  it("uses available margin as tiebreaker", () => {
    const realized = new Map([
      ["a", 100],
      ["b", 100],
    ])
    const unrealized = new Map<string, number>()

    const ranked = scoreParticipantsByTotalPnl(participants, realized, unrealized)

    expect(ranked.map((row) => row.id)).toEqual(["b", "a"])
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
