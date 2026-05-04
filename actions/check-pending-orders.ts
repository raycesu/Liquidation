"use server"

import { revalidatePath } from "next/cache"
import { requireCurrentUser } from "@/lib/auth"
import { isSupportedSymbol } from "@/lib/markets"
import { fetchMarketPrices } from "@/lib/pricing"
import { getSql } from "@/lib/db"
import { calculateLiquidationPrice, calculatePnl, floorRealizedPnl } from "@/lib/perpetuals"
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

const isLimitTriggered = (order: PendingOrder, price: number) => {
  if (order.side === "LONG") {
    return price <= order.trigger_price
  }

  return price >= order.trigger_price
}

const isTakeProfitTriggered = (order: PendingOrder, price: number) => {
  if (order.side === "LONG") {
    return price <= order.trigger_price
  }

  return price >= order.trigger_price
}

const isStopLossTriggered = (order: PendingOrder, price: number) => {
  if (order.side === "LONG") {
    return price >= order.trigger_price
  }

  return price <= order.trigger_price
}

export const checkPendingOrders = async ({
  roomId,
}: {
  roomId: string
}): Promise<ActionResult<CheckPendingOrdersResult>> => {
  const user = await requireCurrentUser()

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
      o.reduce_only,
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

  const symbols = Array.from(new Set(orders.map((order) => order.symbol))).filter(isSupportedSymbol) as SupportedSymbol[]

  if (symbols.length === 0) {
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

  const prices = await fetchMarketPrices(symbols)

  const filledOrderIds: string[] = []
  const cancelledOrderIds: string[] = []
  const newPositions: Position[] = []
  const closedPositionIds: string[] = []
  const trades: Trade[] = []

  let availableMargin = participant.available_margin

  for (const order of orders) {
    const livePrice = prices[order.symbol]

    if (livePrice == null || !Number.isFinite(livePrice) || livePrice <= 0) {
      continue
    }

    if (order.type === "LIMIT") {
      if (!isLimitTriggered(order, livePrice)) {
        continue
      }

      const positionSide: PositionSide = order.side
      const liquidationPrice = calculateLiquidationPrice({
        entryPrice: livePrice,
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
          ${livePrice},
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
          ${livePrice},
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

      await sql`
        update orders
        set status = 'FILLED',
            filled_at = now()
        where id = ${order.id}
      `

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

    await sql`
      update positions
      set is_open = false,
          closed_at = now()
      where id = ${attachedPosition.id}
    `

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

    await sql`
      update orders
      set status = 'FILLED',
          filled_at = now()
      where id = ${order.id}
    `

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
