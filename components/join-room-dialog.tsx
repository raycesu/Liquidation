"use client"

import type { VariantProps } from "class-variance-authority"
import { ArrowRight } from "lucide-react"
import { useActionState, useState } from "react"
import { joinRoomAction } from "@/actions/rooms"
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
import { RoomCodeInput } from "@/components/room-code-input"
import { dialogAccentSubmitClassName } from "@/lib/dashboard-nav-triggers"
import type { ActionResult } from "@/lib/types"
import { cn } from "@/lib/utils"

export type JoinRoomDialogProps = {
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

export const JoinRoomDialog = (props?: JoinRoomDialogProps) => {
  const {
    triggerVariant = "secondary",
    triggerSize = "default",
    triggerClassName,
  } = props ?? {}
  const [state, formAction, isPending] = useActionState(joinRoomAction, initialState)
  const [joinCode, setJoinCode] = useState("")
  const isCodeComplete = joinCode.length === 6

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          Join room
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden border-border/80 bg-popover p-0 sm:max-w-md",
          "shadow-xl shadow-black/20",
        )}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
        }}
      >
        <form action={formAction} className="space-y-4 px-6 py-4">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-lg font-semibold tracking-tight">Join competition room</DialogTitle>
            <DialogDescription className="text-sm leading-snug text-muted-foreground">
              Six-character code, not case-sensitive. Public rooms are on the dashboard.
            </DialogDescription>
          </DialogHeader>

          {!state.ok ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <RoomCodeInput
            value={joinCode}
            onChange={setJoinCode}
            disabled={isPending}
            autoFocus
          />

          <Button
            type="submit"
            size="lg"
            disabled={isPending || !isCodeComplete}
            className={dialogAccentSubmitClassName}
          >
            {isPending ? (
              "Joining..."
            ) : (
              <>
                Enter Room
                <ArrowRight className="size-4" aria-hidden />
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
