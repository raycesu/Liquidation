"use client"

import { CircleHelp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatNumber } from "@/lib/format"
import { MAKER_FEE_BPS, TAKER_FEE_BPS } from "@/lib/trading-fees"
import type { SupportedSymbol } from "@/lib/types"

const FUNDING_HELP_TEXT =
  "Funding is applied hourly (UTC) using Hyperliquid rates for each market. When the rate is positive, longs pay and shorts receive. Funding is deducted from or credited to each position's isolated margin and can move your liquidation price. At most one funding tick is applied per hour per position (missed hours are not backfilled). Liquidations have no trading fee."

type TradingFeesDisclaimerProps = {
  symbol: SupportedSymbol
  fundingRate: number | undefined
}

const formatHourlyFundingPercent = (rate: number) => `${formatNumber(rate * 100, 4)}%`

export const TradingFeesDisclaimer = ({ symbol, fundingRate }: TradingFeesDisclaimerProps) => {
  return (
    <Card className="gap-0 border-border/70 bg-surface/90 py-0 shadow-2xl shadow-background/30 backdrop-blur">
      <CardContent className="space-y-2 px-4 py-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
          Fees &amp; funding
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              tabIndex={0}
              aria-label="How funding works"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-muted/40 hover:text-text-primary"
            >
              <CircleHelp className="size-3.5" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-left leading-relaxed">
            {FUNDING_HELP_TEXT}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-secondary">Maker</span>
          <span className="font-mono text-text-primary">{MAKER_FEE_BPS / 100}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-secondary">Taker</span>
          <span className="font-mono text-text-primary">{TAKER_FEE_BPS / 100}%</span>
        </div>
      </div>

      {fundingRate != null ? (
        <p className="font-mono text-[11px] text-text-primary">
          {symbol}: {formatHourlyFundingPercent(fundingRate)} / hr
        </p>
      ) : (
        <p className="text-[11px] text-text-secondary">Loading funding rate for {symbol}…</p>
      )}
      </CardContent>
    </Card>
  )
}
