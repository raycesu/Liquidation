import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPercent, formatUsd } from "@/lib/format"
import type { LeaderboardPageData } from "@/lib/room-leaderboard"

type PnlLeaderboardSectionProps = {
  leaderboardPage: LeaderboardPageData
  participantCount: number
  getPageHref: (page: number) => string
  actions?: ReactNode
}

const getInitials = (username: string) =>
  username
    .split(/[\s-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TR"

const getPnlClassName = (pnl: number) => {
  if (pnl > 0) {
    return "text-profit"
  }

  if (pnl < 0) {
    return "text-loss"
  }

  return "text-text-secondary"
}

export const PnlLeaderboardSection = ({
  leaderboardPage,
  participantCount,
  getPageHref,
  actions,
}: PnlLeaderboardSectionProps) => {
  const { currentPage, totalPages, pageStartIndex, visibleParticipants, pageItems } = leaderboardPage

  return (
    <section className="flex flex-col gap-8" aria-labelledby="pnl-leaderboard-title">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <h2
          id="pnl-leaderboard-title"
          className="font-heading text-4xl font-semibold tracking-[-0.035em] text-white drop-shadow-[0_12px_28px_rgba(10,140,255,0.24)] sm:text-5xl"
        >
          PNL Leaderboard
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Badge
            variant="outline"
            className="h-8 w-fit gap-2 rounded-full border-accent-neon/35 bg-accent-neon/10 px-3 text-sm font-semibold text-accent-neon"
          >
            <Users className="size-3.5" aria-hidden />
            {participantCount.toLocaleString("en-US")} participants
          </Badge>
          {actions}
        </div>
      </header>

      <Card className="overflow-hidden border-border/60 bg-surface/70 shadow-2xl shadow-accent-blue/5 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table className="min-w-[880px] text-sm [&_td]:px-5 [&_td]:py-4">
            <TableHeader className="bg-background/30 [&_tr]:border-border/40 [&_th]:h-12 [&_th]:px-5 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.18em] [&_th]:text-text-secondary">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-20 text-center">Rank</TableHead>
                <TableHead>Trader Name</TableHead>
                <TableHead
                  className="text-left"
                  title="Realized plus unrealized PnL from open positions at current marks"
                >
                  PnL
                </TableHead>
                <TableHead className="text-center">Win Rate</TableHead>
                <TableHead className="text-center">Number of Trades</TableHead>
                <TableHead className="text-right" title="Cash available to open new positions">
                  Free margin
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleParticipants.length > 0 ? (
                visibleParticipants.map((participant, index) => {
                  const username = participant.users?.username ?? "Anonymous"
                  const globalRank = pageStartIndex + index + 1
                  const avatarUrl = participant.users?.image_url

                  return (
                    <TableRow key={participant.id} className="border-border/35 hover:bg-surface-elevated/35">
                      <TableCell className="text-center text-sm font-medium tabular-nums text-text-primary">
                        {globalRank}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-accent-neon/20 bg-gradient-to-br from-accent-blue/40 via-surface-elevated to-accent-neon/20 ring-1 ring-white/5">
                            {avatarUrl ? (
                              <Image
                                src={avatarUrl}
                                alt={`${username} avatar`}
                                fill
                                className="object-cover"
                                sizes="44px"
                                unoptimized
                              />
                            ) : (
                              <span className="flex size-full items-center justify-center text-xs font-semibold text-text-primary">
                                {getInitials(username)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-text-primary">{username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`text-left font-semibold tabular-nums ${getPnlClassName(participant.totalPnl)}`}>
                        {formatUsd(participant.totalPnl)}
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-accent-neon">
                        {participant.winRate == null ? "--" : formatPercent(participant.winRate)}
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-text-primary">
                        {participant.closedTrades}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-text-primary">
                        {formatUsd(participant.available_margin)}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow className="border-border/35 hover:bg-transparent">
                  <TableCell colSpan={6} className="h-32 text-center text-text-secondary">
                    No traders in this room yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 ? (
            <div className="flex flex-col gap-3 border-t border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
              {currentPage > 1 ? (
                <Button
                  asChild
                  variant="ghost"
                  size="icon-sm"
                  className="border border-border/50 bg-background/30 text-text-secondary hover:text-text-primary"
                  aria-label="Previous leaderboard page"
                >
                  <Link href={getPageHref(currentPage - 1)}>
                    <ChevronLeft className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="border border-border/50 bg-background/30 text-text-secondary disabled:opacity-40"
                  disabled
                  aria-label="Previous leaderboard page"
                >
                  <span>
                    <ChevronLeft className="size-4" />
                  </span>
                </Button>
              )}

              <div className="flex items-center gap-2">
                {pageItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-1 font-mono text-sm text-text-secondary">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      asChild={item !== currentPage}
                      variant={item === currentPage ? "default" : "ghost"}
                      size="icon-sm"
                      className={
                        item === currentPage
                          ? "bg-gradient-to-br from-accent-blue to-accent-neon text-background shadow-lg shadow-accent-blue/20"
                          : "border border-border/50 bg-background/30 text-text-secondary hover:text-text-primary"
                      }
                      aria-current={item === currentPage ? "page" : undefined}
                    >
                      {item === currentPage ? <span>{item}</span> : <Link href={getPageHref(item)}>{item}</Link>}
                    </Button>
                  ),
                )}
              </div>

              {currentPage < totalPages ? (
                <Button
                  asChild
                  variant="ghost"
                  size="icon-sm"
                  className="border border-border/50 bg-background/30 text-text-secondary hover:text-text-primary"
                  aria-label="Next leaderboard page"
                >
                  <Link href={getPageHref(currentPage + 1)}>
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="border border-border/50 bg-background/30 text-text-secondary disabled:opacity-40"
                  disabled
                  aria-label="Next leaderboard page"
                >
                  <span>
                    <ChevronRight className="size-4" />
                  </span>
                </Button>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
