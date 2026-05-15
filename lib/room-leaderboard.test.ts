import {
  paginateRankedParticipants,
  parseLeaderboardPage,
  type RankedParticipant,
} from "@/lib/room-leaderboard"

const rankedParticipant = (id: string, totalPnl: number): RankedParticipant => ({
  id,
  room_id: "room-1",
  user_id: `user-${id}`,
  available_margin: 1000,
  created_at: "2026-01-01T00:00:00.000Z",
  users: { id: `user-${id}`, username: `trader-${id}`, image_url: null },
  realizedPnl: totalPnl,
  unrealizedPnl: 0,
  totalPnl,
  closedTrades: 0,
  winningTrades: 0,
  winRate: null,
})

describe("parseLeaderboardPage", () => {
  it("defaults invalid pages to 1", () => {
    expect(parseLeaderboardPage(undefined)).toBe(1)
    expect(parseLeaderboardPage("0")).toBe(1)
    expect(parseLeaderboardPage("2.5")).toBe(1)
  })

  it("accepts positive integers", () => {
    expect(parseLeaderboardPage("3")).toBe(3)
  })
})

describe("paginateRankedParticipants", () => {
  it("caps the current page to the last page", () => {
    const ranked = Array.from({ length: 12 }, (_, index) =>
      rankedParticipant(String(index + 1), 100 - index),
    )

    const page = paginateRankedParticipants(ranked, 99, 5)

    expect(page.currentPage).toBe(3)
    expect(page.totalPages).toBe(3)
    expect(page.visibleParticipants).toHaveLength(2)
  })
})
