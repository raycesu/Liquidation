import { calculatePnl } from "@/lib/perpetuals"
import type { PositionSide, SupportedSymbol } from "@/lib/types"

export type PnlPositionRow = {
  participant_id: string
  symbol: SupportedSymbol
  side: PositionSide
  size: number
  entry_price: number
}

export type ParticipantPnlScore = {
  id: string
  available_margin: number
  realizedPnl: number
  unrealizedPnl: number
  totalPnl: number
}

export const buildUnrealizedPnlByParticipant = (
  positions: PnlPositionRow[],
  prices: Partial<Record<SupportedSymbol, number>>,
) => {
  const pnlByParticipant = new Map<string, number>()

  positions.forEach((position) => {
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

export const computeTotalPnl = (realizedPnl: number, unrealizedPnl: number) => realizedPnl + unrealizedPnl

/** Percent return vs room starting balance from trade PnL (matches lobby ranking basis). */
export const computePnlPercentFromTotalPnl = (totalPnl: number, startingBalance: number) => {
  if (startingBalance <= 0) {
    return 0
  }

  return (totalPnl / startingBalance) * 100
}

export const computeDisplayedPnlPercentFromTotalPnl = (
  totalPnl: number,
  startingBalance: number,
  isAccountBusted: boolean,
) => {
  if (isAccountBusted) {
    return -100
  }

  return computePnlPercentFromTotalPnl(totalPnl, startingBalance)
}

export const computeDisplayedTotalPnlFromTotalPnl = (
  totalPnl: number,
  startingBalance: number,
  isAccountBusted: boolean,
) => {
  if (isAccountBusted) {
    return startingBalance > 0 ? -startingBalance : totalPnl
  }

  return totalPnl
}

export const compareByLeaderboardPnl = (a: ParticipantPnlScore, b: ParticipantPnlScore) =>
  b.totalPnl - a.totalPnl || b.available_margin - a.available_margin

export const scoreParticipantsByTotalPnl = <T extends { id: string; available_margin: number }>(
  participants: T[],
  realizedByParticipant: Map<string, number>,
  unrealizedByParticipant: Map<string, number>,
): (T & ParticipantPnlScore)[] =>
  participants
    .map((participant) => {
      const realizedPnl = realizedByParticipant.get(participant.id) ?? 0
      const unrealizedPnl = unrealizedByParticipant.get(participant.id) ?? 0

      return {
        ...participant,
        realizedPnl,
        unrealizedPnl,
        totalPnl: computeTotalPnl(realizedPnl, unrealizedPnl),
      }
    })
    .sort(compareByLeaderboardPnl)

export const placementRankForParticipant = (sortedParticipants: { id: string }[], participantId: string) => {
  const index = sortedParticipants.findIndex((row) => row.id === participantId)

  if (index < 0) {
    return 0
  }

  return index + 1
}
