"use client"

import { useEffect, useRef, useState } from "react"
import { CandlestickSeries, createChart, type IChartApi, type UTCTimestamp } from "lightweight-charts"
import { Skeleton } from "@/components/ui/skeleton"
import type { SupportedSymbol } from "@/lib/types"

type TradingChartProps = {
  symbol: SupportedSymbol
}

type BinanceKlineTuple = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
]

export const TradingChart = ({ symbol }: TradingChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const styles = getComputedStyle(document.documentElement)
    const surface = styles.getPropertyValue("--surface").trim()
    const border = styles.getPropertyValue("--border").trim()
    const textSecondary = styles.getPropertyValue("--text-secondary").trim()
    const green = styles.getPropertyValue("--green").trim()
    const red = styles.getPropertyValue("--red").trim()

    const chart = createChart(container, {
      height: 520,
      layout: {
        background: { color: surface },
        textColor: textSecondary,
      },
      grid: {
        vertLines: { color: border },
        horzLines: { color: border },
      },
      rightPriceScale: {
        borderColor: border,
      },
      timeScale: {
        borderColor: border,
      },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: green,
      downColor: red,
      borderUpColor: green,
      borderDownColor: red,
      wickUpColor: green,
      wickDownColor: red,
    })

    chartRef.current = chart
    setIsLoading(true)

    const handleResize = () => {
      chart.applyOptions({
        width: container.clientWidth,
      })
    }

    const loadKlines = async () => {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=200`,
      )

      if (!response.ok) {
        setIsLoading(false)
        return
      }

      const klines = (await response.json()) as BinanceKlineTuple[]
      candleSeries.setData(
        klines.map((kline) => ({
          time: Math.floor(kline[0] / 1000) as UTCTimestamp,
          open: Number(kline[1]),
          high: Number(kline[2]),
          low: Number(kline[3]),
          close: Number(kline[4]),
        })),
      )
      chart.timeScale().fitContent()
      setIsLoading(false)
    }

    handleResize()
    void loadKlines()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
      chartRef.current = null
    }
  }, [symbol])

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-xl border border-border bg-surface">
      {isLoading ? <Skeleton className="absolute inset-0 z-10 bg-surface-elevated" /> : null}
      <div ref={containerRef} className="h-[520px] w-full" />
    </div>
  )
}
