"use server"

import { revalidatePath } from "next/cache"
import { requireCurrentUser } from "@/lib/auth"
import { fetchSpotPrice } from "@/lib/binance"
import { getSql } from "@/lib/db"
import { calculatePnl, floorRealizedPnl } from "@/lib/perpetuals"
import type { ActionResult, Position, RoomParticipant } from "@/lib/types"

type PositionWithParticipant = Position & {
  room_participants: RoomParticipant | null
}

export const closePosition = async ({
  positionId,
  roomId,
}: {
  positionId: string
  roomId: string
}): Promise<ActionResult<{ positionId: string; realizedPnl: number }>> => {
  const user = await requireCurrentUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to close a position" }
  }

  const sql = getSql()
  const positions = (await sql`
    select
      p.id::text,
      p.participant_id::text,
      p.symbol,
      p.side,
      p.leverage,
      p.size::float8 as size,
      p.margin_allocated::float8 as margin_allocated,
      p.entry_price::float8 as entry_price,
      p.liquidation_price::float8 as liquidation_price,
      p.is_open,
      p.created_at::text,
      p.closed_at::text,
      json_build_object(
        'id', rp.id::text,
        'room_id', rp.room_id::text,
        'user_id', rp.user_id,
        'available_margin', rp.available_margin::float8,
        'total_equity', rp.total_equity::float8,
        'created_at', rp.created_at::text
      ) as room_participants
    from positions p
    join room_participants rp on rp.id = p.participant_id
    where p.id = ${positionId}
      and rp.user_id = ${user.id}
    limit 1
  `) as PositionWithParticipant[]
  const position = positions[0]

  if (!position || !position.room_participants) {
    return { ok: false, error: "Position not found" }
  }

  if (!position.is_open) {
    return { ok: false, error: "Position is already closed" }
  }

  const finalPrice = await fetchSpotPrice(position.symbol)
  const rawPnl = calculatePnl({
    entryPrice: position.entry_price,
    livePrice: finalPrice,
    side: position.side,
    size: position.size,
  })
  const realizedPnl = floorRealizedPnl(rawPnl, position.margin_allocated)
  const nextAvailableMargin =
    position.room_participants.available_margin + position.margin_allocated + realizedPnl
  const nextTotalEquity = Math.max(0, nextAvailableMargin)

  await sql`
    update positions
    set is_open = false,
        closed_at = now()
    where id = ${position.id}
  `

  await sql`
    update room_participants
    set available_margin = ${Math.max(0, nextAvailableMargin)},
        total_equity = ${nextTotalEquity}
    where id = ${position.room_participants.id}
  `

  revalidatePath(`/room/${roomId}/trade`)
  revalidatePath(`/room/${roomId}`)
  return { ok: true, data: { positionId: position.id, realizedPnl } }
}
