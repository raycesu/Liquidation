import { notFound, redirect } from "next/navigation"
import { MarketingBackdrop } from "@/components/marketing/marketing-backdrop"
import { PnlLeaderboardSection } from "@/components/room/pnl-leaderboard-section"
import { RoomLobbyHero } from "@/components/room/room-lobby-hero"
import { requireOnboardedUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { marketingFontClassName } from "@/lib/marketing-fonts"
import { getRoomLeaderboard } from "@/lib/room-leaderboard"
import type { Room, RoomParticipant } from "@/lib/types"

export const dynamic = "force-dynamic"

type RoomPageProps = {
  params: Promise<{
    room_id: string
  }>
  searchParams?: Promise<{
    page?: string | string[]
  }>
}

type RoomStatus = "upcoming" | "active" | "ended"

const getRoomStatus = (room: Room): RoomStatus => {
  const now = new Date()
  const startDate = new Date(room.start_date)
  const endDate = new Date(room.end_date)

  if (!room.is_active || now > endDate) {
    return "ended"
  }

  if (now < startDate) {
    return "upcoming"
  }

  return "active"
}

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { room_id: roomId } = await params
  const search = await searchParams
  const user = await requireOnboardedUser()

  if (!user) {
    redirect("/sign-in")
  }

  const sql = getSql()
  const roomRows = (await sql`
    select
      r.id::text,
      r.creator_id,
      r.name,
      r.description,
      r.is_public,
      r.join_code,
      r.starting_balance::float8 as starting_balance,
      r.start_date::text,
      r.end_date::text,
      r.is_active,
      r.settled_at::text,
      r.late_join_hours,
      r.created_at::text
    from rooms r
    where r.id = ${roomId}
    limit 1
  `) as Room[]
  const room = roomRows[0]

  if (!room) {
    notFound()
  }

  const participantRows = (await sql`
    select
      id::text,
      room_id::text,
      user_id,
      available_margin::float8 as available_margin,
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

  const { rankedParticipants, leaderboardPage } = await getRoomLeaderboard(room.id, search?.page)
  const isCreator = user.id === room.creator_id

  const status = getRoomStatus(room)
  const roomDescription = room.description?.trim()

  return (
    <div
      data-theme="marketing-dark"
      className={`${marketingFontClassName} relative isolate min-h-screen overflow-hidden bg-background [font-family:var(--font-marketing-sans)]`}
    >
      <MarketingBackdrop />
      <main className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <RoomLobbyHero room={room} status={status} roomDescription={roomDescription} />

          <PnlLeaderboardSection
            leaderboardPage={leaderboardPage}
            participantCount={rankedParticipants.length}
            startingBalance={room.starting_balance}
            getPageHref={(page) => `/room/${room.id}?page=${page}`}
            isCreator={isCreator}
            roomId={room.id}
            creatorUserId={room.creator_id}
          />
        </div>
      </main>
    </div>
  )
}
