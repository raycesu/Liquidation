"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireCurrentUser } from "@/lib/auth"
import { fetchSpotPrice, isSupportedSymbol } from "@/lib/binance"
import { getSql } from "@/lib/db"
import { calculateLiquidationPrice, calculateRequiredMargin } from "@/lib/perpetuals"
import type { ActionResult, Position, PositionSide, RoomParticipant, SupportedSymbol } from "@/lib/types"

const placeOrderSchema = z.object({
  participantId: z.string().uuid(),
  roomId: z.string().uuid(),
  symbol: z.string().refine(isSupportedSymbol, "Unsupported market"),
  side: z.enum(["LONG", "SHORT"]),
  leverage: z.coerce.number().int().min(1).max(20),
  size: z.coerce.number().positive("Position size must be positive"),
})

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>

export const placeOrder = async (input: PlaceOrderInput): Promise<ActionResult<Position>> => {
  const parsed = placeOrderSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order" }
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

  const requiredMargin = calculateRequiredMargin(parsed.data.size, parsed.data.leverage)

  if (participant.available_margin < requiredMargin) {
    return { ok: false, error: "Insufficient margin." }
  }

  const symbol = parsed.data.symbol as SupportedSymbol
  const side = parsed.data.side as PositionSide
  const entryPrice = await fetchSpotPrice(symbol)
  const liquidationPrice = calculateLiquidationPrice({
    entryPrice,
    leverage: parsed.data.leverage,
    side,
  })

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
    return { ok: false, error: "Unable to place order" }
  }

  await sql`
    update room_participants
    set available_margin = ${participant.available_margin - requiredMargin},
        total_equity = ${participant.total_equity}
    where id = ${participant.id}
  `

  revalidatePath(`/room/${parsed.data.roomId}/trade`)
  revalidatePath(`/room/${parsed.data.roomId}`)
  return { ok: true, data: position }
}
