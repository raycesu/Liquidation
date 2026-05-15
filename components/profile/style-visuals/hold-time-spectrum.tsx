import { formatHoldMs, holdMsToPercent } from "@/lib/profile-style-visuals"
import { cn } from "@/lib/utils"

type HoldTimeSpectrumProps = {
  averageHoldMs: number | null
}

export const HoldTimeSpectrum = ({ averageHoldMs }: HoldTimeSpectrumProps) => {
  const markerPercent = holdMsToPercent(averageHoldMs) ?? 50
  const hasValue = averageHoldMs != null && Number.isFinite(averageHoldMs) && averageHoldMs > 0

  const ariaLabel = hasValue
    ? `Average hold time ${formatHoldMs(averageHoldMs)}, between patient two days and impatient one minute`
    : "Average hold time not available"

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Avg hold time</p>
      <div className="relative pt-9 pb-1" role="img" aria-label={ariaLabel}>
        <div className="pointer-events-none absolute top-0 left-0 flex flex-col items-center gap-0.5">
          <span className="text-xl leading-none" aria-hidden>
            🧘
          </span>
          <span className="text-[10px] font-medium tabular-nums text-text-secondary">2d</span>
        </div>
        <div className="pointer-events-none absolute top-0 right-0 flex flex-col items-center gap-0.5">
          <span className="text-xl leading-none" aria-hidden>
            ⚡
          </span>
          <span className="text-[10px] font-medium tabular-nums text-text-secondary">1m</span>
        </div>
        <div className="relative mt-1 h-0.5 rounded-full bg-white/15">
          <div
            className={cn(
              "absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent-neon shadow-[0_0_14px_rgba(17,201,255,0.55)]",
              !hasValue && "border-text-secondary bg-text-secondary shadow-none",
            )}
            style={{ left: `${markerPercent}%` }}
            aria-hidden
          />
        </div>
      </div>
      <p className="text-center text-lg font-semibold tabular-nums text-text-primary">{formatHoldMs(averageHoldMs)}</p>
    </div>
  )
}
