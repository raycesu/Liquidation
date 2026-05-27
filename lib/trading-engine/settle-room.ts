import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getSql } from "@/lib/db"
import { isSupportedSymbol } from "@/lib/markets"
import { fetchMarketPrices } from "@/lib/pricing"
import { floorToUsdCents, toDecimal } from "@/lib/margin-utils"
import { isRoomSettled, roomNeedsSettlement } from "@/lib/room-competition-status"
import { computeManualCloseEconomics } from "@/lib/trading-engine/close-position"
import { getTradeFeeForFill } from "@/lib/trading-fees"
import type { ActionResult, Position, Room, SupportedSymbol } from "@/lib/types"

export type SettleRoomResult = {
  cancelledOrderIds: string[]
  closedPositionIds: string[]
  skippedSymbols: SupportedSymbol[]
}

type SettlementPosition = Position & {
  room_participants: {
    id: string
    available_margin: string
  } | null
}

const cancelAllPendingOrdersForRoom = async (roomId: string) => {
  const sql = getSql()

  const cancelledRows = (await sql`
    update orders o
    set status = 'CANCELLED',
        cancelled_at = now()
    from room_participants rp
    where o.participant_id = rp.id
      and rp.room_id = ${roomId}
      and o.status = 'PENDING'
    returning o.id::text, o.participant_id::text, o.margin_reserved::float8 as margin_reserved
  `) as { id: string; participant_id: string; margin_reserved: number }[]

  if (cancelledRows.length === 0) {
    return { cancelledOrderIds: [] as string[] }
  }

  const releaseByParticipant = new Map<string, number>()

  cancelledRows.forEach((row) => {
    if (row.margin_reserved <= 0) {
      return
    }

    releaseByParticipant.set(
      row.participant_id,
      (releaseByParticipant.get(row.participant_id) ?? 0) + row.margin_reserved,
    )
  })

  for (const [participantId, released] of releaseByParticipant) {
    await sql`
      update room_participants
      set available_margin = available_margin + ${released}
      where id = ${participantId}
    `
  }

  return { cancelledOrderIds: cancelledRows.map((row) => row.id) }
}

const fetchOpenPositionsForSettlement = async (roomId: string) => {
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
        'available_margin', rp.available_margin::text
      ) as room_participants
    from positions p
    join room_participants rp on rp.id = p.participant_id
    where rp.room_id = ${roomId}
      and p.is_open = true
    order by p.created_at asc
  `) as SettlementPosition[]
}

const closePositionAtSettlement = async (
  position: SettlementPosition,
  livePrice: number,
  availableMargin: number,
) => {
  const sql = getSql()
  const participant = position.room_participants

  if (!participant) {
    return null
  }

  const { fee: tradeFee, liquidityRole } = getTradeFeeForFill({
    notionalUsd: position.size,
    orderType: "MARKET",
  })
  const { realizedPnl, nextAvailableMargin, tradeDirection } = computeManualCloseEconomics({
    entryPrice: position.entry_price,
    livePrice,
    side: position.side,
    size: position.size,
    marginAllocated: position.margin_allocated,
    availableMargin,
    fee: tradeFee,
  })

  const closedRows = (await sql`
    with closed_position as (
      update positions
      set is_open = false,
          closed_at = now()
      where id = ${position.id}
        and is_open = true
      returning id, participant_id, symbol, size
    ),
    cancelled_orders as (
      update orders
      set status = 'CANCELLED',
          cancelled_at = now()
      where position_id = ${position.id}
        and status = 'PENDING'
        and exists (select 1 from closed_position)
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
        realized_pnl,
        fee,
        liquidity_role
      )
      select
        cp.participant_id,
        cp.id,
        cp.symbol,
        ${tradeDirection},
        ${livePrice},
        cp.size,
        cp.size,
        ${realizedPnl},
        ${tradeFee},
        ${liquidityRole}
      from closed_position cp
      returning id::text
    )
    select id::text as position_id from closed_position
  `) as { position_id: string }[]

  if (!closedRows[0]) {
    return null
  }

  return { positionId: position.id, nextAvailableMargin }
}

const closeAllOpenPositionsForRoom = async (
  roomId: string,
  prices: Partial<Record<SupportedSymbol, number>>,
) => {
  const sql = getSql()
  const positions = await fetchOpenPositionsForSettlement(roomId)
  const closedPositionIds: string[] = []
  const skippedSymbols = new Set<SupportedSymbol>()
  const marginByParticipant = new Map<string, number>()

  const participantRows = (await sql`
    select id::text, available_margin::text as available_margin
    from room_participants
    where room_id = ${roomId}
  `) as { id: string; available_margin: string }[]

  participantRows.forEach((row) => {
    marginByParticipant.set(row.id, floorToUsdCents(toDecimal(row.available_margin)).toNumber())
  })

  for (const position of positions) {
    const participantId = position.participant_id
    const livePrice = prices[position.symbol as SupportedSymbol]

    if (livePrice == null || !Number.isFinite(livePrice) || livePrice <= 0) {
      if (isSupportedSymbol(position.symbol)) {
        skippedSymbols.add(position.symbol as SupportedSymbol)
      }
      continue
    }

    const availableMargin =
      marginByParticipant.get(participantId) ??
      (position.room_participants
        ? floorToUsdCents(toDecimal(position.room_participants.available_margin)).toNumber()
        : 0)
    const closeResult = await closePositionAtSettlement(position, livePrice, availableMargin)

    if (!closeResult) {
      continue
    }

    closedPositionIds.push(closeResult.positionId)
    marginByParticipant.set(participantId, closeResult.nextAvailableMargin)
  }

  for (const [participantId, availableMargin] of marginByParticipant) {
    await sql`
      update room_participants
      set available_margin = ${availableMargin}
      where id = ${participantId}
    `
  }

  return { closedPositionIds, skippedSymbols: Array.from(skippedSymbols) }
}

const countOpenExposure = async (roomId: string) => {
  const sql = getSql()

  const [openPositions, pendingOrders] = await Promise.all([
    sql`
      select count(*)::int as count
      from positions p
      join room_participants rp on rp.id = p.participant_id
      where rp.room_id = ${roomId}
        and p.is_open = true
    `,
    sql`
      select count(*)::int as count
      from orders o
      join room_participants rp on rp.id = o.participant_id
      where rp.room_id = ${roomId}
        and o.status = 'PENDING'
    `,
  ])

  return {
    openPositions: (openPositions as { count: number }[])[0]?.count ?? 0,
    pendingOrders: (pendingOrders as { count: number }[])[0]?.count ?? 0,
  }
}

const markRoomSettled = async (roomId: string) => {
  const sql = getSql()

  await sql`
    update rooms
    set is_active = false,
        settled_at = now()
    where id = ${roomId}
      and settled_at is null
  `
}

const loadRoomForSettlement = async (roomId: string) => {
  const sql = getSql()

  const rows = (await sql`
    select
      id::text,
      creator_id,
      name,
      description,
      is_public,
      join_code,
      starting_balance::float8 as starting_balance,
      start_date::text,
      end_date::text,
      is_active,
      settled_at::text,
      late_join_hours,
      created_at::text
    from rooms
    where id = ${roomId}
    limit 1
  `) as Room[]

  return rows[0] ?? null
}

export const settleRoomCompetition = async (
  roomId: string,
  options: { revalidate?: boolean; now?: Date } = {},
): Promise<ActionResult<SettleRoomResult>> => {
  const parsed = z.string().uuid().safeParse(roomId)

  if (!parsed.success) {
    return { ok: false, error: "Invalid room id" }
  }

  const { revalidate = true, now = new Date() } = options
  const room = await loadRoomForSettlement(roomId)

  if (!room) {
    return { ok: false, error: "Room not found" }
  }

  if (isRoomSettled(room)) {
    return {
      ok: true,
      data: { cancelledOrderIds: [], closedPositionIds: [], skippedSymbols: [] },
    }
  }

  if (!roomNeedsSettlement(room, now)) {
    return { ok: false, error: "Competition has not ended yet" }
  }

  const { cancelledOrderIds } = await cancelAllPendingOrdersForRoom(roomId)

  const openPositions = await fetchOpenPositionsForSettlement(roomId)
  const symbols = Array.from(new Set(openPositions.map((position) => position.symbol))).filter(
    (symbol): symbol is SupportedSymbol => isSupportedSymbol(symbol),
  )
  const prices = symbols.length > 0 ? await fetchMarketPrices(symbols) : {}

  const { closedPositionIds, skippedSymbols } = await closeAllOpenPositionsForRoom(roomId, prices)

  if (skippedSymbols.length > 0) {
    return {
      ok: false,
      error: `Unable to settle room: missing market prices for ${skippedSymbols.join(", ")}`,
    }
  }

  const exposure = await countOpenExposure(roomId)

  if (exposure.openPositions > 0 || exposure.pendingOrders > 0) {
    return {
      ok: false,
      error: "Settlement incomplete: open positions or pending orders remain",
    }
  }

  await markRoomSettled(roomId)

  if (revalidate) {
    revalidatePath(`/room/${roomId}/trade`)
    revalidatePath(`/room/${roomId}`)
    revalidatePath("/dashboard")
  }

  return {
    ok: true,
    data: { cancelledOrderIds, closedPositionIds, skippedSymbols: [] },
  }
}
