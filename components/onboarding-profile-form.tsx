"use client"

import { ArrowRight, Camera, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useActionState, useState } from "react"
import { completeProfileSetup } from "@/actions/complete-profile-setup"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { openLobbyButtonClassName } from "@/lib/dashboard-nav-triggers"
import type { ActionResult } from "@/lib/types"
import { cn } from "@/lib/utils"

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
    <form action={formAction} className="space-y-4">
      {!state.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-1.5 flex justify-center pt-1.5 pb-0">
        <Link
          href="/user-profile/photo?redirect_url=/onboarding"
          aria-label="Add or change profile photo"
          className={cn(
            "group relative size-[7.5rem] shrink-0 overflow-hidden rounded-full border border-border bg-muted ring-2 ring-accent-neon/30",
            "outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-accent-neon/50",
          )}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile avatar preview"
              fill
              className="object-cover"
              sizes="120px"
              unoptimized
            />
          ) : (
            <div
              className="flex size-full items-center justify-center text-3xl font-semibold text-text-secondary"
              aria-hidden
            >
              {getInitials(usernamePreview || "tr")}
            </div>
          )}
          {!avatarUrl ? (
            <span
              className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border border-white/20 bg-accent-neon/90 text-accent-foreground shadow-sm"
              aria-hidden
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
            </span>
          ) : null}
          <span
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100"
            aria-hidden
          >
            <Camera className="size-8 text-white" />
          </span>
        </Link>
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
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          type="submit"
          variant="default"
          size="lg"
          disabled={isPending}
          className={openLobbyButtonClassName}
        >
          {isPending ? "Saving..." : "Continue"}
        </Button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary disabled:pointer-events-none disabled:opacity-50"
        >
          Skip for now
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      </div>
    </form>
  )
}
