import { fetchHlAllMids } from "@/lib/hyperliquid"
import { getMarket, isSupportedSymbol } from "@/lib/markets"
import type { Market } from "@/lib/markets-types"

const PRICE_CACHE_TTL_MS = 1500

type PriceCacheEntry = {
  prices: Record<string, number>
  expiresAt: number
}

const batchPriceCache = new Map<string, PriceCacheEntry>()
const singlePriceCache = new Map<string, { price: number; expiresAt: number }>()

const parsePositive = (raw: string | undefined): number | null => {
  if (raw == null) {
    return null
  }
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) {
    return null
  }
  return n
}

const cacheKeyForSymbols = (symbols: string[]) => [...symbols].sort().join(",")

/** Perps / major crypto mids (BTC, ETH, …) — use main `allMids`, not `dex: xyz`. */
const fetchHyperliquidMainMid = async (hlPriceKey: string): Promise<number> => {
  const mids = await fetchHlAllMids()
  const mid = parsePositive(mids[hlPriceKey])

  if (mid == null) {
    throw new Error(`Unable to fetch Hyperliquid main-book mid for ${hlPriceKey}`)
  }

  return mid
}

const fetchHyperliquidMidForMarket = async (market: Market): Promise<number> => {
  const mids = await fetchHlAllMids("xyz")
  const key = market.hlPriceKey ?? market.symbol
  const mid = parsePositive(mids[key])

  if (mid == null) {
    throw new Error(`Unable to fetch Hyperliquid mid for ${key}`)
  }

  return mid
}

export const fetchFuturesPrice = async (binanceSymbol: string): Promise<number> => {
  const response = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${binanceSymbol}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Unable to fetch Binance futures price for ${binanceSymbol}`)
  }

  const payload = (await response.json()) as { price: string }
  const price = parsePositive(payload.price)

  if (price == null) {
    throw new Error(`Invalid futures price for ${binanceSymbol}`)
  }

  return price
}

export const fetchMarketPrice = async (canonicalSymbol: string): Promise<number> => {
  const market = getMarket(canonicalSymbol)

  if (!market) {
    throw new Error(`Unsupported market: ${canonicalSymbol}`)
  }

  const cached = singlePriceCache.get(canonicalSymbol)
  const now = Date.now()

  if (cached && cached.expiresAt > now) {
    return cached.price
  }

  let price: number

  if (market.priceSource === "binance-futures" && market.binanceSymbol) {
    try {
      price = await fetchFuturesPrice(market.binanceSymbol)
    } catch {
      const hlKey = market.hlPriceKey ?? market.symbol
      price = await fetchHyperliquidMainMid(hlKey)
    }
  } else {
    price = await fetchHyperliquidMidForMarket(market)
  }

  singlePriceCache.set(canonicalSymbol, { price, expiresAt: now + PRICE_CACHE_TTL_MS })
  return price
}

/**
 * Batch-fetch mark prices for supported canonical symbols (Binance futures + HL xyz).
 */
export const fetchMarketPrices = async (canonicalSymbols: string[]): Promise<Record<string, number>> => {
  const uniq = [...new Set(canonicalSymbols)].filter(isSupportedSymbol)
  const out: Record<string, number> = {}

  if (uniq.length === 0) {
    return out
  }

  const cacheKey = cacheKeyForSymbols(uniq)
  const now = Date.now()
  const cached = batchPriceCache.get(cacheKey)

  if (cached && cached.expiresAt > now) {
    return { ...cached.prices }
  }

  const binanceCanon = uniq.filter((s) => getMarket(s)?.priceSource === "binance-futures")
  const hlCanon = uniq.filter((s) => getMarket(s)?.priceSource === "hyperliquid")

  if (binanceCanon.length > 0) {
    const binanceSymbols = binanceCanon.map((s) => getMarket(s)!.binanceSymbol!)
    const encoded = encodeURIComponent(JSON.stringify(binanceSymbols))
    let hlMainMids: Record<string, string> | null = null

    const loadHlMainMids = async () => {
      if (hlMainMids == null) {
        hlMainMids = await fetchHlAllMids()
      }
      return hlMainMids
    }

    try {
      const response = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbols=${encoded}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Unable to batch-fetch Binance futures prices")
      }

      const rows = (await response.json()) as { symbol: string; price: string }[]
      const byBin = new Map(rows.map((r) => [r.symbol, r.price]))

      for (const canon of binanceCanon) {
        const m = getMarket(canon)!
        const raw = byBin.get(m.binanceSymbol!)
        const px = parsePositive(raw)
        if (px != null) {
          out[canon] = px
        }
      }
    } catch {
      const mids = await loadHlMainMids()

      for (const canon of binanceCanon) {
        const m = getMarket(canon)!
        const key = m.hlPriceKey ?? m.symbol
        const px = parsePositive(mids[key])
        if (px != null) {
          out[canon] = px
        }
      }
    }

    const missingBinance = binanceCanon.filter((c) => out[c] == null)

    if (missingBinance.length > 0) {
      const mids = await loadHlMainMids()

      for (const canon of missingBinance) {
        const m = getMarket(canon)!
        const key = m.hlPriceKey ?? m.symbol
        const px = parsePositive(mids[key])
        if (px != null) {
          out[canon] = px
        }
      }
    }
  }

  if (hlCanon.length > 0) {
    const mids = await fetchHlAllMids("xyz")

    for (const canon of hlCanon) {
      const m = getMarket(canon)!
      const key = m.hlPriceKey ?? m.symbol
      const px = parsePositive(mids[key])
      if (px != null) {
        out[canon] = px
      }
    }
  }

  batchPriceCache.set(cacheKey, { prices: out, expiresAt: now + PRICE_CACHE_TTL_MS })

  for (const [symbol, price] of Object.entries(out)) {
    singlePriceCache.set(symbol, { price, expiresAt: now + PRICE_CACHE_TTL_MS })
  }

  return out
}
