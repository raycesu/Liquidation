import { buildParticipantNetPnlStats } from "@/lib/net-pnl"

describe("buildParticipantNetPnlStats", () => {
  it("combines fee-inclusive trade pnl with funding pnl", () => {
    const stats = buildParticipantNetPnlStats(
      ["p1", "p2"],
      [
        {
          participant_id: "p1",
          trade_pnl: -9400,
          closed_trade_count: 2,
          winning_trade_count: 0,
        },
      ],
      [{ participant_id: "p1", funding_pnl: -600 }],
    )

    expect(stats.get("p1")).toEqual({
      tradePnl: -9400,
      fundingPnl: -600,
      realizedPnl: -10_000,
      closedTradeCount: 2,
      winningTradeCount: 0,
    })
    expect(stats.get("p2")).toEqual({
      tradePnl: 0,
      fundingPnl: 0,
      realizedPnl: 0,
      closedTradeCount: 0,
      winningTradeCount: 0,
    })
  })

  it("keeps funding-only participants in the result", () => {
    const stats = buildParticipantNetPnlStats([], [], [{ participant_id: "p3", funding_pnl: -250 }])

    expect(stats.get("p3")).toEqual({
      tradePnl: 0,
      fundingPnl: -250,
      realizedPnl: -250,
      closedTradeCount: 0,
      winningTradeCount: 0,
    })
  })
})
