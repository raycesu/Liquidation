"use client"

import { Fragment, useState } from "react"
import { getProfileRoomBreakdown } from "@/actions/get-profile-room-breakdown"
import { TradeHistoryTab } from "@/components/trade-history-tab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatNumber, formatPercent } from "@/lib/format"
import type { Position, ProfileCompetitionRow, Trade } from "@/lib/types"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"

type BreakdownState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; trades: Trade[]; positions: Position[] }
  | { status: "error"; message: string }

type ProfileCompetitionTableProps = {
  rows: ProfileCompetitionRow[]
}

const formatEndDate = (iso: string, isOngoing: boolean) => {
  if (isOngoing) {
    return "Ongoing"
  }

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

const rankMedal = (rank: number) => {
  if (rank === 1) {
    return "Gold"
  }

  if (rank === 2) {
    return "Silver"
  }

  if (rank === 3) {
    return "Bronze"
  }

  return null
}

const rankBadgeClass = (rank: number) => {
  if (rank === 1) {
    return "border-amber-400/60 bg-amber-500/15 text-amber-200"
  }

  if (rank === 2) {
    return "border-slate-300/50 bg-slate-400/15 text-slate-200"
  }

  if (rank === 3) {
    return "border-amber-700/60 bg-amber-800/30 text-amber-100"
  }

  return "border-border text-text-secondary"
}

export const ProfileCompetitionTable = ({ rows }: ProfileCompetitionTableProps) => {
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null)
  const [breakdownByRoom, setBreakdownByRoom] = useState<Record<string, BreakdownState>>({})

  const handleToggleRow = async (roomId: string) => {
    if (expandedRoomId === roomId) {
      setExpandedRoomId(null)
      return
    }

    setExpandedRoomId(roomId)

    const existing = breakdownByRoom[roomId]

    if (existing?.status === "ready" || existing?.status === "loading") {
      return
    }

    setBreakdownByRoom((prev) => ({ ...prev, [roomId]: { status: "loading" } }))

    const result = await getProfileRoomBreakdown({ roomId })

    if (!result.ok) {
      setBreakdownByRoom((prev) => ({
        ...prev,
        [roomId]: { status: "error", message: result.error },
      }))
      return
    }

    setBreakdownByRoom((prev) => ({
      ...prev,
      [roomId]: { status: "ready", trades: result.data.trades, positions: result.data.positions },
    }))
  }

  if (rows.length === 0) {
    return null
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle className="text-text-primary">Competition history</CardTitle>
        <p className="text-sm text-text-secondary">
          Rankings use the same display equity as the live leaderboard. Expand a row for trades and positions.
        </p>
      </CardHeader>
      <CardContent className="px-0 sm:px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Rank</TableHead>
              <TableHead>Competition</TableHead>
              <TableHead>Entries</TableHead>
              <TableHead>End date</TableHead>
              <TableHead className="text-right">P&amp;L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const medal = rankMedal(row.placementRank)
              const isOpen = expandedRoomId === row.room.id
              const breakdown = breakdownByRoom[row.room.id]

              return (
                <Fragment key={row.room.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => void handleToggleRow(row.room.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        void handleToggleRow(row.room.id)
                      }
                    }}
                    tabIndex={0}
                    aria-expanded={isOpen}
                    aria-label={`${row.room.name}, rank ${row.placementRank}, toggle details`}
                  >
                    <TableCell className="w-10 align-middle">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-text-secondary"
                        aria-hidden
                        tabIndex={-1}
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleToggleRow(row.room.id)
                        }}
                      >
                        {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`font-mono ${rankBadgeClass(row.placementRank)}`}>
                          #{row.placementRank}
                        </Badge>
                        {medal ? (
                          <span className="text-xs font-medium text-text-secondary">{medal}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-text-primary">{row.room.name}</TableCell>
                    <TableCell className="font-mono text-text-secondary">{row.entryCount}</TableCell>
                    <TableCell className="text-text-secondary">
                      {formatEndDate(row.endDateIso, row.isOngoing)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${row.pnlPercent >= 0 ? "text-profit" : "text-loss"}`}
                    >
                      {formatPercent(row.pnlPercent)}
                    </TableCell>
                  </TableRow>
                  {isOpen ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="bg-background/80 p-4">
                        {breakdown?.status === "loading" ? (
                          <div className="flex items-center gap-2 text-text-secondary">
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                            <span>Loading breakdown…</span>
                          </div>
                        ) : null}
                        {breakdown?.status === "error" ? (
                          <p className="text-sm text-loss">{breakdown.message}</p>
                        ) : null}
                        {breakdown?.status === "ready" ? (
                          <div className="flex flex-col gap-6">
                            <div>
                              <h3 className="mb-2 text-sm font-semibold text-text-primary">Positions</h3>
                              <PositionSummaryTable positions={breakdown.positions} />
                            </div>
                            <div>
                              <h3 className="mb-2 text-sm font-semibold text-text-primary">Trades</h3>
                              <TradeHistoryTab trades={breakdown.trades} />
                            </div>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

const PositionSummaryTable = ({ positions }: { positions: Position[] }) => {
  if (positions.length === 0) {
    return <p className="text-sm text-text-secondary">No positions in this room.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Symbol</TableHead>
          <TableHead>Side</TableHead>
          <TableHead>Lev</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Entry</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-mono text-text-primary">{p.symbol.replace("USDT", "")}</TableCell>
            <TableCell className={p.side === "LONG" ? "text-profit" : "text-loss"}>{p.side}</TableCell>
            <TableCell className="font-mono">{p.leverage}x</TableCell>
            <TableCell className="text-text-secondary">{p.is_open ? "Open" : "Closed"}</TableCell>
            <TableCell className="font-mono">{formatNumber(p.entry_price)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
