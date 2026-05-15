jest.mock("@/lib/pricing", () => ({
  fetchMarketPrice: jest.fn(),
}))

jest.mock("@/lib/auth", () => ({
  requireOnboardedUser: jest.fn(),
}))

jest.mock("@/lib/competition-guards", () => ({
  loadRoomForParticipant: jest.fn(),
  assertRoomTradingOpen: jest.fn(),
}))

jest.mock("@/lib/db", () => ({
  getSql: jest.fn(),
  withUserContext: jest.fn((_userId: string, run: () => Promise<unknown>) => run()),
}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

import { fetchMarketPrice } from "@/lib/pricing"
import { requireOnboardedUser } from "@/lib/auth"
import { assertRoomTradingOpen, loadRoomForParticipant } from "@/lib/competition-guards"
import { getSql } from "@/lib/db"
import { placeOrder } from "@/actions/place-order"

const fetchMarketPriceMock = fetchMarketPrice as jest.MockedFunction<typeof fetchMarketPrice>
const requireOnboardedUserMock = requireOnboardedUser as jest.MockedFunction<typeof requireOnboardedUser>
const loadRoomForParticipantMock = loadRoomForParticipant as jest.MockedFunction<typeof loadRoomForParticipant>
const assertRoomTradingOpenMock = assertRoomTradingOpen as jest.MockedFunction<typeof assertRoomTradingOpen>
const getSqlMock = getSql as jest.MockedFunction<typeof getSql>

describe("placeOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireOnboardedUserMock.mockResolvedValue({ id: "user-1" } as never)
    loadRoomForParticipantMock.mockResolvedValue({
      ok: true,
      data: {
        room: {
          id: "room-1",
          start_date: "2020-01-01",
          end_date: "2099-01-01",
          is_active: true,
        },
        participant: {
          id: "00000000-0000-4000-8000-000000000001",
          room_id: "00000000-0000-4000-8000-000000000002",
          user_id: "user-1",
          available_margin: 10_000,
          created_at: "2026-01-01T00:00:00.000Z",
        },
      },
    } as never)
    assertRoomTradingOpenMock.mockReturnValue({ ok: true, data: undefined })
    getSqlMock.mockReturnValue((async () => []) as never)
  })

  it("returns a friendly error when market price fetch fails", async () => {
    fetchMarketPriceMock.mockRejectedValue(new Error("Binance unavailable"))

    const result = await placeOrder({
      participantId: "00000000-0000-4000-8000-000000000001",
      roomId: "00000000-0000-4000-8000-000000000002",
      symbol: "BTCUSDT",
      side: "LONG",
      leverage: 5,
      size: 0.01,
    })

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.error).toBe("Unable to fetch market price. Try again in a moment.")
    }
  })
})
