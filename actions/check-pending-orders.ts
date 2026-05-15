"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOnboardedUser } from "@/lib/auth"
import { isSupportedSymbol } from "@/lib/markets"
import { fetchMarketPrices } from "@/lib/pricing"
import { getSql } from "@/lib/db"
import { calculateLiquidationPrice, calculatePnl, floorRealizedPnl } from "@/lib/perpetuals"
import {
  getLimitFillPrice,
  getTriggerPriority,
  isLimitTriggered,
  isStopLossTriggered,
  isTakeProfitTriggered,
} from "@/lib/trading-rules"
import type {
  ActionResult,
  PendingOrder,
  Position,
  PositionSide,
  RoomParticipant,
  SupportedSymbol,
  Trade,
} from "@/lib/types"

type PendingOrderRow = PendingOrder & {
  participant: RoomParticipant
  attached_position: Position | null
}

export type CheckPendingOrdersResult = {
  filledOrderIds: string[]
  cancelledOrderIds: string[]
  newPositions: Position[]
  closedPositionIds: string[]
  trades: Trade[]
  availableMargin: number | null
}

export const checkPendingOrders = async ({
  roomId,
}: {
  roomId: string
}): Promise<ActionResult<CheckPendingOrdersResult>> => {
  const parsed = z.string().uuid().safeParse(roomId)
  if (!parsed.success) {
    return { ok: false, error: "Invalid room id" }
  }

  const user = await requireOnboardedUser()

  if (!user) {
    return { ok: false, error: "You must be signed in" }
  }

  const sql = getSql()
  const participants = (await sql`
    select
      id::text,
      room_id::text,
      user_id,
      available_margin::float8 as available_margin,
      total_equity::float8 as total_equity,
      created_at::text
    from room_participants
    where room_id = ${roomId}
      and user_id = ${user.id}
    limit 1
  `) as RoomParticipant[]
  const participant = participants[0]

  if (!participant) {
    return { ok: false, error: "Participant not found" }
  }

  const orders = (await sql`
    select
      o.id::text,
      o.participant_id::text,
      o.position_id::text,
      o.symbol,
      o.side,
      o.type,
      o.size::float8 as size,
      o.leverage,
      o.trigger_price::float8 as trigger_price,
      o.status,
      o.margin_reserved::float8 as margin_reserved,
      o.created_at::text,
      o.filled_at::text,
      o.cancelled_at::text,
      json_build_object(
        'id', rp.id::text,
        'room_id', rp.room_id::text,
        'user_id', rp.user_id,
        'available_margin', rp.available_margin::float8,
        'total_equity', rp.total_equity::float8,
        'created_at', rp.created_at::text
      ) as participant,
      case when p.id is null then null else json_build_object(
        'id', p.id::text,
        'participant_id', p.participant_id::text,
        'symbol', p.symbol,
        'side', p.side,
        'leverage', p.leverage,
        'size', p.size::float8,
        'margin_allocated', p.margin_allocated::float8,
        'entry_price', p.entry_price::float8,
        'liquidation_price', p.liquidation_price::float8,
        'is_open', p.is_open,
        'created_at', p.created_at::text,
        'closed_at', p.closed_at::text
      ) end as attached_position
    from orders o
    join room_participants rp on rp.id = o.participant_id
    left join positions p on p.id = o.position_id
    where o.participant_id = ${participant.id}
      and o.status = 'PENDING'
    order by o.created_at asc
  `) as PendingOrderRow[]

  if (orders.length === 0) {
    return {
      ok: true,
      data: {
        filledOrderIds: [],
        cancelledOrderIds: [],
        newPositions: [],
        closedPositionIds: [],
        trades: [],
        availableMargin: participant.available_margin,
      },
    }
  }

  const supportedOrders = orders.filter((order) => isSupportedSymbol(order.symbol))
  const unsupportedOrders = orders.filter((order) => !isSupportedSymbol(order.symbol))
  const symbols = Array.from(new Set(supportedOrders.map((order) => order.symbol))) as SupportedSymbol[]
  const filledOrderIds: string[] = []
  const cancelledOrderIds: string[] = []
  const newPositions: Position[] = []
  const closedPositionIds: string[] = []
  const trades: Trade[] = []

  let availableMargin = participant.available_margin

  if (unsupportedOrders.length > 0) {
    const unsupportedOrderIds = unsupportedOrders.map((order) => order.id)
    await sql`
      update orders
      set status = 'CANCELLED',
          cancelled_at = now()
      where id = any(${unsupportedOrderIds})
        and status = 'PENDING'
    `
    cancelledOrderIds.push(...unsupportedOrderIds)

    const releasedMargin = unsupportedOrders.reduce((sum, order) => sum + order.margin_reserved, 0)
    if (releasedMargin > 0) {
      availableMargin += releasedMargin
      await sql`
        update room_participants
        set available_margin = ${availableMargin}
        where id = ${participant.id}
      `
    }
  }

  if (symbols.length === 0) {
    return {
      ok: true,
      data: {
        filledOrderIds: [],
        cancelledOrderIds,
        newPositions: [],
        closedPositionIds: [],
        trades: [],
        availableMargin,
      },
    }
  }

  const prices = await fetchMarketPrices(symbols)

  const sortedOrders = [...supportedOrders].sort((a, b) => {
    const priority = getTriggerPriority(a) - getTriggerPriority(b)
    if (priority !== 0) {
      return priority
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  for (const order of sortedOrders) {
    const livePrice = prices[order.symbol]

    if (livePrice == null || !Number.isFinite(livePrice) || livePrice <= 0) {
      continue
    }

    if (order.type === "LIMIT") {
      if (!isLimitTriggered(order, livePrice)) {
        continue
      }

      const claimedOrderRows = (await sql`
        update orders
        set status = 'FILLED',
            filled_at = now()
        where id = ${order.id}
          and status = 'PENDING'
        returning id::text
      `) as { id: string }[]

      if (!claimedOrderRows[0]) {
        continue
      }

      const positionSide: PositionSide = order.side
      const fillPrice = getLimitFillPrice(order, livePrice)
      const liquidationPrice = calculateLiquidationPrice({
        entryPrice: fillPrice,
        leverage: order.leverage,
        side: positionSide,
      })

      const insertedPositions = (await sql`
        insert into positions (
          participant_id,
          symbol,
          side,
          leverage,
          size,
          margin_allocated,
          entry_price,
          liquidation_price,
          is_open
        )
        values (
          ${order.participant_id},
          ${order.symbol},
          ${positionSide},
          ${order.leverage},
          ${order.size},
          ${order.margin_reserved},
          ${fillPrice},
          ${liquidationPrice},
          true
        )
        returning
          id::text,
          participant_id::text,
          symbol,
          side,
          leverage,
          size::float8 as size,
          margin_allocated::float8 as margin_allocated,
          entry_price::float8 as entry_price,
          liquidation_price::float8 as liquidation_price,
          is_open,
          created_at::text,
          closed_at::text
      `) as Position[]
      const newPosition = insertedPositions[0]

      if (!newPosition) {
        continue
      }

      newPositions.push(newPosition)

      const tradeDirection = positionSide === "LONG" ? "OPEN_LONG" : "OPEN_SHORT"
      const tradeRows = (await sql`
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
          ${order.participant_id},
          ${newPosition.id},
          ${order.symbol},
          ${tradeDirection},
          ${fillPrice},
          ${order.size},
          ${order.size},
          null
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
          created_at::text
      `) as Trade[]

      if (tradeRows[0]) {
        trades.push(tradeRows[0])
      }

      filledOrderIds.push(order.id)
      continue
    }

    const attachedPosition = order.attached_position

    if (!attachedPosition) {
      await sql`
        update orders
        set status = 'CANCELLED',
            cancelled_at = now()
        where id = ${order.id}
      `
      cancelledOrderIds.push(order.id)
      continue
    }

    if (!attachedPosition.is_open) {
      await sql`
        update orders
        set status = 'CANCELLED',
            cancelled_at = now()
        where id = ${order.id}
      `
      cancelledOrderIds.push(order.id)
      continue
    }

    const positionPrice = livePrice
    const triggered =
      order.type === "TAKE_PROFIT"
        ? isTakeProfitTriggered(order, positionPrice)
        : isStopLossTriggered(order, positionPrice)

    if (!triggered) {
      continue
    }

    const rawPnl = calculatePnl({
      entryPrice: attachedPosition.entry_price,
      livePrice: positionPrice,
      side: attachedPosition.side,
      size: attachedPosition.size,
    })
    const realizedPnl = floorRealizedPnl(rawPnl, attachedPosition.margin_allocated)
    const nextAvailableMargin = Math.max(
      0,
      availableMargin + attachedPosition.margin_allocated + realizedPnl,
    )

    const closedRows = (await sql`
      update positions
      set is_open = false,
          closed_at = now()
      where id = ${attachedPosition.id}
        and is_open = true
      returning id::text
    `) as { id: string }[]

    if (!closedRows[0]) {
      continue
    }

    await sql`
      update room_participants
      set available_margin = ${nextAvailableMargin},
          total_equity = ${nextAvailableMargin}
      where id = ${order.participant_id}
    `

    availableMargin = nextAvailableMargin

    await sql`
      update orders
      set status = 'CANCELLED',
          cancelled_at = now()
      where position_id = ${attachedPosition.id}
        and status = 'PENDING'
        and id <> ${order.id}
    `

    const claimedTriggerRows = (await sql`
      update orders
      set status = 'FILLED',
          filled_at = now()
      where id = ${order.id}
        and status = 'PENDING'
      returning id::text
    `) as { id: string }[]

    if (!claimedTriggerRows[0]) {
      continue
    }

    const tradeDirection = attachedPosition.side === "LONG" ? "CLOSE_LONG" : "CLOSE_SHORT"
    const tradeRows = (await sql`
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
        ${order.participant_id},
        ${attachedPosition.id},
        ${order.symbol},
        ${tradeDirection},
        ${positionPrice},
        ${attachedPosition.size},
        ${attachedPosition.size},
        ${realizedPnl}
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
        created_at::text
    `) as Trade[]

    if (tradeRows[0]) {
      trades.push(tradeRows[0])
    }

    closedPositionIds.push(attachedPosition.id)
    filledOrderIds.push(order.id)
  }

  if (filledOrderIds.length > 0 || closedPositionIds.length > 0) {
    revalidatePath(`/room/${roomId}/trade`)
  }

  return {
    ok: true,
    data: {
      filledOrderIds,
      cancelledOrderIds,
      newPositions,
      closedPositionIds,
      trades,
      availableMargin,
    },
  }
}
