import { paginateItems } from "@/lib/client-pagination"
import { getSql } from "@/lib/db"
import { buildParticipantNetPnlStats } from "@/lib/net-pnl"
import { buildUnrealizedPnlByParticipant, scoreParticipantsByTotalPnl } from "@/lib/participant-pnl"
import { floorToUsdCents, toDecimal } from "@/lib/margin-utils"
import { fetchMarketPrices } from "@/lib/pricing"
import type { ParticipantWithUser, Position } from "@/lib/types"

export const leaderboardPageSize = 10

import type { PaginationItem } from "@/lib/pagination"

export type { PaginationItem }

export type RankedParticipant = ParticipantWithUser & {
  realizedPnl: number
  unrealizedPnl: number
  totalPnl: number
  closedTrades: number
  winningTrades: number
  winRate: number | null
  isAccountBusted: boolean
}

export type LeaderboardPageData = {
  currentPage: number
  totalPages: number
  pageStartIndex: number
  visibleParticipants: RankedParticipant[]
  pageItems: PaginationItem[]
}

type RoomPosition = Pick<Position, "participant_id" | "symbol" | "side" | "size" | "entry_price">

type TradeStatsRow = {
  participant_id: string
  trade_pnl: number
  closed_trade_count: number
  winning_trade_count: number
}

const EPS = 1e-6

export const parseLeaderboardPage = (page: string | string[] | undefined) => {
  const value = Array.isArray(page) ? page[0] : page
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

export const paginateRankedParticipants = (
  rankedParticipants: RankedParticipant[],
  requestedPage: number,
  pageSize = leaderboardPageSize,
): LeaderboardPageData => {
  const pagination = paginateItems(rankedParticipants, requestedPage, pageSize)

  return {
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    pageStartIndex: pagination.pageStartIndex,
    visibleParticipants: pagination.visibleItems,
    pageItems: pagination.pageItems,
  }
}

export const loadRoomParticipantsWithUsers = async (roomId: string) => {
  const sql = getSql()

  const rows = (await sql`
    select
      rp.id::text,
      rp.room_id::text,
      rp.user_id,
      rp.available_margin::text as available_margin,
      rp.created_at::text,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'image_url', u.image_url
      ) as users
    from room_participants rp
    join users u on u.id = rp.user_id
    where rp.room_id = ${roomId}
    order by rp.created_at asc
  `) as (Omit<ParticipantWithUser, "available_margin"> & { available_margin: string })[]

  return rows.map((row) => ({
    ...row,
    available_margin: floorToUsdCents(toDecimal(row.available_margin)).toNumber(),
  })) as ParticipantWithUser[]
}

export const getRoomLeaderboard = async (roomId: string, page?: string | string[]) => {
  const participants = await loadRoomParticipantsWithUsers(roomId)
  const rankedParticipants = await getRankedParticipants(roomId, participants)
  const leaderboardPage = paginateRankedParticipants(rankedParticipants, parseLeaderboardPage(page))

  return { rankedParticipants, leaderboardPage }
}

export const getRankedParticipants = async (roomId: string, participants: ParticipantWithUser[]) => {
  const sql = getSql()
  const roomRows = (await sql`
    select settled_at::text, end_date::text
    from rooms
    where id = ${roomId}
    limit 1
  `) as { settled_at: string | null; end_date: string }[]
  const roomMeta = roomRows[0]
  const lockRanking =
    roomMeta?.settled_at != null ||
    (roomMeta?.end_date != null && new Date(roomMeta.end_date).getTime() <= Date.now())

  const [tradeStatsRows, fundingStatsRows, roomPositions] = (await Promise.all([
    sql`
      select
        t.participant_id::text,
        coalesce(sum(coalesce(t.realized_pnl, 0) - coalesce(t.fee, 0)), 0)::float8 as trade_pnl,
        count(*)::int as closed_trade_count,
        (
          count(*) filter (where (coalesce(t.realized_pnl, 0) - coalesce(t.fee, 0)) > 0)
        )::int as winning_trade_count
      from trades t
      join room_participants rp on rp.id = t.participant_id
      where rp.room_id = ${roomId}
        and t.direction in ('CLOSE_LONG', 'CLOSE_SHORT')
        and t.realized_pnl is not null
      group by t.participant_id
    `,
    sql`
      select
        fp.participant_id::text,
        coalesce(
          sum(coalesce(fp.actual_applied, fp.payment_amount)),
          0
        )::float8 as funding_pnl
      from funding_payments fp
      join room_participants rp on rp.id = fp.participant_id
      where rp.room_id = ${roomId}
      group by fp.participant_id
    `,
    sql`
      select
        p.participant_id::text,
        p.symbol,
        p.side,
        p.size::float8 as size,
        p.entry_price::float8 as entry_price
      from positions p
      join room_participants rp on rp.id = p.participant_id
      where p.is_open = true
        and rp.room_id = ${roomId}
    `,
  ])) as [TradeStatsRow[], { participant_id: string; funding_pnl: number }[], RoomPosition[]]

  const symbols = Array.from(new Set(roomPositions.map((position) => position.symbol)))
  const prices = !lockRanking && symbols.length > 0 ? await fetchMarketPrices(symbols) : {}
  const unrealizedByParticipant = lockRanking
    ? new Map<string, number>()
    : buildUnrealizedPnlByParticipant(roomPositions, prices)
  const netStatsByParticipant = buildParticipantNetPnlStats(
    participants.map((participant) => participant.id),
    tradeStatsRows,
    fundingStatsRows,
  )
  const realizedByParticipant = new Map(
    participants.map((participant) => [
      participant.id,
      netStatsByParticipant.get(participant.id)?.realizedPnl ?? 0,
    ]),
  )
  const hasOpenPositions = new Set(roomPositions.map((position) => position.participant_id))

  const scored = scoreParticipantsByTotalPnl(participants, realizedByParticipant, unrealizedByParticipant)

  return scored.map((participant): RankedParticipant => {
    const stats = netStatsByParticipant.get(participant.id)
    const closedTrades = stats?.closedTradeCount ?? 0
    const winningTrades = stats?.winningTradeCount ?? 0
    const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : null
    const isAccountBusted = !hasOpenPositions.has(participant.id) && participant.available_margin <= EPS

    return {
      ...participant,
      realizedPnl: participant.realizedPnl,
      unrealizedPnl: participant.unrealizedPnl,
      totalPnl: participant.totalPnl,
      closedTrades,
      winningTrades,
      winRate,
      isAccountBusted,
    }
  })
}
