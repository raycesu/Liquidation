import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { ReactNode } from "react"
import { ArrowUpRight, BarChart3, DoorOpen, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PnlLeaderboardSection } from "@/components/room/pnl-leaderboard-section"
import { requireOnboardedUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import { formatWholeUsd } from "@/lib/format"
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

type RoomDetail = {
  label: string
  value: ReactNode
}

const formatCompetitionDateParts = (iso: string) => {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return {
      date: iso,
      time: "",
    }
  }

  return {
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date),
  }
}

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

const getStatusLabel = (status: RoomStatus) => {
  if (status === "upcoming") {
    return "Upcoming"
  }

  if (status === "active") {
    return "Active"
  }

  return "Ended"
}

const getStatusClassName = (status: RoomStatus) => {
  if (status === "active") {
    return "border-profit/30 bg-profit/10 text-profit hover:bg-profit/10"
  }

  if (status === "upcoming") {
    return "border-accent-neon/35 bg-accent-neon/10 text-accent-neon hover:bg-accent-neon/10"
  }

  return "border-loss/30 bg-loss/10 text-loss hover:bg-loss/10"
}

const DetailCard = ({ label, value }: RoomDetail) => (
  <Card className="border-border/60 bg-surface/70 shadow-xl shadow-accent-blue/5 backdrop-blur-xl">
    <CardContent className="space-y-4 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">{label}</p>
      <div className="break-words font-heading text-2xl font-semibold tracking-[-0.03em] text-text-primary tabular-nums">
        {value}
      </div>
    </CardContent>
  </Card>
)

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

  const status = getRoomStatus(room)
  const roomDescription = room.description?.trim()
  const startDate = formatCompetitionDateParts(room.start_date)
  const endDate = formatCompetitionDateParts(room.end_date)
  const details: RoomDetail[] = [
    {
      label: "Starting balance",
      value: formatWholeUsd(room.starting_balance),
    },
    {
      label: "Room code",
      value: room.join_code,
    },
    {
      label: "Start date",
      value: (
        <span className="flex flex-col gap-1">
          <span>{startDate.date}</span>
          <span className="text-base font-medium tracking-normal text-text-secondary">{startDate.time}</span>
        </span>
      ),
    },
    {
      label: "End date",
      value: (
        <span className="flex flex-col gap-1">
          <span>{endDate.date}</span>
          <span className="text-base font-medium tracking-normal text-text-secondary">{endDate.time}</span>
        </span>
      ),
    },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(23,201,255,0.18),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(10,140,255,0.14),transparent_30%),linear-gradient(180deg,rgba(3,9,20,0),rgba(3,9,20,0.92))]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="overflow-hidden rounded-3xl border border-border/60 bg-surface/65 shadow-2xl shadow-accent-blue/10 backdrop-blur-xl">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className={getStatusClassName(status)}>
                  {getStatusLabel(status)}
                </Badge>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/35 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-text-secondary">
                  <Trophy className="size-3.5 text-accent-neon" aria-hidden />
                  Trading Competition
                </span>
              </div>

              <div className="max-w-3xl space-y-4">
                <h1 className="font-heading text-4xl font-semibold tracking-[-0.045em] text-white drop-shadow-[0_18px_40px_rgba(10,140,255,0.22)] sm:text-5xl lg:text-6xl">
                  {room.name}
                </h1>
                {roomDescription ? (
                  <p className="max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">{roomDescription}</p>
                ) : null}
              </div>
            </div>

            <nav className="flex flex-col gap-3 sm:flex-row lg:justify-end" aria-label="Room navigation">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 rounded-full border-border/70 bg-background/35 px-5 text-text-primary shadow-lg shadow-accent-blue/5 backdrop-blur transition-colors hover:border-accent-neon/45 hover:bg-surface-elevated hover:text-white dark:bg-background/35 dark:hover:bg-surface-elevated"
              >
                <Link href="/dashboard">
                  <BarChart3 className="size-4" aria-hidden />
                  Dashboard
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-11 rounded-full bg-gradient-to-r from-accent-blue to-accent-neon px-5 font-semibold text-background shadow-lg shadow-accent-blue/25 transition-transform hover:translate-y-[-1px] hover:shadow-accent-blue/35"
              >
                <Link href={`/room/${room.id}/trade`}>
                  <DoorOpen className="size-4" aria-hidden />
                  Trading Terminal
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </nav>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Competition details">
          {details.map((detail) => (
            <DetailCard key={detail.label} {...detail} />
          ))}
        </section>

        <PnlLeaderboardSection
          leaderboardPage={leaderboardPage}
          participantCount={rankedParticipants.length}
          getPageHref={(page) => `/room/${room.id}?page=${page}`}
        />
      </div>
    </main>
  )
}
