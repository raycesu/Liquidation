"use client"

import { useActionState } from "react"
import { joinRoomAction } from "@/actions/rooms"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ActionResult } from "@/lib/types"

const initialState: ActionResult<{ roomId: string }> = {
  ok: true,
  data: {
    roomId: "",
  },
}

export const JoinRoomDialog = () => {
  const [state, formAction, isPending] = useActionState(joinRoomAction, initialState)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Join room</Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-surface text-text-primary">
        <DialogHeader>
          <DialogTitle>Join competition room</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Enter the six-character room code shared from the room lobby.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {!state.ok ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="joinCode">Room code</Label>
            <Input
              id="joinCode"
              name="joinCode"
              placeholder="ABC123"
              minLength={6}
              maxLength={6}
              pattern="[A-Za-z0-9]{6}"
              autoComplete="off"
              autoCapitalize="characters"
              className="font-mono uppercase tracking-[0.35em]"
              required
            />
          </div>

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Joining..." : "Join room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
