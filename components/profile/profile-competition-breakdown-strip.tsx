import { formatPercent } from "@/lib/format"
import type { ProfileRoomCompetitionStats, ProfileRoomTradeHighlight } from "@/lib/profile-room-competition-stats"
import { cn } from "@/lib/utils"

type ProfileCompetitionBreakdownStripProps = {
  stats: ProfileRoomCompetitionStats
}

type StatCardProps = {
  label: string
  value: string
}

const StatCard = ({ label, value }: StatCardProps) => (
  <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
    <p className="text-xs text-text-secondary">{label}</p>
    <p className="mt-1 text-lg font-semibold tabular-nums text-text-primary">{value}</p>
  </div>
)

const formatAssetLabel = (symbol: string) => symbol.replace("USDT", "")

const TradeHighlightRow = ({ trade }: { trade: ProfileRoomTradeHighlight }) => {
  const pnlClass = trade.roePercent >= 0 ? "text-profit" : "text-loss"

  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-text-primary">{formatAssetLabel(trade.symbol)}</span>
      <span className={cn("font-mono font-semibold tabular-nums", pnlClass)}>
        {trade.roePercent >= 0 ? "+" : ""}
        {formatPercent(trade.roePercent)}
      </span>
    </li>
  )
}

type TradeListProps = {
  title: string
  trades: ProfileRoomTradeHighlight[]
}

const TradeList = ({ title, trades }: TradeListProps) => (
  <div className="rounded-xl border border-border bg-background/60 p-4">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</h3>
    {trades.length === 0 ? (
      <p className="mt-3 text-sm text-text-secondary">No closed trades yet.</p>
    ) : (
      <ul className="mt-3 space-y-2.5">
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
    stats.mostTradedSymbol != null ? formatAssetLabel(stats.mostTradedSymbol) : "—"

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Win rate" value={winRateDisplay} />
        <StatCard label="Avg leverage" value={leverageDisplay} />
        <StatCard label="Most traded" value={mostTradedDisplay} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TradeList title="Best trades" trades={stats.bestTrades} />
        <TradeList title="Worst trades" trades={stats.worstTrades} />
      </div>
    </div>
  )
}
