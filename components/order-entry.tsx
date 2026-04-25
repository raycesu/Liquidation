"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { placeOrder } from "@/actions/place-order"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { formatUsd } from "@/lib/format"
import { calculateLiquidationPrice, calculateRequiredMargin } from "@/lib/perpetuals"
import type { Position, PositionSide, SupportedSymbol } from "@/lib/types"

type OrderEntryProps = {
  participantId: string
  roomId: string
  symbol: SupportedSymbol
  availableMargin: number
  livePrice: number | undefined
  onOptimisticPosition: (position: Position) => void
  onOrderPlaced: (optimisticId: string, position: Position) => void
  onOrderRejected: (optimisticId: string) => void
}

export const OrderEntry = ({
  participantId,
  roomId,
  symbol,
  availableMargin,
  livePrice,
  onOptimisticPosition,
  onOrderPlaced,
  onOrderRejected,
}: OrderEntryProps) => {
  const [leverage, setLeverage] = useState(5)
  const [size, setSize] = useState("1000")
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const numericSize = Number(size)

  const requiredMargin = useMemo(() => {
    if (!Number.isFinite(numericSize) || numericSize <= 0) {
      return 0
    }

    return calculateRequiredMargin(numericSize, leverage)
  }, [leverage, numericSize])

  const handleSubmit = (side: PositionSide) => {
    setInlineError(null)

    if (livePrice == null || !Number.isFinite(livePrice) || livePrice <= 0) {
      setInlineError("Waiting for live market price.")
      return
    }

    if (!Number.isFinite(numericSize) || numericSize <= 0) {
      setInlineError("Enter a positive position size.")
      return
    }

    if (availableMargin < requiredMargin) {
      setInlineError("Insufficient margin.")
      return
    }

    const optimisticId = `optimistic-${crypto.randomUUID()}`
    const optimisticPosition: Position = {
      id: optimisticId,
      participant_id: participantId,
      symbol,
      side,
      leverage,
      size: numericSize,
      margin_allocated: requiredMargin,
      entry_price: livePrice,
      liquidation_price: calculateLiquidationPrice({
        entryPrice: livePrice,
        leverage,
        side,
      }),
      is_open: true,
      created_at: new Date().toISOString(),
      closed_at: null,
    }

    onOptimisticPosition(optimisticPosition)

    startTransition(async () => {
      const result = await placeOrder({
        participantId,
        roomId,
        symbol,
        side,
        leverage,
        size: numericSize,
      })

      if (!result.ok) {
        onOrderRejected(optimisticId)

        if (result.error === "Insufficient margin.") {
          setInlineError(result.error)
          return
        }

        toast.error(result.error)
        return
      }

      onOrderPlaced(optimisticId, result.data)
      toast.success(`${side} ${symbol} opened`)
    })
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle className="text-text-primary">Order entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {inlineError ? (
          <Alert variant="destructive">
            <AlertDescription>{inlineError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="size">Position size (USD)</Label>
          <Input
            id="size"
            value={size}
            min="1"
            step="1"
            type="number"
            onChange={(event) => setSize(event.target.value)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Leverage</Label>
            <span className="font-mono text-accent-neon">{leverage}x</span>
          </div>
          <Slider
            min={1}
            max={20}
            step={1}
            value={[leverage]}
            onValueChange={(value) => setLeverage(value[0] ?? 5)}
            aria-label="Leverage"
          />
        </div>

        <div className="rounded-lg border border-border bg-surface-elevated p-4">
          <p className="text-sm text-text-secondary">Required margin</p>
          <p className="mt-1 font-mono text-2xl text-text-primary">{formatUsd(requiredMargin)}</p>
          <p className="mt-2 text-xs text-text-secondary">Available: {formatUsd(availableMargin)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            className="bg-profit text-background hover:bg-profit/90"
            disabled={isPending}
            type="button"
            onClick={() => handleSubmit("LONG")}
          >
            Long
          </Button>
          <Button
            className="bg-loss text-text-primary hover:bg-loss/90"
            disabled={isPending}
            type="button"
            onClick={() => handleSubmit("SHORT")}
          >
            Short
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
