export const STYLE_LEVERAGE_MIN = 1
export const STYLE_LEVERAGE_MAX = 40
export const STYLE_HOLD_MIN_MS = 60_000
export const STYLE_HOLD_MAX_MS = 2 * 24 * 60 * 60 * 1000

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export const leverageToPercent = (leverage: number | null): number | null => {
  if (leverage == null || !Number.isFinite(leverage)) {
    return null
  }

  const range = STYLE_LEVERAGE_MAX - STYLE_LEVERAGE_MIN
  return clamp01((leverage - STYLE_LEVERAGE_MIN) / range) * 100
}

export const holdMsToPercent = (holdMs: number | null): number | null => {
  if (holdMs == null || !Number.isFinite(holdMs) || holdMs <= 0) {
    return null
  }

  const clampedMs = Math.min(Math.max(holdMs, STYLE_HOLD_MIN_MS), STYLE_HOLD_MAX_MS)
  const minLog = Math.log(STYLE_HOLD_MIN_MS)
  const maxLog = Math.log(STYLE_HOLD_MAX_MS)
  const valueLog = Math.log(clampedMs)

  // Left = patient (2d), right = impatient (1m) — invert so short holds sit right
  const linear = (valueLog - minLog) / (maxLog - minLog)
  return (1 - linear) * 100
}

export const formatHoldMs = (ms: number | null) => {
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

/** Profile gauge label: e.g. "1d 6.3h" */
export const formatHoldMsDaysAndHours = (ms: number | null) => {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) {
    return "—"
  }

  const totalHours = ms / 3_600_000

  if (totalHours < 1) {
    return `${Math.round(ms / 60_000)}m`
  }

  if (totalHours < 24) {
    return `${totalHours.toFixed(1)}h`
  }

  const days = Math.floor(totalHours / 24)
  const remainderHours = totalHours - days * 24

  if (remainderHours < 0.05) {
    return `${days}d`
  }

  return `${days}d ${remainderHours.toFixed(1)}h`
}
