type TradePnlRow = {
  participant_id: string
  trade_pnl: number
  closed_trade_count?: number | string
  winning_trade_count?: number | string
}

type FundingPnlRow = {
  participant_id: string
  funding_pnl: number
}

export type ParticipantNetPnlStats = {
  tradePnl: number
  fundingPnl: number
  realizedPnl: number
  closedTradeCount: number
  winningTradeCount: number
}

const parseCount = (value: number | string | undefined) => {
  if (value == null) {
    return 0
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const buildParticipantNetPnlStats = (
  participantIds: string[],
  tradeRows: TradePnlRow[],
  fundingRows: FundingPnlRow[],
) => {
  const tradeByParticipant = new Map(tradeRows.map((row) => [row.participant_id, row]))
  const fundingByParticipant = new Map(fundingRows.map((row) => [row.participant_id, row.funding_pnl]))
  const statsByParticipant = new Map<string, ParticipantNetPnlStats>()

  participantIds.forEach((participantId) => {
    const tradeRow = tradeByParticipant.get(participantId)
    const fundingPnl = fundingByParticipant.get(participantId) ?? 0
    const tradePnl = tradeRow?.trade_pnl ?? 0

    statsByParticipant.set(participantId, {
      tradePnl,
      fundingPnl,
      realizedPnl: tradePnl + fundingPnl,
      closedTradeCount: parseCount(tradeRow?.closed_trade_count),
      winningTradeCount: parseCount(tradeRow?.winning_trade_count),
    })
  })

  fundingRows.forEach((row) => {
    if (statsByParticipant.has(row.participant_id)) {
      return
    }

    statsByParticipant.set(row.participant_id, {
      tradePnl: 0,
      fundingPnl: row.funding_pnl,
      realizedPnl: row.funding_pnl,
      closedTradeCount: 0,
      winningTradeCount: 0,
    })
  })

  return statsByParticipant
}
