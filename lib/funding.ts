import { fetchHlMetaAndAssetCtxs } from "@/lib/hyperliquid"
import { getMarket, MARKETS } from "@/lib/markets"
import type { PositionSide, SupportedSymbol } from "@/lib/types"

const FUNDING_CACHE_TTL_MS = 60_000

type FundingCacheEntry = {
  ratesByHlName: Map<string, number>
  expiresAt: number
}

let fundingCache: FundingCacheEntry | null = null

const parseFundingRate = (raw: string | undefined): number | null => {
  if (raw == null) {
    return null
  }

  const rate = Number(raw)

  if (!Number.isFinite(rate)) {
    return null
  }

  return rate
}

const mergeDexFundingRates = async (dex: string, target: Map<string, number>) => {
  const { universe, assetCtxs } = await fetchHlMetaAndAssetCtxs(dex)

  for (let i = 0; i < universe.length && i < assetCtxs.length; i += 1) {
    const rate = parseFundingRate(assetCtxs[i]?.funding)

    if (rate == null) {
      continue
    }

    target.set(universe[i].name, rate)
  }
}

export const fetchHlFundingRatesByHlName = async (): Promise<Map<string, number>> => {
  const now = Date.now()

  if (fundingCache && fundingCache.expiresAt > now) {
    return new Map(fundingCache.ratesByHlName)
  }

  const ratesByHlName = new Map<string, number>()

  await Promise.all([mergeDexFundingRates("", ratesByHlName), mergeDexFundingRates("xyz", ratesByHlName)])

  fundingCache = {
    ratesByHlName,
    expiresAt: now + FUNDING_CACHE_TTL_MS,
  }

  return new Map(ratesByHlName)
}

const hlNameToCanonical = (() => {
  const map = new Map<string, SupportedSymbol>()

  for (const market of MARKETS) {
    map.set(market.hlName, market.symbol)
  }

  return map
})()

export const resolveFundingRate = async (canonicalSymbol: SupportedSymbol): Promise<number | null> => {
  const market = getMarket(canonicalSymbol)

  if (!market) {
    return null
  }

  const rates = await fetchHlFundingRatesByHlName()
  return rates.get(market.hlName) ?? null
}

export const getFundingHourUtc = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), 0, 0, 0))

export const computeFundingPayment = (side: PositionSide, sizeUsd: number, hourlyRate: number) => {
  const sideSign = side === "LONG" ? -1 : 1
  return sideSign * sizeUsd * hourlyRate
}

export const buildFundingRatesBySymbol = async (): Promise<Record<SupportedSymbol, number>> => {
  const ratesByHlName = await fetchHlFundingRatesByHlName()
  const out: Record<SupportedSymbol, number> = {}

  for (const [hlName, rate] of ratesByHlName) {
    const canonical = hlNameToCanonical.get(hlName)

    if (canonical) {
      out[canonical] = rate
    }
  }

  return out
}
