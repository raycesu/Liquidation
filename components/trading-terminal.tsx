"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { OrderEntry } from "@/components/order-entry"
import { OpenPositions } from "@/components/open-positions"
import { TradingChart } from "@/components/trading-chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBinanceTicker } from "@/hooks/useBinanceTicker"
import { formatNumber, formatUsd } from "@/lib/format"
import { supportedSymbols, type Position, type SupportedSymbol } from "@/lib/types"

type TradingTerminalProps = {
  roomId: string
  participantId: string
  initialAvailableMargin: number
  initialPositions: Position[]
}

const symbolLabels: Record<SupportedSymbol, string> = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  SOLUSDT: "SOL",
}

export const TradingTerminal = ({
  roomId,
  participantId,
  initialAvailableMargin,
  initialPositions,
}: TradingTerminalProps) => {
  const [symbol, setSymbol] = useState<SupportedSymbol>("BTCUSDT")
  const [availableMargin, setAvailableMargin] = useState(initialAvailableMargin)
  const [positions, setPositions] = useState(initialPositions)
  const { prices, isConnected } = useBinanceTicker()
  const selectedPrice = prices[symbol]

  const openPositions = useMemo(() => positions.filter((position) => position.is_open), [positions])

  const handleOptimisticPosition = (position: Position) => {
    setPositions((currentPositions) => [position, ...currentPositions])
    setAvailableMargin((currentMargin) => Math.max(0, currentMargin - position.margin_allocated))
  }

  const handleOrderPlaced = (optimisticId: string, position: Position) => {
    setPositions((currentPositions) =>
      currentPositions.map((currentPosition) => (currentPosition.id === optimisticId ? position : currentPosition)),
    )
  }

  const handleOrderRejected = (optimisticId: string) => {
    setPositions((currentPositions) => {
      const rejectedPosition = currentPositions.find((position) => position.id === optimisticId)

      if (rejectedPosition) {
        setAvailableMargin((currentMargin) => currentMargin + rejectedPosition.margin_allocated)
      }

      return currentPositions.filter((position) => position.id !== optimisticId)
    })
  }

  const handlePositionClosed = (positionId: string) => {
    setPositions((currentPositions) => currentPositions.filter((position) => position.id !== positionId))
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent-neon">Trading terminal</p>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-text-primary">{symbolLabels[symbol]} Perp</h1>
              <Badge className={isConnected ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"}>
                {isConnected ? "Live" : "Connecting"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Card className="border-border bg-surface">
              <CardContent className="p-3">
                <p className="text-xs text-text-secondary">Mark price</p>
                <p className="font-mono text-xl text-text-primary">
                  {selectedPrice ? formatNumber(selectedPrice) : "--"}
                </p>
              </CardContent>
            </Card>
            <Button asChild variant="outline">
              <Link href={`/room/${roomId}`}>Lobby</Link>
            </Button>
          </div>
        </header>

        <Tabs value={symbol} onValueChange={(value) => setSymbol(value as SupportedSymbol)}>
          <TabsList className="bg-surface">
            {supportedSymbols.map((supportedSymbol) => (
              <TabsTrigger key={supportedSymbol} value={supportedSymbol}>
                {symbolLabels[supportedSymbol]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(360px,1fr)]">
          <div className="flex flex-col gap-4">
            <TradingChart symbol={symbol} />
            <OpenPositions
              roomId={roomId}
              positions={openPositions}
              prices={prices}
              onPositionClosed={handlePositionClosed}
            />
          </div>
          <div className="flex flex-col gap-4">
            <OrderEntry
              participantId={participantId}
              roomId={roomId}
              symbol={symbol}
              availableMargin={availableMargin}
              livePrice={selectedPrice}
              onOptimisticPosition={handleOptimisticPosition}
              onOrderPlaced={handleOrderPlaced}
              onOrderRejected={handleOrderRejected}
            />
            <Card className="border-border bg-surface">
              <CardContent className="space-y-2 p-5">
                <p className="text-sm text-text-secondary">Available margin</p>
                <p className="font-mono text-3xl text-text-primary">{formatUsd(availableMargin)}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}
