"use client"

import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react"
import { toPng } from "html-to-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_PATH, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"
import { formatPercent, formatProfileDate } from "@/lib/format"
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
const ACCENT_BLUE = "#0a8cff"
const ACCENT_NEON = "#17c9ff"

const directionLabel = (side: ProfileShareTradeHighlight["side"]) => (side === "LONG" ? "LONG" : "SHORT")

const badgeClassForSide = (side: ProfileShareTradeHighlight["side"]) =>
  side === "LONG"
    ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/35"
    : "bg-rose-500/25 text-rose-50 ring-1 ring-rose-400/40"

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const pnlColorClass = (value: number) => (value >= 0 ? "text-[#00c97a]" : "text-[#ff3b5c]")

const logoAspectRatio = BRAND_LOGO_WIDTH / BRAND_LOGO_HEIGHT

const resolveLogoAbsoluteUrl = (assetBaseUrl: string) => {
  if (assetBaseUrl) {
    return `${assetBaseUrl.replace(/\/$/, "")}${BRAND_LOGO_PATH}`
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${BRAND_LOGO_PATH}`
  }

  return BRAND_LOGO_PATH
}

const loadLogoAsDataUrl = async (absoluteUrl: string): Promise<string | null> => {
  if (typeof window === "undefined") {
    return null
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

  try {
    const response = await fetch(absoluteUrl)

    if (!response.ok) {
      return null
    }

    const blob = await response.blob()

    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(typeof reader.result === "string" ? reader.result : null)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const waitForLogoImage = async (img: HTMLImageElement, dataUrl: string) => {
  img.src = dataUrl

  if (typeof img.decode === "function") {
    await img.decode()
    return
  }

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error("Logo failed to load"))
  })
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

  const [logoAbsoluteUrl, setLogoAbsoluteUrl] = useState("")
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)

  useEffect(() => {
    setLogoAbsoluteUrl(resolveLogoAbsoluteUrl(assetBaseUrl))
  }, [assetBaseUrl])

  useEffect(() => {
    if (!logoAbsoluteUrl) {
      return
    }

    let cancelled = false

    const preload = async () => {
      const dataUrl = await loadLogoAsDataUrl(logoAbsoluteUrl)

      if (!cancelled) {
        setLogoDataUrl(dataUrl)
      }
    }

    void preload()

    return () => {
      cancelled = true
    }
  }, [logoAbsoluteUrl])

  const logoSrc = logoDataUrl ?? logoAbsoluteUrl

  const handleExportPng = async () => {
    const node = cardRef.current

    if (!node || !selectedOption) {
      return
    }

    setIsExporting(true)

    try {
      const logoImg = node.querySelector<HTMLImageElement>("img[data-share-logo]")
      const embedded =
        logoDataUrl ?? (logoAbsoluteUrl ? await loadLogoAsDataUrl(logoAbsoluteUrl) : null)

      if (logoImg && embedded) {
        await waitForLogoImage(logoImg, embedded)
      }

      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        width: cardWidth,
        height: cardHeight,
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
              <ShareCardCanvas ref={cardRef} option={selectedOption} logoSrc={logoSrc} />
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          onClick={() => void handleExportPng()}
          disabled={!selectedOption || isExporting}
          className="w-fit gap-2"
          aria-label="Download share card as PNG"
        >
          {isExporting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
          {isExporting ? "Exporting…" : "Download PNG"}
        </Button>
      </CardContent>
    </Card>
  )
}

type ShareCardCanvasProps = {
  option: ProfileShareRoomOption
  logoSrc: string
}

const ShareCardCanvas = forwardRef<HTMLDivElement, ShareCardCanvasProps>(function ShareCardCanvas(
  { option, logoSrc },
  ref,
) {
  const gradientId = `dropletGrad-${useId().replace(/:/g, "")}`
  const glowId = `dropletGlow-${useId().replace(/:/g, "")}`
  const pnlClass = pnlColorClass(option.pnlPercent)
  const endLabel = option.isOngoing ? "Ongoing" : formatProfileDate(option.endDateIso)
  const dateRange = `${formatProfileDate(option.startDateIso)} – ${endLabel}`

  return (
    <div
      ref={ref}
      className="relative flex overflow-hidden rounded-2xl text-white ring-1"
      style={{
        width: cardWidth,
        height: cardHeight,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        backgroundColor: CARD_BG,
        boxShadow: `inset 0 0 0 1px ${CARD_RING}`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a8cff]/10 via-transparent to-[#17c9ff]/5" aria-hidden />

      <div className="pointer-events-none absolute -right-8 top-1/2 w-[42%] -translate-y-1/2" aria-hidden>
        <svg viewBox="0 0 200 260" className="h-full w-full" preserveAspectRatio="xMaxYMid meet">
          <defs>
            <radialGradient id={glowId} cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor={ACCENT_NEON} stopOpacity="0.45" />
              <stop offset="100%" stopColor={ACCENT_BLUE} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={gradientId} x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor={ACCENT_NEON} stopOpacity="0.95" />
              <stop offset="100%" stopColor={ACCENT_BLUE} stopOpacity="0.75" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="130" rx="90" ry="100" fill={`url(#${glowId})`} />
          <path
            d="M100 28 C72 28 52 58 52 92 C52 138 100 198 100 198 C100 198 148 138 148 92 C148 58 128 28 100 28 Z"
            fill={`url(#${gradientId})`}
            opacity={0.88}
          />
          <path
            d="M100 28 C72 28 52 58 52 92 C52 138 100 198 100 198 C100 198 148 138 148 92 C148 58 128 28 100 28 Z"
            fill="none"
            stroke={ACCENT_NEON}
            strokeWidth="2"
            opacity={0.35}
          />
        </svg>
      </div>

      <div className="relative z-10 flex w-full flex-col justify-between p-10 pr-[38%]">
        <div style={{ width: 220, height: Math.round(220 / logoAspectRatio) }}>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- html-to-image needs plain img + data URL
            <img
              data-share-logo
              src={logoSrc}
              alt={`${BRAND_NAME} logo`}
              width={BRAND_LOGO_WIDTH}
              height={BRAND_LOGO_HEIGHT}
              className="block h-full w-full object-contain object-left"
            />
          ) : null}
        </div>

        <div className="mt-6 flex flex-1 flex-col">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">{option.room.name}</h2>
          <p className="mt-3 text-lg text-white/70">
            <span className="font-mono text-white">#{option.placementRank}</span>
            <span className="text-white/40"> of </span>
            <span className="font-mono text-white">{option.participantCount}</span>
            <span> traders</span>
            <span className="mx-2 text-white/30">·</span>
            <span>Number of trades: </span>
            <span className="font-mono text-white">{option.entryCount}</span>
          </p>
          <p className="mt-2 text-base text-white/50">{dateRange}</p>

          <div className={`mt-5 text-7xl font-bold leading-none ${pnlClass}`}>
            {option.pnlPercent >= 0 ? "+" : ""}
            {formatPercent(option.pnlPercent)}
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/45">Top trades</p>
          {option.topTrades.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">No closed trades yet.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {option.topTrades.map((trade, index) => (
                <TopTradeRow key={trade.tradeId} rank={index + 1} trade={trade} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
})

type TopTradeRowProps = {
  rank: number
  trade: ProfileShareTradeHighlight
}

const TopTradeRow = ({ rank, trade }: TopTradeRowProps) => {
  const assetLabel = trade.symbol.replace("USDT", "")
  const tradePnlClass = pnlColorClass(trade.roePercent)

  return (
    <li className="flex items-center gap-4 text-base">
      <span className="w-6 font-mono text-sm text-white/40">{rank}</span>
      <span className="min-w-[4rem] text-lg font-semibold text-white">{assetLabel}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeClassForSide(trade.side)}`}
      >
        {directionLabel(trade.side)} {trade.leverage}x
      </span>
      <span className={`ml-auto font-mono text-lg font-semibold ${tradePnlClass}`}>
        {trade.roePercent >= 0 ? "+" : ""}
        {formatPercent(trade.roePercent)}
      </span>
    </li>
  )
}
