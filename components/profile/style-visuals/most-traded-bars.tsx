import { formatShareAssetLabel } from "@/lib/format"
import type { SupportedSymbol } from "@/lib/types"
import { cn } from "@/lib/utils"

type SymbolCount = {
  symbol: SupportedSymbol
  count: number
}

type MostTradedBarsProps = {
  topSymbols: SymbolCount[]
  maxItems?: number
  compact?: boolean
}

export const MostTradedBars = ({ topSymbols, maxItems = 5, compact = false }: MostTradedBarsProps) => {
  const rows = topSymbols.slice(0, maxItems)
  const maxCount = rows.length > 0 ? Math.max(...rows.map((row) => row.count)) : 0

  if (rows.length === 0) {
    return (
      <div className={cn("space-y-1.5", compact && "space-y-1")}>
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Most traded</p>
        <p className="text-sm text-text-secondary">No trades yet</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Most traded</p>
      <ul className={cn("space-y-2", compact && "space-y-1.5")} aria-label="Most traded symbols">
        {rows.map((row, index) => {
          const widthPercent = maxCount > 0 ? (row.count / maxCount) * 100 : 0
          const isTop = index === 0

          return (
            <li key={row.symbol} className="flex items-center gap-2">
              <span
                className={cn(
                  "shrink-0 rounded-md border px-2 py-0.5 font-mono text-xs",
                  isTop
                    ? "border-accent-neon/35 bg-accent-neon/10 text-text-primary"
                    : "border-white/10 bg-white/[0.04] text-text-primary",
                )}
              >
                {formatShareAssetLabel(row.symbol)}
              </span>
              <div className={cn("min-w-0 flex-1 h-2 overflow-hidden rounded-full bg-white/8", compact && "h-1.5")}>
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isTop ? "bg-gradient-to-r from-accent-blue to-accent-neon" : "bg-white/25",
                  )}
                  style={{ width: `${widthPercent}%` }}
                  role="presentation"
                />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-text-secondary">{row.count} trades</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
