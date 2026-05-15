import { revalidatePath } from "next/cache"
import { getSql } from "@/lib/db"
import { fetchMarketPrices } from "@/lib/pricing"
import {
  computeLiquidationRealizedPnl,
  getCloseTradeDirection,
  isPositionUnderwater,
} from "@/lib/trading-engine/close-position"
import type { ActionResult, Position, SupportedSymbol } from "@/lib/types"
import type { RunLiquidationEngineResult } from "@/lib/trading-engine/types"

type LiquidationPosition = Position & {
  room_participants: {
    id: string
    room_id: string
    available_margin: number
  } | null
}

const liquidatePositionBatch = async (
  roomPositions: LiquidationPosition[],
  prices: Record<string, number>,
) => {
  const sql = getSql()
  let liquidated = 0
  const liquidatedPositionIds: string[] = []

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

    if (!isPositionUnderwater(position, livePrice)) {
      continue
    }

    const tradeDirection = getCloseTradeDirection(position.side)
    const realizedPnl = computeLiquidationRealizedPnl(position.margin_allocated)

    const closedRows = (await sql`
      with closed_position as (
        update positions
        set is_open = false,
            closed_at = now()
        where id = ${position.id}
          and is_open = true
        returning id::text as position_id
      ),
      cancelled_orders as (
        update orders
        set status = 'CANCELLED',
            cancelled_at = now()
        where position_id = ${position.id}
          and status = 'PENDING'
          and exists (select 1 from closed_position)
        returning id::text
      ),
      inserted_trade as (
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
        select
          ${position.participant_id},
          ${position.id},
          ${position.symbol},
          ${tradeDirection},
          ${livePrice},
          ${position.size},
          ${position.size},
          ${realizedPnl}
        where exists (select 1 from closed_position)
        returning id::text
      )
      select position_id from closed_position
    `) as { position_id: string }[]

    if (!closedRows[0]) {
      continue
    }

    liquidated += 1
    liquidatedPositionIds.push(position.id)
  }

  return { liquidated, liquidatedPositionIds }
}

const fetchOpenPositionsForRoom = async (roomId: string) => {
  const sql = getSql()

  return (await sql`
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
}

const fetchOpenPositionsForParticipant = async (roomId: string, participantId: string) => {
  const sql = getSql()

  return (await sql`
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
      and rp.id = ${participantId}
  `) as LiquidationPosition[]
}

export const liquidateParticipantPositions = async (
  roomId: string,
  participantId: string,
  options: { revalidate?: boolean } = {},
): Promise<ActionResult<RunLiquidationEngineResult>> => {
  const { revalidate = false } = options
  const roomPositions = await fetchOpenPositionsForParticipant(roomId, participantId)

  if (roomPositions.length === 0) {
    return { ok: true, data: { liquidated: 0, liquidatedPositionIds: [] } }
  }

  const symbols = Array.from(new Set(roomPositions.map((position) => position.symbol))) as SupportedSymbol[]
  const prices = await fetchMarketPrices(symbols)
  const result = await liquidatePositionBatch(roomPositions, prices)

  if (revalidate && result.liquidated > 0) {
    revalidatePath(`/room/${roomId}/trade`)
    revalidatePath(`/room/${roomId}`)
  }

  return { ok: true, data: result }
}

export const runLiquidationEngineForRoom = async (
  roomId: string,
  options: { revalidate?: boolean } = {},
): Promise<ActionResult<RunLiquidationEngineResult>> => {
  const { revalidate = false } = options
  const roomPositions = await fetchOpenPositionsForRoom(roomId)

  if (roomPositions.length === 0) {
    return { ok: true, data: { liquidated: 0, liquidatedPositionIds: [] } }
  }

  const symbols = Array.from(new Set(roomPositions.map((position) => position.symbol))) as SupportedSymbol[]
  const prices = await fetchMarketPrices(symbols)
  const result = await liquidatePositionBatch(roomPositions, prices)

  if (revalidate && result.liquidated > 0) {
    revalidatePath(`/room/${roomId}/trade`)
    revalidatePath(`/room/${roomId}`)
  }

  return { ok: true, data: result }
}
