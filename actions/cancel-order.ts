"use server"

import { revalidatePath } from "next/cache"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import type { ActionResult, PendingOrder, RoomParticipant } from "@/lib/types"

type OrderWithParticipant = PendingOrder & {
  room_participants: RoomParticipant | null
}

export type CancelOrderResult = {
  orderId: string
  availableMargin: number
}

export const cancelOrder = async ({
  orderId,
  roomId,
}: {
  orderId: string
  roomId: string
}): Promise<ActionResult<CancelOrderResult>> => {
  const user = await requireCurrentUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to cancel an order" }
  }

  const sql = getSql()
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
      ) as room_participants
    from orders o
    join room_participants rp on rp.id = o.participant_id
    where o.id = ${orderId}
      and rp.user_id = ${user.id}
    limit 1
  `) as OrderWithParticipant[]
  const order = orders[0]

  if (!order || !order.room_participants) {
    return { ok: false, error: "Order not found" }
  }

  if (order.status !== "PENDING") {
    return { ok: false, error: "Order is no longer pending" }
  }

  await sql`
    update orders
    set status = 'CANCELLED',
        cancelled_at = now()
    where id = ${order.id}
  `

  let nextAvailableMargin = order.room_participants.available_margin

  if (order.margin_reserved > 0) {
    nextAvailableMargin = order.room_participants.available_margin + order.margin_reserved
    await sql`
      update room_participants
      set available_margin = ${nextAvailableMargin}
      where id = ${order.room_participants.id}
    `
  }

  revalidatePath(`/room/${roomId}/trade`)
  return {
    ok: true,
    data: {
      orderId: order.id,
      availableMargin: nextAvailableMargin,
    },
  }
}
