export const supportedSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const

export type SupportedSymbol = (typeof supportedSymbols)[number]

export type PositionSide = "LONG" | "SHORT"

export type UserProfile = {
  id: string
  email: string
  username: string
  created_at: string
}

export type Room = {
  id: string
  creator_id: string
  name: string
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
  total_equity: number
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
  created_at: string
  closed_at: string | null
}

export type LatestPrice = {
  symbol: SupportedSymbol
  price: number
  updated_at: string
}

export type ParticipantWithUser = RoomParticipant & {
  users: Pick<UserProfile, "id" | "username" | "email"> | null
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
