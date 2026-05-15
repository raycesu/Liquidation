/** Economic equity: free margin + margin locked in open positions + mark-to-market PnL. */
export const computeParticipantEquity = (
  availableMargin: number,
  openMarginAllocated: number,
  unrealizedPnl: number,
) => availableMargin + openMarginAllocated + unrealizedPnl

/** @deprecated Use computeParticipantEquity with open margin allocated. */
export const computeDisplayEquity = computeParticipantEquity
