"use client"

import { Button } from "@/components/ui/button"

type DashboardErrorProps = {
  reset: () => void
}

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard unavailable</h1>
        <p className="mt-2 text-text-secondary">Refresh the room list and try again.</p>
        <Button className="mt-6" onClick={reset}>
          Reload dashboard
        </Button>
      </div>
    </main>
  )
}
