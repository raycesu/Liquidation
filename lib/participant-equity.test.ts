import { computeDisplayEquity, computeParticipantEquity } from "@/lib/participant-equity"

describe("computeParticipantEquity", () => {
  it("includes free margin, locked margin, and unrealized PnL", () => {
    expect(computeParticipantEquity(5000, 2000, 350)).toBe(7350)
    expect(computeParticipantEquity(5000, 2000, -800)).toBe(6200)
  })
})

describe("computeDisplayEquity alias", () => {
  it("matches computeParticipantEquity", () => {
    expect(computeDisplayEquity(1000, 500, 120)).toBe(computeParticipantEquity(1000, 500, 120))
  })
})
