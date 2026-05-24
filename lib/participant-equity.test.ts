import { computeParticipantEquity } from "@/lib/participant-equity"

describe("computeParticipantEquity", () => {
  it("includes free margin, locked margin, and unrealized PnL", () => {
    expect(computeParticipantEquity(5000, 2000, 350)).toBe(7350)
    expect(computeParticipantEquity(5000, 2000, -800)).toBe(6200)
  })
})
