import { HoldTimeSpectrum } from "@/components/profile/style-visuals/hold-time-spectrum"
import { LeverageSpectrum } from "@/components/profile/style-visuals/leverage-spectrum"
import { LongShortBiasTank } from "@/components/profile/style-visuals/long-short-bias-tank"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber } from "@/lib/format"
import { formatHoldMs } from "@/lib/profile-style-visuals"
import { cn } from "@/lib/utils"
import type { ProfileTradingStyle } from "@/lib/types"

type ProfileTradingStyleCardProps = {
  style: ProfileTradingStyle
  embedded?: boolean
}

const styleCardClassName = cn(
  "relative overflow-hidden rounded-2xl border border-white/10",
  "bg-[#050a14] bg-[radial-gradient(ellipse_70%_55%_at_0%_0%,rgb(17_201_255/0.16),transparent_50%),radial-gradient(ellipse_50%_45%_at_100%_100%,rgb(10_140_255/0.1),transparent_55%)]",
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-sm",
)

export const ProfileTradingStyleCard = ({ style, embedded = false }: ProfileTradingStyleCardProps) => {
  const shortBias = 100 - style.longBiasPercent

  if (embedded) {
    return (
      <div className={styleCardClassName}>
        <div className="relative p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-text-primary">Style</h2>
          <div className="mt-6 space-y-6">
            <LongShortBiasTank longBiasPercent={style.longBiasPercent} />
            <LeverageSpectrum averageLeverage={style.averageLeverage} />
            <HoldTimeSpectrum averageHoldMs={style.averageHoldMs} />
          </div>
        </div>
      </div>
    )
  }

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
