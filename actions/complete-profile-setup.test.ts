import { currentUser } from "@clerk/nextjs/server"
import { completeProfileSetup } from "@/actions/complete-profile-setup"
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

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}))

describe("completeProfileSetup", () => {
  const requireCurrentUserMock = jest.mocked(requireCurrentUser)
  const currentUserMock = jest.mocked(currentUser)
  const getSqlMock = jest.mocked(getSql)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("rejects invalid usernames", async () => {
    requireCurrentUserMock.mockResolvedValue({
      id: "user_1",
      email: "trader@example.com",
      username: "trader-000001",
      image_url: null,
      profile_setup_completed_at: null,
      created_at: new Date().toISOString(),
    })

    const formData = new FormData()
    formData.set("username", "UPPERCASE")

    const result = await completeProfileSetup({ ok: true, data: { username: "" } }, formData)
    expect(result.ok).toBe(false)
  })

  it("returns taken error when username conflicts", async () => {
    requireCurrentUserMock.mockResolvedValue({
      id: "user_1",
      email: "trader@example.com",
      username: "trader-000001",
      image_url: null,
      profile_setup_completed_at: null,
      created_at: new Date().toISOString(),
    })
    currentUserMock.mockResolvedValue(null)

    const sqlMock = jest.fn().mockRejectedValue({ code: "23505" })
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const formData = new FormData()
    formData.set("username", "new-name")

    const result = await completeProfileSetup({ ok: true, data: { username: "" } }, formData)
    expect(result).toEqual({ ok: false, error: "Username already taken" })
  })

  it("marks profile setup complete and redirects", async () => {
    requireCurrentUserMock.mockResolvedValue({
      id: "user_1",
      email: "trader@example.com",
      username: "trader-000001",
      image_url: null,
      profile_setup_completed_at: null,
      created_at: new Date().toISOString(),
    })
    currentUserMock.mockResolvedValue({
      imageUrl: "https://img.clerk.com/avatar",
    } as unknown as Awaited<ReturnType<typeof currentUser>>)

    const sqlMock = jest.fn().mockResolvedValue([])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const formData = new FormData()
    formData.set("username", "new-name")

    await completeProfileSetup({ ok: true, data: { username: "" } }, formData)

    const sqlCall = sqlMock.mock.calls[0]?.[0]
    const fullQuery = Array.isArray(sqlCall?.raw) ? sqlCall.raw.join(" ") : ""

    expect(fullQuery).toContain("profile_setup_completed_at = now()")
    expect(fullQuery).toContain("username =")
    expect(fullQuery).toContain("image_url =")
  })
})
