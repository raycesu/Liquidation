"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { OrderEntry } from "@/components/order-entry"
import { PositionsPanel } from "@/components/positions-panel"
import { TradingViewChart } from "@/components/tradingview-chart"
import { AssetSelector } from "@/components/asset-selector"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useBinanceTicker } from "@/hooks/useBinanceTicker"
import { formatCompactUsd, formatNumber, formatPercent } from "@/lib/format"
import { defaultMarketSymbol, getMarket } from "@/lib/markets"
import { cn } from "@/lib/utils"
import type { PendingOrder, Position, Trade } from "@/lib/types"
import type { CancelOrderResult } from "@/actions/cancel-order"
import type { ClosePositionResult } from "@/actions/close-position"
import type { PlaceOrderResult } from "@/actions/place-order"
import type { SetPositionTriggersResult } from "@/actions/set-position-triggers"

type TradingTerminalProps = {
  roomId: string
  participantId: string
  initialAvailableMargin: number
  initialPositions: Position[]
  initialPendingOrders: PendingOrder[]
  initialTrades: Trade[]
}

export const TradingTerminal = ({
  roomId,
  participantId,
  initialAvailableMargin,
  initialPositions,
  initialPendingOrders,
  initialTrades,
}: TradingTerminalProps) => {
  const [symbol, setSymbol] = useState(defaultMarketSymbol)
  const [availableMargin, setAvailableMargin] = useState(initialAvailableMargin)
  const [positions, setPositions] = useState(initialPositions)
  const [pendingOrders, setPendingOrders] = useState(initialPendingOrders)
  const [trades, setTrades] = useState(initialTrades)
  const { prices, statsBySymbol, isConnected } = useBinanceTicker()
  const selectedPrice = prices[symbol]
  const selectedStats = statsBySymbol[symbol]

  const openPositions = useMemo(() => positions.filter((position) => position.is_open), [positions])
  const activePendingOrders = useMemo(
    () => pendingOrders.filter((order) => order.status === "PENDING"),
    [pendingOrders],
  )

  const changeToneClass = useMemo(() => {
    if (selectedStats == null) {
      return "text-text-primary"
    }
    return selectedStats.changeAbs >= 0 ? "text-profit" : "text-loss"
  }, [selectedStats])

  const handleOptimisticPosition = (position: Position) => {
    setPositions((current) => [position, ...current])
    setAvailableMargin((current) => Math.max(0, current - position.margin_allocated))
  }

  const handleOrderPlaced = (optimisticId: string, payload: PlaceOrderResult) => {
    setPositions((current) =>
      current.map((position) => (position.id === optimisticId ? payload.position : position)),
    )
    setTrades((current) => [payload.trade, ...current])

    if (payload.triggers.length > 0) {
      setPendingOrders((current) => [...payload.triggers, ...current])
    }

    setAvailableMargin(payload.availableMargin)
  }

  const handleOrderRejected = (optimisticId: string) => {
    setPositions((current) => {
      const rejected = current.find((position) => position.id === optimisticId)

      if (rejected) {
        setAvailableMargin((margin) => margin + rejected.margin_allocated)
      }

      return current.filter((position) => position.id !== optimisticId)
    })
  }

  const handleLimitOrderPlaced = (order: PendingOrder, nextAvailableMargin: number) => {
    setPendingOrders((current) => [order, ...current])
    setAvailableMargin(nextAvailableMargin)
  }

  const handlePositionClosed = (payload: ClosePositionResult) => {
    setPositions((current) => current.filter((position) => position.id !== payload.positionId))
    setPendingOrders((current) =>
      current.map((order) =>
        order.position_id === payload.positionId && order.status === "PENDING"
          ? { ...order, status: "CANCELLED", cancelled_at: new Date().toISOString() }
          : order,
      ),
    )
    setTrades((current) => [payload.trade, ...current])
    setAvailableMargin(payload.availableMargin)
  }

  const handleTriggersUpdated = (payload: SetPositionTriggersResult) => {
    setPendingOrders((current) => {
      const stripped = current.filter(
        (order) =>
          !(
            order.position_id === payload.positionId &&
            order.status === "PENDING" &&
            (order.type === "TAKE_PROFIT" || order.type === "STOP_LOSS")
          ),
      )
      return [...payload.triggers, ...stripped]
    })
  }

  const handleOrderCancelled = (payload: CancelOrderResult) => {
    setPendingOrders((current) =>
      current.map((order) =>
        order.id === payload.orderId
          ? { ...order, status: "CANCELLED", cancelled_at: new Date().toISOString() }
          : order,
      ),
    )
    setAvailableMargin(payload.availableMargin)
  }

  const changeLabel =
    selectedStats == null
      ? "--"
      : `${selectedStats.changeAbs >= 0 ? "+" : ""}${formatNumber(selectedStats.changeAbs)} / ${selectedStats.changePercent >= 0 ? "+" : ""}${formatPercent(selectedStats.changePercent)}`

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <header className="flex flex-col gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent-neon">Trading terminal</p>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-text-primary">
                {getMarket(symbol)?.displayName ?? symbol} Perp
              </h1>
              <Badge className={isConnected ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"}>
                {isConnected ? "Live" : "Connecting"}
              </Badge>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border pb-4"
            role="toolbar"
            aria-label="Market and symbol controls"
          >
            <AssetSelector value={symbol} onChange={setSymbol} prices={prices} statsBySymbol={statsBySymbol} />

            <div className="hidden h-8 w-px bg-border sm:block" aria-hidden />

            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-secondary">Mark</p>
                <p className="font-mono text-base text-text-primary">
                  {selectedPrice != null ? `$${formatNumber(selectedPrice)}` : "--"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-secondary">24h change</p>
                <p className={cn("font-mono text-base", changeToneClass)}>{changeLabel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-secondary">24h volume</p>
                <p className="font-mono text-base text-text-primary">
                  {selectedStats != null ? formatCompactUsd(selectedStats.quoteVolume) : "--"}
                </p>
              </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center">
              <Button asChild variant="outline">
                <Link href={`/room/${roomId}`}>Lobby</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(360px,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <TradingViewChart symbol={symbol} />
            <PositionsPanel
              roomId={roomId}
              positions={openPositions}
              pendingOrders={activePendingOrders}
              trades={trades}
              prices={prices}
              onPositionClosed={handlePositionClosed}
              onTriggersUpdated={handleTriggersUpdated}
              onOrderCancelled={handleOrderCancelled}
            />
          </div>
          <div className="flex flex-col gap-4">
            <OrderEntry
              key={symbol}
              participantId={participantId}
              roomId={roomId}
              symbol={symbol}
              availableMargin={availableMargin}
              livePrice={selectedPrice}
              positions={openPositions}
              onOptimisticPosition={handleOptimisticPosition}
              onOrderPlaced={handleOrderPlaced}
              onOrderRejected={handleOrderRejected}
              onLimitOrderPlaced={handleLimitOrderPlaced}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
