"use client"

import { useActionState, useEffect, useRef } from "react"
import { updateProfile } from "@/actions/update-profile"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ActionResult } from "@/lib/types"

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

export const ProfileUsernameDialog = ({ username, open, onOpenChange }: ProfileUsernameDialogProps) => {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState)
  const wasPendingRef = useRef(false)

  useEffect(() => {
    if (wasPendingRef.current && !isPending && state.ok && state.data.username) {
      onOpenChange(false)
    }
    wasPendingRef.current = isPending
  }, [isPending, state, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Edit username</DialogTitle>
          <DialogDescription>
            Lowercase letters, numbers, and hyphens only. 3–24 characters.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {!state.ok ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="profile-username">Username</Label>
            <Input
              id="profile-username"
              name="username"
              defaultValue={username}
              minLength={3}
              maxLength={24}
              pattern="[a-z0-9-]+"
              autoComplete="username"
              required
            />
          </div>

          <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save username"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
