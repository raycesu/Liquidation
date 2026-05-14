import { updateProfile } from "@/actions/update-profile"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"

jest.mock("@/lib/auth", () => ({
  requireCurrentUser: jest.fn(),
}))

jest.mock("@/lib/db", () => ({
  getSql: jest.fn(),
}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

describe("updateProfile", () => {
  const requireCurrentUserMock = jest.mocked(requireCurrentUser)
  const getSqlMock = jest.mocked(getSql)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("rejects invalid usernames", async () => {
    const formData = new FormData()
    formData.set("username", "UPPERCASE")

    const result = await updateProfile({ ok: true, data: { username: "" } }, formData)
    expect(result.ok).toBe(false)
  })

  it("returns taken error when username conflicts", async () => {
    requireCurrentUserMock.mockResolvedValue({
      id: "user_1",
      email: "trader@example.com",
      username: "rayce",
      image_url: null,
      created_at: new Date().toISOString(),
    })

    const sqlMock = jest.fn().mockRejectedValue({ code: "23505" })
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    const formData = new FormData()
    formData.set("username", "new-name")

    const result = await updateProfile({ ok: true, data: { username: "" } }, formData)
    expect(result).toEqual({ ok: false, error: "Username already taken" })
  })
})
