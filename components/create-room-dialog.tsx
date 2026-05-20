"use client"

import type { VariantProps } from "class-variance-authority"
import type { KeyboardEvent } from "react"
import { useActionState, useState } from "react"
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
import { GlobeIcon, LayoutGridIcon, LockIcon } from "lucide-react"

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
  const [isPublic, setIsPublic] = useState(false)

  const handleSelectPrivate = () => {
    setIsPublic(false)
  }

  const handleSelectPublic = () => {
    setIsPublic(true)
  }

  const handleVisibilityKeyDown = (event: KeyboardEvent, selectPublic: boolean) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()

    if (selectPublic) {
      handleSelectPublic()
      return
    }

    handleSelectPrivate()
  }

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
              {isPublic
                ? "Public rooms appear on every trader’s dashboard. Anyone can join until the join window closes."
                : "Private rooms stay hidden. Share a six-character code so others can join."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form action={formAction} className="space-y-4 px-6 py-5">
          <input type="hidden" name="isPublic" value={isPublic ? "true" : "false"} />

          {!state.ok ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label>Room visibility</Label>
            <div
              className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-muted/15 p-1"
              role="group"
              aria-label="Room visibility"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!isPublic}
                tabIndex={0}
                onClick={handleSelectPrivate}
                onKeyDown={(event) => handleVisibilityKeyDown(event, false)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  !isPublic
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LockIcon className="size-4 shrink-0" aria-hidden />
                Private
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={isPublic}
                tabIndex={0}
                onClick={handleSelectPublic}
                onKeyDown={(event) => handleVisibilityKeyDown(event, true)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isPublic
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <GlobeIcon className="size-4 shrink-0" aria-hidden />
                Public
              </button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isPublic
                ? "Listed on everyone’s dashboard; no join code."
                : "Hidden from browse; share a join code after creation."}
            </p>
          </div>

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
            <Label htmlFor="lateJoinHours">Late join window (hours after start)</Label>
            <Input
              id="lateJoinHours"
              name="lateJoinHours"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="Optional"
              aria-describedby="lateJoinHoursHelp"
            />
            <p id="lateJoinHoursHelp" className="text-xs leading-relaxed text-muted-foreground">
              Leave blank to allow joins until the competition ends. Use 0 to require joining before start, or enter
              hours (e.g. 48) to allow late joins for that long after start.
            </p>
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
