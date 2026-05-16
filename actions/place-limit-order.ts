"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOnboardedUser } from "@/lib/auth"
import { assertRoomTradingOpen, loadRoomForParticipant } from "@/lib/competition-guards"
import { getMaxLeverage, isSupportedSymbol } from "@/lib/markets"
import { getSql, withUserContext } from "@/lib/db"
import { calculateRequiredMargin } from "@/lib/perpetuals"
import { getTriggerSide, validateTriggerPrices } from "@/lib/trading-rules"
import type { ActionResult, PendingOrder, RoomParticipant } from "@/lib/types"

const placeLimitOrderSchema = z
  .object({
    participantId: z.string().uuid(),
    roomId: z.string().uuid(),
    symbol: z.string(),
    side: z.enum(["LONG", "SHORT"]),
    leverage: z.coerce.number().int().min(1).max(50),
    size: z.coerce.number().positive("Position size must be positive"),
    limitPrice: z.coerce.number().positive("Limit price must be positive"),
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

export type PlaceLimitOrderInput = z.infer<typeof placeLimitOrderSchema>

export type PlaceLimitOrderResult = {
  order: PendingOrder
  triggers: PendingOrder[]
  availableMargin: number
}

export const placeLimitOrder = async (
  input: PlaceLimitOrderInput,
): Promise<ActionResult<PlaceLimitOrderResult>> => {
  const parsed = placeLimitOrderSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid limit order" }
  }

  const user = await requireOnboardedUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to trade" }
  }

  const membership = await loadRoomForParticipant(parsed.data.roomId, user.id)

  if (!membership.ok) {
    return membership
  }

  const tradingGuard = assertRoomTradingOpen(membership.data.room)

  if (!tradingGuard.ok) {
    return tradingGuard
  }

  const participant = membership.data.participant

  if (participant.id !== parsed.data.participantId) {
    return { ok: false, error: "Participant not found" }
  }

  const triggerValidationError = validateTriggerPrices({
    side: parsed.data.side,
    referencePrice: parsed.data.limitPrice,
    takeProfitPrice: parsed.data.takeProfitPrice,
    stopLossPrice: parsed.data.stopLossPrice,
  })

  if (triggerValidationError) {
    return { ok: false, error: triggerValidationError }
  }

  const requiredMargin = calculateRequiredMargin(parsed.data.size, parsed.data.leverage)

  if (participant.available_margin < requiredMargin) {
    return { ok: false, error: "Insufficient margin." }
  }

  return withUserContext(user.id, async () => {
    const sql = getSql()
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

    const nextAvailableMargin = marginRow.available_margin

    const orderRows = (await sql`
      insert into orders (
        participant_id,
        parent_order_id,
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
        null,
        null,
        ${parsed.data.symbol},
        ${parsed.data.side},
        ${"LIMIT"},
        ${parsed.data.size},
        ${parsed.data.leverage},
        ${parsed.data.limitPrice},
        'PENDING',
        ${requiredMargin}
      )
      returning
        id::text,
        participant_id::text,
        parent_order_id::text,
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
    const order = orderRows[0]

    if (!order) {
      await sql`
        update room_participants
        set available_margin = available_margin + ${requiredMargin}
        where id = ${participant.id}
      `
      return { ok: false, error: "Unable to place limit order" }
    }

    const triggers: PendingOrder[] = []
    const triggerSide = getTriggerSide(parsed.data.side)

    if (parsed.data.takeProfitPrice != null) {
      const tpRows = (await sql`
        insert into orders (
          participant_id,
          parent_order_id,
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
          ${order.id},
          null,
          ${parsed.data.symbol},
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
          parent_order_id::text,
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
          parent_order_id,
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
          ${order.id},
          null,
          ${parsed.data.symbol},
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
          parent_order_id::text,
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
    return {
      ok: true,
      data: {
        order,
        triggers,
        availableMargin: nextAvailableMargin,
      },
    }
  })
}
