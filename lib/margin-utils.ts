import Decimal from "decimal.js"

export type Decimalish = Decimal.Value

export const toDecimal = (value: Decimalish) => new Decimal(value)

export const floorToUsdCents = (value: Decimalish) =>
  toDecimal(value).toDecimalPlaces(2, Decimal.ROUND_DOWN)

export const requiredMarginUsd = (sizeUsd: Decimalish, leverage: Decimalish) =>
  floorToUsdCents(toDecimal(sizeUsd).div(leverage))

export const hasSufficientMarginUsd = (availableUsd: Decimalish, requiredUsd: Decimalish) =>
  floorToUsdCents(availableUsd).gte(floorToUsdCents(requiredUsd))

export const formatUsdFixed = (value: Decimalish) => floorToUsdCents(value).toFixed(2)

