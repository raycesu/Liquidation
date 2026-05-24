import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { JoinPublicRoomButton } from "@/components/join-public-room-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { openLobbyButtonClassName } from "@/lib/dashboard-nav-triggers"
import { formatWholeUsd } from "@/lib/format"
import { liveRoomCardGlowClassName } from "@/lib/room-card-surface"
import { getCompetitionPhase } from "@/lib/room-competition-status"
import type { Room } from "@/lib/types"
import { cn } from "@/lib/utils"

type RoomCardProps = {
  room: Room
  variant?: "member" | "discover"
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

const phaseCopy: Record<
  ReturnType<typeof getCompetitionPhase>,
  { label: string; badgeClass: string }
> = {
  upcoming: {
    label: "Upcoming",
    badgeClass: "border-border/80 bg-muted/50 text-muted-foreground hover:bg-muted/50",
  },
  ongoing: {
    label: "Live",
    badgeClass:
      "rounded-full border-profit/35 bg-profit/15 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-profit hover:bg-profit/15",
  },
  ended: {
    label: "Ended",
    badgeClass:
      "rounded-full border-border/60 bg-muted/30 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/30",
  },
}

const dateLabelsByPhase: Record<
  ReturnType<typeof getCompetitionPhase>,
  { start: string; end: string }
> = {
  upcoming: { start: "Starts", end: "Ends" },
  ongoing: { start: "Starts", end: "Ends" },
  ended: { start: "Started", end: "Ended" },
}

const mutedResultsButtonClassName =
  "h-11 w-full rounded-lg border border-border/60 bg-muted/20 font-medium text-muted-foreground transition-colors hover:border-border/80 hover:bg-muted/30 hover:text-foreground"

export const RoomCard = ({ room, variant = "member" }: RoomCardProps) => {
  const phase = getCompetitionPhase(room)
  const { label, badgeClass } = phaseCopy[phase]
  const { start: startLabel, end: endLabel } = dateLabelsByPhase[phase]
  const isLiveCard = phase === "ongoing"
  const isEndedMemberCard = variant === "member" && phase === "ended"

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/80 bg-card/80 shadow-lg shadow-black/10 ring-1 ring-border/40 backdrop-blur-sm transition-shadow hover:shadow-xl",
        isLiveCard
          ? "border-accent-neon/25 ring-accent-neon/20 hover:ring-accent-neon/35"
          : "hover:ring-border/60",
      )}
    >
      {isLiveCard ? (
        <div className={liveRoomCardGlowClassName} aria-hidden />
      ) : null}
      <CardHeader className="relative space-y-3 pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold leading-snug tracking-tight text-text-primary">
            {room.name}
          </CardTitle>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {variant === "discover" ? (
              <Badge variant="outline" className="border-accent-neon/35 bg-accent-neon/10 font-medium text-accent-neon">
                Public
              </Badge>
            ) : null}
            <Badge variant="outline" className={cn("font-medium", badgeClass)}>
              {label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4 pt-0">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{startLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">{dateTimeFormatter.format(new Date(room.start_date))}</dd>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{endLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">{dateTimeFormatter.format(new Date(room.end_date))}</dd>
          </div>
        </dl>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Starting capital</span>
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {formatWholeUsd(room.starting_balance)}
          </span>
        </div>
        {variant === "discover" ? (
          <JoinPublicRoomButton roomId={room.id} />
        ) : isEndedMemberCard ? (
          <Button asChild variant="outline" size="lg" className={mutedResultsButtonClassName}>
            <Link href={`/room/${room.id}`}>View results</Link>
          </Button>
        ) : (
          <Button asChild variant="default" size="lg" className={openLobbyButtonClassName}>
            <Link href={`/room/${room.id}`} className="inline-flex w-full items-center justify-center gap-2">
              Open lobby
              <ArrowRight className="size-4 opacity-90" aria-hidden />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
