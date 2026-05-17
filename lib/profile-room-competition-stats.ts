import { closedTradeRoePercent } from "@/lib/profile-stats"
import type { Position, SupportedSymbol, Trade } from "@/lib/types"

export type ProfileRoomTradeHighlight = {
  tradeId: string
  symbol: SupportedSymbol
  roePercent: number
  realizedPnl: number
}

export type ProfileRoomCompetitionStats = {
  winRatePercent: number | null
  averageLeverage: number | null
  mostTradedSymbol: SupportedSymbol | null
  bestTrades: ProfileRoomTradeHighlight[]
  worstTrades: ProfileRoomTradeHighlight[]
}

const isCloseTrade = (trade: Trade) =>
  trade.direction === "CLOSE_LONG" || trade.direction === "CLOSE_SHORT"

const toTradeHighlight = (
  trade: Trade,
  positionById: Map<string, Position>,
): ProfileRoomTradeHighlight | null => {
  if (trade.realized_pnl == null) {
    return null
  }

  const position = positionById.get(trade.position_id)

  if (!position) {
    return null
  }

  const roePercent = closedTradeRoePercent(trade.realized_pnl, position.margin_allocated)

  if (roePercent == null) {
    return null
  }

  return {
    tradeId: trade.id,
    symbol: trade.symbol,
    roePercent,
    realizedPnl: trade.realized_pnl,
  }
}

const pickBestTrades = (highlights: ProfileRoomTradeHighlight[], limit = 3) =>
  [...highlights].sort((a, b) => b.realizedPnl - a.realizedPnl).slice(0, limit)

const pickWorstTrades = (highlights: ProfileRoomTradeHighlight[], limit = 3) =>
  [...highlights].sort((a, b) => a.realizedPnl - b.realizedPnl).slice(0, limit)

const computeMostTradedSymbol = (trades: Trade[]): SupportedSymbol | null => {
  if (trades.length === 0) {
    return null
  }

  const counts = new Map<SupportedSymbol, number>()

  trades.forEach((trade) => {
    counts.set(trade.symbol, (counts.get(trade.symbol) ?? 0) + 1)
  })

  let topSymbol: SupportedSymbol | null = null
  let topCount = 0

  counts.forEach((count, symbol) => {
    if (count > topCount) {
      topCount = count
      topSymbol = symbol
    }
  })

  return topSymbol
}

export const computeProfileRoomCompetitionStats = (
  trades: Trade[],
  positions: Position[],
): ProfileRoomCompetitionStats => {
  const positionById = new Map(positions.map((position) => [position.id, position]))

  const closedTrades = trades.filter((trade) => isCloseTrade(trade) && trade.realized_pnl != null)
  const winningTrades = closedTrades.filter((trade) => trade.realized_pnl! > 0).length
  const winRatePercent =
    closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : null

  const averageLeverage =
    positions.length > 0
      ? positions.reduce((sum, position) => sum + position.leverage, 0) / positions.length
      : null

  const tradeHighlights = closedTrades
    .map((trade) => toTradeHighlight(trade, positionById))
    .filter((highlight): highlight is ProfileRoomTradeHighlight => highlight != null)

  return {
    winRatePercent,
    averageLeverage,
    mostTradedSymbol: computeMostTradedSymbol(trades),
    bestTrades: pickBestTrades(tradeHighlights),
    worstTrades: pickWorstTrades(tradeHighlights),
  }
}
