import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Leaderboard } from "@/components/leaderboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { formatUsd } from "@/lib/format"
import type { ParticipantWithUser, Room, RoomParticipant } from "@/lib/types"

export const dynamic = "force-dynamic"

type RoomPageProps = {
  params: Promise<{
    room_id: string
  }>
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { room_id: roomId } = await params
  const user = await requireCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const sql = getSql()
  const rooms = (await sql`
    select
      id::text,
      creator_id,
      name,
      join_code,
      starting_balance::float8 as starting_balance,
      start_date::text,
      end_date::text,
      is_active,
      created_at::text
    from rooms
    where id = ${roomId}
    limit 1
  `) as Room[]
  const room = rooms[0]

  if (!room) {
    notFound()
  }

  const participantRows = (await sql`
    select
      id::text,
      room_id::text,
      user_id,
      available_margin::float8 as available_margin,
      total_equity::float8 as total_equity,
      created_at::text
    from room_participants
    where room_id = ${room.id}
      and user_id = ${user.id}
    limit 1
  `) as RoomParticipant[]
  const participant = participantRows[0]

  if (!participant) {
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
    where rp.room_id = ${room.id}
    order by rp.total_equity desc
  `) as ParticipantWithUser[]

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-semibold text-text-primary">{room.name}</h1>
              <Badge className="bg-accent-blue/15 text-accent-neon hover:bg-accent-blue/15">
                {room.is_active ? "Active" : "Ended"}
              </Badge>
            </div>
            <p className="mt-2 text-text-secondary">
              Starting balance {formatUsd(room.starting_balance)}. Share this room code:{" "}
              <code className="rounded bg-surface-elevated px-2 py-1 font-mono tracking-[0.2em] text-accent-neon">
                {room.join_code}
              </code>
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/room/${room.id}/leaderboard`}>Leaderboard</Link>
            </Button>
            <Button asChild>
              <Link href={`/room/${room.id}/trade`}>Enter terminal</Link>
            </Button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-sm text-text-secondary">Your live equity</CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-3xl text-text-primary">
              {formatUsd(participant.available_margin)}
            </CardContent>
          </Card>
          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-sm text-text-secondary">Available margin</CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-3xl text-text-primary">
              {formatUsd(participant.available_margin)}
            </CardContent>
          </Card>
          <Card className="border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-sm text-text-secondary">Participants</CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-3xl text-text-primary">
              {participants.length}
            </CardContent>
          </Card>
        </section>

        <Leaderboard participants={participants} />
      </div>
    </main>
  )
}
