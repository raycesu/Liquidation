import { getSql } from "@/lib/db"
import { calculatePnl } from "@/lib/perpetuals"
import { fetchMarketPrices } from "@/lib/pricing"
import type { ParticipantWithUser, Position } from "@/lib/types"

export const leaderboardPageSize = 10

export type PaginationItem = number | "ellipsis"

export type RankedParticipant = ParticipantWithUser & {
  realizedPnl: number
  unrealizedPnl: number
  totalPnl: number
  closedTrades: number
  winningTrades: number
  winRate: number | null
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
  realized_pnl: number
  closed_trades: number
  winning_trades: number
}

export const parseLeaderboardPage = (page: string | string[] | undefined) => {
  const value = Array.isArray(page) ? page[0] : page
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

export const createLeaderboardPageItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages]
}

export const paginateRankedParticipants = (
  rankedParticipants: RankedParticipant[],
  requestedPage: number,
  pageSize = leaderboardPageSize,
): LeaderboardPageData => {
  const totalPages = Math.max(1, Math.ceil(rankedParticipants.length / pageSize))
  const currentPage = Math.min(requestedPage, totalPages)
  const pageStartIndex = (currentPage - 1) * pageSize

  return {
    currentPage,
    totalPages,
    pageStartIndex,
    visibleParticipants: rankedParticipants.slice(pageStartIndex, pageStartIndex + pageSize),
    pageItems: createLeaderboardPageItems(currentPage, totalPages),
  }
}

export const getRankedParticipants = async (roomId: string, participants: ParticipantWithUser[]) => {
  const sql = getSql()
  const [tradeStatsRows, roomPositions] = (await Promise.all([
    sql`
      select
        t.participant_id::text,
        coalesce(sum(t.realized_pnl), 0)::float8 as realized_pnl,
        count(*)::int as closed_trades,
        (count(*) filter (where t.realized_pnl > 0))::int as winning_trades
      from trades t
      join room_participants rp on rp.id = t.participant_id
      where rp.room_id = ${roomId}
        and t.direction in ('CLOSE_LONG', 'CLOSE_SHORT')
        and t.realized_pnl is not null
      group by t.participant_id
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
  ])) as [TradeStatsRow[], RoomPosition[]]

  const symbols = Array.from(new Set(roomPositions.map((position) => position.symbol)))
  const prices = symbols.length > 0 ? await fetchMarketPrices(symbols) : {}
  const pnlByParticipant = new Map<string, number>()
  const statsByParticipant = new Map(tradeStatsRows.map((row) => [row.participant_id, row]))

  roomPositions.forEach((position) => {
    const livePrice = prices[position.symbol]

    if (!livePrice) {
      return
    }

    const pnl = calculatePnl({
      entryPrice: position.entry_price,
      livePrice,
      side: position.side,
      size: position.size,
    })
    pnlByParticipant.set(position.participant_id, (pnlByParticipant.get(position.participant_id) ?? 0) + pnl)
  })

  return participants
    .map((participant): RankedParticipant => {
      const unrealizedPnl = pnlByParticipant.get(participant.id) ?? 0
      const stats = statsByParticipant.get(participant.id)
      const realizedPnl = stats?.realized_pnl ?? 0
      const closedTrades = stats?.closed_trades ?? 0
      const winningTrades = stats?.winning_trades ?? 0
      const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : null

      return {
        ...participant,
        realizedPnl,
        unrealizedPnl,
        totalPnl: realizedPnl + unrealizedPnl,
        closedTrades,
        winningTrades,
        winRate,
      }
    })
    .sort((a, b) => b.totalPnl - a.totalPnl || b.available_margin - a.available_margin)
}
