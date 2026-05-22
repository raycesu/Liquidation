"use client"

import { Fragment, useState } from "react"
import { getProfileRoomBreakdown } from "@/actions/get-profile-room-breakdown"
import { ProfileCompetitionBreakdownStrip } from "@/components/profile/profile-competition-breakdown-strip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPercent, formatProfileDate } from "@/lib/format"
import { computeProfileRoomCompetitionStats } from "@/lib/profile-room-competition-stats"
import { getCompetitionPhase, type CompetitionPhase } from "@/lib/room-competition-status"
import type { Position, ProfileCompetitionRow, Trade } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"

type BreakdownState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; trades: Trade[]; positions: Position[] }
  | { status: "error"; message: string }

type ProfileCompetitionTableProps = {
  rows: ProfileCompetitionRow[]
}

const competitionColumnOffsetClass = "pl-11"

const tableHeadClassName =
  "h-8 py-2 text-[13px] font-medium uppercase tracking-wider text-text-secondary/90"

const phaseCopy: Record<CompetitionPhase, { label: string; badgeClass: string }> = {
  upcoming: {
    label: "Upcoming",
    badgeClass:
      "rounded-full border border-white/20 bg-muted/30 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/30",
  },
  ongoing: {
    label: "Live",
    badgeClass:
      "rounded-full border-profit/35 bg-profit/15 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-profit hover:bg-profit/15",
  },
  ended: {
    label: "Ended",
    badgeClass:
      "rounded-full border border-white/25 bg-muted/30 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/30",
  },
}

const formatCompetitionSubtitle = (row: ProfileCompetitionRow) => {
  if (row.isOngoing) {
    return `Started ${formatProfileDate(row.room.start_date)}`
  }

  return `Ended ${formatProfileDate(row.room.end_date)}`
}

const rankTagClass = (rank: number) => {
  if (rank === 1) {
    return "border-amber-400/70 text-amber-200"
  }

  if (rank === 2) {
    return "border-slate-300/60 text-slate-200"
  }

  if (rank === 3) {
    return "border-amber-700/60 text-amber-100"
  }

  return "border-border text-text-secondary"
}

const CompetitionStatusBadge = ({ phase }: { phase: CompetitionPhase }) => {
  const { label, badgeClass } = phaseCopy[phase]

  return (
    <Badge variant="outline" className={cn("font-medium", badgeClass)}>
      {label}
    </Badge>
  )
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
        <CardContent className="py-6">
          <p className="text-sm text-text-secondary">
            No competitions yet. Join a room from the dashboard to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-0 border-border bg-surface py-0">
      <CardContent className="px-0 pt-3 pb-3 sm:px-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className={cn(tableHeadClassName, competitionColumnOffsetClass)}>
                Competition
              </TableHead>
              <TableHead className={cn(tableHeadClassName, "w-28")}>Participants</TableHead>
              <TableHead className={cn(tableHeadClassName, "w-28")}>Status</TableHead>
              <TableHead className={cn(tableHeadClassName, "w-28 text-right")}>P&amp;L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isOpen = expandedRoomId === row.room.id
              const breakdown = breakdownByRoom[row.room.id]
              const phase = getCompetitionPhase(row.room)
              const { label: statusLabel } = phaseCopy[phase]

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
                    aria-label={`${row.room.name}, rank ${row.placementRank}, ${statusLabel}, toggle details`}
                  >
                    <TableCell className="whitespace-normal py-3">
                      <div className="flex items-start gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="mt-0.5 shrink-0 text-text-secondary"
                          aria-hidden
                          tabIndex={-1}
                          onClick={(event) => {
                            event.stopPropagation()
                            void handleToggleRow(row.room.id)
                          }}
                        >
                          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </Button>
                        <Badge
                          variant="outline"
                          className={cn(
                            "mt-0.5 shrink-0 rounded-full border bg-transparent px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
                            rankTagClass(row.placementRank),
                          )}
                        >
                          #{row.placementRank}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-[15px] font-medium text-text-primary">{row.room.name}</p>
                          <p className="mt-0.5 text-xs text-text-secondary">
                            {formatCompetitionSubtitle(row)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-text-secondary">{row.participantCount}</TableCell>
                    <TableCell>
                      <CompetitionStatusBadge phase={phase} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono text-[15px] font-semibold tabular-nums",
                        row.pnlPercent >= 0 ? "text-profit" : "text-loss",
                      )}
                    >
                      {row.pnlPercent >= 0 ? "+" : ""}
                      {formatPercent(row.pnlPercent)}
                    </TableCell>
                  </TableRow>
                  {isOpen ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={4}
                        className="border-t border-border/50 bg-muted/20 p-4 sm:p-5"
                      >
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
