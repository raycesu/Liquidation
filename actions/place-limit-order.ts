"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireCurrentUser } from "@/lib/auth"
import { getMaxLeverage, isSupportedSymbol } from "@/lib/markets"
import { getSql } from "@/lib/db"
import { calculateRequiredMargin } from "@/lib/perpetuals"
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
    reduceOnly: z.boolean().optional().default(false),
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
  availableMargin: number
}

export const placeLimitOrder = async (
  input: PlaceLimitOrderInput,
): Promise<ActionResult<PlaceLimitOrderResult>> => {
  const parsed = placeLimitOrderSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid limit order" }
  }

  const user = await requireCurrentUser()

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

  const requiredMargin = parsed.data.reduceOnly
    ? 0
    : calculateRequiredMargin(parsed.data.size, parsed.data.leverage)

  if (!parsed.data.reduceOnly && participant.available_margin < requiredMargin) {
    return { ok: false, error: "Insufficient margin." }
  }

  const orderRows = (await sql`
    insert into orders (
      participant_id,
      position_id,
      symbol,
      side,
      type,
      size,
      leverage,
      trigger_price,
      reduce_only,
      status,
      margin_reserved
    )
    values (
      ${participant.id},
      null,
      ${parsed.data.symbol},
      ${parsed.data.side},
      ${"LIMIT"},
      ${parsed.data.size},
      ${parsed.data.leverage},
      ${parsed.data.limitPrice},
      ${parsed.data.reduceOnly},
      'PENDING',
      ${requiredMargin}
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
      reduce_only,
      status,
      margin_reserved::float8 as margin_reserved,
      created_at::text,
      filled_at::text,
      cancelled_at::text
  `) as PendingOrder[]
  const order = orderRows[0]

  if (!order) {
    return { ok: false, error: "Unable to place limit order" }
  }

  const nextAvailableMargin = participant.available_margin - requiredMargin

  if (requiredMargin > 0) {
    await sql`
      update room_participants
      set available_margin = ${nextAvailableMargin}
      where id = ${participant.id}
    `
  }

  revalidatePath(`/room/${parsed.data.roomId}/trade`)
  return {
    ok: true,
    data: {
      order,
      availableMargin: nextAvailableMargin,
    },
  }
}
