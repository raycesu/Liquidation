"use server"

import { z } from "zod"
import { runOrderEngineForRoom } from "@/lib/trading-engine/run-order-engine"
import { requireOnboardedUser } from "@/lib/auth"
import { getSql, withUserContext } from "@/lib/db"
import { releaseEnginePoll, tryAcquireEnginePoll } from "@/lib/engine-poll-throttle"
import type { ActionResult, Position, Trade } from "@/lib/types"

import type { LinkedBracketTrigger } from "@/lib/trading-engine/types"

export type CheckPendingOrdersResult = {
  filledOrderIds: string[]
  cancelledOrderIds: string[]
  newPositions: Position[]
  closedPositionIds: string[]
  trades: Trade[]
  availableMargin: number | null
  skippedSymbols: string[]
  skippedOrderIds: string[]
  linkedBracketTriggers: LinkedBracketTrigger[]
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

  return withUserContext(user.id, async () => {
    const sql = getSql()
    const participants = (await sql`
      select id::text
      from room_participants
      where room_id = ${roomId}
        and user_id = ${user.id}
      limit 1
    `) as { id: string }[]
    const participant = participants[0]

    if (!participant) {
      return { ok: false, error: "Participant not found" }
    }

    const pollKey = `${user.id}:${roomId}`

    if (!tryAcquireEnginePoll(pollKey)) {
      return {
        ok: true,
        data: {
          filledOrderIds: [],
          cancelledOrderIds: [],
          newPositions: [],
          closedPositionIds: [],
          trades: [],
          availableMargin: null,
          skippedSymbols: [],
          skippedOrderIds: [],
          linkedBracketTriggers: [],
        },
      }
    }

    try {
      const engineResult = await runOrderEngineForRoom(roomId, {
        participantId: participant.id,
        revalidate: false,
      })

      if (!engineResult.ok) {
        return engineResult
      }

      const marginRows = (await sql`
        select available_margin::float8 as available_margin
        from room_participants
        where id = ${participant.id}
        limit 1
      `) as { available_margin: number }[]

      return {
        ok: true,
        data: {
          filledOrderIds: engineResult.data.filledOrderIds,
          cancelledOrderIds: engineResult.data.cancelledOrderIds,
          newPositions: engineResult.data.newPositions,
          closedPositionIds: engineResult.data.closedPositionIds,
          trades: engineResult.data.trades,
          availableMargin: marginRows[0]?.available_margin ?? null,
          skippedSymbols: engineResult.data.skippedSymbols,
          skippedOrderIds: engineResult.data.skippedOrderIds,
          linkedBracketTriggers: engineResult.data.linkedBracketTriggers,
        },
      }
    } finally {
      releaseEnginePoll(pollKey)
    }
  })
}
