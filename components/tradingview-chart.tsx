"use client"

import { useEffect, useId, useRef } from "react"
import { getMarket } from "@/lib/markets"

let tvScriptPromise: Promise<void> | null = null

const ensureTradingViewScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }

  if (window.TradingView) {
    return Promise.resolve()
  }

  if (tvScriptPromise) {
    return tvScriptPromise
  }

  tvScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load TradingView script"))
    document.head.appendChild(script)
  })

  return tvScriptPromise
}

type TradingViewChartProps = {
  symbol: string
}

export const TradingViewChart = ({ symbol }: TradingViewChartProps) => {
  const baseId = useId().replace(/:/g, "")
  const containerId = `tv-${baseId}`
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<{ remove?: () => void } | null>(null)

  useEffect(() => {
    const parent = containerRef.current

    if (!parent) {
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        await ensureTradingViewScript()
      } catch {
        return
      }

      if (cancelled || !window.TradingView) {
        return
      }

      try {
        widgetRef.current?.remove?.()
      } catch {
        // same as effect cleanup — remove can throw if DOM is inconsistent
      }
      widgetRef.current = null

      parent.innerHTML = ""
      const mount = document.createElement("div")
      mount.id = containerId
      mount.className = "h-full min-h-[520px] w-full"
      parent.appendChild(mount)

      const tvSymbol = getMarket(symbol)?.tvSymbol ?? "BINANCE:BTCUSDT.P"

      const widget = new window.TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: false,
        container_id: containerId,
        hide_top_toolbar: false,
        hide_legend: false,
        hide_side_toolbar: false,
      })

      widgetRef.current = widget
    }

    void run()

    return () => {
      cancelled = true
      const widget = widgetRef.current
      widgetRef.current = null

      // TradingView's remove() walks iframe/container parent chains; during route
      // unmount those nodes can already be gone, which throws (parentNode on null).
      if (parent.isConnected) {
        try {
          widget?.remove?.()
        } catch {
          // ignore — DOM may already be torn down
        }
      }

      try {
        parent.innerHTML = ""
      } catch {
        // ignore
      }
    }
  }, [symbol, containerId])

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent-neon">Liquidation</p>
      <div
        ref={containerRef}
        className="min-h-[520px] w-full overflow-hidden rounded-xl border border-border bg-surface"
        role="region"
        aria-label="TradingView price chart"
      />
    </div>
  )
}
