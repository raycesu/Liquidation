import { AccountWipeoutsDisplay } from "@/components/profile/account-wipeouts-display"
import { MostTradedBars } from "@/components/profile/style-visuals/most-traded-bars"
import { formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ProfileSummaryStats, ProfileTradingStyle } from "@/lib/types"

type ProfileStatsOverviewCardProps = {
  summary: ProfileSummaryStats
  topSymbols: ProfileTradingStyle["topSymbols"]
}

type DetailRowProps = {
  label: string
  value: string
  valueClassName?: string
}

const DetailRow = ({ label, value, valueClassName }: DetailRowProps) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <span className="text-sm text-text-secondary">{label}</span>
    <span className={cn("text-sm font-semibold tabular-nums text-text-primary", valueClassName)}>{value}</span>
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
        "relative overflow-hidden rounded-2xl border border-white/10",
        "bg-[#050a14] bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgb(17_201_255/0.22),transparent_55%),radial-gradient(ellipse_50%_40%_at_0%_100%,rgb(10_140_255/0.12),transparent_50%)]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-sm",
      )}
    >
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Stats Overview</h2>
          <span className="shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-medium text-text-secondary">
            All time
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-text-secondary">Competitions entered</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-text-primary sm:text-4xl">
              {summary.competitionsEntered}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">All-time avg P&amp;L</p>
            <p className={cn("mt-1 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl", avgPnlClassName)}>
              {avgPnlDisplay}
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-white/8 border-t border-white/8">
          <DetailRow label="Best trade (ROE)" value={bestTradeDisplay} valueClassName={bestTradeClassName} />
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm text-text-secondary">Account wipeouts</span>
            <AccountWipeoutsDisplay wipeouts={summary.wipeouts} />
          </div>
        </div>

        <div className="mt-5 border-t border-white/8 pt-5">
          <MostTradedBars topSymbols={topSymbols} maxItems={3} compact />
        </div>
      </div>
    </div>
  )
}
