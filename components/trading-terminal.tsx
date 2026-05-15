"use client"

import Link from "next/link"
import { useCallback, useMemo, useState, type ReactNode } from "react"
import type { CheckPendingOrdersResult } from "@/actions/check-pending-orders"
import type { LiquidateRoomResult } from "@/actions/liquidate"
import { OrderEntry } from "@/components/order-entry"
import { PositionsPanel } from "@/components/positions-panel"
import { TradingViewChart } from "@/components/tradingview-chart"
import { AssetSelector } from "@/components/asset-selector"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useBinanceTicker } from "@/hooks/useBinanceTicker"
import { useTradingEngineSync } from "@/hooks/useTradingEngineSync"
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

type MarketMetricProps = {
  label: string
  value: ReactNode
  valueClassName?: string
}

const MarketMetric = ({ label, value, valueClassName }: MarketMetricProps) => {
  return (
    <div className="min-w-[7.5rem] rounded-lg border border-border/70 bg-surface-elevated/70 px-2.5 py-1.5 shadow-lg shadow-accent-blue/5">
      <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-text-secondary">{label}</p>
      <p className={cn("mt-0.5 font-mono text-xs text-text-primary", valueClassName)}>{value}</p>
    </div>
  )
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
  const selectedMarket = getMarket(symbol)
  const marketDisplayName = selectedMarket?.displayName ?? symbol

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

  const handleOrdersSynced = useCallback((result: CheckPendingOrdersResult) => {
    if (result.availableMargin != null) {
      setAvailableMargin(result.availableMargin)
    }

    if (result.newPositions.length > 0) {
      setPositions((current) => [...result.newPositions, ...current])
    }

    if (result.closedPositionIds.length > 0) {
      const closedSet = new Set(result.closedPositionIds)
      setPositions((current) => current.filter((position) => !closedSet.has(position.id)))
    }

    if (result.filledOrderIds.length > 0 || result.cancelledOrderIds.length > 0) {
      const filledSet = new Set(result.filledOrderIds)
      const cancelledSet = new Set(result.cancelledOrderIds)
      const now = new Date().toISOString()

      setPendingOrders((current) =>
        current.map((order) => {
          if (filledSet.has(order.id)) {
            return { ...order, status: "FILLED", filled_at: now }
          }

          if (cancelledSet.has(order.id)) {
            return { ...order, status: "CANCELLED", cancelled_at: now }
          }

          return order
        }),
      )
    }

    if (result.trades.length > 0) {
      setTrades((current) => [...result.trades, ...current])
    }
  }, [])

  const handleLiquidationSynced = useCallback((result: LiquidateRoomResult) => {
    if (result.availableMargin != null) {
      setAvailableMargin(result.availableMargin)
    }

    if (result.liquidatedPositionIds.length === 0) {
      return
    }

    const liquidatedSet = new Set(result.liquidatedPositionIds)
    const now = new Date().toISOString()

    setPositions((current) => current.filter((position) => !liquidatedSet.has(position.id)))
    setPendingOrders((current) =>
      current.map((order) =>
        order.position_id && liquidatedSet.has(order.position_id) && order.status === "PENDING"
          ? { ...order, status: "CANCELLED", cancelled_at: now }
          : order,
      ),
    )
  }, [])

  useTradingEngineSync({
    roomId,
    onOrdersSynced: handleOrdersSynced,
    onLiquidationSynced: handleLiquidationSynced,
  })

  const changeLabel =
    selectedStats == null
      ? "--"
      : `${selectedStats.changeAbs >= 0 ? "+" : ""}${formatNumber(selectedStats.changeAbs)} / ${selectedStats.changePercent >= 0 ? "+" : ""}${formatPercent(selectedStats.changePercent)}`

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-2 py-2 sm:px-3 sm:py-3">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(23,201,255,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(10,140,255,0.13),transparent_30%),linear-gradient(180deg,rgba(7,23,42,0.92)_0%,rgba(3,9,20,1)_62%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-3">
        <header className="rounded-xl border border-border/70 bg-surface/80 p-3 shadow-2xl shadow-accent-blue/10 backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="bg-gradient-to-r from-accent-neon via-primary to-text-primary bg-clip-text font-heading text-[10px] font-semibold uppercase tracking-[0.28em] text-transparent">
                Trading Terminal
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-text-primary sm:text-3xl">
                  {marketDisplayName} Perp
                </h1>
                <Badge
                  className={cn(
                    "border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
                    isConnected
                      ? "border-profit/30 bg-profit/10 text-profit hover:bg-profit/10"
                      : "border-loss/30 bg-loss/10 text-loss hover:bg-loss/10",
                  )}
                >
                  {isConnected ? "Live" : "Connecting"}
                </Badge>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="h-9 w-fit border-border/70 bg-surface-elevated/70 px-3 text-sm text-text-primary shadow-lg shadow-accent-blue/5 hover:border-accent-neon/60 hover:bg-surface-elevated"
            >
              <Link href={`/room/${roomId}`}>Lobby</Link>
            </Button>
          </div>

          <div
            className="mt-3 flex flex-wrap items-stretch gap-2 border-t border-border/60 pt-3"
            role="toolbar"
            aria-label="Market and symbol controls"
          >
            <AssetSelector value={symbol} onChange={setSymbol} prices={prices} statsBySymbol={statsBySymbol} />

            <MarketMetric
              label="Mark"
              value={selectedPrice != null ? `$${formatNumber(selectedPrice)}` : "--"}
            />
            <MarketMetric label="24h Change" value={changeLabel} valueClassName={changeToneClass} />
            <MarketMetric
              label="24h Volume"
              value={selectedStats != null ? formatCompactUsd(selectedStats.quoteVolume) : "--"}
            />
          </div>
        </header>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(360px,1fr)]">
          <div className="flex min-w-0 flex-col gap-3">
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
          <div className="flex flex-col gap-3">
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
