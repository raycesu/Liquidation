"use client"

import { useActionState } from "react"
import { joinPublicRoomAction } from "@/actions/rooms"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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

      <Button className="w-full font-medium shadow-sm shadow-primary/15" type="submit" size="lg" disabled={isPending}>
        {isPending ? "Joining..." : "Join room"}
      </Button>
    </form>
  )
}
