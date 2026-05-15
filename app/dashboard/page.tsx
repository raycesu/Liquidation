import { redirect } from "next/navigation"
import { CreateRoomDialog } from "@/components/create-room-dialog"
import { DashboardHeader } from "@/components/dashboard-header"
import { JoinRoomDialog } from "@/components/join-room-dialog"
import { RoomCard } from "@/components/room-card"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import type { Room } from "@/lib/types"

export const dynamic = "force-dynamic"

type DashboardParticipant = {
  id: string
  rooms: Room | null
}

export default async function DashboardPage() {
  const user = await requireCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const sql = getSql()
  const participants = (await sql`
    select
      rp.id::text,
      json_build_object(
        'id', r.id::text,
        'creator_id', r.creator_id,
        'name', r.name,
        'description', r.description,
        'join_code', r.join_code,
        'starting_balance', r.starting_balance::float8,
        'start_date', r.start_date::text,
        'end_date', r.end_date::text,
        'is_active', r.is_active,
        'created_at', r.created_at::text
      ) as rooms
    from room_participants rp
    join rooms r on r.id = rp.room_id
    where rp.user_id = ${user.id}
    order by r.created_at desc
  `) as DashboardParticipant[]

  const rooms = participants.filter((participant) => participant.rooms)

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <DashboardHeader username={user.username} imageUrl={user.image_url} />

        <section className="space-y-6">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">Competition Rooms</h1>

          {rooms.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map((participant) =>
                participant.rooms ? <RoomCard key={participant.id} room={participant.rooms} /> : null,
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-10 text-center shadow-inner shadow-black/5 backdrop-blur-sm sm:p-14">
              <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">No rooms yet</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Start a competition room or enter a shared room code to begin paper trading.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <JoinRoomDialog />
                <CreateRoomDialog />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
