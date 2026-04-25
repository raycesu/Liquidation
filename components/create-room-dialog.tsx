"use client"

import { useActionState } from "react"
import { createRoom } from "@/actions/rooms"
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

export const CreateRoomDialog = () => {
  const [state, formAction, isPending] = useActionState(createRoom, initialState)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create room</Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-surface text-text-primary">
        <DialogHeader>
          <DialogTitle>Create competition room</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Set up virtual capital and an end date for the paper-trading competition.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {!state.ok ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">Room name</Label>
            <Input id="name" name="name" placeholder="Weekend degens" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startingBalance">Starting balance</Label>
            <Input
              id="startingBalance"
              name="startingBalance"
              type="number"
              min="100"
              step="100"
              defaultValue="10000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End date</Label>
            <Input id="endDate" name="endDate" type="datetime-local" required />
          </div>

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
