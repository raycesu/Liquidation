import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatUsd } from "@/lib/format"
import { getCompetitionPhase } from "@/lib/room-competition-status"
import type { Room } from "@/lib/types"
import { cn } from "@/lib/utils"

type RoomCardProps = {
  room: Room
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
    label: "Ongoing",
    badgeClass: "border-profit/30 bg-profit/10 text-profit hover:bg-profit/10",
  },
  ended: {
    label: "Ended",
    badgeClass: "border-loss/30 bg-loss/10 text-loss hover:bg-loss/10",
  },
}

export const RoomCard = ({ room }: RoomCardProps) => {
  const phase = getCompetitionPhase(room)
  const { label, badgeClass } = phaseCopy[phase]

  return (
    <Card className="border-border/80 bg-card/80 shadow-lg shadow-black/10 ring-1 ring-border/40 backdrop-blur-sm transition-shadow hover:shadow-xl hover:ring-border/60">
      <CardHeader className="space-y-3 pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold leading-snug tracking-tight text-text-primary">
            {room.name}
          </CardTitle>
          <Badge variant="outline" className={cn("shrink-0 font-medium", badgeClass)}>
            {label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Starts</dt>
            <dd className="mt-1 font-medium text-foreground">{dateTimeFormatter.format(new Date(room.start_date))}</dd>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ends</dt>
            <dd className="mt-1 font-medium text-foreground">{dateTimeFormatter.format(new Date(room.end_date))}</dd>
          </div>
        </dl>
        <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Starting capital</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">{formatUsd(room.starting_balance)}</p>
        </div>
        <Button asChild className="w-full font-medium shadow-sm shadow-primary/15" size="lg">
          <Link href={`/room/${room.id}`}>Open lobby</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
