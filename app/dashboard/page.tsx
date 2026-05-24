import { Plus } from "lucide-react"
import { redirect } from "next/navigation"
import { CreateRoomDialog } from "@/components/create-room-dialog"
import { DashboardHeader } from "@/components/dashboard-header"
import { JoinRoomDialog } from "@/components/join-room-dialog"
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell"
import { RoomCard } from "@/components/room-card"
import { requireOnboardedUser } from "@/lib/auth"
import { assertRoomJoinable } from "@/lib/competition-guards"
import { createRoomTriggerClassName, joinRoomTriggerClassName } from "@/lib/dashboard-nav-triggers"
import { getSql, withUserContext } from "@/lib/db"
import { getCompetitionPhase } from "@/lib/room-competition-status"
import type { Room } from "@/lib/types"

export const dynamic = "force-dynamic"

type DashboardParticipant = {
  id: string
  rooms: Room | null
}

const mapRoomRow = (row: Record<string, unknown>): Room => ({
  id: String(row.id),
  creator_id: String(row.creator_id),
  name: String(row.name),
  description: row.description ? String(row.description) : null,
  is_public: Boolean(row.is_public),
  join_code: row.join_code ? String(row.join_code) : null,
  starting_balance: Number(row.starting_balance),
  start_date: String(row.start_date),
  end_date: String(row.end_date),
  is_active: Boolean(row.is_active),
  settled_at: row.settled_at ? String(row.settled_at) : null,
  late_join_hours: row.late_join_hours === null || row.late_join_hours === undefined ? null : Number(row.late_join_hours),
  created_at: String(row.created_at),
})

export default async function DashboardPage() {
  const user = await requireOnboardedUser()

  if (!user) {
    redirect("/sign-in")
  }

  const { joinedRooms, discoverablePublicRooms } = await withUserContext(user.id, async () => {
    const sql = getSql()

    const participants = (await sql`
      select
        rp.id::text,
        json_build_object(
          'id', r.id::text,
          'creator_id', r.creator_id,
          'name', r.name,
          'description', r.description,
          'is_public', r.is_public,
          'join_code', r.join_code,
          'starting_balance', r.starting_balance::float8,
          'start_date', r.start_date::text,
          'end_date', r.end_date::text,
          'is_active', r.is_active,
          'settled_at', r.settled_at::text,
          'late_join_hours', r.late_join_hours,
          'created_at', r.created_at::text
        ) as rooms
      from room_participants rp
      join rooms r on r.id = rp.room_id
      where rp.user_id = ${user.id}
      order by r.created_at desc
    `) as DashboardParticipant[]

    const publicRoomRows = (await sql`
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
      from rooms r
      where r.is_public = true
        and not exists (
          select 1
          from room_participants rp
          where rp.room_id = r.id
            and rp.user_id = ${user.id}
        )
      order by r.created_at desc
    `) as Record<string, unknown>[]

    const joined = participants
      .map((participant) => participant.rooms)
      .filter((room): room is Room => room !== null)

    const discoverable = publicRoomRows
      .map(mapRoomRow)
      .filter((room) => assertRoomJoinable(room).ok)

    return {
      joinedRooms: joined,
      discoverablePublicRooms: discoverable,
    }
  })

  const hasJoinedRooms = joinedRooms.length > 0
  const hasDiscoverableRooms = discoverablePublicRooms.length > 0
  const isEmpty = !hasJoinedRooms && !hasDiscoverableRooms
  const roomCountLabel = joinedRooms.length === 1 ? "room" : "rooms"
  const activeRoomCount = joinedRooms.filter((room) => getCompetitionPhase(room) === "ongoing").length

  return (
    <MarketingPageShell>
      <main className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
          <DashboardHeader
            username={user.username}
            imageUrl={user.image_url}
            activeRoomCount={activeRoomCount}
          />

          {hasDiscoverableRooms ? (
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
                Public Competitions
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {discoverablePublicRooms.map((room) => (
                  <RoomCard key={room.id} room={room} variant="discover" />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-2xl">Rooms</h1>
              {hasJoinedRooms ? (
                <span className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                  {joinedRooms.length} {roomCountLabel}
                </span>
              ) : null}
            </div>

            {hasJoinedRooms ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {joinedRooms.map((room) => (
                  <RoomCard key={room.id} room={room} variant="member" />
                ))}
              </div>
            ) : isEmpty ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-10 text-center shadow-inner shadow-black/5 backdrop-blur-sm sm:p-14">
                <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">No rooms yet</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Start a competition room, browse public competitions above when available, or enter a private room
                  code.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <JoinRoomDialog
                    triggerVariant="outline"
                    triggerSize="lg"
                    triggerClassName={joinRoomTriggerClassName}
                  />
                  <CreateRoomDialog
                    triggerVariant="default"
                    triggerSize="lg"
                    triggerClassName={createRoomTriggerClassName}
                    triggerLeadingIcon={<Plus className="size-4 shrink-0" aria-hidden />}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You have not joined any competitions yet. Browse public rooms above or enter a private code.
              </p>
            )}
          </section>
        </div>
      </main>
    </MarketingPageShell>
  )
}
