"use client"

import { forwardRef, useEffect, useMemo, useRef, useState } from "react"
import { toPng } from "html-to-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"
import { MarketingBackdropLayers } from "@/components/marketing/marketing-backdrop-layers"
import { formatPercent, formatProfileDate, formatShareAssetLabel } from "@/lib/format"
import type { ProfileShareRoomOption, ProfileShareTradeHighlight } from "@/lib/types"
import { Download, Loader2 } from "lucide-react"

type ProfileShareCardSectionProps = {
  shareRoomOptions: ProfileShareRoomOption[]
  assetBaseUrl: string
}

const cardWidth = 1200
const cardHeight = 630

const CARD_BG = "#050a14"
const CARD_RING = "#173a60"

const formatTradeCountLabel = (count: number) => `${count} trade${count === 1 ? "" : "s"}`

const directionLabel = (side: ProfileShareTradeHighlight["side"]) => (side === "LONG" ? "LONG" : "SHORT")

const badgeClassForSide = (side: ProfileShareTradeHighlight["side"]) =>
  side === "LONG"
    ? "border border-emerald-400/35 bg-emerald-500/20 text-emerald-100"
    : "border border-rose-400/40 bg-rose-500/25 text-rose-50"

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const pnlColorClass = (value: number) => (value >= 0 ? "text-[#00c97a]" : "text-[#ff3b5c]")

const logoAspectRatio = BRAND_LOGO_WIDTH / BRAND_LOGO_HEIGHT

const resolveLogoAbsoluteUrl = (assetBaseUrl: string) => {
  const baseUrl = assetBaseUrl || (typeof window !== "undefined" ? window.location.origin : "")

  if (!baseUrl) {
    return BRAND_LOGO_SRC
  }

  return new URL(BRAND_LOGO_SRC, baseUrl).toString()
}

const loadLogoAsDataUrl = async (absoluteUrl: string): Promise<string | null> => {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const response = await fetch(absoluteUrl, { cache: "no-store" })

    if (response.ok) {
      const blob = await response.blob()

      return await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(typeof reader.result === "string" ? reader.result : null)
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    }
  } catch {
    // Fall back to drawing the image if fetch is blocked by the current environment.
  }

  const fromCanvas = await new Promise<string | null>((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          resolve(null)
          return
        }

        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL("image/png"))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = absoluteUrl
  })

  if (fromCanvas) {
    return fromCanvas
  }

  return null
}

const waitForNextFrame = async () => {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

const waitForExistingLogoImage = async (img: HTMLImageElement) => {
  if (img.complete && img.naturalWidth > 0) {
    if (typeof img.decode === "function") {
      await img.decode().catch(() => undefined)
    }

    await waitForNextFrame()
    return
  }

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error("Logo failed to load"))
  })
  await waitForNextFrame()
}

const loadImageElement = async (src: string) =>
  await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Image failed to load"))
    img.src = src
  })

const compositeLogoOntoExport = async ({
  exportedDataUrl,
  logoDataUrl,
  logoRect,
  cardRect,
}: {
  exportedDataUrl: string
  logoDataUrl: string
  logoRect: DOMRect
  cardRect: DOMRect
}) => {
  const [exportedImage, logoImage] = await Promise.all([
    loadImageElement(exportedDataUrl),
    loadImageElement(logoDataUrl),
  ])
  const canvas = document.createElement("canvas")
  canvas.width = exportedImage.naturalWidth
  canvas.height = exportedImage.naturalHeight
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return exportedDataUrl
  }

  const scaleX = canvas.width / cardRect.width
  const scaleY = canvas.height / cardRect.height
  const logoX = (logoRect.left - cardRect.left) * scaleX
  const logoY = (logoRect.top - cardRect.top) * scaleY
  const logoWidth = logoRect.width * scaleX
  const logoHeight = logoRect.height * scaleY

  ctx.drawImage(exportedImage, 0, 0)
  ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight)

  return canvas.toDataURL("image/png")
}

export const ProfileShareCardSection = ({ shareRoomOptions, assetBaseUrl }: ProfileShareCardSectionProps) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const firstOpt = shareRoomOptions[0]
  const [selectedRoomId, setSelectedRoomId] = useState(firstOpt?.room.id ?? "")
  const [isExporting, setIsExporting] = useState(false)

  const selectedOption = useMemo(
    () => shareRoomOptions.find((o) => o.room.id === selectedRoomId),
    [shareRoomOptions, selectedRoomId],
  )

  const logoAbsoluteUrl = useMemo(() => resolveLogoAbsoluteUrl(assetBaseUrl), [assetBaseUrl])
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [hasLogoLoadError, setHasLogoLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLogoDataUrl(null)
    setHasLogoLoadError(false)

    const preload = async () => {
      const dataUrl = await loadLogoAsDataUrl(logoAbsoluteUrl)

      if (cancelled) {
        return
      }

      if (!dataUrl) {
        setHasLogoLoadError(true)
        return
      }

      setLogoDataUrl(dataUrl)
    }

    void preload()

    return () => {
      cancelled = true
    }
  }, [logoAbsoluteUrl])

  const isShareCardReady = Boolean(selectedOption && logoDataUrl)

  const handleExportPng = async () => {
    const node = cardRef.current

    if (!node || !selectedOption || !logoDataUrl) {
      return
    }

    setIsExporting(true)

    try {
      const logoImg = node.querySelector<HTMLImageElement>("img[data-share-logo]")

      if (!logoImg) {
        return
      }

      await waitForExistingLogoImage(logoImg)

      const cardRect = node.getBoundingClientRect()
      const logoRect = logoImg.getBoundingClientRect()
      const dataUrlWithoutLogo = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        width: cardWidth,
        height: cardHeight,
        filter: (domNode) => !(domNode instanceof HTMLImageElement && domNode.dataset.shareLogo === "true"),
      })
      const dataUrl = await compositeLogoOntoExport({
        exportedDataUrl: dataUrlWithoutLogo,
        logoDataUrl,
        logoRect,
        cardRect,
      })
      const anchor = document.createElement("a")
      anchor.href = dataUrl
      anchor.download = `${BRAND_NAME.toLowerCase()}-competition-${slugify(selectedOption.room.name)}.png`
      anchor.click()
    } finally {
      setIsExporting(false)
    }
  }

  if (shareRoomOptions.length === 0) {
    return (
      <Card className="border-border bg-surface">
        <CardContent className="pt-6">
          <p className="text-sm text-text-secondary">Join a competition to generate a shareable card.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-surface">
      <CardContent className="flex flex-col gap-6 pt-6">
        <div className="max-w-md space-y-2">
          <Label htmlFor="profile-share-room">Competitions</Label>
          <select
            id="profile-share-room"
            className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            value={selectedRoomId}
            onChange={(event) => setSelectedRoomId(event.target.value)}
            aria-label="Select competition for share card"
          >
            {shareRoomOptions.map((opt) => (
              <option key={opt.room.id} value={opt.room.id}>
                {opt.room.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-background/60 p-4">
          <p className="mb-3 text-xs text-text-secondary">Preview (scaled)</p>
          <div
            className="origin-top-left scale-[0.42] sm:scale-[0.48]"
            style={{ width: cardWidth * 0.48, height: cardHeight * 0.48 }}
          >
            {selectedOption ? (
              <ShareCardCanvas ref={cardRef} option={selectedOption} logoSrc={logoDataUrl} />
            ) : null}
          </div>
        </div>

        {hasLogoLoadError ? (
          <p className="text-sm text-rose-300">
            The logo could not be prepared for export. Refresh the page and try again.
          </p>
        ) : null}

        <Button
          type="button"
          onClick={() => void handleExportPng()}
          disabled={!isShareCardReady || isExporting}
          className="w-fit gap-2"
          aria-label="Download share card as PNG"
        >
          {isExporting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
          {isExporting ? "Exporting…" : logoDataUrl ? "Download PNG" : "Preparing logo…"}
        </Button>
      </CardContent>
    </Card>
  )
}

type ShareCardCanvasProps = {
  option: ProfileShareRoomOption
  logoSrc: string | null
}

const RankHero = ({ placementRank, participantCount }: { placementRank: number; participantCount: number }) => {
  return (
    <div className="relative flex flex-1 items-center justify-center" aria-hidden>
      <div className="pointer-events-none absolute right-8 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#0f8dff]/20 blur-[70px]" />
      <svg
        viewBox="0 0 280 280"
        className="pointer-events-none absolute h-[300px] w-[300px] text-[#0f8dff]/25"
        aria-hidden
      >
        <circle cx="140" cy="140" r="128" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="140" cy="140" r="104" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
        <circle cx="140" cy="140" r="80" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.45" />
        <circle cx="140" cy="140" r="56" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      </svg>
      <div
        className="relative flex size-[240px] flex-col items-center justify-center rounded-full ring-2 ring-[#17c9ff]/45"
        style={{ boxShadow: "0 0 48px rgb(23 201 255 / 0.12)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9eb8d6]">Rank</p>
        <p className="mt-1 font-mono text-8xl font-bold leading-none text-white">#{placementRank}</p>
        <p className="mt-2 text-center text-base text-white/60">
          of {participantCount} trader{participantCount === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  )
}

const ShareCardCanvas = forwardRef<HTMLDivElement, ShareCardCanvasProps>(function ShareCardCanvas(
  { option, logoSrc },
  ref,
) {
  const pnlClass = pnlColorClass(option.pnlPercent)
  const endLabel = option.isOngoing ? "Ongoing" : formatProfileDate(option.endDateIso)
  const subtitle = `${formatProfileDate(option.startDateIso)} – ${endLabel} · ${formatTradeCountLabel(option.closedTradeCount)}`

  return (
    <div
      ref={ref}
      data-theme="marketing-dark"
      className="relative isolate flex rounded-2xl text-white"
      style={{
        width: cardWidth,
        height: cardHeight,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        backgroundColor: CARD_BG,
        boxShadow: `inset 0 0 0 1px ${CARD_RING}`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
        <MarketingBackdropLayers
          layerClassName="absolute inset-0 z-0"
          glowClassName="pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto h-48 max-w-3xl rounded-full bg-[#17c9ff]/10 blur-[80px]"
        />
      </div>

      <div className="relative z-10 flex w-full min-w-0">
        <div className="flex min-w-0 flex-[0_0_62%] flex-col justify-between p-10">
          <div style={{ width: 170, height: Math.round(170 / logoAspectRatio) }}>
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- html-to-image needs plain img + data URL
              <img
                data-share-logo="true"
                src={logoSrc}
                alt={`${BRAND_NAME} logo`}
                width={BRAND_LOGO_WIDTH}
                height={BRAND_LOGO_HEIGHT}
                className="block h-full w-full object-contain object-left"
              />
            ) : null}
          </div>

          <div className="mt-5 flex flex-1 flex-col">
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">{option.room.name}</h2>
            <p className="mt-2 text-lg text-white/60">{subtitle}</p>

            <div className={`mt-5 text-7xl font-bold leading-none ${pnlClass}`}>
              {option.pnlPercent >= 0 ? "+" : ""}
              {formatPercent(option.pnlPercent)}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/45">Top trades</p>
            {option.topTrades.length === 0 ? (
              <p className="mt-3 text-sm text-white/40">No closed trades yet.</p>
            ) : (
              <ul className="mt-3 w-full space-y-2">
                {option.topTrades.map((trade, index) => (
                  <TopTradeRow key={trade.tradeId} rank={index + 1} trade={trade} />
                ))}
              </ul>
            )}
          </div>
        </div>

        <RankHero placementRank={option.placementRank} participantCount={option.participantCount} />
      </div>
    </div>
  )
})

type TopTradeRowProps = {
  rank: number
  trade: ProfileShareTradeHighlight
}

const TopTradeRow = ({ rank, trade }: TopTradeRowProps) => {
  const assetLabel = formatShareAssetLabel(trade.symbol)
  const tradePnlClass = pnlColorClass(trade.roePercent)

  return (
    <li
      className="box-border flex w-full items-center gap-3 overflow-hidden border border-white/10 bg-white/[0.04] px-4 py-3 text-base"
      style={{ borderRadius: 12 }}
    >
      <span className="w-5 shrink-0 font-mono text-sm text-white/40">{rank}</span>
      <span className="min-w-[3.5rem] shrink-0 font-semibold text-white">{assetLabel}</span>
      <span
        className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeClassForSide(trade.side)}`}
        style={{ borderRadius: 9999 }}
      >
        {directionLabel(trade.side)} {trade.leverage}x
      </span>
      <span className={`ml-auto shrink-0 font-mono font-semibold ${tradePnlClass}`}>
        {trade.roePercent >= 0 ? "+" : ""}
        {formatPercent(trade.roePercent)}
      </span>
    </li>
  )
}
