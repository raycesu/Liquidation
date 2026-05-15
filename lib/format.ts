export const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)

export const formatWholeUsd = (value: number) =>
  `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value)} USD`

export const formatNumber = (value: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value)

export const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value)}%`

/** Compact USD-style label for large quote volumes (USDT ≈ USD). */
export const formatCompactUsd = (value: number) => {
  const abs = Math.abs(value)

  if (abs >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`
  }

  if (abs >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`
  }

  if (abs >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`
  }

  if (abs >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`
  }

  return formatUsd(value)
}

export const formatProfileDate = (iso: string) => {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export const formatDateTime = (iso: string) => {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return date.toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
