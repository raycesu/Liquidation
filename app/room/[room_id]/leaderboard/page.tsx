import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { PnlLeaderboardSection } from "@/components/room/pnl-leaderboard-section"
import { Button } from "@/components/ui/button"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { getRankedParticipants, paginateRankedParticipants, parseLeaderboardPage } from "@/lib/room-leaderboard"
import type { ParticipantWithUser } from "@/lib/types"

export const dynamic = "force-dynamic"

type LeaderboardPageProps = {
  params: Promise<{
    room_id: string
  }>
  searchParams?: Promise<{
    page?: string | string[]
  }>
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

  const rankedParticipants = await getRankedParticipants(roomId, participants)
  const leaderboardPage = paginateRankedParticipants(rankedParticipants, parseLeaderboardPage(search?.page))
  const backToLobbyAction = (
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
  )

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(23,201,255,0.18),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(10,140,255,0.14),transparent_32%),linear-gradient(180deg,rgba(3,9,20,0),rgba(3,9,20,0.82))]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <PnlLeaderboardSection
          leaderboardPage={leaderboardPage}
          participantCount={rankedParticipants.length}
          getPageHref={(page) => `/room/${roomId}/leaderboard?page=${page}`}
          actions={backToLobbyAction}
        />
      </div>
    </main>
  )
}
