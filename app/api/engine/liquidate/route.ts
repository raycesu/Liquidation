import { NextResponse } from "next/server"
import { runTradingEngineForActiveRooms } from "@/lib/trading-engine/run-trading-engine"
import { verifyEngineCronSecret } from "@/lib/engine-auth"

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 })

/** @deprecated Prefer POST /api/engine/run — kept for older scheduler URLs */
export const POST = async (request: Request) => {
  if (!verifyEngineCronSecret(request)) {
    return unauthorized()
  }

  const summary = await runTradingEngineForActiveRooms()

  return NextResponse.json({
    ok: true,
    processedRooms: summary.processedRooms,
    totalLiquidated: summary.totalLiquidated,
    totalFilledOrders: summary.totalFilledOrders,
    deprecated: true,
    message: "Use POST /api/engine/run for order fills and liquidation",
  })
}
