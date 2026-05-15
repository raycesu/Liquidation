import { render, screen } from "@testing-library/react"
import { ProfilePageTabs } from "@/components/profile/profile-page-tabs"
import type { ProfileDashboardData } from "@/lib/types"

jest.mock("@/actions/get-profile-room-breakdown", () => ({
  getProfileRoomBreakdown: jest.fn(),
}))

const mockData: Pick<
  ProfileDashboardData,
  "summary" | "tradingStyle" | "competitionRows" | "shareRoomOptions"
> = {
  summary: {
    competitionsEntered: 1,
    allTimeAvgPnlPercent: -0.003,
    bestTradeRoePercent: 0.039,
    timesLiquidated: 0,
    wipeouts: [],
  },
  tradingStyle: {
    longCount: 2,
    shortCount: 0,
    longBiasPercent: 100,
    averageLeverage: 12.5,
    averageHoldMs: 370598.5,
    topSymbols: [{ symbol: "BTCUSDT", count: 2 }],
  },
  competitionRows: [
    {
      room: {
        id: "f3581f97-8115-44c7-a8e7-a8748e3b50ca",
        creator_id: "user_test",
        name: "Test",
        description: null,
        join_code: "9G76CR",
        starting_balance: 10000,
        start_date: "2026-04-25 18:41:07.143325+00",
        end_date: "2026-04-26 04:00:00+00",
        is_active: true,
        created_at: "2026-04-25 18:41:07.143325+00",
      },
      participantId: "b8c148dd-c7c3-40ab-ba26-d26b27e84acb",
      placementRank: 1,
      entryCount: 1,
      endDateIso: "2026-04-26 04:00:00+00",
      isOngoing: false,
      pnlPercent: -0.003,
      displayEquity: 9999.66,
    },
  ],
  shareRoomOptions: [
    {
      room: {
        id: "f3581f97-8115-44c7-a8e7-a8748e3b50ca",
        creator_id: "user_test",
        name: "Test",
        description: null,
        join_code: "9G76CR",
        starting_balance: 10000,
        start_date: "2026-04-25 18:41:07.143325+00",
        end_date: "2026-04-26 04:00:00+00",
        is_active: true,
        created_at: "2026-04-25 18:41:07.143325+00",
      },
      participantId: "b8c148dd-c7c3-40ab-ba26-d26b27e84acb",
      placementRank: 1,
      pnlPercent: -0.003,
      entryCount: 1,
      participantCount: 1,
      startDateIso: "2026-04-25 18:41:07.143325+00",
      endDateIso: "2026-04-26 04:00:00+00",
      isOngoing: false,
      topTrades: [
        {
          tradeId: "3babe799-e8a1-48da-8812-d67a4c5d6eea",
          symbol: "BTCUSDT",
          side: "LONG",
          leverage: 5,
          roePercent: 0.039,
          realizedPnl: 2.64,
        },
      ],
    },
  ],
}

describe("ProfilePageTabs", () => {
  it("renders trading stats tab without throwing", () => {
    render(
      <ProfilePageTabs
        summary={mockData.summary}
        tradingStyle={mockData.tradingStyle}
        competitionRows={mockData.competitionRows}
        shareRoomOptions={mockData.shareRoomOptions}
        assetBaseUrl="http://localhost:3000"
      />,
    )

    expect(screen.getByText("Trading Stats")).toBeInTheDocument()
    expect(screen.getByText("Stats Overview")).toBeInTheDocument()
  })
})
