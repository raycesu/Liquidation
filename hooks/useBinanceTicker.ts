"use client"

import { useEffect, useState } from "react"
import { fetchSpotPrices } from "@/lib/binance"
import { supportedSymbols, type SupportedSymbol } from "@/lib/types"

type BinanceTickerMessage = {
  s: string
  c: string
}

export type TickerPrices = Partial<Record<SupportedSymbol, number>>

export const useBinanceTicker = () => {
  const [prices, setPrices] = useState<TickerPrices>({})
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadRestSnapshot = async () => {
      try {
        const snapshot = await fetchSpotPrices([...supportedSymbols])
        if (cancelled) {
          return
        }

        setPrices((current) => {
          const next: TickerPrices = { ...current }
          for (const sym of supportedSymbols) {
            const value = snapshot[sym]
            if (value == null) {
              continue
            }
            if (next[sym] == null) {
              next[sym] = value
            }
          }
          return next
        })
      } catch {
        // WebSocket updates may still arrive; user can rely on same REST path as the server
      }
    }

    void loadRestSnapshot()

    const socket = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr")

    socket.addEventListener("open", () => {
      setIsConnected(true)
    })

    socket.addEventListener("close", () => {
      setIsConnected(false)
    })

    socket.addEventListener("message", (event: MessageEvent<string>) => {
      let payload: BinanceTickerMessage[]

      try {
        payload = JSON.parse(event.data) as BinanceTickerMessage[]
      } catch {
        return
      }

      const nextPrices: TickerPrices = {}

      payload.forEach((ticker) => {
        if (!supportedSymbols.includes(ticker.s as SupportedSymbol)) {
          return
        }

        const price = Number(ticker.c)

        if (!Number.isFinite(price) || price <= 0) {
          return
        }

        nextPrices[ticker.s as SupportedSymbol] = price
      })

      if (Object.keys(nextPrices).length === 0) {
        return
      }

      setPrices((currentPrices) => ({
        ...currentPrices,
        ...nextPrices,
      }))
    })

    return () => {
      cancelled = true
      socket.close()
    }
  }, [])

  return {
    prices,
    isConnected,
  }
}
