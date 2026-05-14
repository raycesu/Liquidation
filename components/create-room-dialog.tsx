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
import { Textarea } from "@/components/ui/textarea"
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-surface text-text-primary">
        <DialogHeader>
          <DialogTitle>Create competition room</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Set up the competition details, trading window, and optional room context.
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
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" name="startDate" type="datetime-local" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End date</Label>
            <Input id="endDate" name="endDate" type="datetime-local" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Optional. Describe the competition in 25 words or fewer."
              className="min-h-24 resize-none"
            />
          </div>

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
