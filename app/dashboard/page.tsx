import { redirect } from "next/navigation"
import Image from "next/image"
import { CreateRoomDialog } from "@/components/create-room-dialog"
import { RoomCard } from "@/components/room-card"
import { SignOutButton } from "@/components/sign-out-button"
import { requireCurrentUser } from "@/lib/auth"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"
import { getSql } from "@/lib/db"
import type { Room } from "@/lib/types"

export const dynamic = "force-dynamic"

type DashboardParticipant = {
  id: string
  available_margin: number
  total_equity: number
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
      rp.available_margin::float8 as available_margin,
      rp.total_equity::float8 as total_equity,
      json_build_object(
        'id', r.id::text,
        'creator_id', r.creator_id,
        'name', r.name,
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
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Image
              src={BRAND_LOGO_SRC}
              alt={`${BRAND_NAME} logo`}
              width={BRAND_LOGO_WIDTH}
              height={BRAND_LOGO_HEIGHT}
              className="h-auto w-full max-w-md sm:max-w-lg md:max-w-xl"
              priority
              unoptimized
            />
            <h1 className="mt-2 text-4xl font-semibold text-text-primary">Competition rooms</h1>
            <p className="mt-2 max-w-2xl text-text-secondary">
              Create crypto perpetuals rooms, invite competitors, and trade with virtual capital using live prices.
            </p>
          </div>
          <div className="flex gap-3">
            <CreateRoomDialog />
            <SignOutButton />
          </div>
        </header>

        {rooms.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((participant) =>
              participant.rooms ? (
                <RoomCard
                  key={participant.id}
                  room={participant.rooms}
                  availableMargin={participant.available_margin}
                  totalEquity={participant.total_equity}
                />
              ) : null,
            )}
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
            <h2 className="text-2xl font-semibold text-text-primary">No rooms yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-text-secondary">
              Start a competition room to generate a shareable join link and begin paper trading.
            </p>
            <div className="mt-6">
              <CreateRoomDialog />
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
