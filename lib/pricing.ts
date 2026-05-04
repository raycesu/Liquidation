import { fetchHlAllMids } from "@/lib/hyperliquid"
import { getMarket, isSupportedSymbol } from "@/lib/markets"

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

  if (market.priceSource === "binance-futures" && market.binanceSymbol) {
    return fetchFuturesPrice(market.binanceSymbol)
  }

  const mids = await fetchHlAllMids("xyz")
  const key = market.hlPriceKey ?? market.symbol
  const price = parsePositive(mids[key])

  if (price == null) {
    throw new Error(`Unable to fetch Hyperliquid mid for ${key}`)
  }

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

  const binanceCanon = uniq.filter((s) => getMarket(s)?.priceSource === "binance-futures")
  const hlCanon = uniq.filter((s) => getMarket(s)?.priceSource === "hyperliquid")

  if (binanceCanon.length > 0) {
    const binanceSymbols = binanceCanon.map((s) => getMarket(s)!.binanceSymbol!)
    const encoded = encodeURIComponent(JSON.stringify(binanceSymbols))
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

  return out
}
