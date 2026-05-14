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
        created_at: new Date().toISOString(),
      },
    ])
    getSqlMock.mockReturnValue(sqlMock as unknown as ReturnType<typeof getSql>)

    await requireCurrentUser()

    const sqlCall = sqlMock.mock.calls[0]?.[0]
    const fullQuery = Array.isArray(sqlCall?.raw) ? sqlCall.raw.join(" ") : ""

    expect(fullQuery).toContain("set email = excluded.email")
    expect(fullQuery).toContain("image_url = excluded.image_url")
    expect(fullQuery).not.toContain("set username = excluded.username")
  })
})
