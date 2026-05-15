import { formatNumber } from "@/lib/format"

type LongShortBiasTankProps = {
  longBiasPercent: number
}

export const LongShortBiasTank = ({ longBiasPercent }: LongShortBiasTankProps) => {
  const clampedLong = Math.min(100, Math.max(0, longBiasPercent))
  const shortBias = 100 - clampedLong

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Long / short</p>
      <div
        className="relative h-10 overflow-hidden rounded-lg border border-white/12 bg-black/40"
        role="img"
        aria-label={`${formatNumber(clampedLong, 1)} percent long, ${formatNumber(shortBias, 1)} percent short`}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, rgb(10 201 125 / 0.85) 0%, rgb(10 201 125 / 0.85) ${clampedLong}%, rgb(255 77 112 / 0.85) ${clampedLong}%, rgb(255 77 112 / 0.85) 100%)`,
          }}
        />
        <div
          className="absolute top-1 bottom-1 w-1 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          style={{ left: `calc(${clampedLong}% - 2px)` }}
          aria-hidden
        />
      </div>
      <p className="text-sm tabular-nums text-text-primary">
        <span className="text-profit">{formatNumber(clampedLong, 1)}% long</span>
        <span className="text-text-secondary"> · </span>
        <span className="text-loss">{formatNumber(shortBias, 1)}% short</span>
      </p>
    </div>
  )
}
