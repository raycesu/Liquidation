"use client"

import type { VariantProps } from "class-variance-authority"
import { useActionState } from "react"
import { createRoom } from "@/actions/rooms"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import { LayoutGridIcon } from "lucide-react"

export type CreateRoomDialogProps = {
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"]
  triggerSize?: VariantProps<typeof buttonVariants>["size"]
  triggerClassName?: string
}

const initialState: ActionResult<{ roomId: string }> = {
  ok: true,
  data: {
    roomId: "",
  },
}

export const CreateRoomDialog = (props?: CreateRoomDialogProps) => {
  const {
    triggerVariant = "default",
    triggerSize = "default",
    triggerClassName,
  } = props ?? {}
  const [state, formAction, isPending] = useActionState(createRoom, initialState)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          Create room
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden border-border/80 bg-popover p-0 sm:max-w-md",
          "max-h-[min(90vh,640px)] overflow-y-auto shadow-xl shadow-black/20",
        )}
      >
        <div className="border-b border-border/60 bg-muted/20 px-6 py-5">
          <DialogHeader className="gap-3 text-left">
            <div className="flex items-center gap-2 text-primary">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <LayoutGridIcon className="size-4" aria-hidden />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                New competition
              </span>
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight">Create competition room</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Set the schedule, starting balance, and optional description. You can share the lobby code after
              creation.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form action={formAction} className="space-y-4 px-6 py-5">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="datetime-local" required />
            </div>
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

          <Button className="mt-2 w-full" type="submit" size="lg" disabled={isPending}>
            {isPending ? "Creating..." : "Create room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
