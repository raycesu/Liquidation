"use client"

import Link from "next/link"
import { useActionState } from "react"
import { updateProfile } from "@/actions/update-profile"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ActionResult } from "@/lib/types"

type ProfileSettingsFormProps = {
  username: string
}

const initialState: ActionResult<{ username: string }> = {
  ok: true,
  data: {
    username: "",
  },
}

export const ProfileSettingsForm = ({ username }: ProfileSettingsFormProps) => {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState)

  return (
    <div className="mt-4 space-y-4">
      <form action={formAction} className="space-y-3">
        {!state.ok ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        {state.ok && state.data.username ? (
          <Alert>
            <AlertDescription>Username updated to @{state.data.username}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            defaultValue={username}
            minLength={3}
            maxLength={24}
            pattern="[a-z0-9-]+"
            autoComplete="username"
            required
          />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save username"}
        </Button>
      </form>

      <div className="rounded-md border border-border bg-background/30 p-3">
        <p className="text-sm text-text-secondary">
          Profile photos appear on competition leaderboards. Manage your photo in account settings.
        </p>
        <Button className="mt-3" variant="outline" asChild>
          <Link href="/user-profile/photo?redirect_url=/dashboard/profile">Change profile photo</Link>
        </Button>
      </div>
    </div>
  )
}
