"use client"

import { ChevronDown } from "lucide-react"
import { useMemo, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { placeLimitOrder } from "@/actions/place-limit-order"
import { placeOrder } from "@/actions/place-order"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { formatNumber, formatUsd } from "@/lib/format"
import { getMarket, getMaxLeverage } from "@/lib/markets"
import { calculateLiquidationPrice, calculateRequiredMargin } from "@/lib/perpetuals"
import type { PendingOrder, Position, PositionSide, SupportedSymbol, Trade } from "@/lib/types"

type OrderEntryProps = {
  participantId: string
  roomId: string
  symbol: SupportedSymbol
  availableMargin: number
  livePrice: number | undefined
  positions: Position[]
  onOptimisticPosition: (position: Position) => void
  onOrderPlaced: (
    optimisticId: string,
    payload: {
      position: Position
      trade: Trade
      triggers: PendingOrder[]
      availableMargin: number
    },
  ) => void
  onOrderRejected: (optimisticId: string) => void
  onLimitOrderPlaced: (order: PendingOrder, availableMargin: number) => void
}

type OrderType = "MARKET" | "LIMIT"

const sizeStops = [0, 25, 50, 75, 100]
const sizeTrackMarkers = [25, 50, 75]

const aggregatePosition = (positions: Position[], symbol: SupportedSymbol) => {
  let netSize = 0

  for (const position of positions) {
    if (position.symbol !== symbol || !position.is_open) {
      continue
    }

    netSize += position.side === "LONG" ? position.size : -position.size
  }

  return netSize
}

export const OrderEntry = ({
  participantId,
  roomId,
  symbol,
  availableMargin,
  livePrice,
  positions,
  onOptimisticPosition,
  onOrderPlaced,
  onOrderRejected,
  onLimitOrderPlaced,
}: OrderEntryProps) => {
  const [orderType, setOrderType] = useState<OrderType>("MARKET")
  const [side, setSide] = useState<PositionSide>("LONG")
  const maxLev = getMaxLeverage(symbol)
  const [leverage, setLeverage] = useState(() => Math.min(5, getMaxLeverage(symbol)))
  const [sizeUsd, setSizeUsd] = useState("1000")
  const [sizeUnit, setSizeUnit] = useState<"USD" | "BASE">("USD")
  const [sizePercent, setSizePercent] = useState(0)
  const [tpSlEnabled, setTpSlEnabled] = useState(false)
  const [tpPrice, setTpPrice] = useState("")
  const [tpGainPercent, setTpGainPercent] = useState("")
  const [slPrice, setSlPrice] = useState("")
  const [slLossPercent, setSlLossPercent] = useState("")
  const [limitPrice, setLimitPrice] = useState("")
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const submitInFlightRef = useRef(false)

  const baseSymbol = getMarket(symbol)?.base ?? symbol
  const numericSize = Number(sizeUsd)
  const numericLimitPrice = Number(limitPrice)
  const numericTpPrice = Number(tpPrice)
  const numericSlPrice = Number(slPrice)

  const previewEntryPrice = useMemo(() => {
    if (orderType === "LIMIT" && Number.isFinite(numericLimitPrice) && numericLimitPrice > 0) {
      return numericLimitPrice
    }

    return livePrice ?? null
  }, [livePrice, numericLimitPrice, orderType])

  const requiredMargin = useMemo(() => {
    if (!Number.isFinite(numericSize) || numericSize <= 0) {
      return 0
    }

    return calculateRequiredMargin(numericSize, leverage)
  }, [leverage, numericSize])

  const liquidationPreview = useMemo(() => {
    if (!previewEntryPrice || requiredMargin <= 0) {
      return null
    }

    return calculateLiquidationPrice({
      entryPrice: previewEntryPrice,
      leverage,
      side,
    })
  }, [leverage, previewEntryPrice, requiredMargin, side])

  const currentNetSize = useMemo(() => aggregatePosition(positions, symbol), [positions, symbol])
  const currentSide: PositionSide | null =
    currentNetSize > 0 ? "LONG" : currentNetSize < 0 ? "SHORT" : null
  const handleSelectOrderType = (type: OrderType) => {
    setOrderType(type)

    if (type === "LIMIT" && limitPrice === "" && livePrice && livePrice > 0) {
      setLimitPrice(livePrice.toFixed(2))
    }
  }

  const baseSizeDisplay = useMemo(() => {
    if (!previewEntryPrice || !Number.isFinite(numericSize) || numericSize <= 0) {
      return "0"
    }

    return (numericSize / previewEntryPrice).toFixed(6)
  }, [numericSize, previewEntryPrice])

  const handleSizeUsdChange = (value: string) => {
    setSizeUsd(value)
    setSizePercent(0)
  }

  const handleBaseSizeChange = (value: string) => {
    if (!previewEntryPrice) {
      return
    }

    const baseAmount = Number(value)

    if (!Number.isFinite(baseAmount)) {
      setSizeUsd("0")
      return
    }

    setSizeUsd((baseAmount * previewEntryPrice).toFixed(2))
    setSizePercent(0)
  }

  const handleSizePercentChange = (percent: number) => {
    setSizePercent(percent)
    const buyingPower = availableMargin * leverage
    const target = (buyingPower * percent) / 100
    setSizeUsd(target.toFixed(2))
  }

  const handleTpPriceChange = (value: string) => {
    setTpPrice(value)
    const numeric = Number(value)

    if (!previewEntryPrice || !Number.isFinite(numeric) || numeric <= 0) {
      setTpGainPercent("")
      return
    }

    const gain =
      side === "LONG"
        ? ((numeric - previewEntryPrice) / previewEntryPrice) * 100 * leverage
        : ((previewEntryPrice - numeric) / previewEntryPrice) * 100 * leverage
    setTpGainPercent(gain.toFixed(2))
  }

  const handleTpGainChange = (value: string) => {
    setTpGainPercent(value)
    const numeric = Number(value)

    if (!previewEntryPrice || !Number.isFinite(numeric)) {
      setTpPrice("")
      return
    }

    const move = (numeric / 100) * (previewEntryPrice / leverage)
    const target = side === "LONG" ? previewEntryPrice + move : previewEntryPrice - move
    setTpPrice(target.toFixed(2))
  }

  const handleSlPriceChange = (value: string) => {
    setSlPrice(value)
    const numeric = Number(value)

    if (!previewEntryPrice || !Number.isFinite(numeric) || numeric <= 0) {
      setSlLossPercent("")
      return
    }

    const loss =
      side === "LONG"
        ? ((previewEntryPrice - numeric) / previewEntryPrice) * 100 * leverage
        : ((numeric - previewEntryPrice) / previewEntryPrice) * 100 * leverage
    setSlLossPercent(loss.toFixed(2))
  }

  const handleSlLossChange = (value: string) => {
    setSlLossPercent(value)
    const numeric = Number(value)

    if (!previewEntryPrice || !Number.isFinite(numeric)) {
      setSlPrice("")
      return
    }

    const move = (numeric / 100) * (previewEntryPrice / leverage)
    const target = side === "LONG" ? previewEntryPrice - move : previewEntryPrice + move
    setSlPrice(target.toFixed(2))
  }

  const handleSubmit = () => {
    if (submitInFlightRef.current || isSubmitting || isPending) {
      return
    }

    submitInFlightRef.current = true
    setIsSubmitting(true)
    setInlineError(null)

    if (!previewEntryPrice || previewEntryPrice <= 0) {
      submitInFlightRef.current = false
      setIsSubmitting(false)
      setInlineError(
        orderType === "LIMIT" ? "Enter a valid limit price." : "Waiting for live market price.",
      )
      return
    }

    if (!Number.isFinite(numericSize) || numericSize <= 0) {
      setInlineError("Enter a positive position size.")
      submitInFlightRef.current = false
      setIsSubmitting(false)
      return
    }

    if (availableMargin < requiredMargin) {
      setInlineError("Insufficient margin.")
      submitInFlightRef.current = false
      setIsSubmitting(false)
      return
    }

    const tpValue = tpSlEnabled && tpPrice !== "" ? numericTpPrice : null
    const slValue = tpSlEnabled && slPrice !== "" ? numericSlPrice : null

    if (orderType === "LIMIT") {
      startTransition(async () => {
        try {
        const result = await placeLimitOrder({
          participantId,
          roomId,
          symbol,
          side,
          leverage,
          size: numericSize,
          limitPrice: numericLimitPrice,
        })

        if (!result.ok) {
          toast.error(result.error)
          setInlineError(result.error)
          return
        }

        onLimitOrderPlaced(result.data.order, result.data.availableMargin)
        toast.success(`Limit ${side === "LONG" ? "buy" : "sell"} ${baseSymbol} placed`)
        setSizePercent(0)
        } finally {
          submitInFlightRef.current = false
          setIsSubmitting(false)
        }
      })
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
      entry_price: previewEntryPrice,
      liquidation_price: calculateLiquidationPrice({
        entryPrice: previewEntryPrice,
        leverage,
        side,
      }),
      is_open: true,
      created_at: new Date().toISOString(),
      closed_at: null,
    }

    onOptimisticPosition(optimisticPosition)

    startTransition(async () => {
      try {
      const result = await placeOrder({
        participantId,
        roomId,
        symbol,
        side,
        leverage,
        size: numericSize,
        takeProfitPrice: tpValue,
        stopLossPrice: slValue,
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
      toast.success(`${side} ${baseSymbol} opened`)
      setSizePercent(0)
      } finally {
        submitInFlightRef.current = false
        setIsSubmitting(false)
      }
    })
  }

  const submitLabel = orderType === "LIMIT" ? "Place Limit Order" : `${side === "LONG" ? "Buy / Long" : "Sell / Short"} ${baseSymbol}`
  const orderValue = Number.isFinite(numericSize) && numericSize > 0 ? numericSize : 0

  return (
    <Card className="border-border/70 bg-surface/90 shadow-2xl shadow-background/30 backdrop-blur">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-6 border-b border-border/60">
          {(["MARKET", "LIMIT"] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-label={`${type.toLowerCase()} order type`}
              onClick={() => handleSelectOrderType(type)}
              className={cn(
                "relative pb-3 pt-1 text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
                orderType === type
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {type}
              {orderType === type ? (
                <span className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-accent-neon" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/70 bg-background/50 p-1">
          <button
            type="button"
            aria-label="Buy long"
            onClick={() => setSide("LONG")}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              side === "LONG"
                ? "bg-profit/15 text-profit ring-1 ring-profit/20"
                : "text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary",
            )}
          >
            Buy / Long
          </button>
          <button
            type="button"
            aria-label="Sell short"
            onClick={() => setSide("SHORT")}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              side === "SHORT"
                ? "bg-loss/15 text-loss ring-1 ring-loss/20"
                : "text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary",
            )}
          >
            Sell / Short
          </button>
        </div>

        {inlineError ? (
          <Alert variant="destructive">
            <AlertDescription>{inlineError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary">Available to Trade</span>
            <span className="font-mono text-text-primary">{formatUsd(availableMargin)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary">Current Position</span>
            <span className="font-mono text-text-primary">
              {currentNetSize === 0 ? `0.00 ${baseSymbol}` : (
                <span className={currentSide === "LONG" ? "text-profit" : "text-loss"}>
                  {Math.abs(currentNetSize).toFixed(2)} USD {currentSide}
                </span>
              )}
            </span>
          </div>
        </div>

        {orderType === "LIMIT" ? (
          <div className="space-y-1.5">
            <label htmlFor="limit-price" className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary">
              Limit Price (USD)
            </label>
            <Input
              id="limit-price"
              value={limitPrice}
              type="number"
              min="0"
              step="0.01"
              onChange={(event) => setLimitPrice(event.target.value)}
              className="h-11 border-border/70 bg-background/60 font-mono text-text-primary shadow-inner shadow-background/30"
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <div className="relative">
            <label htmlFor="size" className="absolute left-3 top-2 text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary">
              Size
            </label>
            <Input
              id="size"
              value={sizeUnit === "USD" ? sizeUsd : baseSizeDisplay}
              min="0"
              step="0.01"
              type="number"
              onChange={(event) =>
                sizeUnit === "USD"
                  ? handleSizeUsdChange(event.target.value)
                  : handleBaseSizeChange(event.target.value)
              }
              className="h-12 border-border/70 bg-background/60 pl-14 pr-20 text-right font-mono text-text-primary shadow-inner shadow-background/30"
            />
            <button
              type="button"
              aria-label="Toggle size unit"
              onClick={() => setSizeUnit(sizeUnit === "USD" ? "BASE" : "USD")}
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 border-l border-border/70 pl-3 text-xs font-medium text-text-primary transition-colors hover:text-accent-neon"
            >
              {sizeUnit === "USD" ? "USD" : baseSymbol}
              <ChevronDown className="size-3" />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-2">
            <div className="relative rounded-lg border border-border/60 bg-background/35 p-1 shadow-inner shadow-background/40">
              <Slider
                min={0}
                max={100}
                step={1}
                value={[sizePercent]}
                onValueChange={(value) => handleSizePercentChange(value[0] ?? 0)}
                aria-label="Size percent of buying power"
                className={cn(
                  "h-8 [&_[data-slot=slider-range]]:rounded-md [&_[data-slot=slider-thumb]]:h-8 [&_[data-slot=slider-thumb]]:w-1.5 [&_[data-slot=slider-thumb]]:rounded-[3px] [&_[data-slot=slider-thumb]]:border [&_[data-slot=slider-thumb]]:border-background/70 [&_[data-slot=slider-thumb]]:shadow-lg [&_[data-slot=slider-track]]:h-7 [&_[data-slot=slider-track]]:rounded-md [&_[data-slot=slider-track]]:border [&_[data-slot=slider-track]]:border-border/70 [&_[data-slot=slider-track]]:bg-surface-elevated/30",
                  side === "LONG"
                    ? "[&_[data-slot=slider-range]]:bg-profit/45 [&_[data-slot=slider-thumb]]:bg-profit [&_[data-slot=slider-thumb]]:shadow-profit/35"
                    : "[&_[data-slot=slider-range]]:bg-loss/45 [&_[data-slot=slider-thumb]]:bg-loss [&_[data-slot=slider-thumb]]:shadow-loss/35",
                )}
              />
              <div className="pointer-events-none absolute inset-x-1 top-1/2 flex -translate-y-1/2 justify-between px-[25%]">
                {sizeTrackMarkers.map((marker) => (
                  <span key={marker} className="h-4 w-px rounded-full bg-text-primary/25" />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-1 text-[11px] font-medium text-text-secondary">
              {sizeStops.map((stop) => (
                <button
                  key={stop}
                  type="button"
                  aria-label={`Set size to ${stop}%`}
                  onClick={() => handleSizePercentChange(stop)}
                  className="transition-colors hover:text-text-primary"
                >
                  {stop}%
                </button>
              ))}
            </div>
          </div>
          <div className="relative w-20">
            <Input
              value={sizePercent}
              type="number"
              min="0"
              max="100"
              onChange={(event) => handleSizePercentChange(Number(event.target.value) || 0)}
              className="h-10 border-border/70 bg-background/60 pr-6 text-right font-mono text-text-primary shadow-inner shadow-background/30"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-secondary">%</span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <label className="group flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={tpSlEnabled}
              onChange={(event) => setTpSlEnabled(event.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "grid size-6 place-items-center rounded-md border transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-accent-neon/40",
                tpSlEnabled
                  ? "border-accent-neon bg-accent-neon shadow-sm shadow-accent-neon/25"
                  : "border-border/80 bg-background/70 group-hover:border-accent-neon/70",
              )}
            >
              <span
                className={cn(
                  "grid size-4 place-items-center rounded-[4px] transition-colors",
                  tpSlEnabled ? "bg-background/95" : "bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "size-2.5 rounded-[2px] border transition-colors",
                    tpSlEnabled
                      ? "border-accent-neon bg-accent-neon"
                      : "border-transparent bg-transparent",
                  )}
                />
              </span>
            </span>
            <span className="font-medium text-text-primary">Take Profit / Stop Loss</span>
          </label>

          {tpSlEnabled ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="TP Price"
                  value={tpPrice}
                  type="number"
                  min="0"
                  step="0.01"
                  onChange={(event) => handleTpPriceChange(event.target.value)}
                  className="h-10 border-border/70 bg-background/60 font-mono text-text-primary shadow-inner shadow-background/30"
                />
                <div className="relative">
                  <Input
                    placeholder="Gain"
                    value={tpGainPercent}
                    type="number"
                    onChange={(event) => handleTpGainChange(event.target.value)}
                    className="h-10 border-border/70 bg-background/60 pr-7 font-mono text-text-primary shadow-inner shadow-background/30"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-secondary">%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="SL Price"
                  value={slPrice}
                  type="number"
                  min="0"
                  step="0.01"
                  onChange={(event) => handleSlPriceChange(event.target.value)}
                  className="h-10 border-border/70 bg-background/60 font-mono text-text-primary shadow-inner shadow-background/30"
                />
                <div className="relative">
                  <Input
                    placeholder="Loss"
                    value={slLossPercent}
                    type="number"
                    onChange={(event) => handleSlLossChange(event.target.value)}
                    className="h-10 border-border/70 bg-background/60 pr-7 font-mono text-text-primary shadow-inner shadow-background/30"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-secondary">%</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary">Leverage</span>
            <span className="font-mono text-xs text-accent-neon">{leverage}x</span>
          </div>
          <Slider
            min={1}
            max={maxLev}
            step={1}
            value={[Math.min(leverage, maxLev)]}
            onValueChange={(value) => setLeverage(value[0] ?? 1)}
            aria-label="Leverage"
            className="[&_[data-slot=slider-range]]:bg-accent-neon/80 [&_[data-slot=slider-thumb]]:border-accent-neon [&_[data-slot=slider-thumb]]:shadow-lg [&_[data-slot=slider-thumb]]:shadow-accent-neon/20 [&_[data-slot=slider-track]]:bg-background/75"
          />
        </div>

        <Button
          type="button"
          disabled={isSubmitting || isPending}
          onClick={handleSubmit}
          className={cn(
            "h-11 w-full rounded-lg text-sm font-semibold shadow-lg transition-all",
            side === "LONG"
              ? "bg-profit text-background shadow-profit/15 hover:bg-profit/90"
              : "bg-loss text-text-primary shadow-loss/15 hover:bg-loss/90",
          )}
        >
          {submitLabel}
        </Button>

        {orderType === "MARKET" ? (
          <p className="text-[10px] leading-relaxed text-text-secondary">
            Fills use the server mark at execution time, which may differ slightly from the live chart price.
          </p>
        ) : null}

        <div className="space-y-2 rounded-xl border border-border/70 bg-background/35 p-3 text-sm shadow-inner shadow-background/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary">Liquidation Price</span>
            <span className="font-mono text-text-primary">
              {liquidationPreview ? formatNumber(liquidationPreview) : "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary">Order Value</span>
            <span className="font-mono text-text-primary">
              {orderValue > 0 ? formatUsd(orderValue) : "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary">Margin Required</span>
            <span className="font-mono text-text-primary">
              {requiredMargin > 0 ? formatUsd(requiredMargin) : "N/A"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
