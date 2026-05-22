import { formatNumber } from "@/lib/format"
import {
  STYLE_LEVERAGE_MAX,
  STYLE_LEVERAGE_MIN,
  leverageToPercent,
} from "@/lib/profile-style-visuals"
import { cn } from "@/lib/utils"

type LeverageSpectrumProps = {
  averageLeverage: number | null
  fillSpace?: boolean
}

const trackValueReserveClassName = "pb-5"

export const LeverageSpectrum = ({ averageLeverage, fillSpace = false }: LeverageSpectrumProps) => {
  const markerPercent = leverageToPercent(averageLeverage) ?? 50
  const hasValue = averageLeverage != null && Number.isFinite(averageLeverage)
  const valueLabel = hasValue ? `${formatNumber(averageLeverage, 2)}x` : "—"

  const ariaLabel = hasValue
    ? `Average leverage ${formatNumber(averageLeverage, 2)}x, between conservative ${STYLE_LEVERAGE_MIN}x and aggressive ${STYLE_LEVERAGE_MAX}x`
    : "Average leverage not available"

  return (
    <div className={cn("flex flex-col space-y-1.5", fillSpace && "min-h-0 flex-1")}>
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Avg leverage</p>
      <div className={cn("flex flex-col", fillSpace && "min-h-0 flex-1 justify-center")}>
        <div className="grid grid-cols-[auto_1fr_auto] items-end gap-2" role="img" aria-label={ariaLabel}>
          <div className="flex flex-col items-center gap-0.5 pb-0.5">
            <span className="text-base leading-none" aria-hidden>
              👴
            </span>
            <span className="text-[10px] font-medium tabular-nums text-text-secondary">{STYLE_LEVERAGE_MIN}x</span>
          </div>
          <div className={cn("relative min-w-0", trackValueReserveClassName)}>
            <div className="relative h-0.5 rounded-full bg-white/15">
              <div
                className={cn(
                  "absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent-neon shadow-[0_0_14px_rgba(17,201,255,0.55)]",
                  !hasValue && "border-text-secondary bg-text-secondary shadow-none",
                )}
                style={{ left: `${markerPercent}%` }}
                aria-hidden
              />
            </div>
            <p
              className="absolute top-[calc(100%+2px)] -translate-x-1/2 whitespace-nowrap text-lg font-semibold leading-none tabular-nums text-text-primary"
              style={{ left: `${markerPercent}%` }}
            >
              {valueLabel}
            </p>
          </div>
          <div className="flex flex-col items-center gap-0.5 pb-0.5">
            <span className="text-base leading-none" aria-hidden>
              🚀
            </span>
            <span className="text-[10px] font-medium tabular-nums text-text-secondary">{STYLE_LEVERAGE_MAX}x</span>
          </div>
        </div>
      </div>
    </div>
  )
}
