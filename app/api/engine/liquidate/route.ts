import { NextResponse } from "next/server"
import { runLiquidationEngineForRoom } from "@/actions/liquidate"
import { getSql } from "@/lib/db"

type ActiveRoom = {
  id: string
}

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export const POST = async (request: Request) => {
  const engineSecret = process.env.ENGINE_CRON_SECRET
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!engineSecret || !bearerToken || bearerToken !== engineSecret) {
    return unauthorized()
  }

  const sql = getSql()
  const activeRooms = (await sql`
    select id::text
    from rooms
    where is_active = true
  `) as ActiveRoom[]

  let totalLiquidated = 0
  for (const room of activeRooms) {
    const result = await runLiquidationEngineForRoom(room.id)
    if (result.ok) {
      totalLiquidated += result.data.liquidated
    }
  }

  return NextResponse.json({
    ok: true,
    processedRooms: activeRooms.length,
    totalLiquidated,
  })
}
