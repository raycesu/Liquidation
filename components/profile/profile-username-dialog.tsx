"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { updateProfile } from "@/actions/update-profile"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { dialogAccentSubmitClassName } from "@/lib/dashboard-nav-triggers"
import type { ActionResult } from "@/lib/types"
import { usernameSchema } from "@/lib/username"
import { cn } from "@/lib/utils"
import { Check, CircleCheck, InfoIcon, UserRound, XIcon } from "lucide-react"

type ProfileUsernameDialogProps = {
  username: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const initialState: ActionResult<{ username: string }> = {
  ok: true,
  data: {
    username: "",
  },
}

const USERNAME_HELPER_ID = "profile-username-helper"

export const ProfileUsernameDialog = ({ username, open, onOpenChange }: ProfileUsernameDialogProps) => {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState)
  const [usernameValue, setUsernameValue] = useState(username)
  const wasPendingRef = useRef(false)

  useEffect(() => {
    if (open) {
      setUsernameValue(username)
    }
  }, [open, username])

  useEffect(() => {
    if (wasPendingRef.current && !isPending && state.ok && state.data.username) {
      onOpenChange(false)
    }
    wasPendingRef.current = isPending
  }, [isPending, state, onOpenChange])

  const parsed = usernameSchema.safeParse(usernameValue)
  const isValid = parsed.success
  const showInvalid = usernameValue.length > 0 && !isValid

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsernameValue(event.target.value.toLowerCase().slice(0, 24))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "gap-0 overflow-hidden border-border/80 bg-popover p-0 sm:max-w-md",
          "shadow-xl shadow-black/20",
        )}
      >
        <form action={formAction} className="space-y-5 px-8 py-6">
          <DialogHeader className="gap-0 border-b border-border/60 pb-5 text-left">
            <div className="flex items-start gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-neon/15 ring-1 ring-accent-neon/30"
                aria-hidden
              >
                <UserRound className="size-5 text-accent-neon" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <DialogTitle className="text-lg font-semibold tracking-tight text-text-primary">
                  Edit username
                </DialogTitle>
                <DialogDescription className="text-sm leading-snug text-muted-foreground">
                  Visible on leaderboards & profile
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 shrink-0 rounded-lg border border-border/50 bg-transparent text-muted-foreground shadow-none hover:border-border/70 hover:bg-white/[0.03] hover:text-text-secondary"
                  aria-label="Close"
                >
                  <XIcon className="size-3.5" aria-hidden />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          {!state.ok ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2.5">
            <Label htmlFor="profile-username" className="text-sm font-medium text-muted-foreground">
              Username
            </Label>
            <div className="relative">
              <span
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-accent-neon"
                aria-hidden
              >
                @
              </span>
              <Input
                id="profile-username"
                name="username"
                value={usernameValue}
                onChange={handleUsernameChange}
                minLength={3}
                maxLength={24}
                pattern="[a-z0-9-]+"
                autoComplete="username"
                required
                aria-invalid={showInvalid}
                aria-describedby={USERNAME_HELPER_ID}
                className={cn(
                  "h-11 pr-24 pl-8 text-base md:text-sm",
                  showInvalid && "border-destructive ring-destructive/20",
                  !showInvalid &&
                    "focus-visible:border-accent-neon/50 focus-visible:ring-accent-neon/20",
                )}
              />
              <div
                className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2"
                aria-hidden
              >
                <span className="text-xs tabular-nums text-text-secondary">
                  {usernameValue.length}/24
                </span>
                {isValid ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-profit/15">
                    <CircleCheck className="size-3.5 text-profit" />
                  </span>
                ) : null}
              </div>
            </div>
            <p
              id={USERNAME_HELPER_ID}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <InfoIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
              Lowercase letters, numbers, hyphens only. 3–24 chars.
            </p>
          </div>

          <DialogFooter className="mx-0 mb-0 mt-1 gap-3 border-0 bg-transparent p-0 pt-1 sm:justify-stretch">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-11 flex-1 rounded-xl border border-border/60 bg-transparent text-text-primary shadow-none hover:border-border/80 hover:bg-white/[0.04] dark:hover:bg-white/[0.04]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isValid}
              className={cn(
                dialogAccentSubmitClassName,
                "flex-[2] w-auto min-w-0 rounded-xl",
              )}
            >
              {isPending ? (
                "Saving..."
              ) : (
                <>
                  <Check className="size-4" aria-hidden />
                  Save username
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
