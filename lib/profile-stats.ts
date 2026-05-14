import { getSql } from "@/lib/db"
import { fetchMarketPrices } from "@/lib/pricing"
import { calculatePnl } from "@/lib/perpetuals"
import type {
  Position,
  PositionSide,
  ProfileCompetitionRow,
  ProfileDashboardData,
  ProfileShareRoomOption,
  ProfileSpotlightTrade,
  ProfileSummaryStats,
  ProfileTradingStyle,
  Room,
  SupportedSymbol,
} from "@/lib/types"

type ParticipantRow = {
  id: string
  room_id: string
  user_id: string
  available_margin: number
  total_equity: number
  rooms: Room | null
}

type PlainParticipantRow = {
  id: string
  room_id: string
  user_id: string
  available_margin: number
  total_equity: number
}

type OpenPositionRow = Position & {
  room_id: string
}

type EntryCountRow = {
  participant_id: string
  room_id: string
  entry_count: string | number
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

const EPS = 1e-6

export const computeDisplayEquity = (availableMargin: number, unrealizedPnl: number) =>
  availableMargin + unrealizedPnl

export const computePnlPercent = (displayEquity: number, startingBalance: number) => {
  if (startingBalance <= 0) {
    return 0
  }

  return ((displayEquity - startingBalance) / startingBalance) * 100
}

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

const roomIsOngoing = (room: Room) => room.is_active && new Date(room.end_date) > new Date()

const buildUnrealizedByParticipant = (
  openRows: OpenPositionRow[],
  prices: Partial<Record<SupportedSymbol, number>>,
) => {
  const pnlByParticipant = new Map<string, number>()

  openRows.forEach((position) => {
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

  return pnlByParticipant
}

const rankParticipantsInRoom = (
  roomId: string,
  participants: PlainParticipantRow[],
  unrealizedByParticipant: Map<string, number>,
) => {
  const inRoom = participants.filter((p) => p.room_id === roomId)
  const scored = inRoom.map((p) => ({
    id: p.id,
    displayEquity: computeDisplayEquity(p.available_margin, unrealizedByParticipant.get(p.id) ?? 0),
  }))
  scored.sort((a, b) => b.displayEquity - a.displayEquity)
  return scored
}

export const placementRankForParticipant = (sortedDisplay: { id: string }[], participantId: string) => {
  const index = sortedDisplay.findIndex((row) => row.id === participantId)

  if (index < 0) {
    return 0
  }

  return index + 1
}

export const loadProfileDashboardData = async (userId: string): Promise<ProfileDashboardData> => {
  const sql = getSql()

  const myRows = (await sql`
    select
      rp.id::text,
      rp.room_id::text,
      rp.user_id,
      rp.available_margin::float8 as available_margin,
      rp.total_equity::float8 as total_equity,
      json_build_object(
        'id', r.id::text,
        'creator_id', r.creator_id,
        'name', r.name,
        'description', r.description,
        'join_code', r.join_code,
        'starting_balance', r.starting_balance::float8,
        'start_date', r.start_date::text,
        'end_date', r.end_date::text,
        'is_active', r.is_active,
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

  const [allRoomParticipants, openPositions, entryRows, stylePositions, symbolRows, roeRows] =
    (await Promise.all([
      sql`
        select
          rp.id::text,
          rp.room_id::text,
          rp.user_id,
          rp.available_margin::float8 as available_margin,
          rp.total_equity::float8 as total_equity
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
          rp.id::text as participant_id,
          rp.room_id::text as room_id,
          (
            select count(*)::int
            from trades t
            where t.participant_id = rp.id
              and t.direction in ('OPEN_LONG', 'OPEN_SHORT')
          ) as entry_count
        from room_participants rp
        where rp.user_id = ${userId}
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
    ])) as unknown as [
      PlainParticipantRow[],
      OpenPositionRow[],
      EntryCountRow[],
      PositionStyleRow[],
      SymbolCountRow[],
      ClosedTradeRoeRow[],
    ]

  const symbols = Array.from(new Set(openPositions.map((p) => p.symbol))) as SupportedSymbol[]
  const prices = symbols.length > 0 ? await fetchMarketPrices(symbols) : {}
  const unrealizedByParticipant = buildUnrealizedByParticipant(openPositions, prices)

  const openByParticipant = new Map<string, boolean>()
  openPositions.forEach((p) => {
    openByParticipant.set(p.participant_id, true)
  })

  const entryByParticipant = new Map<string, number>()
  entryRows.forEach((row) => {
    entryByParticipant.set(row.participant_id, parseCount(row.entry_count))
  })

  const competitionRows: ProfileCompetitionRow[] = []
  const pnlPercents: number[] = []
  let timesLiquidated = 0

  for (const row of myRows) {
    const room = row.rooms

    if (!room) {
      continue
    }

    const ranked = rankParticipantsInRoom(room.id, allRoomParticipants, unrealizedByParticipant)
    const rankedDisplay = ranked.map((r) => ({ id: r.id, displayEquity: r.displayEquity }))
    const placementRank = placementRankForParticipant(rankedDisplay, row.id)
    const mine = ranked.find((r) => r.id === row.id)
    const displayEquity = mine?.displayEquity ?? row.available_margin
    const pnlPercent = computePnlPercent(displayEquity, room.starting_balance)
    pnlPercents.push(pnlPercent)

    const hasOpen = openByParticipant.has(row.id)

    if (isAccountBusted(displayEquity, hasOpen)) {
      timesLiquidated += 1
    }

    competitionRows.push({
      room,
      participantId: row.id,
      placementRank,
      entryCount: entryByParticipant.get(row.id) ?? 0,
      endDateIso: room.end_date,
      isOngoing: roomIsOngoing(room),
      pnlPercent,
      displayEquity,
    })
  }

  const globalRoes: number[] = []
  roeRows.forEach((r) => {
    const roe = closedTradeRoePercent(r.realized_pnl, r.margin_allocated)
    if (roe != null) {
      globalRoes.push(roe)
    }
  })

  const summary: ProfileSummaryStats = {
    competitionsEntered: myRows.length,
    allTimeAvgPnlPercent: meanOrNull(pnlPercents),
    bestTradeRoePercent: maxOrNull(globalRoes),
    timesLiquidated,
  }

  const tradingStyle = buildTradingStyle(stylePositions, symbolRows)

  const shareRoomOptions = buildShareRoomOptions(competitionRows, roeRows)

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

const toSpotlight = (
  row: ClosedTradeRoeRow,
  placementRank: number,
): ProfileSpotlightTrade | null => {
  const roe = closedTradeRoePercent(row.realized_pnl, row.margin_allocated)

  if (roe == null) {
    return null
  }

  return {
    roomId: row.room_id,
    tradeId: row.trade_id,
    symbol: row.symbol,
    side: row.side,
    leverage: row.leverage,
    roePercent: roe,
    realizedPnl: row.realized_pnl,
    entryPrice: row.entry_price,
    closePrice: row.close_price,
    roomName: row.room_name,
    placementRank,
  }
}

const buildShareRoomOptions = (
  competitionRows: ProfileCompetitionRow[],
  roeRows: ClosedTradeRoeRow[],
): ProfileShareRoomOption[] =>
  competitionRows.map((comp) => {
    const roomTrades = roeRows.filter((r) => r.room_id === comp.room.id)
    const withRoe = roomTrades
      .map((row) => ({
        row,
        roe: closedTradeRoePercent(row.realized_pnl, row.margin_allocated),
      }))
      .filter((x): x is { row: ClosedTradeRoeRow; roe: number } => x.roe != null)
      .sort((a, b) => b.roe - a.roe)

    const spotlightCandidates = withRoe
      .map(({ row }) => toSpotlight(row, comp.placementRank))
      .filter((s): s is ProfileSpotlightTrade => s != null)

    return {
      room: comp.room,
      participantId: comp.participantId,
      placementRank: comp.placementRank,
      pnlPercent: comp.pnlPercent,
      defaultSpotlight: spotlightCandidates[0] ?? null,
      spotlightCandidates,
    }
  })
