"use client"

import { Fragment, useState } from "react"
import { getProfileRoomBreakdown } from "@/actions/get-profile-room-breakdown"
import { ProfileCompetitionBreakdownStrip } from "@/components/profile/profile-competition-breakdown-strip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPercent } from "@/lib/format"
import { computeProfileRoomCompetitionStats } from "@/lib/profile-room-competition-stats"
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

const competitionHistoryTitleClass = "text-xl font-semibold text-text-primary sm:text-2xl"

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
    return (
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className={competitionHistoryTitleClass}>Competition History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">No competitions yet. Join a room from the dashboard to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle className={competitionHistoryTitleClass}>Competition History</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Rank</TableHead>
              <TableHead>Competition</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>End date</TableHead>
              <TableHead className="text-right">P&amp;L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
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
                      <Badge variant="outline" className={`font-mono ${rankBadgeClass(row.placementRank)}`}>
                        #{row.placementRank}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-text-primary">{row.room.name}</TableCell>
                    <TableCell className="font-mono text-text-secondary">{row.participantCount}</TableCell>
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
                          <ProfileCompetitionBreakdownStrip
                            stats={computeProfileRoomCompetitionStats(breakdown.trades, breakdown.positions)}
                          />
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
