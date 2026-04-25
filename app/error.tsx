"use client"

import { Button } from "@/components/ui/button"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-text-secondary">System fault</p>
        <h1 className="mt-3 text-2xl font-semibold text-text-primary">Something went wrong</h1>
        <p className="mt-3 text-sm text-text-secondary">{error.message}</p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  )
}
