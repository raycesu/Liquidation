"use server"

import { z } from "zod"
import { requireOnboardedUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { fetchMarketPrices } from "@/lib/pricing"
import type { ActionResult, Position, SupportedSymbol } from "@/lib/types"

type LiquidationPosition = Position & {
  room_participants: {
    id: string
    room_id: string
    available_margin: number
  } | null
}

const isUnderwater = (position: Position, livePrice: number) => {
  if (position.side === "LONG") {
    return livePrice <= position.liquidation_price
  }

  return livePrice >= position.liquidation_price
}

export const liquidateRoom = async (roomId: string): Promise<ActionResult<{ liquidated: number }>> => {
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

  if (!membershipRows[0]) {
    return { ok: false, error: "Forbidden" }
  }

  return runLiquidationEngineForRoom(roomId)
}

export const runLiquidationEngineForRoom = async (
  roomId: string,
): Promise<ActionResult<{ liquidated: number }>> => {
  const sql = getSql()
  const roomPositions = (await sql`
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
        'available_margin', rp.available_margin::float8
      ) as room_participants
    from positions p
    join room_participants rp on rp.id = p.participant_id
    where p.is_open = true
      and rp.room_id = ${roomId}
  `) as LiquidationPosition[]

  if (roomPositions.length === 0) {
    return { ok: true, data: { liquidated: 0 } }
  }

  const symbols = Array.from(new Set(roomPositions.map((position) => position.symbol))) as SupportedSymbol[]
  const prices = await fetchMarketPrices(symbols)
  const updatedAt = new Date().toISOString()

  for (const [symbol, price] of Object.entries(prices)) {
    await sql`
      insert into latest_prices (symbol, price, updated_at)
      values (${symbol}, ${price}, ${updatedAt})
      on conflict (symbol) do update
      set price = excluded.price,
          updated_at = excluded.updated_at
    `
  }

  let liquidated = 0

  for (const position of roomPositions) {
    const livePrice = prices[position.symbol]

    if (
      livePrice == null ||
      !Number.isFinite(livePrice) ||
      livePrice <= 0 ||
      !position.room_participants
    ) {
      continue
    }

    if (!isUnderwater(position, livePrice)) {
      continue
    }

    const closedRows = (await sql`
      update positions
      set is_open = false,
          closed_at = now()
      where id = ${position.id}
        and is_open = true
      returning id::text
    `) as { id: string }[]

    if (!closedRows[0]) {
      continue
    }

    await sql`
      update orders
      set status = 'CANCELLED',
          cancelled_at = now()
      where position_id = ${position.id}
        and status = 'PENDING'
    `

    await sql`
      update room_participants
      set total_equity = ${position.room_participants.available_margin}
      where id = ${position.room_participants.id}
    `

    const tradeDirection = position.side === "LONG" ? "CLOSE_LONG" : "CLOSE_SHORT"
    await sql`
      insert into trades (
        participant_id,
        position_id,
        symbol,
        direction,
        price,
        size,
        trade_value,
        realized_pnl
      )
      values (
        ${position.participant_id},
        ${position.id},
        ${position.symbol},
        ${tradeDirection},
        ${livePrice},
        ${position.size},
        ${position.size},
        ${-position.margin_allocated}
      )
    `

    liquidated += 1
  }

  return { ok: true, data: { liquidated } }
}
