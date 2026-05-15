import { NextResponse } from "next/server"
import { runTradingEngineForActiveRooms } from "@/lib/trading-engine/run-trading-engine"
import { verifyEngineCronSecret } from "@/lib/engine-auth"
import { checkRateLimit } from "@/lib/rate-limit"

/** Called by an external scheduler (e.g. cron-job.org every 1 min), not Vercel Cron on Hobby. */
const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 })

const getClientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for")

  if (!forwarded) {
    return "unknown"
  }

  return forwarded.split(",")[0]?.trim() ?? "unknown"
}

export const POST = async (request: Request) => {
  const ip = getClientIp(request)
  const rateLimit = checkRateLimit(`engine-run:${ip}`, { maxAttempts: 10, windowMs: 60_000 })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } },
    )
  }

  if (!verifyEngineCronSecret(request)) {
    return unauthorized()
  }

  const summary = await runTradingEngineForActiveRooms()

  return NextResponse.json({
    ok: true,
    ...summary,
  })
}
