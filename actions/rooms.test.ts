import { joinRoom } from "@/actions/rooms"
import { requireOnboardedUser } from "@/lib/auth"
import { getSql } from "@/lib/db"

jest.mock("@/lib/auth", () => ({
  requireOnboardedUser: jest.fn(),
}))

jest.mock("@/lib/db", () => ({
  getSql: jest.fn(),
}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}))

describe("joinRoom", () => {
  const requireOnboardedUserMock = jest.mocked(requireOnboardedUser)
  const getSqlMock = jest.mocked(getSql)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("rejects invalid room codes before reading the current user", async () => {
    const result = await joinRoom("room-id")

    expect(result.ok).toBe(false)
    expect(requireOnboardedUserMock).not.toHaveBeenCalled()
  })

  it("normalizes codes before looking up the room and joining it", async () => {
    requireOnboardedUserMock.mockResolvedValue({
      id: "user_1",
      email: "trader@example.com",
      username: "rayce",
      image_url: null,
      profile_setup_completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })

    const sqlMock = jest
      .fn()
      .mockResolvedValueOnce([{ id: "room_1", starting_balance: 10000, is_active: true }])
      .mockResolvedValueOnce([])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await joinRoom("abc123")

    expect(result).toEqual({ ok: true, data: { roomId: "room_1" } })
    expect(sqlMock.mock.calls[0]?.[1]).toBe("ABC123")
    expect(sqlMock).toHaveBeenCalledTimes(2)
  })

  it("returns an error when the code does not match a room", async () => {
    requireOnboardedUserMock.mockResolvedValue({
      id: "user_1",
      email: "trader@example.com",
      username: "rayce",
      image_url: null,
      profile_setup_completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })

    const sqlMock = jest.fn().mockResolvedValueOnce([])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await joinRoom("ABC123")

    expect(result).toEqual({ ok: false, error: "Room not found" })
  })
})
