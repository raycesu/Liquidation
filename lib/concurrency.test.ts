import { mapWithConcurrency } from "@/lib/concurrency"

describe("mapWithConcurrency", () => {
  it("runs all items and preserves order", async () => {
    const results = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => value * 2)

    expect(results).toEqual([2, 4, 6, 8])
  })

  it("respects concurrency limit", async () => {
    let inFlight = 0
    let maxInFlight = 0

    await mapWithConcurrency([1, 2, 3, 4, 5], 2, async () => {
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 10))
      inFlight -= 1
    })

    expect(maxInFlight).toBeLessThanOrEqual(2)
  })
})
