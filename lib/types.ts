/** Canonical market id (e.g. BTCUSDT, xyz:TSLA); validate with isSupportedSymbol from @/lib/markets */
export type SupportedSymbol = string

export type PositionSide = "LONG" | "SHORT"

export type UserProfile = {
  id: string
  email: string
  username: string
  image_url: string | null
  profile_setup_completed_at: string | null
  created_at: string
}

export type Room = {
  id: string
  creator_id: string
  name: string
  description: string | null
  join_code: string
  starting_balance: number
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export type RoomParticipant = {
  id: string
  room_id: string
  user_id: string
  available_margin: number
  created_at: string
}

export type Position = {
  id: string
  participant_id: string
  symbol: SupportedSymbol
  side: PositionSide
  leverage: number
  size: number
  margin_allocated: number
  entry_price: number
  liquidation_price: number
  is_open: boolean
  last_funding_hour: string | null
  created_at: string
  closed_at: string | null
}

export type OrderType = "LIMIT" | "TAKE_PROFIT" | "STOP_LOSS"

export type OrderStatus = "PENDING" | "FILLED" | "CANCELLED"

export type PendingOrder = {
  id: string
  participant_id: string
  parent_order_id: string | null
  position_id: string | null
  symbol: SupportedSymbol
  side: PositionSide
  type: OrderType
  size: number
  leverage: number
  trigger_price: number
  status: OrderStatus
  margin_reserved: number
  created_at: string
  filled_at: string | null
  cancelled_at: string | null
}

export type TradeDirection = "OPEN_LONG" | "OPEN_SHORT" | "CLOSE_LONG" | "CLOSE_SHORT"

export type LiquidityRole = "MAKER" | "TAKER"

export type Trade = {
  id: string
  participant_id: string
  position_id: string
  symbol: SupportedSymbol
  direction: TradeDirection
  price: number
  size: number
  trade_value: number
  realized_pnl: number | null
  fee: number
  liquidity_role: LiquidityRole | null
  created_at: string
}

export type FundingPayment = {
  id: string
  participant_id: string
  position_id: string
  symbol: SupportedSymbol
  funding_rate: number
  payment_amount: number
  funding_hour: string
  created_at: string
}

export type ParticipantWithUser = RoomParticipant & {
  users: Pick<UserProfile, "id" | "username" | "image_url"> | null
}

export type ActionResult<T = undefined> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: string
    }

export type ProfileCompetitionRow = {
  room: Room
  participantId: string
  placementRank: number
  entryCount: number
  endDateIso: string
  isOngoing: boolean
  pnlPercent: number
  displayEquity: number
}

export type ProfileWipeoutEvent = {
  roomId: string
  roomName: string
  wipedAtIso: string
}

export type ProfileSummaryStats = {
  competitionsEntered: number
  allTimeAvgPnlPercent: number | null
  bestTradeRoePercent: number | null
  timesLiquidated: number
  wipeouts: ProfileWipeoutEvent[]
}

export type ProfileTradingStyle = {
  longCount: number
  shortCount: number
  longBiasPercent: number
  averageLeverage: number | null
  averageHoldMs: number | null
  topSymbols: { symbol: SupportedSymbol; count: number }[]
}

export type ProfileShareTradeHighlight = {
  tradeId: string
  symbol: SupportedSymbol
  side: PositionSide
  leverage: number
  roePercent: number
  realizedPnl: number
}

export type ProfileShareRoomOption = {
  room: Room
  participantId: string
  placementRank: number
  pnlPercent: number
  entryCount: number
  participantCount: number
  startDateIso: string
  endDateIso: string
  isOngoing: boolean
  topTrades: ProfileShareTradeHighlight[]
}

export type ProfileDashboardData = {
  competitionRows: ProfileCompetitionRow[]
  summary: ProfileSummaryStats
  tradingStyle: ProfileTradingStyle
  shareRoomOptions: ProfileShareRoomOption[]
}
