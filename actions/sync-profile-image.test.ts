import { currentUser } from "@clerk/nextjs/server"
import { syncProfileImage } from "@/actions/sync-profile-image"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(),
}))

jest.mock("@/lib/auth", () => ({
  requireCurrentUser: jest.fn(),
}))

jest.mock("@/lib/db", () => ({
  getSql: jest.fn(),
}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

describe("syncProfileImage", () => {
  const requireCurrentUserMock = jest.mocked(requireCurrentUser)
  const currentUserMock = jest.mocked(currentUser)
  const getSqlMock = jest.mocked(getSql)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("rejects unauthenticated users", async () => {
    requireCurrentUserMock.mockResolvedValue(null)

    const result = await syncProfileImage()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain("signed in")
    }
  })

  it("syncs clerk image url into postgres", async () => {
    const sqlMock = jest.fn().mockResolvedValue([])
    getSqlMock.mockReturnValue(sqlMock as never)

    requireCurrentUserMock.mockResolvedValue({
      id: "user_1",
      email: "trader@example.com",
      username: "trader-000001",
      image_url: null,
      profile_setup_completed_at: "2026-01-01T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
    })

    currentUserMock.mockResolvedValue({
      imageUrl: "https://img.clerk.com/avatar",
    } as Awaited<ReturnType<typeof currentUser>>)

    const result = await syncProfileImage()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.imageUrl).toBe("https://img.clerk.com/avatar")
    }

    expect(sqlMock).toHaveBeenCalled()
    const sqlCall = sqlMock.mock.calls[0]?.[0]
    const fullQuery = Array.isArray(sqlCall?.raw) ? sqlCall.raw.join(" ") : ""

    expect(fullQuery).toContain("image_url =")
    expect(fullQuery).toContain("where id =")
  })
})
