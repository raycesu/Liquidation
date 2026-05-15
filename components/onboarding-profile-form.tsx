"use client"

import Image from "next/image"
import Link from "next/link"
import { useActionState, useState } from "react"
import { completeProfileSetup } from "@/actions/complete-profile-setup"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ActionResult } from "@/lib/types"

type OnboardingProfileFormProps = {
  avatarUrl: string | null
  suggestedUsername: string
}

const initialState: ActionResult<{ username: string }> = {
  ok: true,
  data: {
    username: "",
  },
}

const getInitials = (username: string) => username.slice(0, 2).toUpperCase()

export const OnboardingProfileForm = ({ avatarUrl, suggestedUsername }: OnboardingProfileFormProps) => {
  const [state, formAction, isPending] = useActionState(completeProfileSetup, initialState)
  const [usernamePreview, setUsernamePreview] = useState(suggestedUsername)

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsernamePreview(event.target.value.toLowerCase())
  }

  return (
    <form action={formAction} className="space-y-6">
      {!state.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted ring-2 ring-accent-neon/30">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile avatar preview"
              fill
              className="object-cover"
              sizes="96px"
              unoptimized
            />
          ) : (
            <div
              className="flex size-full items-center justify-center text-2xl font-semibold text-text-secondary"
              aria-hidden
            >
              {getInitials(usernamePreview || "tr")}
            </div>
          )}
        </div>
        <div className="space-y-3 text-center sm:text-left">
          <p className="text-sm text-text-secondary">
            Add a profile photo for competition leaderboards, or skip and add one later.
          </p>
          <Button variant="outline" asChild>
            <Link href="/user-profile/photo?redirect_url=/onboarding">Change photo</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          defaultValue={suggestedUsername}
          minLength={3}
          maxLength={24}
          pattern="[a-z0-9-]+"
          autoComplete="username"
          required
          onChange={handleUsernameChange}
        />
        <p className="text-sm text-text-secondary">
          {usernamePreview.length >= 3 ? (
            <>
              Your trading name will be{" "}
              <span className="font-medium text-text-primary">@{usernamePreview}</span>
            </>
          ) : (
            "3–24 characters: lowercase letters, numbers, and hyphens"
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={isPending} className="sm:flex-1">
          {isPending ? "Saving..." : "Continue"}
        </Button>
        <Button type="submit" variant="outline" disabled={isPending} className="sm:flex-1">
          {isPending ? "Saving..." : "Skip photo for now"}
        </Button>
      </div>
    </form>
  )
}
