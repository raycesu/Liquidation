import {
  assertRoomJoinable,
  assertRoomTradingOpen,
  COMPETITION_ENDED_MESSAGE,
  TRADING_CLOSED_MESSAGE,
} from "@/lib/competition-guards"
import type { Room } from "@/lib/types"

const baseRoom: Room = {
  id: "room-1",
  creator_id: "creator",
  name: "Test Room",
  description: null,
  join_code: "ABC123",
  starting_balance: 10_000,
  start_date: "2026-05-01T00:00:00.000Z",
  end_date: "2026-05-31T23:59:59.000Z",
  is_active: true,
  created_at: "2026-04-01T00:00:00.000Z",
}

describe("assertRoomTradingOpen", () => {
  it("allows trading during ongoing phase", () => {
    const now = new Date("2026-05-15T12:00:00.000Z")
    expect(assertRoomTradingOpen(baseRoom, now)).toEqual({ ok: true, data: undefined })
  })

  it("blocks trading before start", () => {
    const now = new Date("2026-04-15T12:00:00.000Z")
    expect(assertRoomTradingOpen(baseRoom, now)).toEqual({ ok: false, error: TRADING_CLOSED_MESSAGE })
  })

  it("blocks trading after end", () => {
    const now = new Date("2026-06-01T12:00:00.000Z")
    expect(assertRoomTradingOpen(baseRoom, now)).toEqual({ ok: false, error: TRADING_CLOSED_MESSAGE })
  })

  it("blocks trading when room is inactive", () => {
    const now = new Date("2026-05-15T12:00:00.000Z")
    expect(assertRoomTradingOpen({ ...baseRoom, is_active: false }, now)).toEqual({
      ok: false,
      error: TRADING_CLOSED_MESSAGE,
    })
  })
})

describe("assertRoomJoinable", () => {
  it("allows join before competition ends", () => {
    const now = new Date("2026-05-15T12:00:00.000Z")
    expect(assertRoomJoinable(baseRoom, now)).toEqual({ ok: true, data: undefined })
  })

  it("blocks join after competition ends", () => {
    const now = new Date("2026-06-01T12:00:00.000Z")
    expect(assertRoomJoinable(baseRoom, now)).toEqual({ ok: false, error: COMPETITION_ENDED_MESSAGE })
  })
})
