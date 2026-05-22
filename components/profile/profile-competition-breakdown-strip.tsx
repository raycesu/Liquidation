import { formatPercent, formatShareAssetLabel } from "@/lib/format"
import type { ProfileRoomCompetitionStats, ProfileRoomTradeHighlight } from "@/lib/profile-room-competition-stats"
import { cn } from "@/lib/utils"

type ProfileCompetitionBreakdownStripProps = {
  stats: ProfileRoomCompetitionStats
}

type StatCardProps = {
  label: string
  value: string
}

const breakdownCardClassName = "rounded-xl border border-border/70 bg-card/70 px-4 py-3"

const StatCard = ({ label, value }: StatCardProps) => (
  <div className={breakdownCardClassName}>
    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-text-secondary">{label}</p>
    <p className="mt-1 text-lg font-semibold tabular-nums text-text-primary">{value}</p>
  </div>
)

const TradeHighlightRow = ({ trade }: { trade: ProfileRoomTradeHighlight }) => {
  const pnlClass = trade.roePercent >= 0 ? "text-profit" : "text-loss"

  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
      <span className="font-semibold text-text-primary">{formatShareAssetLabel(trade.symbol)}</span>
      <span className={cn("font-mono font-semibold tabular-nums", pnlClass)}>
        {trade.roePercent >= 0 ? "+" : ""}
        {formatPercent(trade.roePercent)}
      </span>
    </li>
  )
}

type TradeListProps = {
  title: string
  titleClassName: string
  trades: ProfileRoomTradeHighlight[]
}

const TradeList = ({ title, titleClassName, trades }: TradeListProps) => (
  <div className={cn(breakdownCardClassName, "p-4")}>
    <h3
      className={cn(
        "text-[0.65rem] font-semibold uppercase tracking-wider",
        titleClassName,
      )}
    >
      {title}
    </h3>
    {trades.length === 0 ? (
      <p className="mt-3 text-sm text-text-secondary">No closed trades yet.</p>
    ) : (
      <ul className="mt-3 divide-y divide-border/35">
        {trades.map((trade) => (
          <TradeHighlightRow key={trade.tradeId} trade={trade} />
        ))}
      </ul>
    )}
  </div>
)

export const ProfileCompetitionBreakdownStrip = ({ stats }: ProfileCompetitionBreakdownStripProps) => {
  const winRateDisplay = stats.winRatePercent != null ? formatPercent(stats.winRatePercent) : "—"
  const leverageDisplay =
    stats.averageLeverage != null ? `${stats.averageLeverage.toFixed(1)}x` : "—"
  const mostTradedDisplay =
    stats.mostTradedSymbol != null ? formatShareAssetLabel(stats.mostTradedSymbol) : "—"

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Win rate" value={winRateDisplay} />
        <StatCard label="Avg leverage" value={leverageDisplay} />
        <StatCard label="Most traded" value={mostTradedDisplay} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TradeList title="Best trades" titleClassName="text-profit" trades={stats.bestTrades} />
        <TradeList title="Worst trades" titleClassName="text-loss" trades={stats.worstTrades} />
      </div>
    </div>
  )
}
