import { joinPublicRoom, joinRoom, removeRoomParticipant } from "@/actions/rooms"
import { requireOnboardedUser } from "@/lib/auth"
import { COMPETITION_ENDED_MESSAGE } from "@/lib/competition-guards"
import { getSql } from "@/lib/db"
import type { Room } from "@/lib/types"

jest.mock("@/lib/auth", () => ({
  requireOnboardedUser: jest.fn(),
}))

jest.mock("@/lib/db", () => ({
  getSql: jest.fn(),
  withUserContext: jest.fn((_userId: string, run: () => Promise<unknown>) => run()),
}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}))

const privateRoomId = "11111111-1111-4111-8111-111111111111"
const publicRoomId = "22222222-2222-4222-8222-222222222222"

const activePrivateRoom: Room = {
  id: privateRoomId,
  creator_id: "creator_1",
  name: "Arena",
  description: null,
  is_public: false,
  join_code: "ABC123",
  starting_balance: 10000,
  start_date: "2026-01-01T00:00:00.000Z",
  end_date: "2099-12-31T23:59:59.000Z",
  is_active: true,
  settled_at: null,
  late_join_hours: null,
  created_at: "2026-01-01T00:00:00.000Z",
}

const activePublicRoom: Room = {
  ...activePrivateRoom,
  id: publicRoomId,
  is_public: true,
  join_code: null,
}

const onboardedUser = {
  id: "user_1",
  email: "trader@example.com",
  username: "rayce",
  image_url: null,
  profile_setup_completed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
}

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
    requireOnboardedUserMock.mockResolvedValue(onboardedUser)

    const sqlMock = jest
      .fn()
      .mockResolvedValueOnce([activePrivateRoom])
      .mockResolvedValueOnce([])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await joinRoom("abc123")

    expect(result).toEqual({ ok: true, data: { roomId: privateRoomId } })
    expect(sqlMock.mock.calls[0]?.[1]).toBe("ABC123")
    expect(sqlMock).toHaveBeenCalledTimes(2)
  })

  it("rejects join when the competition has ended", async () => {
    requireOnboardedUserMock.mockResolvedValue(onboardedUser)

    const sqlMock = jest.fn().mockResolvedValueOnce([
      {
        ...activePrivateRoom,
        start_date: "2020-01-01T00:00:00.000Z",
        end_date: "2020-12-31T23:59:59.000Z",
        is_active: false,
      },
    ])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await joinRoom("ABC123")

    expect(result).toEqual({ ok: false, error: COMPETITION_ENDED_MESSAGE })
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it("returns an error when the code does not match a room", async () => {
    requireOnboardedUserMock.mockResolvedValue(onboardedUser)

    const sqlMock = jest.fn().mockResolvedValueOnce([])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await joinRoom("ABC123")

    expect(result).toEqual({ ok: false, error: "Room not found" })
  })

  it("rejects joining a public room by code", async () => {
    requireOnboardedUserMock.mockResolvedValue(onboardedUser)

    const sqlMock = jest.fn().mockResolvedValueOnce([activePublicRoom])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await joinRoom("ABC123")

    expect(result).toEqual({
      ok: false,
      error: "This is a public room — join from the dashboard",
    })
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })
})

describe("joinPublicRoom", () => {
  const requireOnboardedUserMock = jest.mocked(requireOnboardedUser)
  const getSqlMock = jest.mocked(getSql)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("rejects invalid room ids before reading the current user", async () => {
    const result = await joinPublicRoom("not-a-uuid")

    expect(result.ok).toBe(false)
    expect(requireOnboardedUserMock).not.toHaveBeenCalled()
  })

  it("joins a public room by id", async () => {
    requireOnboardedUserMock.mockResolvedValue(onboardedUser)

    const sqlMock = jest
      .fn()
      .mockResolvedValueOnce([activePublicRoom])
      .mockResolvedValueOnce([])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await joinPublicRoom(publicRoomId)

    expect(result).toEqual({ ok: true, data: { roomId: publicRoomId } })
    expect(sqlMock).toHaveBeenCalledTimes(2)
  })

  it("rejects joining a private room by id", async () => {
    requireOnboardedUserMock.mockResolvedValue(onboardedUser)

    const sqlMock = jest.fn().mockResolvedValueOnce([activePrivateRoom])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await joinPublicRoom(privateRoomId)

    expect(result).toEqual({
      ok: false,
      error: "This room is private — use the join code",
    })
  })
})

describe("removeRoomParticipant", () => {
  const requireOnboardedUserMock = jest.mocked(requireOnboardedUser)
  const getSqlMock = jest.mocked(getSql)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("rejects when the caller is not the room creator", async () => {
    requireOnboardedUserMock.mockResolvedValue(onboardedUser)

    const sqlMock = jest.fn().mockResolvedValueOnce([
      { id: privateRoomId, creator_id: "other_creator" },
    ])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await removeRoomParticipant(privateRoomId, "user_target")

    expect(result).toEqual({
      ok: false,
      error: "Only the room creator can remove participants",
    })
  })

  it("rejects removing the creator", async () => {
    requireOnboardedUserMock.mockResolvedValue(onboardedUser)

    const sqlMock = jest.fn().mockResolvedValueOnce([
      { id: privateRoomId, creator_id: "user_1" },
    ])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await removeRoomParticipant(privateRoomId, "user_1")

    expect(result).toEqual({
      ok: false,
      error: "You cannot remove yourself from the room",
    })
  })

  it("rejects when the participant has open positions", async () => {
    requireOnboardedUserMock.mockResolvedValue(onboardedUser)

    const sqlMock = jest
      .fn()
      .mockResolvedValueOnce([{ id: privateRoomId, creator_id: "user_1" }])
      .mockResolvedValueOnce([{ id: "participant_1" }])
      .mockResolvedValueOnce([{ id: "position_1" }])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await removeRoomParticipant(privateRoomId, "user_target")

    expect(result).toEqual({
      ok: false,
      error: "Close all open positions before removing this participant",
    })
  })

  it("removes a participant with no open positions", async () => {
    requireOnboardedUserMock.mockResolvedValue(onboardedUser)

    const sqlMock = jest
      .fn()
      .mockResolvedValueOnce([{ id: privateRoomId, creator_id: "user_1" }])
      .mockResolvedValueOnce([{ id: "participant_1" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const result = await removeRoomParticipant(privateRoomId, "user_target")

    expect(result).toEqual({ ok: true, data: undefined })
    expect(sqlMock).toHaveBeenCalledTimes(4)
  })
})
