import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit"

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimit("test-key")
  })

  it("allows requests under the limit", () => {
    const config = { maxAttempts: 2, windowMs: 60_000 }

    expect(checkRateLimit("test-key", config).allowed).toBe(true)
    expect(checkRateLimit("test-key", config).allowed).toBe(true)
  })

  it("blocks requests over the limit", () => {
    const config = { maxAttempts: 2, windowMs: 60_000 }

    checkRateLimit("test-key", config)
    checkRateLimit("test-key", config)
    const blocked = checkRateLimit("test-key", config)

    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
  })
})
