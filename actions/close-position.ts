"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOnboardedUser } from "@/lib/auth"
import { assertRoomTradingOpen, loadRoomForParticipant } from "@/lib/competition-guards"
import { fetchMarketPrice } from "@/lib/pricing"
import { getSql, withUserContext } from "@/lib/db"
import { computeManualCloseEconomics } from "@/lib/trading-engine/close-position"
import { getTradeFeeForFill } from "@/lib/trading-fees"
import type { ActionResult, Position, RoomParticipant, Trade } from "@/lib/types"

type PositionWithParticipant = Position & {
  room_participants: RoomParticipant | null
}

export type ClosePositionResult = {
  positionId: string
  realizedPnl: number
  trade: Trade
  availableMargin: number
}

const closePositionSchema = z.object({
  positionId: z.string().uuid(),
  roomId: z.string().uuid(),
})

export const closePosition = async ({
  positionId,
  roomId,
}: {
  positionId: string
  roomId: string
}): Promise<ActionResult<ClosePositionResult>> => {
  const parsed = closePositionSchema.safeParse({ positionId, roomId })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" }
  }

  const user = await requireOnboardedUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to close a position" }
  }

  const membership = await loadRoomForParticipant(parsed.data.roomId, user.id)

  if (!membership.ok) {
    return membership
  }

  const tradingGuard = assertRoomTradingOpen(membership.data.room)

  if (!tradingGuard.ok) {
    return tradingGuard
  }

  return withUserContext(user.id, async () => {
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
        'created_at', rp.created_at::text
      ) as room_participants
    from positions p
    join room_participants rp on rp.id = p.participant_id
    where p.id = ${positionId}
      and rp.room_id = ${parsed.data.roomId}
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

  let finalPrice: number

  try {
    finalPrice = await fetchMarketPrice(position.symbol)
  } catch (error) {
    console.error("[closePosition] fetchMarketPrice failed", {
      symbol: position.symbol,
      message: error instanceof Error ? error.message : String(error),
    })
    return { ok: false, error: "Unable to fetch market price. Try again in a moment." }
  }
  const { fee: tradeFee, liquidityRole } = getTradeFeeForFill({
    notionalUsd: position.size,
    orderType: "MARKET",
  })
  const { realizedPnl, nextAvailableMargin, tradeDirection } = computeManualCloseEconomics({
    entryPrice: position.entry_price,
    livePrice: finalPrice,
    side: position.side,
    size: position.size,
    marginAllocated: position.margin_allocated,
    availableMargin: position.room_participants.available_margin,
    fee: tradeFee,
  })
  const closedRows = (await sql`
    update positions
    set is_open = false,
        closed_at = now()
    where id = ${position.id}
      and is_open = true
    returning id::text
  `) as { id: string }[]

  if (!closedRows[0]) {
    return { ok: false, error: "Position is already closed" }
  }

  await sql`
    update room_participants
    set available_margin = ${nextAvailableMargin}
    where id = ${position.room_participants.id}
  `

  await sql`
    update orders
    set status = 'CANCELLED',
        cancelled_at = now()
    where position_id = ${position.id}
      and status = 'PENDING'
  `

  const tradeRows = (await sql`
    insert into trades (
      participant_id,
      position_id,
      symbol,
      direction,
      price,
      size,
      trade_value,
      realized_pnl,
      fee,
      liquidity_role
    )
    values (
      ${position.room_participants.id},
      ${position.id},
      ${position.symbol},
      ${tradeDirection},
      ${finalPrice},
      ${position.size},
      ${position.size},
      ${realizedPnl},
      ${tradeFee},
      ${liquidityRole}
    )
    returning
      id::text,
      participant_id::text,
      position_id::text,
      symbol,
      direction,
      price::float8 as price,
      size::float8 as size,
      trade_value::float8 as trade_value,
      realized_pnl::float8 as realized_pnl,
      fee::float8 as fee,
      liquidity_role,
      created_at::text
  `) as Trade[]
  const trade = tradeRows[0]

  const authorizedRoomId = position.room_participants.room_id
  revalidatePath(`/room/${authorizedRoomId}/trade`)
  revalidatePath(`/room/${authorizedRoomId}`)
  return {
    ok: true,
    data: {
      positionId: position.id,
      realizedPnl,
      trade,
      availableMargin: nextAvailableMargin,
    },
  }
  })
}
