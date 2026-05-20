import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowUpRight, BarChart3, DoorOpen } from "lucide-react"
import { CopyRoomCodeButton } from "@/components/room/copy-room-code-button"
import { RoomHeroBackground } from "@/components/room/room-hero-background"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatWholeUsd } from "@/lib/format"
import { formatLateJoinPolicy } from "@/lib/room-join-policy"
import { getRoomVisibilityLabel, isPrivateRoom } from "@/lib/room-visibility"
import { cn } from "@/lib/utils"
import type { Room } from "@/lib/types"

type RoomStatus = "upcoming" | "active" | "ended"

type RoomLobbyHeroProps = {
  room: Room
  status: RoomStatus
  roomDescription?: string
}

const identityCardClassName =
  "border border-border/60 bg-background shadow-2xl shadow-accent-blue/10 backdrop-blur-xl"

const statsStripCardClassName =
  "border border-border/60 bg-surface shadow-2xl shadow-accent-blue/10 backdrop-blur-xl"

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

type StatStripItemProps = {
  label: string
  children: ReactNode
  showDivider?: boolean
}

const StatStripItem = ({ label, children, showDivider = false }: StatStripItemProps) => (
  <div
    className={cn(
      "flex min-w-0 flex-1 flex-col gap-1 px-4 py-2.5 first:pl-4 last:pr-4 sm:px-5 sm:py-3",
      showDivider && "sm:border-l sm:border-white/12",
    )}
  >
    <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-text-secondary/50">
      {label}
    </span>
    {children}
  </div>
)

export const RoomLobbyHero = ({ room, status, roomDescription }: RoomLobbyHeroProps) => {
  const startDate = formatCompetitionDateParts(room.start_date)
  const endDate = formatCompetitionDateParts(room.end_date)
  const showRoomCode = isPrivateRoom(room) && room.join_code

  return (
    <header className="flex flex-col gap-1.5 sm:gap-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border-l-2 border-l-accent-neon",
          identityCardClassName,
        )}
      >
        <RoomHeroBackground />
        <div
          className="pointer-events-none absolute inset-0 bg-background/70"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={getStatusClassName(status)}>
                {getStatusLabel(status)}
              </Badge>
              <Badge
                variant="outline"
                className="border-border/60 bg-background/35 text-text-secondary hover:bg-background/35"
              >
                {getRoomVisibilityLabel(room)}
              </Badge>
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{room.name}</h1>
            {roomDescription ? (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-secondary/80 sm:text-base">
                {roomDescription}
              </p>
            ) : null}
          </div>

          <nav
            className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center"
            aria-label="Room navigation"
          >
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full border-border/70 bg-background/35 px-4 text-text-primary shadow-lg shadow-accent-blue/5 backdrop-blur transition-colors hover:border-accent-neon/45 hover:bg-surface-elevated hover:text-white dark:bg-background/35 dark:hover:bg-surface-elevated"
            >
              <Link href="/dashboard">
                <BarChart3 className="size-4" aria-hidden />
                Dashboard
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-full bg-gradient-to-r from-accent-blue to-accent-neon px-4 font-semibold text-background shadow-lg shadow-accent-blue/25 transition-transform hover:translate-y-[-1px] hover:shadow-accent-blue/35"
            >
              <Link href={`/room/${room.id}/trade`}>
                <DoorOpen className="size-4" aria-hidden />
                Trading Terminal
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </nav>
        </div>
      </div>

      <div className={cn("overflow-hidden rounded-3xl py-0.5 sm:py-0", statsStripCardClassName)}>
        <div className="flex flex-col divide-y divide-white/12 sm:flex-row sm:divide-y-0">
          <StatStripItem label="Starting balance">
            <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
              {formatWholeUsd(room.starting_balance)}
            </span>
          </StatStripItem>

          {showRoomCode ? (
            <StatStripItem label="Room code" showDivider>
              <div className="flex items-center gap-1">
                <span className="font-mono text-sm font-semibold tracking-wide tabular-nums text-text-primary">
                  {room.join_code}
                </span>
                <CopyRoomCodeButton code={room.join_code!} />
              </div>
            </StatStripItem>
          ) : null}

          <StatStripItem label="Start date" showDivider>
            <span className="font-mono text-sm tabular-nums text-text-primary">{startDate.date}</span>
            {startDate.time ? (
              <span className="text-xs text-text-secondary">{startDate.time}</span>
            ) : null}
          </StatStripItem>

          <StatStripItem label="End date" showDivider>
            <span className="font-mono text-sm tabular-nums text-text-primary">{endDate.date}</span>
            {endDate.time ? (
              <span className="text-xs text-text-secondary">{endDate.time}</span>
            ) : null}
          </StatStripItem>

          <StatStripItem label="Join policy" showDivider>
            <span className="text-sm text-text-primary">{formatLateJoinPolicy(room)}</span>
          </StatStripItem>
        </div>
      </div>
    </header>
  )
}
