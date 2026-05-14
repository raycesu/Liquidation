import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchMarketPrices } from "@/lib/pricing"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { formatPercent, formatUsd } from "@/lib/format"
import { calculatePnl } from "@/lib/perpetuals"
import type { ParticipantWithUser, Position, SupportedSymbol } from "@/lib/types"

export const dynamic = "force-dynamic"

const pageSize = 10

type LeaderboardPageProps = {
  params: Promise<{
    room_id: string
  }>
  searchParams?: Promise<{
    page?: string | string[]
  }>
}

type RoomPosition = Position & {
  room_participants: {
    id: string
    room_id: string
  } | null
}

type RankedParticipant = ParticipantWithUser & {
  realizedPnl: number
  unrealizedPnl: number
  totalPnl: number
  closedTrades: number
  winningTrades: number
  winRate: number | null
}

type TradeStatsRow = {
  participant_id: string
  realized_pnl: number
  closed_trades: number
  winning_trades: number
}

type PaginationItem = number | "ellipsis"

const getInitials = (username: string) =>
  username
    .split(/[\s-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TR"

const parsePage = (page: string | string[] | undefined) => {
  const value = Array.isArray(page) ? page[0] : page
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

const createPageItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages]
}

const getPageHref = (roomId: string, page: number) => `/room/${roomId}/leaderboard?page=${page}`

const getPnlClassName = (pnl: number) => {
  if (pnl > 0) {
    return "text-profit"
  }

  if (pnl < 0) {
    return "text-loss"
  }

  return "text-text-secondary"
}

export default async function LeaderboardPage({ params, searchParams }: LeaderboardPageProps) {
  const { room_id: roomId } = await params
  const search = await searchParams
  const user = await requireCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const sql = getSql()
  const membershipRows = (await sql`
    select id::text
    from room_participants
    where room_id = ${roomId}
      and user_id = ${user.id}
    limit 1
  `) as { id: string }[]

  if (!membershipRows[0]) {
    redirect("/dashboard")
  }

  const participants = (await sql`
    select
      rp.id::text,
      rp.room_id::text,
      rp.user_id,
      rp.available_margin::float8 as available_margin,
      rp.total_equity::float8 as total_equity,
      rp.created_at::text,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'image_url', u.image_url
      ) as users
    from room_participants rp
    join users u on u.id = rp.user_id
    where rp.room_id = ${roomId}
  `) as ParticipantWithUser[]

  const tradeStatsRows = (await sql`
    select
      t.participant_id::text,
      coalesce(sum(t.realized_pnl), 0)::float8 as realized_pnl,
      count(*)::int as closed_trades,
      (count(*) filter (where t.realized_pnl > 0))::int as winning_trades
    from trades t
    join room_participants rp on rp.id = t.participant_id
    where rp.room_id = ${roomId}
      and t.direction in ('CLOSE_LONG', 'CLOSE_SHORT')
      and t.realized_pnl is not null
    group by t.participant_id
  `) as TradeStatsRow[]

  const roomPositions = (await sql`
    select
      p.id::text,
      p.participant_id::text,
      p.symbol,
      p.side,
      p.leverage,
      p.size::float8 as size,
      p.margin_allocated::float8 as margin_allocated,
      p.entry_price::float8 as entry_price,
      p.liquidation_price::float8 as liquidation_price,
      p.is_open,
      p.created_at::text,
      p.closed_at::text,
      json_build_object(
        'id', rp.id::text,
        'room_id', rp.room_id::text
      ) as room_participants
    from positions p
    join room_participants rp on rp.id = p.participant_id
    where p.is_open = true
      and rp.room_id = ${roomId}
  `) as RoomPosition[]
  const symbols = Array.from(new Set(roomPositions.map((position) => position.symbol))) as SupportedSymbol[]
  const prices: Partial<Record<SupportedSymbol, number>> =
    symbols.length > 0 ? await fetchMarketPrices(symbols) : {}
  const pnlByParticipant = new Map<string, number>()
  const statsByParticipant = new Map(tradeStatsRows.map((row) => [row.participant_id, row]))

  roomPositions.forEach((position) => {
    const livePrice = prices[position.symbol]

    if (!livePrice) {
      return
    }

    const pnl = calculatePnl({
      entryPrice: position.entry_price,
      livePrice,
      side: position.side,
      size: position.size,
    })
    pnlByParticipant.set(position.participant_id, (pnlByParticipant.get(position.participant_id) ?? 0) + pnl)
  })

  const rankedParticipants: RankedParticipant[] = participants
    .map((participant) => {
      const unrealizedPnl = pnlByParticipant.get(participant.id) ?? 0
      const stats = statsByParticipant.get(participant.id)
      const realizedPnl = stats?.realized_pnl ?? 0
      const closedTrades = stats?.closed_trades ?? 0
      const winningTrades = stats?.winning_trades ?? 0
      const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : null

      return {
        ...participant,
        realizedPnl,
        unrealizedPnl,
        totalPnl: realizedPnl + unrealizedPnl,
        closedTrades,
        winningTrades,
        winRate,
      }
    })
    .sort((a, b) => b.totalPnl - a.totalPnl || b.available_margin - a.available_margin)

  const requestedPage = parsePage(search?.page)
  const totalPages = Math.max(1, Math.ceil(rankedParticipants.length / pageSize))
  const currentPage = Math.min(requestedPage, totalPages)
  const pageStartIndex = (currentPage - 1) * pageSize
  const visibleParticipants = rankedParticipants.slice(pageStartIndex, pageStartIndex + pageSize)
  const pageItems = createPageItems(currentPage, totalPages)

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(23,201,255,0.18),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(10,140,255,0.14),transparent_32%),linear-gradient(180deg,rgba(3,9,20,0),rgba(3,9,20,0.82))]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.035em] text-white drop-shadow-[0_12px_28px_rgba(10,140,255,0.24)] sm:text-5xl">
              PNL Leaderboard
            </h1>
          </div>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-10 w-fit rounded-full border-border/70 bg-surface/80 px-4 text-sm font-semibold text-text-primary shadow-lg shadow-accent-blue/10 backdrop-blur transition-colors hover:border-accent-neon/45 hover:bg-surface-elevated hover:text-white dark:bg-surface/80 dark:hover:bg-surface-elevated"
            aria-label="Back to room lobby"
          >
            <Link href={`/room/${roomId}`}>
              <ChevronLeft className="size-4" />
              Back to lobby
            </Link>
          </Button>
        </header>

        <Card className="overflow-hidden border-border/60 bg-surface/70 shadow-2xl shadow-accent-blue/5 backdrop-blur-xl">
          <CardContent className="p-0">
            <Table className="min-w-[880px] text-sm [&_td]:px-5 [&_td]:py-4">
              <TableHeader className="bg-background/30 [&_tr]:border-border/40 [&_th]:h-12 [&_th]:px-5 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.18em] [&_th]:text-text-secondary">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-20 text-center">Rank</TableHead>
                  <TableHead>Trader Name</TableHead>
                  <TableHead className="text-left">PnL</TableHead>
                  <TableHead className="text-center">Win Rate</TableHead>
                  <TableHead className="text-center">Number of Trades</TableHead>
                  <TableHead className="text-right">Available Margin</TableHead>
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
                        <TableCell className="text-center text-sm font-medium tabular-nums text-text-primary">{globalRank}</TableCell>
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
                    <Link href={getPageHref(roomId, currentPage - 1)}>
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
                        {item === currentPage ? <span>{item}</span> : <Link href={getPageHref(roomId, item)}>{item}</Link>}
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
                    <Link href={getPageHref(roomId, currentPage + 1)}>
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
      </div>
    </main>
  )
}
