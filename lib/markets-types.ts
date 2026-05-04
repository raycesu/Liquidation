/** Shared types for tradable markets (HL snapshot + Binance routing). */

export type AssetCategory = "crypto" | "equity" | "commodity" | "index"

export type PriceSource = "binance-futures" | "hyperliquid"

export type Market = {
  /** Canonical id stored in DB (e.g. BTCUSDT, xyz:TSLA) */
  symbol: string
  /** Hyperliquid universe name (e.g. BTC, kPEPE, xyz:TSLA) */
  hlName: string
  /** Short label for UI */
  displayName: string
  /** Base without quote (BTC, TSLA, GOLD) */
  base: string
  category: AssetCategory
  maxLeverage: number
  szDecimals: number
  priceSource: PriceSource
  /** Binance USDT-M perpetual symbol when priceSource is binance-futures */
  binanceSymbol?: string
  /** Key in HL allMids map (e.g. xyz:TSLA or BTC for HL-only mids) */
  hlPriceKey?: string
  /** TradingView full symbol (exchange:pair) */
  tvSymbol: string
}
