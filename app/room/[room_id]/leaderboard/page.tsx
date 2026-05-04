import Link from "next/link"
import { redirect } from "next/navigation"
import { liquidateRoom } from "@/actions/liquidate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchMarketPrices } from "@/lib/pricing"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { formatUsd } from "@/lib/format"
import { calculatePnl } from "@/lib/perpetuals"
import type { ParticipantWithUser, Position, SupportedSymbol } from "@/lib/types"

export const dynamic = "force-dynamic"

type LeaderboardPageProps = {
  params: Promise<{
    room_id: string
  }>
}

type RoomPosition = Position & {
  room_participants: {
    id: string
    room_id: string
  } | null
}

type RankedParticipant = ParticipantWithUser & {
  unrealizedPnl: number
  displayEquity: number
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { room_id: roomId } = await params
  const user = await requireCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  await liquidateRoom(roomId)

  const sql = getSql()
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
        'email', u.email
      ) as users
    from room_participants rp
    join users u on u.id = rp.user_id
    where rp.room_id = ${roomId}
  `) as ParticipantWithUser[]

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

      return {
        ...participant,
        unrealizedPnl,
        displayEquity: participant.available_margin + unrealizedPnl,
      }
    })
    .sort((a, b) => b.displayEquity - a.displayEquity)

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent-neon">Leaderboard</p>
            <h1 className="mt-2 text-4xl font-semibold text-text-primary">Live room rankings</h1>
          </div>
          <Button asChild variant="outline">
            <Link href={`/room/${roomId}`}>Back to lobby</Link>
          </Button>
        </header>

        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-text-primary">Ranked by total equity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Total equity</TableHead>
                  <TableHead>Unrealized PnL</TableHead>
                  <TableHead>Available margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedParticipants.map((participant, index) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-mono">#{index + 1}</TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {participant.users?.username ?? "Anonymous"}
                    </TableCell>
                    <TableCell className="font-mono">{formatUsd(participant.displayEquity)}</TableCell>
                    <TableCell
                      className={`font-mono ${participant.unrealizedPnl >= 0 ? "text-profit" : "text-loss"}`}
                    >
                      {formatUsd(participant.unrealizedPnl)}
                    </TableCell>
                    <TableCell className="font-mono">{formatUsd(participant.available_margin)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
