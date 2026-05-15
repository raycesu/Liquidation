"use server"

import { z } from "zod"
import { requireOnboardedUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { runLiquidationEngineForRoom } from "@/lib/trading-engine/liquidate"
import type { ActionResult } from "@/lib/types"

export type LiquidateRoomResult = {
  liquidated: number
  liquidatedPositionIds: string[]
  availableMargin: number | null
}

export const liquidateRoom = async (roomId: string): Promise<ActionResult<LiquidateRoomResult>> => {
  const parsed = z.string().uuid().safeParse(roomId)
  if (!parsed.success) {
    return { ok: false, error: "Invalid room" }
  }

  const user = await requireOnboardedUser()
  if (!user) {
    return { ok: false, error: "You must be signed in" }
  }

  const sql = getSql()
  const membershipRows = (await sql`
    select id::text
    from room_participants
    where room_id = ${roomId}
      and user_id = ${user.id}
    limit 1
  `) as { id: string }[]

  const participant = membershipRows[0]

  if (!participant) {
    return { ok: false, error: "Forbidden" }
  }

  const engineResult = await runLiquidationEngineForRoom(roomId, { revalidate: true })

  if (!engineResult.ok) {
    return engineResult
  }

  const userLiquidatedPositionIds =
    engineResult.data.liquidatedPositionIds.length === 0
      ? []
      : (
          (await sql`
            select id::text
            from positions
            where participant_id = ${participant.id}
              and id = any(${engineResult.data.liquidatedPositionIds})
          `) as { id: string }[]
        ).map((row) => row.id)

  const marginRows = (await sql`
    select available_margin::float8 as available_margin
    from room_participants
    where id = ${participant.id}
    limit 1
  `) as { available_margin: number }[]

  return {
    ok: true,
    data: {
      liquidated: userLiquidatedPositionIds.length,
      liquidatedPositionIds: userLiquidatedPositionIds,
      availableMargin: marginRows[0]?.available_margin ?? null,
    },
  }
}
