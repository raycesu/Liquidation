/** Server-side Hyperliquid public info API helpers. */

export const fetchHlAllMids = async (dex?: string): Promise<Record<string, string>> => {
  const body = dex != null && dex !== "" ? { type: "allMids" as const, dex } : { type: "allMids" as const }
  const response = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Hyperliquid allMids failed: ${response.status}`)
  }

  const data = (await response.json()) as Record<string, string>
  return data
}

export type HlAssetCtxRow = {
  dayNtlVlm: string
  prevDayPx: string
  markPx: string
  midPx?: string
  funding?: string
}

type HlMetaPart = {
  universe: { name: string }[]
}

export const fetchHlMetaAndAssetCtxs = async (
  dex = "",
): Promise<{ universe: { name: string }[]; assetCtxs: HlAssetCtxRow[] }> => {
  const body =
    dex !== ""
      ? { type: "metaAndAssetCtxs" as const, dex }
      : { type: "metaAndAssetCtxs" as const }

  const response = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Hyperliquid metaAndAssetCtxs failed: ${response.status}`)
  }

  const payload = (await response.json()) as [HlMetaPart, HlAssetCtxRow[]]
  const [meta, assetCtxs] = payload

  return { universe: meta.universe, assetCtxs }
}
