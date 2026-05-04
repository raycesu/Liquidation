"use client"

import { forwardRef, useId, useMemo, useRef, useState } from "react"
import { toPng } from "html-to-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/brand"
import { formatNumber, formatPercent } from "@/lib/format"
import type { ProfileShareRoomOption, ProfileSpotlightTrade } from "@/lib/types"
import { Download, Loader2 } from "lucide-react"

type ProfileShareCardSectionProps = {
  shareRoomOptions: ProfileShareRoomOption[]
  assetBaseUrl: string
}

const cardWidth = 1200
const cardHeight = 630

const directionLabel = (side: ProfileSpotlightTrade["side"]) => (side === "LONG" ? "LONG" : "SHORT")

const badgeClassForSide = (side: ProfileSpotlightTrade["side"]) =>
  side === "LONG"
    ? "bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-400/40"
    : "bg-rose-500/30 text-rose-50 ring-1 ring-rose-400/50"

const firstTradeId = (opt: ProfileShareRoomOption | undefined) =>
  opt?.defaultSpotlight?.tradeId ?? opt?.spotlightCandidates[0]?.tradeId ?? ""

export const ProfileShareCardSection = ({ shareRoomOptions, assetBaseUrl }: ProfileShareCardSectionProps) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const firstOpt = shareRoomOptions[0]
  const [selectedRoomId, setSelectedRoomId] = useState(firstOpt?.room.id ?? "")
  const [selectedTradeId, setSelectedTradeId] = useState(firstTradeId(firstOpt))
  const [isExporting, setIsExporting] = useState(false)

  const selectedOption = useMemo(
    () => shareRoomOptions.find((o) => o.room.id === selectedRoomId),
    [shareRoomOptions, selectedRoomId],
  )

  const resolvedTradeId = useMemo(() => {
    const list = selectedOption?.spotlightCandidates ?? []

    if (list.length === 0) {
      return ""
    }

    if (list.some((t) => t.tradeId === selectedTradeId)) {
      return selectedTradeId
    }

    return firstTradeId(selectedOption)
  }, [selectedOption, selectedTradeId])

  const spotlight = useMemo(() => {
    if (!selectedOption) {
      return null
    }

    return (
      selectedOption.spotlightCandidates.find((t) => t.tradeId === resolvedTradeId) ??
      selectedOption.defaultSpotlight
    )
  }, [selectedOption, resolvedTradeId])

  const logoSrc = assetBaseUrl
    ? `${assetBaseUrl.replace(/\/$/, "")}${BRAND_LOGO_SRC}`
    : BRAND_LOGO_SRC

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId)
    const opt = shareRoomOptions.find((o) => o.room.id === roomId)
    setSelectedTradeId(firstTradeId(opt))
  }

  const handleExportPng = async () => {
    const node = cardRef.current

    if (!node || !spotlight) {
      return
    }

    setIsExporting(true)

    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        width: cardWidth,
        height: cardHeight,
      })
      const anchor = document.createElement("a")
      anchor.href = dataUrl
      anchor.download = `${BRAND_NAME.toLowerCase()}-trade-${spotlight.symbol.replace(":", "-")}.png`
      anchor.click()
    } finally {
      setIsExporting(false)
    }
  }

  if (shareRoomOptions.length === 0) {
    return (
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-text-primary">Share card</CardTitle>
          <CardDescription>Join a competition and close a trade to generate a shareable card.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const pnlClass = spotlight && spotlight.roePercent >= 0 ? "text-[#4CE6B6]" : "text-rose-300"

  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle className="text-text-primary">Share card</CardTitle>
        <CardDescription>
          Export a trading card for socials—spotlight trade, placement, and competition context.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-share-room">Competition</Label>
            <select
              id="profile-share-room"
              className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              value={selectedRoomId}
              onChange={(event) => handleRoomChange(event.target.value)}
              aria-label="Select competition for share card"
            >
              {shareRoomOptions.map((opt) => (
                <option key={opt.room.id} value={opt.room.id}>
                  {opt.room.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-share-trade">Spotlight trade</Label>
            <select
              id="profile-share-trade"
              className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              value={resolvedTradeId}
              onChange={(event) => setSelectedTradeId(event.target.value)}
              disabled={!selectedOption?.spotlightCandidates.length}
              aria-label="Select trade to highlight on share card"
            >
              {selectedOption?.spotlightCandidates.map((t) => (
                <option key={t.tradeId} value={t.tradeId}>
                  {t.symbol.replace("USDT", "")} · {directionLabel(t.side)} {t.leverage}x ·{" "}
                  {formatPercent(t.roePercent)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-background/60 p-4">
          <p className="mb-3 text-xs text-text-secondary">Preview (scaled)</p>
          <div
            className="origin-top-left scale-[0.42] sm:scale-[0.48]"
            style={{ width: cardWidth * 0.48, height: cardHeight * 0.48 }}
          >
            {spotlight ? (
              <ShareCardCanvas
                ref={cardRef}
                spotlight={spotlight}
                competitionPnlPercent={selectedOption?.pnlPercent ?? 0}
                logoSrc={logoSrc}
                pnlClass={pnlClass}
              />
            ) : (
              <div
                ref={cardRef}
                className="flex items-center justify-center rounded-2xl bg-[#03140e] text-lg text-slate-400"
                style={{ width: cardWidth, height: cardHeight }}
              >
                No closed trades in this competition yet.
              </div>
            )}
          </div>
        </div>

        <Button
          type="button"
          onClick={() => void handleExportPng()}
          disabled={!spotlight || isExporting}
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
  spotlight: ProfileSpotlightTrade
  competitionPnlPercent: number
  logoSrc: string
  pnlClass: string
}

const ShareCardCanvas = forwardRef<HTMLDivElement, ShareCardCanvasProps>(function ShareCardCanvas(
  { spotlight, competitionPnlPercent, logoSrc, pnlClass },
  ref,
) {
  const gradientId = `cardMint-${useId().replace(/:/g, "")}`
  const assetLabel = spotlight.symbol.replace("USDT", "")

  return (
    <div
      ref={ref}
      className="relative flex overflow-hidden rounded-2xl bg-[#03140e] text-white ring-1 ring-[#0d3d2f]"
      style={{ width: cardWidth, height: cardHeight, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[55%] opacity-90" aria-hidden>
        <svg viewBox="0 0 400 320" className="h-full w-full text-[#4CE6B6]/35" preserveAspectRatio="xMaxYMid meet">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4CE6B6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4CE6B6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <ellipse
              key={i}
              cx="78%"
              cy="48%"
              rx={40 + i * 28}
              ry={28 + i * 20}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.1}
              opacity={0.22 - i * 0.02}
            />
          ))}
          <path
            d="M 310 40 L 360 200 L 260 200 Z"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="3"
            opacity={0.55}
          />
        </svg>
      </div>

      <div className="relative z-10 flex w-[58%] flex-col justify-between p-10 pr-6">
        <div>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- html-to-image needs plain img */}
            <img src={logoSrc} alt="" className="h-10 w-auto max-w-[220px] object-contain object-left" />
          </div>
          <p className="mt-2 text-lg font-medium tracking-wide text-white/90">{BRAND_NAME}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-2xl font-semibold text-white">
            <span className="inline-block size-2.5 rounded-full bg-[#4CE6B6]" aria-hidden />
            {assetLabel}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wide ${badgeClassForSide(spotlight.side)}`}
          >
            {directionLabel(spotlight.side)} {spotlight.leverage}x
          </span>
        </div>

        <div className={`mt-2 text-6xl font-bold leading-none ${pnlClass}`}>
          {spotlight.roePercent >= 0 ? "+" : ""}
          {formatPercent(spotlight.roePercent)}
        </div>

        <div className="mt-6 grid max-w-md grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/45">Entry</p>
            <p className="mt-1 font-mono text-lg text-white">{formatNumber(spotlight.entryPrice)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white/45">Mark (close)</p>
            <p className="mt-1 font-mono text-lg text-white">{formatNumber(spotlight.closePrice)}</p>
          </div>
        </div>

        <div className="mt-4 space-y-1 border-t border-white/10 pt-4 text-sm text-white/55">
          <p>
            <span className="text-white/45">Competition: </span>
            <span className="text-white/90">{spotlight.roomName}</span>
          </p>
          <p>
            <span className="text-white/45">Placement: </span>
            <span className="font-mono text-white/90">#{spotlight.placementRank}</span>
            <span className="mx-2 text-white/30">·</span>
            <span className="text-white/45">Room P&amp;L: </span>
            <span className={`font-mono ${competitionPnlPercent >= 0 ? "text-[#4CE6B6]" : "text-rose-300"}`}>
              {competitionPnlPercent >= 0 ? "+" : ""}
              {formatPercent(competitionPnlPercent)}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
})
