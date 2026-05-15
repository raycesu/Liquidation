/** @jest-environment node */

import { timingSafeEqual } from "node:crypto"
import { verifyEngineCronSecret } from "@/lib/engine-auth"

const safeCompare = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

describe("verifyEngineCronSecret", () => {
  const originalSecret = process.env.ENGINE_CRON_SECRET

  afterEach(() => {
    process.env.ENGINE_CRON_SECRET = originalSecret
  })

  it("accepts a matching bearer token", () => {
    process.env.ENGINE_CRON_SECRET = "test-secret-token"
    const request = new Request("https://example.com/api/engine/run", {
      headers: { Authorization: "Bearer test-secret-token" },
    })

    expect(verifyEngineCronSecret(request)).toBe(true)
  })

  it("rejects missing or invalid bearer tokens", () => {
    process.env.ENGINE_CRON_SECRET = "test-secret-token"
    const missing = new Request("https://example.com/api/engine/run")
    const wrong = new Request("https://example.com/api/engine/run", {
      headers: { Authorization: "Bearer wrong-token" },
    })

    expect(verifyEngineCronSecret(missing)).toBe(false)
    expect(verifyEngineCronSecret(wrong)).toBe(false)
  })

  it("uses length-safe comparison for equal-length secrets", () => {
    expect(safeCompare("abc", "abc")).toBe(true)
    expect(safeCompare("abc", "abd")).toBe(false)
    expect(safeCompare("abc", "abcd")).toBe(false)
  })
})
