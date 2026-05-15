import { suggestUsername } from "@/lib/suggest-username"

describe("suggestUsername", () => {
  it("strips placeholder suffix from auto-generated username", () => {
    const result = suggestUsername({
      clerkUsername: null,
      fullName: null,
      email: null,
      userId: "user_123456",
      currentUsername: "demo-trader-123456",
    })

    expect(result).toBe("demo-trader")
  })

  it("prefers clerk username when available", () => {
    const result = suggestUsername({
      clerkUsername: "DemoTrader",
      fullName: "Demo Trader",
      email: "demo@example.com",
      userId: "user_123456",
      currentUsername: "auto-xyz999",
    })

    expect(result).toBe("demotrader")
  })
})
