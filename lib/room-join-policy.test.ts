import {
  formatLateJoinPolicy,
  getRoomJoinCutoff,
  isRoomJoinOpen,
} from "@/lib/room-join-policy"
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
  settled_at: null,
  late_join_hours: null,
  created_at: "2026-04-01T00:00:00.000Z",
}

describe("getRoomJoinCutoff", () => {
  it("returns null when late_join_hours is unset", () => {
    expect(getRoomJoinCutoff(baseRoom)).toBeNull()
  })

  it("returns start_date when late_join_hours is 0", () => {
    const cutoff = getRoomJoinCutoff({ ...baseRoom, late_join_hours: 0 })
    expect(cutoff?.toISOString()).toBe("2026-05-01T00:00:00.000Z")
  })

  it("returns start plus hours when late_join_hours is positive", () => {
    const cutoff = getRoomJoinCutoff({ ...baseRoom, late_join_hours: 48 })
    expect(cutoff?.toISOString()).toBe("2026-05-03T00:00:00.000Z")
  })
})

describe("isRoomJoinOpen", () => {
  it("allows join mid-competition when policy is open until end", () => {
    const now = new Date("2026-05-15T12:00:00.000Z")
    expect(isRoomJoinOpen(baseRoom, now)).toBe(true)
  })

  it("allows join before start when late_join_hours is 0", () => {
    const now = new Date("2026-04-15T12:00:00.000Z")
    expect(isRoomJoinOpen({ ...baseRoom, late_join_hours: 0 }, now)).toBe(true)
  })

  it("blocks join after start when late_join_hours is 0", () => {
    const now = new Date("2026-05-15T12:00:00.000Z")
    expect(isRoomJoinOpen({ ...baseRoom, late_join_hours: 0 }, now)).toBe(false)
  })

  it("allows join within late window", () => {
    const now = new Date("2026-05-02T00:00:00.000Z")
    expect(isRoomJoinOpen({ ...baseRoom, late_join_hours: 48 }, now)).toBe(true)
  })

  it("blocks join after late window", () => {
    const now = new Date("2026-05-04T00:00:00.000Z")
    expect(isRoomJoinOpen({ ...baseRoom, late_join_hours: 48 }, now)).toBe(false)
  })

  it("blocks join after competition ends", () => {
    const now = new Date("2026-06-01T12:00:00.000Z")
    expect(isRoomJoinOpen(baseRoom, now)).toBe(false)
  })
})

describe("formatLateJoinPolicy", () => {
  it("formats open until end policy", () => {
    expect(formatLateJoinPolicy(baseRoom)).toBe("Open until competition ends")
  })

  it("formats no late joiners policy", () => {
    expect(formatLateJoinPolicy({ ...baseRoom, late_join_hours: 0 })).toBe(
      "No late joiners — join before start",
    )
  })

  it("formats hour window policy", () => {
    expect(formatLateJoinPolicy({ ...baseRoom, late_join_hours: 48 })).toBe(
      "Late joins allowed for 48 hours after start",
    )
  })

  it("formats singular hour policy", () => {
    expect(formatLateJoinPolicy({ ...baseRoom, late_join_hours: 1 })).toBe(
      "Late joins allowed for 1 hour after start",
    )
  })
})
