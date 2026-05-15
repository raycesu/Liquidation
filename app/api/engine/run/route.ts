import { NextResponse } from "next/server"
import { runTradingEngineForActiveRooms } from "@/actions/run-trading-engine"
import { verifyEngineCronSecret } from "@/lib/engine-auth"

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export const POST = async (request: Request) => {
  if (!verifyEngineCronSecret(request)) {
    return unauthorized()
  }

  const summary = await runTradingEngineForActiveRooms()

  return NextResponse.json({
    ok: true,
    ...summary,
  })
}
