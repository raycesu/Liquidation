import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatUsd } from "@/lib/format"
import type { Room } from "@/lib/types"

type RoomCardProps = {
  room: Room
  availableMargin: number
  totalEquity: number
}

export const RoomCard = ({ room, availableMargin, totalEquity }: RoomCardProps) => {
  const isActive = room.is_active && new Date(room.end_date) > new Date()

  return (
    <Card className="border-border bg-surface shadow-xl shadow-accent-blue/5">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-xl text-text-primary">{room.name}</CardTitle>
          <Badge
            className={
              isActive
                ? "bg-profit/10 text-profit hover:bg-profit/10"
                : "bg-loss/10 text-loss hover:bg-loss/10"
            }
          >
            {isActive ? "Active" : "Ended"}
          </Badge>
        </div>
        <p className="text-sm text-text-secondary">
          Ends {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(room.end_date))}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border bg-surface-elevated p-3">
            <p className="text-text-secondary">Equity</p>
            <p className="mt-1 font-mono text-lg text-text-primary">{formatUsd(totalEquity)}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-elevated p-3">
            <p className="text-text-secondary">Available</p>
            <p className="mt-1 font-mono text-lg text-text-primary">{formatUsd(availableMargin)}</p>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link href={`/room/${room.id}`}>Open lobby</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
