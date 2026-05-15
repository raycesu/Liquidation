"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

type ProfileErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProfileError({ error, reset }: ProfileErrorProps) {
  const showDetails = process.env.NODE_ENV === "development"

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Profile unavailable</h1>
        <p className="mt-2 text-text-secondary">
          We could not load your trading stats. Try again in a moment.
        </p>
        {showDetails ? (
          <p className="mt-3 break-words text-left text-xs text-muted-foreground">{error.message}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard">Back to rooms</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
