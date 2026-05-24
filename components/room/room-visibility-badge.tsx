import { Globe, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getRoomVisibilityLabel, isPublicRoom } from "@/lib/room-visibility"
import { cn } from "@/lib/utils"
import type { Room } from "@/lib/types"

type RoomVisibilityBadgeProps = {
  room: Pick<Room, "is_public">
}

export const RoomVisibilityBadge = ({ room }: RoomVisibilityBadgeProps) => {
  const isPublic = isPublicRoom(room)

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium",
        isPublic
          ? "border-accent-blue/35 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/10"
          : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/10",
      )}
    >
      {isPublic ? (
        <Globe className="size-3 shrink-0" aria-hidden />
      ) : (
        <Lock className="size-3 shrink-0" aria-hidden />
      )}
      {getRoomVisibilityLabel(room)}
    </Badge>
  )
}
