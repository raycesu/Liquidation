"use client"

import type { VariantProps } from "class-variance-authority"
import { useActionState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ActionResult } from "@/lib/types"
import { cn } from "@/lib/utils"
import { KeyRoundIcon } from "lucide-react"

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
      >
        <div className="border-b border-border/60 bg-muted/20 px-6 py-5">
          <DialogHeader className="gap-3 text-left">
            <div className="flex items-center gap-2 text-primary">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <KeyRoundIcon className="size-4" aria-hidden />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Enter code
              </span>
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight">Join competition room</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Paste the six-character code from the host. Codes are not case-sensitive.
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
              className="font-mono text-base uppercase tracking-[0.35em]"
              required
            />
          </div>

          <Button className="w-full" type="submit" size="lg" disabled={isPending}>
            {isPending ? "Joining..." : "Join room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
