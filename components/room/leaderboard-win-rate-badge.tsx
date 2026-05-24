import { formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

type LeaderboardWinRateBadgeProps = {
  winRate: number
}

export const LeaderboardWinRateBadge = ({ winRate }: LeaderboardWinRateBadgeProps) => {
  const isPositive = winRate > 0

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-sm font-semibold tabular-nums",
        isPositive
          ? "border-profit/40 bg-profit/15 text-profit"
          : "border-border/60 bg-surface-elevated/80 text-text-secondary",
      )}
    >
      {formatPercent(winRate)}
    </span>
  )
}
