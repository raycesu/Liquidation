import { AccountWipeoutsDisplay } from "@/components/profile/account-wipeouts-display"
import { MostTradedBars } from "@/components/profile/style-visuals/most-traded-bars"
import { formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ProfileSummaryStats, ProfileTradingStyle } from "@/lib/types"

type ProfileStatsOverviewCardProps = {
  summary: ProfileSummaryStats
  topSymbols: ProfileTradingStyle["topSymbols"]
}

const sectionTitleClassName =
  "text-xs font-semibold uppercase tracking-wider text-text-secondary"

type HighlightTileProps = {
  label: string
  value: string
  valueClassName?: string
}

const HighlightTile = ({ label, value, valueClassName }: HighlightTileProps) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">{label}</p>
    <p
      className={cn(
        "mt-1.5 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl",
        valueClassName ?? "text-text-primary",
      )}
    >
      {value}
    </p>
  </div>
)

export const ProfileStatsOverviewCard = ({ summary, topSymbols }: ProfileStatsOverviewCardProps) => {
  const avgPnlClassName =
    summary.allTimeAvgPnlPercent != null && summary.allTimeAvgPnlPercent >= 0
      ? "text-profit"
      : summary.allTimeAvgPnlPercent != null
        ? "text-loss"
        : "text-text-primary"

  const bestTradeClassName =
    summary.bestTradeRoePercent != null && summary.bestTradeRoePercent >= 0 ? "text-profit" : "text-loss"

  const avgPnlDisplay =
    summary.allTimeAvgPnlPercent != null ? formatPercent(summary.allTimeAvgPnlPercent) : "—"

  const bestTradeDisplay =
    summary.bestTradeRoePercent != null ? formatPercent(summary.bestTradeRoePercent) : "—"

  return (
    <div
      className={cn(
        "relative h-full overflow-visible rounded-2xl border border-white/10",
        "bg-[#050a14] bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgb(17_201_255/0.22),transparent_55%),radial-gradient(ellipse_50%_40%_at_0%_100%,rgb(10_140_255/0.12),transparent_50%)]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-sm",
      )}
    >
      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className={sectionTitleClassName}>Stats overview</h2>
          <span className="shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-medium text-text-secondary">
            All time
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <HighlightTile
            label="All-time avg P&L"
            value={avgPnlDisplay}
            valueClassName={avgPnlClassName}
          />
          <HighlightTile
            label="Best trade ROE"
            value={bestTradeDisplay}
            valueClassName={bestTradeClassName}
          />
        </div>

        <div className="mt-3 border-t border-white/8 pt-3">
          <div className="flex items-center justify-between gap-4 py-2">
            <span className="text-sm text-text-secondary">Account wipeouts</span>
            <AccountWipeoutsDisplay wipeouts={summary.wipeouts} />
          </div>
        </div>

        <div className="mt-3 border-t border-white/8 pt-3">
          <MostTradedBars topSymbols={topSymbols} maxItems={3} compact />
        </div>
      </div>
    </div>
  )
}
