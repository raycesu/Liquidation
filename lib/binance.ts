export type Binance24hStats = {
  lastPrice: number
  changeAbs: number
  changePercent: number
  quoteVolume: number
}

type BinanceFutures24hRow = {
  symbol: string
  lastPrice: string
  priceChange: string
  priceChangePercent: string
  quoteVolume: string
}

/** Full USDT-M perpetual 24h ticker map (used for bootstrap / filtering). */
export const fetchAllFutures24hStats = async (): Promise<Map<string, Binance24hStats>> => {
  const response = await fetch("https://fapi.binance.com/fapi/v1/ticker/24hr", {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Unable to fetch Binance futures 24h tickers")
  }

  const rows = (await response.json()) as BinanceFutures24hRow[]
  const out = new Map<string, Binance24hStats>()

  for (const row of rows) {
    const lastPrice = Number(row.lastPrice)
    const changeAbs = Number(row.priceChange)
    const changePercent = Number(row.priceChangePercent)
    const quoteVolume = Number(row.quoteVolume)

    if (
      !Number.isFinite(lastPrice) ||
      lastPrice <= 0 ||
      !Number.isFinite(changeAbs) ||
      !Number.isFinite(changePercent) ||
      !Number.isFinite(quoteVolume)
    ) {
      continue
    }

    out.set(row.symbol, {
      lastPrice,
      changeAbs,
      changePercent,
      quoteVolume,
    })
  }

  return out
}
