import {
  getCompetitionPhase,
  isRoomSettled,
  roomNeedsSettlement,
} from "@/lib/room-competition-status"
import type { Room } from "@/lib/types"

const baseRoom: Room = {
  id: "room-1",
  creator_id: "creator",
  name: "Test Room",
  description: null,
  is_public: false,
  join_code: "ABC123",
  starting_balance: 10_000,
  start_date: "2026-05-01T00:00:00.000Z",
  end_date: "2026-05-31T23:59:59.000Z",
  is_active: true,
  settled_at: null,
  late_join_hours: null,
  created_at: "2026-04-01T00:00:00.000Z",
}

describe("isRoomSettled", () => {
  it("is false when settled_at is null", () => {
    expect(isRoomSettled(baseRoom)).toBe(false)
  })

  it("is true when settled_at is set", () => {
    expect(isRoomSettled({ ...baseRoom, settled_at: "2026-06-01T00:00:00.000Z" })).toBe(true)
  })
})

describe("roomNeedsSettlement", () => {
  it("is false before end while active and unsettled", () => {
    const now = new Date("2026-05-15T12:00:00.000Z")
    expect(roomNeedsSettlement(baseRoom, now)).toBe(false)
  })

  it("is true after end when unsettled", () => {
    const now = new Date("2026-06-01T12:00:00.000Z")
    expect(roomNeedsSettlement(baseRoom, now)).toBe(true)
  })

  it("is true when inactive before end", () => {
    const now = new Date("2026-05-15T12:00:00.000Z")
    expect(roomNeedsSettlement({ ...baseRoom, is_active: false }, now)).toBe(true)
  })

  it("is false once settled", () => {
    const now = new Date("2026-06-01T12:00:00.000Z")
    expect(roomNeedsSettlement({ ...baseRoom, settled_at: "2026-06-01T00:00:00.000Z" }, now)).toBe(false)
  })
})

describe("getCompetitionPhase", () => {
  it("returns ended when settled even before end date", () => {
    const now = new Date("2026-05-15T12:00:00.000Z")
    expect(getCompetitionPhase({ ...baseRoom, settled_at: "2026-05-15T00:00:00.000Z" }, now)).toBe("ended")
  })
})
