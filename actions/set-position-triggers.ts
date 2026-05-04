"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { getTriggerSide } from "@/lib/trading-rules"
import type { ActionResult, PendingOrder, Position } from "@/lib/types"

const setTriggersSchema = z.object({
  positionId: z.string().uuid(),
  roomId: z.string().uuid(),
  takeProfitPrice: z.coerce.number().positive().optional().nullable(),
  stopLossPrice: z.coerce.number().positive().optional().nullable(),
})

export type SetPositionTriggersInput = z.infer<typeof setTriggersSchema>

export type SetPositionTriggersResult = {
  positionId: string
  triggers: PendingOrder[]
}

type PositionWithUser = Position & {
  user_id: string
}

export const setPositionTriggers = async (
  input: SetPositionTriggersInput,
): Promise<ActionResult<SetPositionTriggersResult>> => {
  const parsed = setTriggersSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid triggers" }
  }

  const user = await requireCurrentUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to update triggers" }
  }

  const sql = getSql()
  const positions = (await sql`
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
      rp.user_id as user_id
    from positions p
    join room_participants rp on rp.id = p.participant_id
    where p.id = ${parsed.data.positionId}
      and rp.user_id = ${user.id}
    limit 1
  `) as PositionWithUser[]
  const position = positions[0]

  if (!position) {
    return { ok: false, error: "Position not found" }
  }

  if (!position.is_open) {
    return { ok: false, error: "Position is not open" }
  }

  if (parsed.data.takeProfitPrice != null) {
    if (position.side === "LONG" && parsed.data.takeProfitPrice <= position.entry_price) {
      return { ok: false, error: "Take profit must be above entry for longs." }
    }

    if (position.side === "SHORT" && parsed.data.takeProfitPrice >= position.entry_price) {
      return { ok: false, error: "Take profit must be below entry for shorts." }
    }
  }

  if (parsed.data.stopLossPrice != null) {
    if (position.side === "LONG" && parsed.data.stopLossPrice >= position.entry_price) {
      return { ok: false, error: "Stop loss must be below entry for longs." }
    }

    if (position.side === "SHORT" && parsed.data.stopLossPrice <= position.entry_price) {
      return { ok: false, error: "Stop loss must be above entry for shorts." }
    }
  }

  await sql`
    update orders
    set status = 'CANCELLED',
        cancelled_at = now()
    where position_id = ${position.id}
      and status = 'PENDING'
      and type in ('TAKE_PROFIT', 'STOP_LOSS')
  `

  const triggerSide = getTriggerSide(position.side)
  const triggers: PendingOrder[] = []

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
        ${position.participant_id},
        ${position.id},
        ${position.symbol},
        ${triggerSide},
        ${"TAKE_PROFIT"},
        ${position.size},
        ${position.leverage},
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
        ${position.participant_id},
        ${position.id},
        ${position.symbol},
        ${triggerSide},
        ${"STOP_LOSS"},
        ${position.size},
        ${position.leverage},
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
  return {
    ok: true,
    data: {
      positionId: position.id,
      triggers,
    },
  }
}
