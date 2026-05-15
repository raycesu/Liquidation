"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOnboardedUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { getMaxLeverage, isSupportedSymbol } from "@/lib/markets"
import { fetchMarketPrice } from "@/lib/pricing"
import { calculateLiquidationPrice, calculateRequiredMargin } from "@/lib/perpetuals"
import { getTriggerSide } from "@/lib/trading-rules"
import type {
  ActionResult,
  PendingOrder,
  Position,
  PositionSide,
  RoomParticipant,
  SupportedSymbol,
  Trade,
} from "@/lib/types"

const placeOrderSchema = z
  .object({
    participantId: z.string().uuid(),
    roomId: z.string().uuid(),
    symbol: z.string(),
    side: z.enum(["LONG", "SHORT"]),
    leverage: z.coerce.number().int().min(1).max(50),
    size: z.coerce.number().positive("Position size must be positive"),
    takeProfitPrice: z.coerce.number().positive().optional().nullable(),
    stopLossPrice: z.coerce.number().positive().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!isSupportedSymbol(data.symbol)) {
      ctx.addIssue({ code: "custom", message: "Unsupported market", path: ["symbol"] })
      return
    }

    const cap = getMaxLeverage(data.symbol)

    if (data.leverage > cap) {
      ctx.addIssue({
        code: "custom",
        message: `Maximum leverage for this asset is ${cap}x`,
        path: ["leverage"],
      })
    }
  })

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>

export type PlaceOrderResult = {
  position: Position
  trade: Trade
  triggers: PendingOrder[]
  availableMargin: number
}

export const placeOrder = async (input: PlaceOrderInput): Promise<ActionResult<PlaceOrderResult>> => {
  const parsed = placeOrderSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order" }
  }

  const user = await requireOnboardedUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to trade" }
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
    where id = ${parsed.data.participantId}
      and room_id = ${parsed.data.roomId}
      and user_id = ${user.id}
    limit 1
  `) as RoomParticipant[]
  const participant = participants[0]

  if (!participant) {
    return { ok: false, error: "Participant not found" }
  }

  const requiredMargin = calculateRequiredMargin(parsed.data.size, parsed.data.leverage)

  if (participant.available_margin < requiredMargin) {
    return { ok: false, error: "Insufficient margin." }
  }

  const symbol = parsed.data.symbol as SupportedSymbol
  const side = parsed.data.side as PositionSide
  const entryPrice = await fetchMarketPrice(symbol)
  const liquidationPrice = calculateLiquidationPrice({
    entryPrice,
    leverage: parsed.data.leverage,
    side,
  })

  if (parsed.data.takeProfitPrice != null) {
    if (side === "LONG" && parsed.data.takeProfitPrice <= entryPrice) {
      return { ok: false, error: "Take profit must be above entry for longs." }
    }

    if (side === "SHORT" && parsed.data.takeProfitPrice >= entryPrice) {
      return { ok: false, error: "Take profit must be below entry for shorts." }
    }
  }

  if (parsed.data.stopLossPrice != null) {
    if (side === "LONG" && parsed.data.stopLossPrice >= entryPrice) {
      return { ok: false, error: "Stop loss must be below entry for longs." }
    }

    if (side === "SHORT" && parsed.data.stopLossPrice <= entryPrice) {
      return { ok: false, error: "Stop loss must be above entry for shorts." }
    }
  }

  const marginRows = (await sql`
    update room_participants
    set available_margin = available_margin - ${requiredMargin}
    where id = ${participant.id}
      and available_margin >= ${requiredMargin}
    returning available_margin::float8 as available_margin
  `) as Pick<RoomParticipant, "available_margin">[]
  const marginRow = marginRows[0]

  if (!marginRow) {
    return { ok: false, error: "Insufficient margin." }
  }

  const positions = (await sql`
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
      ${participant.id},
      ${symbol},
      ${side},
      ${parsed.data.leverage},
      ${parsed.data.size},
      ${requiredMargin},
      ${entryPrice},
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
  const position = positions[0]

  if (!position) {
    await sql`
      update room_participants
      set available_margin = available_margin + ${requiredMargin}
      where id = ${participant.id}
    `
    return { ok: false, error: "Unable to place order" }
  }
  const nextAvailableMargin = marginRow.available_margin

  const tradeDirection = side === "LONG" ? "OPEN_LONG" : "OPEN_SHORT"
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
      ${participant.id},
      ${position.id},
      ${symbol},
      ${tradeDirection},
      ${entryPrice},
      ${parsed.data.size},
      ${parsed.data.size},
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
  const trade = tradeRows[0]

  const triggers: PendingOrder[] = []

  const triggerSide = getTriggerSide(side)

  if (parsed.data.takeProfitPrice != null) {
    const tpRows = (await sql`
      insert into orders (
        participant_id,
        position_id,
        symbol,
        side,
        type,
        size,
        leverage,
        trigger_price,
        status,
        margin_reserved
      )
      values (
        ${participant.id},
        ${position.id},
        ${symbol},
        ${triggerSide},
        ${"TAKE_PROFIT"},
        ${parsed.data.size},
        ${parsed.data.leverage},
        ${parsed.data.takeProfitPrice},
        'PENDING',
        0
      )
      returning
        id::text,
        participant_id::text,
        position_id::text,
        symbol,
        side,
        type,
        size::float8 as size,
        leverage,
        trigger_price::float8 as trigger_price,
        status,
        margin_reserved::float8 as margin_reserved,
        created_at::text,
        filled_at::text,
        cancelled_at::text
    `) as PendingOrder[]

    if (tpRows[0]) {
      triggers.push(tpRows[0])
    }
  }

  if (parsed.data.stopLossPrice != null) {
    const slRows = (await sql`
      insert into orders (
        participant_id,
        position_id,
        symbol,
        side,
        type,
        size,
        leverage,
        trigger_price,
        status,
        margin_reserved
      )
      values (
        ${participant.id},
        ${position.id},
        ${symbol},
        ${triggerSide},
        ${"STOP_LOSS"},
        ${parsed.data.size},
        ${parsed.data.leverage},
        ${parsed.data.stopLossPrice},
        'PENDING',
        0
      )
      returning
        id::text,
        participant_id::text,
        position_id::text,
        symbol,
        side,
        type,
        size::float8 as size,
        leverage,
        trigger_price::float8 as trigger_price,
        status,
        margin_reserved::float8 as margin_reserved,
        created_at::text,
        filled_at::text,
        cancelled_at::text
    `) as PendingOrder[]

    if (slRows[0]) {
      triggers.push(slRows[0])
    }
  }

  revalidatePath(`/room/${parsed.data.roomId}/trade`)
  revalidatePath(`/room/${parsed.data.roomId}`)
  return {
    ok: true,
    data: {
      position,
      trade,
      triggers,
      availableMargin: nextAvailableMargin,
    },
  }
}
