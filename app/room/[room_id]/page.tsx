import { notFound, redirect } from "next/navigation"
import { PnlLeaderboardSection } from "@/components/room/pnl-leaderboard-section"
import { RoomLobbyHero } from "@/components/room/room-lobby-hero"
import { requireOnboardedUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
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
  const rooms = (await sql`
    select
      id::text,
      creator_id,
      name,
      description,
      is_public,
      join_code,
      starting_balance::float8 as starting_balance,
      start_date::text,
      end_date::text,
      is_active,
      settled_at::text,
      late_join_hours,
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
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(23,201,255,0.18),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(10,140,255,0.14),transparent_30%),linear-gradient(180deg,rgba(3,9,20,0),rgba(3,9,20,0.92))]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-5">
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
  )
}
