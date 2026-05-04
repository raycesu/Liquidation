import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/format"
import type { ProfileTradingStyle } from "@/lib/types"

type ProfileTradingStyleCardProps = {
  style: ProfileTradingStyle
}

const formatHoldMs = (ms: number | null) => {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) {
    return "—"
  }

  const hours = ms / 3_600_000

  if (hours < 1) {
    return `${Math.round(ms / 60_000)} min`
  }

  if (hours < 48) {
    return `${hours.toFixed(1)} h`
  }

  return `${(hours / 24).toFixed(1)} d`
}

export const ProfileTradingStyleCard = ({ style }: ProfileTradingStyleCardProps) => {
  const shortBias = 100 - style.longBiasPercent

  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle className="text-text-primary">Trading style</CardTitle>
        <p className="text-sm text-text-secondary">Fingerprint across all competitions you joined.</p>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Long / short bias</p>
          <p className="text-2xl font-semibold text-text-primary">
            {formatNumber(style.longBiasPercent, 1)}% long
          </p>
          <p className="text-sm text-text-secondary">{formatNumber(shortBias, 1)}% short</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Avg leverage</p>
          <p className="text-2xl font-semibold text-text-primary">
            {style.averageLeverage != null ? `${formatNumber(style.averageLeverage, 2)}x` : "—"}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Avg hold time</p>
          <p className="text-2xl font-semibold text-text-primary">{formatHoldMs(style.averageHoldMs)}</p>
        </div>
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Most traded</p>
          {style.topSymbols.length > 0 ? (
            <ul className="space-y-1 text-sm text-text-primary">
              {style.topSymbols.slice(0, 5).map((row) => (
                <li key={row.symbol} className="flex justify-between gap-2 font-mono">
                  <span>{row.symbol.replace("USDT", "")}</span>
                  <span className="text-text-secondary">{row.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">No trades yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
