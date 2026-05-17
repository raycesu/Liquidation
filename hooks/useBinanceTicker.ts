"use client"

import { useEffect, useRef, useState } from "react"
import { fetchAllFutures24hStats, type Binance24hStats } from "@/lib/binance"
import { fetchHlMetaAndAssetCtxs } from "@/lib/hyperliquid"
import { MARKETS, getMarket } from "@/lib/markets"

type FuturesMiniTickerWs = {
  s: string
  c: string
  o: string
  q: string
}

export type TickerPrices = Partial<Record<string, number>>

export type SymbolMarketStats = Binance24hStats

export type SymbolStatsMap = Partial<Record<string, SymbolMarketStats>>

export type FundingRatesMap = Partial<Record<string, number>>

const parseMiniToStats = (ticker: FuturesMiniTickerWs): SymbolMarketStats | null => {
  const lastPrice = Number(ticker.c)
  const openPrice = Number(ticker.o)
  const quoteVolume = Number(ticker.q)

  if (
    !Number.isFinite(lastPrice) ||
    lastPrice <= 0 ||
    !Number.isFinite(openPrice) ||
    openPrice <= 0 ||
    !Number.isFinite(quoteVolume)
  ) {
    return null
  }

  const changeAbs = lastPrice - openPrice
  const changePercent = (changeAbs / openPrice) * 100

  return {
    lastPrice,
    changeAbs,
    changePercent,
    quoteVolume,
  }
}

const hlNameToCanonical = (): Map<string, string> => {
  const map = new Map<string, string>()
  for (const m of MARKETS) {
    map.set(m.hlName, m.symbol)
  }
  return map
}

const mergeFundingRates = (
  universe: { name: string }[],
  assetCtxs: { funding?: string }[],
  target: FundingRatesMap,
  hlRev: Map<string, string>,
) => {
  for (let i = 0; i < universe.length && i < assetCtxs.length; i += 1) {
    const canonical = hlRev.get(universe[i].name)

    if (!canonical) {
      continue
    }

    const rate = Number(assetCtxs[i]?.funding)

    if (!Number.isFinite(rate)) {
      continue
    }

    target[canonical] = rate
  }
}

const binanceSymbolToCanonical = (): Map<string, string> => {
  const map = new Map<string, string>()
  for (const m of MARKETS) {
    if (m.priceSource === "binance-futures" && m.binanceSymbol) {
      map.set(m.binanceSymbol, m.symbol)
    }
  }
  return map
}

const extractHlMidsPayload = (msg: unknown): Record<string, string> | null => {
  if (typeof msg !== "object" || msg === null) {
    return null
  }

  const m = msg as Record<string, unknown>

  if (m.channel !== "allMids") {
    return null
  }

  const data = m.data

  if (data == null || typeof data !== "object") {
    return null
  }

  const d = data as Record<string, unknown>

  if (d.mids != null && typeof d.mids === "object" && d.mids !== null && !Array.isArray(d.mids)) {
    return d.mids as Record<string, string>
  }

  return null
}

export const useBinanceTicker = () => {
  const [prices, setPrices] = useState<TickerPrices>({})
  const [statsBySymbol, setStatsBySymbol] = useState<SymbolStatsMap>({})
  const [isConnected, setIsConnected] = useState(false)
  const [fundingRates, setFundingRates] = useState<FundingRatesMap>({})
  const xyzPrevDayRef = useRef<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    let binanceSocket: WebSocket | null = null
    let hlSocket: WebSocket | null = null
    let binanceRetryMs = 1000
    let hlRetryMs = 1000
    let binanceReconnectTimer: ReturnType<typeof setTimeout> | null = null
    let hlReconnectTimer: ReturnType<typeof setTimeout> | null = null
    const binanceRev = binanceSymbolToCanonical()
    const hlRev = hlNameToCanonical()

    const loadRestSnapshot = async () => {
      const [futuresMapResult, hlMainResult, hlXyzResult] = await Promise.allSettled([
        fetchAllFutures24hStats(),
        fetchHlMetaAndAssetCtxs(""),
        fetchHlMetaAndAssetCtxs("xyz"),
      ])

      if (cancelled) {
        return
      }

      const nextPrices: TickerPrices = {}
      const nextStats: SymbolStatsMap = {}

      if (futuresMapResult.status === "fulfilled") {
        const futuresMap = futuresMapResult.value

        for (const m of MARKETS) {
          if (m.priceSource !== "binance-futures" || !m.binanceSymbol) {
            continue
          }

          const row = futuresMap.get(m.binanceSymbol)

          if (!row) {
            continue
          }

          nextPrices[m.symbol] = row.lastPrice
          nextStats[m.symbol] = { ...row }
        }
      }

      const nextFundingRates: FundingRatesMap = {}

      if (hlMainResult.status === "fulfilled") {
        mergeFundingRates(hlMainResult.value.universe, hlMainResult.value.assetCtxs, nextFundingRates, hlRev)
      }

      if (hlXyzResult.status === "fulfilled") {
        const { universe, assetCtxs } = hlXyzResult.value
        mergeFundingRates(universe, assetCtxs, nextFundingRates, hlRev)

        for (let i = 0; i < universe.length && i < assetCtxs.length; i += 1) {
          const name = universe[i].name
          const market = getMarket(name)

          if (!market || market.priceSource !== "hyperliquid") {
            continue
          }

          const ctx = assetCtxs[i]
          const markPx = Number(ctx.markPx)
          const prevDayPx = Number(ctx.prevDayPx)
          const dayNtlVlm = Number(ctx.dayNtlVlm)

          if (!Number.isFinite(markPx) || markPx <= 0) {
            continue
          }

          xyzPrevDayRef.current[market.symbol] = Number.isFinite(prevDayPx) && prevDayPx > 0 ? prevDayPx : markPx

          const changeAbs = Number.isFinite(prevDayPx) && prevDayPx > 0 ? markPx - prevDayPx : 0
          const changePercent =
            Number.isFinite(prevDayPx) && prevDayPx > 0 ? ((markPx - prevDayPx) / prevDayPx) * 100 : 0
          const quoteVolume = Number.isFinite(dayNtlVlm) ? dayNtlVlm : 0

          nextPrices[market.symbol] = markPx
          nextStats[market.symbol] = {
            lastPrice: markPx,
            changeAbs,
            changePercent,
            quoteVolume,
          }
        }
      }

      setPrices((c) => ({ ...c, ...nextPrices }))
      setStatsBySymbol((c) => ({ ...c, ...nextStats }))
      if (Object.keys(nextFundingRates).length > 0) {
        setFundingRates((current) => ({ ...current, ...nextFundingRates }))
      }
    }

    void loadRestSnapshot()

    const handleBinanceMessage = (event: MessageEvent<string>) => {
      let payload: FuturesMiniTickerWs[]

      try {
        payload = JSON.parse(event.data) as FuturesMiniTickerWs[]
      } catch {
        return
      }

      if (!Array.isArray(payload)) {
        return
      }

      const nextPrices: TickerPrices = {}
      const nextStats: SymbolStatsMap = {}

      for (const ticker of payload) {
        const canonical = binanceRev.get(ticker.s)

        if (!canonical) {
          continue
        }

        const parsed = parseMiniToStats(ticker)

        if (!parsed) {
          continue
        }

        nextPrices[canonical] = parsed.lastPrice
        nextStats[canonical] = parsed
      }

      if (Object.keys(nextPrices).length === 0) {
        return
      }

      setPrices((current) => ({ ...current, ...nextPrices }))
      setStatsBySymbol((current) => ({ ...current, ...nextStats }))
    }

    const handleHlMessage = (event: MessageEvent<string>) => {
      let msg: unknown

      try {
        msg = JSON.parse(event.data) as unknown
      } catch {
        return
      }

      const mids = extractHlMidsPayload(msg)

      if (mids == null) {
        return
      }

      const nextPrices: TickerPrices = {}

      setStatsBySymbol((current) => {
        let next = { ...current }

        for (const m of MARKETS) {
          if (m.priceSource !== "hyperliquid" || !m.hlPriceKey) {
            continue
          }

          const raw = mids[m.hlPriceKey]
          const mid = Number(raw)

          if (!Number.isFinite(mid) || mid <= 0) {
            continue
          }

          const prev = xyzPrevDayRef.current[m.symbol]
          const changeAbs = prev != null && Number.isFinite(prev) && prev > 0 ? mid - prev : 0
          const changePercent = prev != null && Number.isFinite(prev) && prev > 0 ? ((mid - prev) / prev) * 100 : 0
          const prior = next[m.symbol] ?? current[m.symbol]
          const quoteVolume = prior?.quoteVolume ?? 0

          nextPrices[m.symbol] = mid
          next = {
            ...next,
            [m.symbol]: {
              lastPrice: mid,
              changeAbs,
              changePercent,
              quoteVolume,
            },
          }
        }

        return next
      })

      if (Object.keys(nextPrices).length > 0) {
        setPrices((current) => ({ ...current, ...nextPrices }))
      }
    }

    const connectBinance = () => {
      if (cancelled) {
        return
      }

      binanceSocket = new WebSocket("wss://fstream.binance.com/ws/!miniTicker@arr")
      binanceSocket.addEventListener("open", () => {
        binanceRetryMs = 1000
        setIsConnected(true)
      })
      binanceSocket.addEventListener("close", () => {
        setIsConnected(false)
        if (cancelled) {
          return
        }
        binanceReconnectTimer = setTimeout(connectBinance, binanceRetryMs)
        binanceRetryMs = Math.min(binanceRetryMs * 2, 10000)
      })
      binanceSocket.addEventListener("message", handleBinanceMessage)
    }

    const connectHyperliquid = () => {
      if (cancelled) {
        return
      }

      hlSocket = new WebSocket("wss://api.hyperliquid.xyz/ws")
      hlSocket.addEventListener("open", () => {
        hlRetryMs = 1000
        hlSocket?.send(
        JSON.stringify({
          method: "subscribe",
          subscription: { type: "allMids", dex: "xyz" },
        }),
      )
      })
      hlSocket.addEventListener("close", () => {
        if (cancelled) {
          return
        }
        hlReconnectTimer = setTimeout(connectHyperliquid, hlRetryMs)
        hlRetryMs = Math.min(hlRetryMs * 2, 10000)
      })
      hlSocket.addEventListener("message", handleHlMessage)
    }

    connectBinance()
    connectHyperliquid()

    return () => {
      cancelled = true
      if (binanceReconnectTimer) {
        clearTimeout(binanceReconnectTimer)
      }
      if (hlReconnectTimer) {
        clearTimeout(hlReconnectTimer)
      }
      binanceSocket?.close()
      hlSocket?.close()
    }
  }, [])

  return {
    prices,
    statsBySymbol,
    fundingRates,
    isConnected,
  }
}
