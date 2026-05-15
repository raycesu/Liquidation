import { readFileSync } from "node:fs"
import { join } from "node:path"

describe("run-order-engine integration contracts", () => {
  it("uses shared manual close economics for trigger fills", () => {
    const source = readFileSync(join(__dirname, "run-order-engine.ts"), "utf8")

    expect(source).toContain("computeManualCloseEconomics")
    expect(source).not.toContain("floorRealizedPnl")
  })

  it("claims trigger orders before closing positions", () => {
    const source = readFileSync(join(__dirname, "run-order-engine.ts"), "utf8")
    const triggerStart = source.indexOf("with claimed_order as (")
    const triggerEnd = source.indexOf(
      "`) as { order_id: string; position_id: string; trade: Trade | null }[]",
      triggerStart,
    )

    expect(triggerStart).toBeGreaterThanOrEqual(0)
    expect(triggerEnd).toBeGreaterThan(triggerStart)

    const triggerBlock = source.slice(triggerStart, triggerEnd)
    const claimIndex = triggerBlock.indexOf("claimed_order")
    const closeIndex = triggerBlock.indexOf("closed_position")

    expect(claimIndex).toBeGreaterThanOrEqual(0)
    expect(closeIndex).toBeGreaterThan(claimIndex)
  })
})
