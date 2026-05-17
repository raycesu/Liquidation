"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { computeFundingPayment } from "@/lib/funding"
import { formatNumber, formatUsd } from "@/lib/format"
import { MAKER_FEE_BPS, TAKER_FEE_BPS } from "@/lib/trading-fees"
import type { SupportedSymbol } from "@/lib/types"

const EXAMPLE_NOTIONAL = 10_000

type TradingFeesDisclaimerProps = {
  symbol: SupportedSymbol
  fundingRate: number | undefined
}

const formatHourlyFundingPercent = (rate: number) => `${formatNumber(rate * 100, 4)}%`

export const TradingFeesDisclaimer = ({ symbol, fundingRate }: TradingFeesDisclaimerProps) => {
  const longExample =
    fundingRate != null ? computeFundingPayment("LONG", EXAMPLE_NOTIONAL, fundingRate) : null
  const shortExample =
    fundingRate != null ? computeFundingPayment("SHORT", EXAMPLE_NOTIONAL, fundingRate) : null

  return (
    <Alert className="border-border/70 bg-surface-elevated/50 text-xs shadow-lg shadow-accent-blue/5">
      <AlertTitle className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
        Fees &amp; funding
      </AlertTitle>
      <AlertDescription className="space-y-2 text-[11px] leading-relaxed text-text-secondary">
        <p>
          Maker fee {MAKER_FEE_BPS / 100}% (limit orders). Taker fee {TAKER_FEE_BPS / 100}% (market
          opens and closes, TP/SL). Liquidations have no trading fee.
        </p>
        <p>
          Funding is applied hourly (UTC) using Hyperliquid rates for each market. When the rate is
          positive, longs pay and shorts receive. At most one funding tick is applied per hour per
          position (missed hours are not backfilled).
        </p>
        {fundingRate != null ? (
          <p className="font-mono text-text-primary">
            {symbol}: {formatHourlyFundingPercent(fundingRate)} / hr — est. on {formatUsd(EXAMPLE_NOTIONAL)}{" "}
            long {formatUsd(longExample ?? 0)}, short {formatUsd(shortExample ?? 0)} per hour
          </p>
        ) : (
          <p>Loading funding rate for {symbol}…</p>
        )}
      </AlertDescription>
    </Alert>
  )
}
