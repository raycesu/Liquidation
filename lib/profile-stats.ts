import { getSql } from "@/lib/db"
import { computeParticipantEquity } from "@/lib/participant-equity"
import {
  buildUnrealizedPnlByParticipant,
  computePnlPercentFromTotalPnl,
  placementRankForParticipant,
  scoreParticipantsByTotalPnl,
} from "@/lib/participant-pnl"
import { fetchMarketPrices } from "@/lib/pricing"
import type {
  Position,
  PositionSide,
  ProfileCompetitionRow,
  ProfileDashboardData,
  ProfileShareRoomOption,
  ProfileShareTradeHighlight,
  ProfileSummaryStats,
  ProfileTradingStyle,
  ProfileWipeoutEvent,
  Room,
  SupportedSymbol,
} from "@/lib/types"

type ParticipantRow = {
  id: string
  room_id: string
  user_id: string
  available_margin: number
  rooms: Room | null
}

type PlainParticipantRow = {
  id: string
  room_id: string
  user_id: string
  available_margin: number
}

type OpenPositionRow = Position & {
  room_id: string
}

type PositionStyleRow = {
  side: PositionSide
  leverage: number
  created_at: string
  closed_at: string | null
}

type SymbolCountRow = {
  symbol: SupportedSymbol
  trade_count: string | number
}

type ClosedTradeRoeRow = {
  room_id: string
  trade_id: string
  symbol: SupportedSymbol
  side: PositionSide
  leverage: number
  realized_pnl: number
  margin_allocated: number
  entry_price: number
  close_price: number
  room_name: string
}

type LastTradeRow = {
  participant_id: string
  last_trade_at: string | null
}

type RealizedPnlRow = {
  participant_id: string
  realized_pnl: number
  closed_trade_count: string | number
}

const EPS = 1e-6

export { computeDisplayEquity, computeParticipantEquity } from "@/lib/participant-equity"

export { computePnlPercentFromTotalPnl, placementRankForParticipant } from "@/lib/participant-pnl"

export const closedTradeRoePercent = (realizedPnl: number, marginAllocated: number) => {
  if (marginAllocated <= EPS) {
    return null
  }

  return (realizedPnl / marginAllocated) * 100
}

export const isAccountBusted = (displayEquity: number, hasOpenPositions: boolean) =>
  !hasOpenPositions && displayEquity <= EPS

export const meanOrNull = (values: number[]): number | null => {
  if (values.length === 0) {
    return null
  }

  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

export const maxOrNull = (values: number[]): number | null => {
  if (values.length === 0) {
    return null
  }

  return Math.max(...values)
}

const parseCount = (value: string | number) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const roomIsOngoing = (room: Room) =>
  room.is_active && room.settled_at == null && new Date(room.end_date) > new Date()

const buildOpenMarginByParticipant = (openRows: OpenPositionRow[]) => {
  const marginByParticipant = new Map<string, number>()

  openRows.forEach((position) => {
    marginByParticipant.set(
      position.participant_id,
      (marginByParticipant.get(position.participant_id) ?? 0) + position.margin_allocated,
    )
  })

  return marginByParticipant
}

export const loadProfileDashboardData = async (userId: string): Promise<ProfileDashboardData> => {
  const sql = getSql()

  const myRows = (await sql`
    select
      rp.id::text,
      rp.room_id::text,
      rp.user_id,
      rp.available_margin::float8 as available_margin,
      json_build_object(
        'id', r.id::text,
        'creator_id', r.creator_id,
        'name', r.name,
        'description', r.description,
        'is_public', r.is_public,
        'join_code', r.join_code,
        'starting_balance', r.starting_balance::float8,
        'start_date', r.start_date::text,
        'end_date', r.end_date::text,
        'is_active', r.is_active,
        'settled_at', r.settled_at::text,
        'late_join_hours', r.late_join_hours,
        'created_at', r.created_at::text
      ) as rooms
    from room_participants rp
    join rooms r on r.id = rp.room_id
    where rp.user_id = ${userId}
    order by r.created_at desc
  `) as ParticipantRow[]

  if (myRows.length === 0) {
    return {
      competitionRows: [],
      summary: {
        competitionsEntered: 0,
        allTimeAvgPnlPercent: null,
        bestTradeRoePercent: null,
        timesLiquidated: 0,
        wipeouts: [],
      },
      tradingStyle: {
        longCount: 0,
        shortCount: 0,
        longBiasPercent: 50,
        averageLeverage: null,
        averageHoldMs: null,
        topSymbols: [],
      },
      shareRoomOptions: [],
    }
  }

  const [
    allRoomParticipants,
    openPositions,
    realizedPnlRows,
    fundingPnlRows,
    stylePositions,
    symbolRows,
    roeRows,
    lastTradeRows,
  ] = (await Promise.all([
      sql`
        select
          rp.id::text,
          rp.room_id::text,
          rp.user_id,
          rp.available_margin::float8 as available_margin
        from room_participants rp
        where exists (
          select 1
          from room_participants mine
          where mine.user_id = ${userId}
            and mine.room_id = rp.room_id
        )
      `,
      sql`
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
          rp.room_id::text as room_id
        from positions p
        join room_participants rp on rp.id = p.participant_id
        where p.is_open = true
          and exists (
            select 1
            from room_participants mine
            where mine.user_id = ${userId}
              and mine.room_id = rp.room_id
          )
      `,
      sql`
        select
          t.participant_id::text,
          coalesce(sum(t.realized_pnl), 0)::float8 as realized_pnl,
          count(*)::int as closed_trade_count
        from trades t
        join room_participants rp on rp.id = t.participant_id
        where exists (
          select 1
          from room_participants mine
          where mine.user_id = ${userId}
            and mine.room_id = rp.room_id
        )
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
        where exists (
          select 1
          from room_participants mine
          where mine.user_id = ${userId}
            and mine.room_id = rp.room_id
        )
        group by fp.participant_id
      `,
      sql`
        select
          p.side,
          p.leverage,
          p.created_at::text,
          p.closed_at::text
        from positions p
        join room_participants rp on rp.id = p.participant_id
        where rp.user_id = ${userId}
      `,
      sql`
        select
          t.symbol,
          count(*)::int as trade_count
        from trades t
        join room_participants rp on rp.id = t.participant_id
        where rp.user_id = ${userId}
        group by t.symbol
        order by count(*) desc
        limit 8
      `,
      sql`
        select
          rp.room_id::text as room_id,
          t.id::text as trade_id,
          t.symbol,
          p.side,
          p.leverage,
          t.realized_pnl::float8 as realized_pnl,
          p.margin_allocated::float8 as margin_allocated,
          p.entry_price::float8 as entry_price,
        t.price::float8 as close_price,
        r.name as room_name
      from trades t
        join positions p on p.id = t.position_id
        join room_participants rp on rp.id = t.participant_id
        join rooms r on r.id = rp.room_id
        where rp.user_id = ${userId}
          and t.direction in ('CLOSE_LONG', 'CLOSE_SHORT')
          and t.realized_pnl is not null
          and p.margin_allocated > 0
      `,
      sql`
        select
          rp.id::text as participant_id,
          max(t.created_at)::text as last_trade_at
        from room_participants rp
        left join trades t on t.participant_id = rp.id
        where rp.user_id = ${userId}
        group by rp.id
      `,
    ])) as unknown as [
      PlainParticipantRow[],
      OpenPositionRow[],
      RealizedPnlRow[],
      { participant_id: string; funding_pnl: number }[],
      PositionStyleRow[],
      SymbolCountRow[],
      ClosedTradeRoeRow[],
      LastTradeRow[],
    ]

  const symbols = Array.from(new Set(openPositions.map((p) => p.symbol))) as SupportedSymbol[]
  let prices: Partial<Record<SupportedSymbol, number>> = {}

  if (symbols.length > 0) {
    try {
      prices = await fetchMarketPrices(symbols)
    } catch {
      // Live quotes are optional for profile stats; margin-only equity still renders.
      prices = {}
    }
  }

  const openMarginByParticipant = buildOpenMarginByParticipant(openPositions)
  const unrealizedByParticipant = buildUnrealizedPnlByParticipant(openPositions, prices)

  const fundingByParticipant = new Map(fundingPnlRows.map((row) => [row.participant_id, row.funding_pnl]))
  const realizedByParticipant = new Map<string, number>()
  const closedTradeCountByParticipant = new Map<string, number>()
  realizedPnlRows.forEach((row) => {
    const fundingPnl = fundingByParticipant.get(row.participant_id) ?? 0
    realizedByParticipant.set(row.participant_id, row.realized_pnl + fundingPnl)
    closedTradeCountByParticipant.set(row.participant_id, parseCount(row.closed_trade_count))
  })
  fundingPnlRows.forEach((row) => {
    if (!realizedByParticipant.has(row.participant_id)) {
      realizedByParticipant.set(row.participant_id, row.funding_pnl)
    }
  })

  const openByParticipant = new Map<string, boolean>()
  openPositions.forEach((p) => {
    openByParticipant.set(p.participant_id, true)
  })

  const participantCountByRoom = new Map<string, number>()
  allRoomParticipants.forEach((p) => {
    participantCountByRoom.set(p.room_id, (participantCountByRoom.get(p.room_id) ?? 0) + 1)
  })

  const lastTradeByParticipant = new Map<string, string>()
  lastTradeRows.forEach((row) => {
    if (row.last_trade_at) {
      lastTradeByParticipant.set(row.participant_id, row.last_trade_at)
    }
  })

  const competitionRows: ProfileCompetitionRow[] = []
  const pnlPercents: number[] = []
  const wipeouts: ProfileWipeoutEvent[] = []

  for (const row of myRows) {
    const room = row.rooms

    if (!room) {
      continue
    }

    const inRoom = allRoomParticipants.filter((participant) => participant.room_id === room.id)
    const ranked = scoreParticipantsByTotalPnl(inRoom, realizedByParticipant, unrealizedByParticipant)
    const placementRank = placementRankForParticipant(ranked, row.id)
    const mine = ranked.find((participant) => participant.id === row.id)
    const totalPnl = mine?.totalPnl ?? 0
    const pnlPercent = computePnlPercentFromTotalPnl(totalPnl, room.starting_balance)
    pnlPercents.push(pnlPercent)

    const displayEquity = computeParticipantEquity(
      row.available_margin,
      openMarginByParticipant.get(row.id) ?? 0,
      unrealizedByParticipant.get(row.id) ?? 0,
    )
    const hasOpen = openByParticipant.has(row.id)

    if (isAccountBusted(displayEquity, hasOpen)) {
      wipeouts.push({
        roomId: room.id,
        roomName: room.name,
        wipedAtIso: lastTradeByParticipant.get(row.id) ?? room.end_date,
      })
    }

    competitionRows.push({
      room,
      participantId: row.id,
      placementRank,
      participantCount: participantCountByRoom.get(room.id) ?? 0,
      endDateIso: room.end_date,
      isOngoing: roomIsOngoing(room),
      pnlPercent,
    })
  }

  const globalRoes: number[] = []
  roeRows.forEach((r) => {
    const roe = closedTradeRoePercent(r.realized_pnl, r.margin_allocated)
    if (roe != null) {
      globalRoes.push(roe)
    }
  })

  wipeouts.sort((a, b) => new Date(a.wipedAtIso).getTime() - new Date(b.wipedAtIso).getTime())

  const summary: ProfileSummaryStats = {
    competitionsEntered: myRows.length,
    allTimeAvgPnlPercent: meanOrNull(pnlPercents),
    bestTradeRoePercent: maxOrNull(globalRoes),
    timesLiquidated: wipeouts.length,
    wipeouts,
  }

  const tradingStyle = buildTradingStyle(stylePositions, symbolRows)

  const shareRoomOptions = buildShareRoomOptions(
    competitionRows,
    roeRows,
    participantCountByRoom,
    closedTradeCountByParticipant,
  )

  return {
    competitionRows,
    summary,
    tradingStyle,
    shareRoomOptions,
  }
}

const buildTradingStyle = (positions: PositionStyleRow[], symbolRows: SymbolCountRow[]): ProfileTradingStyle => {
  let longCount = 0
  let shortCount = 0
  let leverageSum = 0
  const holdDurations: number[] = []

  positions.forEach((p) => {
    if (p.side === "LONG") {
      longCount += 1
    } else {
      shortCount += 1
    }
    leverageSum += p.leverage

    if (p.closed_at) {
      const start = new Date(p.created_at).getTime()
      const end = new Date(p.closed_at).getTime()
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        holdDurations.push(end - start)
      }
    }
  })

  const directional = longCount + shortCount
  const longBiasPercent =
    directional === 0 ? 50 : (longCount / directional) * 100

  return {
    longCount,
    shortCount,
    longBiasPercent,
    averageLeverage: directional === 0 ? null : leverageSum / directional,
    averageHoldMs: meanOrNull(holdDurations),
    topSymbols: symbolRows.map((r) => ({
      symbol: r.symbol,
      count: parseCount(r.trade_count),
    })),
  }
}

export const toShareTradeHighlight = (row: ClosedTradeRoeRow): ProfileShareTradeHighlight | null => {
  const roe = closedTradeRoePercent(row.realized_pnl, row.margin_allocated)

  if (roe == null) {
    return null
  }

  return {
    tradeId: row.trade_id,
    symbol: row.symbol,
    side: row.side,
    leverage: row.leverage,
    roePercent: roe,
    realizedPnl: row.realized_pnl,
  }
}

export const pickTopTradesByPnl = (
  rows: ClosedTradeRoeRow[],
  limit = 3,
): ProfileShareTradeHighlight[] =>
  rows
    .map((row) => ({ row, highlight: toShareTradeHighlight(row) }))
    .filter((x): x is { row: ClosedTradeRoeRow; highlight: ProfileShareTradeHighlight } => x.highlight != null)
    .sort((a, b) => b.row.realized_pnl - a.row.realized_pnl)
    .slice(0, limit)
    .map(({ highlight }) => highlight)

const buildShareRoomOptions = (
  competitionRows: ProfileCompetitionRow[],
  roeRows: ClosedTradeRoeRow[],
  participantCountByRoom: Map<string, number>,
  closedTradeCountByParticipant: Map<string, number>,
): ProfileShareRoomOption[] =>
  competitionRows.map((comp) => {
    const roomTrades = roeRows.filter((r) => r.room_id === comp.room.id)

    return {
      room: comp.room,
      participantId: comp.participantId,
      placementRank: comp.placementRank,
      pnlPercent: comp.pnlPercent,
      closedTradeCount: closedTradeCountByParticipant.get(comp.participantId) ?? 0,
      participantCount: participantCountByRoom.get(comp.room.id) ?? comp.participantCount,
      startDateIso: comp.room.start_date,
      endDateIso: comp.endDateIso,
      isOngoing: comp.isOngoing,
      topTrades: pickTopTradesByPnl(roomTrades),
    }
  })
