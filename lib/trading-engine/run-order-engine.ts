import { revalidatePath } from "next/cache"
import { z } from "zod"
import { isSupportedSymbol } from "@/lib/markets"
import { fetchMarketPrices } from "@/lib/pricing"
import { getSql } from "@/lib/db"
import { calculateLiquidationPrice } from "@/lib/perpetuals"
import { computeManualCloseEconomics } from "@/lib/trading-engine/close-position"
import { getTradeFeeForFill } from "@/lib/trading-fees"
import {
  getLimitFillPrice,
  getTriggerPriority,
  isLimitTriggered,
  isStopLossTriggered,
  isTakeProfitTriggered,
  validateTriggerPrices,
} from "@/lib/trading-rules"
import type { LinkedBracketTrigger } from "@/lib/trading-engine/types"
import type { ActionResult, PendingOrder, Position, PositionSide, SupportedSymbol, Trade } from "@/lib/types"
import type { RunOrderEngineOptions, RunOrderEngineResult } from "@/lib/trading-engine/types"

type PendingOrderRow = PendingOrder & {
  attached_position: Position | null
}

type LimitFillRow = {
  order_id: string
  position: Position
  trade: Trade | null
}

type TriggerFillRow = {
  order_id: string
  position_id: string
  trade: Trade | null
}

export const runOrderEngineForRoom = async (
  roomId: string,
  options: RunOrderEngineOptions = {},
): Promise<ActionResult<RunOrderEngineResult>> => {
  const parsed = z.string().uuid().safeParse(roomId)

  if (!parsed.success) {
    return { ok: false, error: "Invalid room id" }
  }

  const { participantId, revalidate = true } = options
  const sql = getSql()

  const participantMargins = new Map<string, number>()
  const marginRows = participantId
    ? ((await sql`
        select id::text, available_margin::float8 as available_margin
        from room_participants
        where room_id = ${roomId}
          and id = ${participantId}
      `) as { id: string; available_margin: number }[])
    : ((await sql`
        select id::text, available_margin::float8 as available_margin
        from room_participants
        where room_id = ${roomId}
      `) as { id: string; available_margin: number }[])

  for (const row of marginRows) {
    participantMargins.set(row.id, row.available_margin)
  }

  const orders = participantId
    ? ((await sql`
        select
          o.id::text,
          o.participant_id::text,
          o.parent_order_id::text,
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
        where rp.room_id = ${roomId}
          and o.participant_id = ${participantId}
          and o.status = 'PENDING'
        order by o.created_at asc
      `) as PendingOrderRow[])
    : ((await sql`
        select
          o.id::text,
          o.participant_id::text,
          o.parent_order_id::text,
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
        where rp.room_id = ${roomId}
          and o.status = 'PENDING'
        order by o.created_at asc
      `) as PendingOrderRow[])

  const skippedSymbols = new Set<string>()
  const skippedOrderIds: string[] = []

  const emptyResult: RunOrderEngineResult = {
    filledOrderIds: [],
    cancelledOrderIds: [],
    newPositions: [],
    closedPositionIds: [],
    trades: [],
    skippedSymbols: [],
    skippedOrderIds: [],
    linkedBracketTriggers: [],
  }

  if (orders.length === 0) {
    return { ok: true, data: emptyResult }
  }

  const supportedOrders = orders.filter((order) => isSupportedSymbol(order.symbol))
  const unsupportedOrders = orders.filter((order) => !isSupportedSymbol(order.symbol))
  const symbols = Array.from(new Set(supportedOrders.map((order) => order.symbol))) as SupportedSymbol[]
  const filledOrderIds: string[] = []
  const cancelledOrderIds: string[] = []
  const newPositions: Position[] = []
  const closedPositionIds: string[] = []
  const trades: Trade[] = []
  const linkedBracketTriggers: LinkedBracketTrigger[] = []

  if (unsupportedOrders.length > 0) {
    const unsupportedByParticipant = new Map<string, PendingOrderRow[]>()

    for (const order of unsupportedOrders) {
      const bucket = unsupportedByParticipant.get(order.participant_id) ?? []
      bucket.push(order)
      unsupportedByParticipant.set(order.participant_id, bucket)
    }

    for (const [orderParticipantId, participantOrders] of unsupportedByParticipant) {
      const unsupportedOrderIds = participantOrders.map((order) => order.id)
      await sql`
        update orders
        set status = 'CANCELLED',
            cancelled_at = now()
        where id = any(${unsupportedOrderIds})
          and status = 'PENDING'
      `
      cancelledOrderIds.push(...unsupportedOrderIds)

      const releasedMargin = participantOrders.reduce((sum, order) => sum + order.margin_reserved, 0)
      if (releasedMargin > 0) {
        const currentMargin = participantMargins.get(orderParticipantId) ?? 0
        const nextMargin = currentMargin + releasedMargin
        participantMargins.set(orderParticipantId, nextMargin)
        await sql`
          update room_participants
          set available_margin = ${nextMargin}
          where id = ${orderParticipantId}
        `
      }
    }
  }

  if (symbols.length === 0) {
    return {
      ok: true,
      data: {
        filledOrderIds,
        cancelledOrderIds,
        newPositions,
        closedPositionIds,
        trades,
        skippedSymbols: Array.from(skippedSymbols),
        skippedOrderIds,
        linkedBracketTriggers,
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
      skippedSymbols.add(order.symbol)
      skippedOrderIds.push(order.id)
      continue
    }

    if (order.type === "LIMIT") {
      if (!isLimitTriggered(order, livePrice)) {
        continue
      }

      const positionSide: PositionSide = order.side
      const fillPrice = getLimitFillPrice(order, livePrice)
      const liquidationPrice = calculateLiquidationPrice({
        entryPrice: fillPrice,
        leverage: order.leverage,
        side: positionSide,
      })
      const tradeDirection = positionSide === "LONG" ? "OPEN_LONG" : "OPEN_SHORT"
      const participantAvailableMargin = participantMargins.get(order.participant_id) ?? 0
      const { fee: makerFee, liquidityRole } = getTradeFeeForFill({
        notionalUsd: order.size,
        orderType: "LIMIT",
      })

      if (participantAvailableMargin < makerFee) {
        continue
      }

      const fillRows = (await sql`
        with claimed as (
          update orders
          set status = 'FILLED',
              filled_at = now()
          where id = ${order.id}
            and status = 'PENDING'
          returning id::text as order_id, participant_id, symbol, side, leverage, size, margin_reserved
        ),
        inserted_position as (
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
          select
            claimed.participant_id,
            claimed.symbol,
            ${positionSide},
            claimed.leverage,
            claimed.size,
            claimed.margin_reserved,
            ${fillPrice},
            ${liquidationPrice},
            true
          from claimed
          returning
            id,
            participant_id,
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
        ),
        deducted_fee as (
          update room_participants
          set available_margin = greatest(0, available_margin - ${makerFee})
          where id = (select participant_id from claimed limit 1)
            and exists (select 1 from inserted_position)
          returning available_margin::float8 as available_margin
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
            inserted_position.participant_id,
            inserted_position.id,
            inserted_position.symbol,
            ${tradeDirection},
            ${fillPrice},
            inserted_position.size,
            inserted_position.size,
            null,
            ${makerFee},
            ${liquidityRole}
          from inserted_position
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
        )
        select
          claimed.order_id,
          row_to_json(inserted_position)::jsonb as position,
          row_to_json(inserted_trade)::jsonb as trade,
          (select available_margin from deducted_fee limit 1) as available_margin
        from claimed
        join inserted_position on true
        left join inserted_trade on true
      `) as {
        order_id: string
        position: Position
        trade: Trade | null
        available_margin: number | null
      }[]

      const fillRow = fillRows[0] as (LimitFillRow & { available_margin: number | null }) | undefined

      if (!fillRow?.position) {
        continue
      }

      if (fillRow.available_margin != null) {
        participantMargins.set(order.participant_id, fillRow.available_margin)
      }

      newPositions.push(fillRow.position)

      if (fillRow.trade) {
        trades.push(fillRow.trade)
      }

      filledOrderIds.push(order.id)

      const bracketRows = (await sql`
        select
          id::text,
          type,
          trigger_price::float8 as trigger_price
        from orders
        where parent_order_id = ${order.id}
          and status = 'PENDING'
      `) as { id: string; type: PendingOrder["type"]; trigger_price: number }[]

      for (const bracket of bracketRows) {
        const validationError =
          bracket.type === "TAKE_PROFIT"
            ? validateTriggerPrices({
                side: fillRow.position.side,
                referencePrice: fillRow.position.entry_price,
                takeProfitPrice: bracket.trigger_price,
                stopLossPrice: null,
              })
            : validateTriggerPrices({
                side: fillRow.position.side,
                referencePrice: fillRow.position.entry_price,
                takeProfitPrice: null,
                stopLossPrice: bracket.trigger_price,
              })

        if (validationError) {
          await sql`
            update orders
            set status = 'CANCELLED',
                cancelled_at = now()
            where id = ${bracket.id}
              and status = 'PENDING'
          `
          cancelledOrderIds.push(bracket.id)
          continue
        }

        const linkedRows = (await sql`
          update orders
          set position_id = ${fillRow.position.id}
          where id = ${bracket.id}
            and status = 'PENDING'
          returning id::text
        `) as { id: string }[]

        if (linkedRows[0]) {
          linkedBracketTriggers.push({
            orderId: bracket.id,
            positionId: fillRow.position.id,
          })
        }
      }

      continue
    }

    if (!order.position_id) {
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

    const availableMargin = participantMargins.get(order.participant_id) ?? 0
    const { fee: tradeFee, liquidityRole } = getTradeFeeForFill({
      notionalUsd: attachedPosition.size,
      orderType: order.type,
    })
    const { realizedPnl, nextAvailableMargin, tradeDirection } = computeManualCloseEconomics({
      entryPrice: attachedPosition.entry_price,
      livePrice: positionPrice,
      side: attachedPosition.side,
      size: attachedPosition.size,
      marginAllocated: attachedPosition.margin_allocated,
      availableMargin,
      fee: tradeFee,
    })

    const triggerRows = (await sql`
      with claimed_order as (
        update orders
        set status = 'FILLED',
            filled_at = now()
        where id = ${order.id}
          and status = 'PENDING'
        returning id::text as order_id
      ),
      closed_position as (
        update positions
        set is_open = false,
            closed_at = now()
        where id = ${attachedPosition.id}
          and is_open = true
          and exists (select 1 from claimed_order)
        returning
          id,
          participant_id,
          symbol,
          size
      ),
      updated_margin as (
        update room_participants
        set available_margin = ${nextAvailableMargin}
        where id = ${order.participant_id}
          and exists (select 1 from closed_position)
        returning id::text
      ),
      cancelled_siblings as (
        update orders
        set status = 'CANCELLED',
            cancelled_at = now()
        where position_id = ${attachedPosition.id}
          and status = 'PENDING'
          and id <> ${order.id}
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
          realized_pnl,
          fee,
          liquidity_role
        )
        select
          closed_position.participant_id,
          closed_position.id,
          closed_position.symbol,
          ${tradeDirection},
          ${positionPrice},
          closed_position.size,
          closed_position.size,
          ${realizedPnl},
          ${tradeFee},
          ${liquidityRole}
        from closed_position
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
      )
      select
        claimed_order.order_id,
        closed_position.id::text as position_id,
        row_to_json(inserted_trade)::jsonb as trade
      from claimed_order
      join closed_position on true
      left join inserted_trade on true
    `) as { order_id: string; position_id: string; trade: Trade | null }[]

    const triggerRow = triggerRows[0] as TriggerFillRow | undefined

    if (!triggerRow?.position_id) {
      continue
    }

    participantMargins.set(order.participant_id, nextAvailableMargin)

    if (triggerRow.trade) {
      trades.push(triggerRow.trade)
    }

    closedPositionIds.push(attachedPosition.id)
    filledOrderIds.push(order.id)
  }

  if (revalidate && (filledOrderIds.length > 0 || closedPositionIds.length > 0 || cancelledOrderIds.length > 0)) {
    revalidatePath(`/room/${roomId}/trade`)
    revalidatePath(`/room/${roomId}`)
  }

  return {
    ok: true,
    data: {
      filledOrderIds,
      cancelledOrderIds,
      newPositions,
      closedPositionIds,
      trades,
      skippedSymbols: Array.from(skippedSymbols),
      skippedOrderIds,
      linkedBracketTriggers,
    },
  }
}
