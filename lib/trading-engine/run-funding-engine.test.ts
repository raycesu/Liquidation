import { readFileSync } from "node:fs"
import { join } from "node:path"
import { getFundingHourUtc } from "@/lib/funding"

describe("run-funding-engine", () => {
  it("uses hourly UTC idempotency key", () => {
    const hour = getFundingHourUtc(new Date("2026-05-16T09:45:00.000Z"))
    expect(hour.getUTCMinutes()).toBe(0)
    expect(hour.getUTCSeconds()).toBe(0)
  })

  it("records funding payments with conflict guard", () => {
    const source = readFileSync(join(__dirname, "run-funding-engine.ts"), "utf8")
    expect(source).toContain("on conflict (position_id, funding_hour) do nothing")
    expect(source).toContain("last_funding_hour")
  })
})
