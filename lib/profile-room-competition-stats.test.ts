import { computeProfileRoomCompetitionStats } from "@/lib/profile-room-competition-stats"
import type { Position, Trade } from "@/lib/types"

const makeTrade = (overrides: Partial<Trade> & Pick<Trade, "id" | "position_id" | "symbol">): Trade => ({
  participant_id: "participant-1",
  direction: "CLOSE_LONG",
  price: 100,
  size: 1,
  trade_value: 100,
  realized_pnl: 50,
  fee: 0,
  liquidity_role: null,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
})

const makePosition = (overrides: Partial<Position> & Pick<Position, "id">): Position => ({
  participant_id: "participant-1",
  symbol: "BTCUSDT",
  side: "LONG",
  leverage: 10,
  size: 1,
  margin_allocated: 1000,
  entry_price: 100,
  liquidation_price: 80,
  is_open: false,
  last_funding_hour: null,
  created_at: "2026-01-01T00:00:00Z",
  closed_at: "2026-01-02T00:00:00Z",
  ...overrides,
})

describe("computeProfileRoomCompetitionStats", () => {
  it("returns null metrics and empty trade lists for empty input", () => {
    expect(computeProfileRoomCompetitionStats([], [])).toEqual({
      winRatePercent: null,
      averageLeverage: null,
      mostTradedSymbol: null,
      bestTrades: [],
      worstTrades: [],
    })
  })

  it("computes win rate from closed trades with realized PnL", () => {
    const positions = [
      makePosition({ id: "pos-1" }),
      makePosition({ id: "pos-2", symbol: "ETHUSDT" }),
      makePosition({ id: "pos-3", symbol: "SOLUSDT" }),
    ]

    const trades = [
      makeTrade({ id: "t1", position_id: "pos-1", symbol: "BTCUSDT", realized_pnl: 100 }),
      makeTrade({ id: "t2", position_id: "pos-2", symbol: "ETHUSDT", realized_pnl: -20 }),
      makeTrade({ id: "t3", position_id: "pos-3", symbol: "SOLUSDT", realized_pnl: 0 }),
      makeTrade({
        id: "t4",
        position_id: "pos-1",
        symbol: "BTCUSDT",
        direction: "OPEN_LONG",
        realized_pnl: null,
      }),
    ]

    const stats = computeProfileRoomCompetitionStats(trades, positions)

    expect(stats.winRatePercent).toBeCloseTo(33.333, 2)
  })

  it("computes average leverage across all positions", () => {
    const positions = [
      makePosition({ id: "pos-1", leverage: 5 }),
      makePosition({ id: "pos-2", leverage: 15, symbol: "ETHUSDT" }),
    ]

    const stats = computeProfileRoomCompetitionStats([], positions)

    expect(stats.averageLeverage).toBe(10)
  })

  it("picks the most traded symbol by trade count", () => {
    const trades = [
      makeTrade({ id: "t1", position_id: "pos-1", symbol: "BTCUSDT", direction: "OPEN_LONG", realized_pnl: null }),
      makeTrade({ id: "t2", position_id: "pos-1", symbol: "BTCUSDT" }),
      makeTrade({ id: "t3", position_id: "pos-2", symbol: "ETHUSDT" }),
    ]

    const stats = computeProfileRoomCompetitionStats(trades, [])

    expect(stats.mostTradedSymbol).toBe("BTCUSDT")
  })

  it("breaks most-traded ties by first symbol to reach the max count", () => {
    const trades = [
      makeTrade({ id: "t1", position_id: "pos-1", symbol: "BTCUSDT", direction: "OPEN_LONG", realized_pnl: null }),
      makeTrade({ id: "t2", position_id: "pos-2", symbol: "ETHUSDT", direction: "OPEN_LONG", realized_pnl: null }),
    ]

    const stats = computeProfileRoomCompetitionStats(trades, [])

    expect(stats.mostTradedSymbol).toBe("BTCUSDT")
  })

  it("selects best and worst trades by realized PnL and includes ROE", () => {
    const positions = [
      makePosition({ id: "pos-1", margin_allocated: 1000 }),
      makePosition({ id: "pos-2", symbol: "ETHUSDT", margin_allocated: 500 }),
      makePosition({ id: "pos-3", symbol: "SOLUSDT", margin_allocated: 200 }),
      makePosition({ id: "pos-4", symbol: "DOGEUSDT", margin_allocated: 100 }),
    ]

    const trades = [
      makeTrade({ id: "best", position_id: "pos-1", symbol: "BTCUSDT", realized_pnl: 300 }),
      makeTrade({ id: "mid", position_id: "pos-2", symbol: "ETHUSDT", realized_pnl: 10 }),
      makeTrade({ id: "worst", position_id: "pos-3", symbol: "SOLUSDT", realized_pnl: -80 }),
      makeTrade({
        id: "skip",
        position_id: "pos-4",
        symbol: "DOGEUSDT",
        realized_pnl: 5,
      }),
    ]

    positions[3] = makePosition({ id: "pos-4", symbol: "DOGEUSDT", margin_allocated: 0 })

    const stats = computeProfileRoomCompetitionStats(trades, positions)

    expect(stats.bestTrades.map((t) => t.tradeId)).toEqual(["best", "mid", "worst"])
    expect(stats.worstTrades.map((t) => t.tradeId)).toEqual(["worst", "mid", "best"])
    expect(stats.bestTrades[0]?.roePercent).toBeCloseTo(30, 5)
    expect(stats.worstTrades[0]?.roePercent).toBeCloseTo(-40, 5)
    expect(stats.bestTrades.find((t) => t.tradeId === "skip")).toBeUndefined()
  })
})
