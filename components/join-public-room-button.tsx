"use client"

import { ArrowRight } from "lucide-react"
import { useActionState } from "react"
import { joinPublicRoomAction } from "@/actions/rooms"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { openLobbyButtonClassName } from "@/lib/dashboard-nav-triggers"
import type { ActionResult } from "@/lib/types"
import { cn } from "@/lib/utils"

type JoinPublicRoomButtonProps = {
  roomId: string
  className?: string
}

const initialState: ActionResult<{ roomId: string }> = {
  ok: true,
  data: {
    roomId: "",
  },
}

export const JoinPublicRoomButton = ({ roomId, className }: JoinPublicRoomButtonProps) => {
  const [state, formAction, isPending] = useActionState(joinPublicRoomAction, initialState)

  return (
    <form action={formAction} className={cn("space-y-2", className)}>
      <input type="hidden" name="roomId" value={roomId} />

      {!state.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        variant="default"
        size="lg"
        className={openLobbyButtonClassName}
        disabled={isPending}
      >
        <span className="inline-flex w-full items-center justify-center gap-2">
          {isPending ? "Joining..." : "Join room"}
          <ArrowRight className="size-4 opacity-90" aria-hidden />
        </span>
      </Button>
    </form>
  )
}
