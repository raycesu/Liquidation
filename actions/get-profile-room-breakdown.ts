"use server"

import { z } from "zod"
import { requireOnboardedUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import type { ActionResult, Position, Trade } from "@/lib/types"

const inputSchema = z.object({
  roomId: z.string().uuid(),
})

export type ProfileRoomBreakdown = {
  trades: Trade[]
  positions: Position[]
}

export const getProfileRoomBreakdown = async (
  input: z.infer<typeof inputSchema>,
): Promise<ActionResult<ProfileRoomBreakdown>> => {
  const parsed = inputSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Invalid room" }
  }

  const user = await requireOnboardedUser()

  if (!user) {
    return { ok: false, error: "You must be signed in" }
  }

  const sql = getSql()
  const { roomId } = parsed.data

  const membership = (await sql`
    select id::text
    from room_participants
    where room_id = ${roomId}
      and user_id = ${user.id}
    limit 1
  `) as { id: string }[]

  const participantId = membership[0]?.id

  if (!participantId) {
    return { ok: false, error: "You are not in this competition" }
  }

  const trades = (await sql`
    select
      t.id::text,
      t.participant_id::text,
      t.position_id::text,
      t.symbol,
      t.direction,
      t.price::float8 as price,
      t.size::float8 as size,
      t.trade_value::float8 as trade_value,
      t.realized_pnl::float8 as realized_pnl,
      t.created_at::text
    from trades t
    where t.participant_id = ${participantId}
    order by t.created_at desc
  `) as Trade[]

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
      p.closed_at::text
    from positions p
    where p.participant_id = ${participantId}
    order by p.created_at desc
  `) as Position[]

  return {
    ok: true,
    data: { trades, positions },
  }
}
