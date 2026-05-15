import { currentUser } from "@clerk/nextjs/server"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(),
}))

jest.mock("@/lib/db", () => ({
  getSql: jest.fn(),
}))

describe("requireCurrentUser", () => {
  const currentUserMock = jest.mocked(currentUser)
  const getSqlMock = jest.mocked(getSql)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("upserts without overwriting existing username", async () => {
    currentUserMock.mockResolvedValue({
      id: "user_123456",
      username: "demo",
      fullName: "Demo Trader",
      primaryEmailAddress: { emailAddress: "demo@example.com" },
    } as Awaited<ReturnType<typeof currentUser>>)

    const sqlMock = jest.fn().mockResolvedValue([
      {
        id: "user_123456",
        email: "demo@example.com",
        username: "existing-name",
        image_url: "https://img.clerk.com/demo",
        profile_setup_completed_at: null,
        created_at: new Date().toISOString(),
      },
    ])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    await requireCurrentUser()

    const sqlCall = sqlMock.mock.calls[0]?.[0]
    const fullQuery = Array.isArray(sqlCall?.raw) ? sqlCall.raw.join(" ") : ""

    expect(fullQuery).toContain("set email = excluded.email")
    expect(fullQuery).toContain("when users.profile_setup_completed_at is null then excluded.image_url")
    expect(fullQuery).not.toContain("set username = excluded.username")
  })

  it("does not overwrite image_url when profile setup is complete", async () => {
    currentUserMock.mockResolvedValue({
      id: "user_123456",
      imageUrl: "https://img.clerk.com/new",
      primaryEmailAddress: { emailAddress: "demo@example.com" },
    } as Awaited<ReturnType<typeof currentUser>>)

    const sqlMock = jest.fn().mockResolvedValue([
      {
        id: "user_123456",
        email: "demo@example.com",
        username: "rayce",
        image_url: "https://img.clerk.com/stored",
        profile_setup_completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    await requireCurrentUser()

    const sqlCall = sqlMock.mock.calls[0]?.[0]
    const fullQuery = Array.isArray(sqlCall?.raw) ? sqlCall.raw.join(" ") : ""

    expect(fullQuery).toContain("else users.image_url")
  })
})
