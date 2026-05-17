import { redirect } from "next/navigation"
import { TradingTerminal } from "@/components/trading-terminal"
import { requireOnboardedUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { getCompetitionPhase } from "@/lib/room-competition-status"
import type { PendingOrder, Position, Room, RoomParticipant, Trade } from "@/lib/types"

export const dynamic = "force-dynamic"

type TradePageProps = {
  params: Promise<{
    room_id: string
  }>
}

export default async function TradePage({ params }: TradePageProps) {
  const { room_id: roomId } = await params
  const user = await requireOnboardedUser()

  if (!user) {
    redirect("/sign-in")
  }

  const sql = getSql()
  const roomRows = (await sql`
    select
      id::text,
      creator_id,
      name,
      description,
      join_code,
      starting_balance::float8 as starting_balance,
      start_date::text as start_date,
      end_date::text as end_date,
      is_active,
      created_at::text as created_at
    from rooms
    where id = ${roomId}
    limit 1
  `) as Room[]
  const room = roomRows[0]

  if (!room) {
    redirect("/dashboard")
  }

  if (getCompetitionPhase(room) !== "ongoing") {
    redirect(`/room/${roomId}`)
  }

  const participantRows = (await sql`
    select
      id::text,
      room_id::text,
      user_id,
      available_margin::float8 as available_margin,
      created_at::text
    from room_participants
    where room_id = ${roomId}
      and user_id = ${user.id}
    limit 1
  `) as RoomParticipant[]
  const participant = participantRows[0]

  if (!participant) {
    redirect("/dashboard")
  }

  const positions = (await sql`
    select
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
      last_funding_hour::text,
      created_at::text,
      closed_at::text
    from positions
    where participant_id = ${participant.id}
      and is_open = true
    order by created_at desc
  `) as Position[]

  const pendingOrders = (await sql`
    select
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
    from orders
    where participant_id = ${participant.id}
      and status = 'PENDING'
    order by created_at desc
  `) as PendingOrder[]

  const trades = (await sql`
    select
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
    from trades
    where participant_id = ${participant.id}
    order by created_at desc
    limit 50
  `) as Trade[]

  return (
    <TradingTerminal
      roomId={roomId}
      participantId={participant.id}
      initialAvailableMargin={participant.available_margin}
      initialPositions={positions}
      initialPendingOrders={pendingOrders}
      initialTrades={trades}
    />
  )
}
