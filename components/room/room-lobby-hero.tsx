import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  CandlestickChart,
  Key,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { CopyRoomCodeButton } from "@/components/room/copy-room-code-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatUsdRounded } from "@/lib/format"
import { RoomVisibilityBadge } from "@/components/room/room-visibility-badge"
import { formatLateJoinPolicyParts } from "@/lib/room-join-policy"
import { isPrivateRoom } from "@/lib/room-visibility"
import {
  liveRoomCardGlowClassName,
  lobbyHeaderCardClassName,
  lobbyStatCardClassName,
} from "@/lib/room-card-surface"
import { cn } from "@/lib/utils"
import type { Room } from "@/lib/types"

type RoomStatus = "upcoming" | "active" | "ended"

type RoomLobbyHeroProps = {
  room: Room
  status: RoomStatus
  roomDescription?: string
}

const lobbyNavButtonClassName = "h-auto rounded-full py-2.5 px-[22px] text-sm"

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

const getStatusDotClassName = (status: RoomStatus) => {
  if (status === "active") {
    return "bg-profit"
  }

  if (status === "upcoming") {
    return "bg-accent-neon"
  }

  return "bg-loss"
}

type LobbyStatCardProps = {
  icon: LucideIcon
  label: string
  primary: ReactNode
  secondary?: string
}

const LobbyStatCard = ({ icon: Icon, label, primary, secondary }: LobbyStatCardProps) => (
  <div className={lobbyStatCardClassName}>
    <div className={liveRoomCardGlowClassName} aria-hidden />
    <div className="relative">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-text-secondary/55">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold tabular-nums text-text-primary">{primary}</div>
      {secondary ? (
        <p className="mt-0.5 text-xs text-text-secondary/80">{secondary}</p>
      ) : null}
    </div>
  </div>
)

export const RoomLobbyHero = ({ room, status, roomDescription }: RoomLobbyHeroProps) => {
  const startDate = formatCompetitionDateParts(room.start_date)
  const endDate = formatCompetitionDateParts(room.end_date)
  const joinPolicy = formatLateJoinPolicyParts(room)
  const showRoomCode = isPrivateRoom(room) && room.join_code

  return (
    <header className="flex flex-col gap-4">
      <div className={lobbyHeaderCardClassName}>
        <div className={liveRoomCardGlowClassName} aria-hidden />
        <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("gap-1.5", getStatusClassName(status))}>
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", getStatusDotClassName(status))}
                  aria-hidden
                />
                {getStatusLabel(status)}
              </Badge>
              <RoomVisibilityBadge room={room} />
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {room.name}
            </h1>
            {roomDescription ? (
              <p className="mt-1 max-w-2xl text-sm italic leading-relaxed text-text-secondary/55 sm:text-base">
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
              className={cn(
                lobbyNavButtonClassName,
                "border-border/70 bg-background/35 text-text-primary shadow-lg shadow-accent-blue/5 backdrop-blur transition-colors hover:border-accent-neon/45 hover:bg-surface-elevated hover:text-white dark:bg-background/35 dark:hover:bg-surface-elevated",
              )}
            >
              <Link href="/dashboard">
                <BarChart3 className="size-4" aria-hidden />
                Dashboard
              </Link>
            </Button>
            <Button
              asChild
              className={cn(
                lobbyNavButtonClassName,
                "bg-gradient-to-r from-accent-blue to-accent-neon font-semibold text-background shadow-lg shadow-accent-blue/25 transition-transform hover:translate-y-[-1px] hover:shadow-accent-blue/35",
              )}
            >
              <Link href={`/room/${room.id}/trade`}>
                <CandlestickChart className="size-4" aria-hidden />
                Trade
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </nav>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-3 sm:grid-cols-2",
          showRoomCode ? "xl:grid-cols-5" : "xl:grid-cols-4",
        )}
      >
        <LobbyStatCard
          icon={Wallet}
          label="Starting balance"
          primary={formatUsdRounded(room.starting_balance)}
          secondary="USD"
        />

        {showRoomCode ? (
          <LobbyStatCard
            icon={Key}
            label="Room code"
            primary={
              <div className="flex items-center gap-1 font-mono text-lg tracking-wide">
                {room.join_code}
                <CopyRoomCodeButton code={room.join_code!} />
              </div>
            }
            secondary="Private room"
          />
        ) : null}

        <LobbyStatCard
          icon={Calendar}
          label="Start date"
          primary={startDate.date}
          secondary={startDate.time || undefined}
        />

        <LobbyStatCard
          icon={Calendar}
          label="End date"
          primary={endDate.date}
          secondary={endDate.time || undefined}
        />

        <LobbyStatCard
          icon={UserPlus}
          label="Join policy"
          primary={joinPolicy.primary}
          secondary={joinPolicy.secondary || undefined}
        />
      </div>
    </header>
  )
}
