import { MARKETS_SNAPSHOT } from "./markets.generated"
import type { AssetCategory, Market } from "./markets-types"

export type { AssetCategory, Market, PriceSource } from "./markets-types"

const bySymbol = new Map<string, Market>()

for (const m of MARKETS_SNAPSHOT) {
  bySymbol.set(m.symbol, m)
}

/** All tradable markets (HL snapshot + Binance intersection). */
export const MARKETS: readonly Market[] = MARKETS_SNAPSHOT

export const getMarket = (symbol: string): Market | undefined => bySymbol.get(symbol)

export const isSupportedSymbol = (symbol: string): boolean => bySymbol.has(symbol)

export const getMaxLeverage = (symbol: string): number => getMarket(symbol)?.maxLeverage ?? 1

/** Default chart / terminal symbol */
export const defaultMarketSymbol = "BTCUSDT"
