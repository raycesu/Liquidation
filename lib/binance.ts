import { supportedSymbols, type SupportedSymbol } from "@/lib/types"

type BinancePriceResponse = {
  symbol: string
  price: string
}

export type BinanceKline = {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export const isSupportedSymbol = (symbol: string): symbol is SupportedSymbol =>
  supportedSymbols.includes(symbol as SupportedSymbol)

export const fetchSpotPrice = async (symbol: SupportedSymbol) => {
  const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Unable to fetch ${symbol} price`)
  }

  const payload = (await response.json()) as BinancePriceResponse
  const price = Number(payload.price)

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Invalid ${symbol} price from Binance`)
  }

  return price
}

export const fetchSpotPrices = async (symbols: SupportedSymbol[]) => {
  const entries = await Promise.all(
    symbols.map(async (symbol) => {
      const price = await fetchSpotPrice(symbol)
      return [symbol, price] as const
    }),
  )

  return Object.fromEntries(entries) as Record<SupportedSymbol, number>
}
