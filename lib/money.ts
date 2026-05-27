export const toCents = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0
  }

  const scaled = value * 100

  if (!Number.isFinite(scaled)) {
    return 0
  }

  // Guard against negative zero and tiny negative values
  const rounded = Math.round(scaled + 1e-6)

  return rounded < 0 ? 0 : rounded
}

export const fromCents = (cents: number) => {
  if (!Number.isFinite(cents)) {
    return 0
  }

  return cents / 100
}

export const hasSufficientMargin = (available: number, required: number) => {
  return toCents(available) >= toCents(required)
}

export const floorToCents = (value: number) => {
  const cents = toCents(value)

  return fromCents(cents)
}
