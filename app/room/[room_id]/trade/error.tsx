"use client"

import { Button } from "@/components/ui/button"

type TradeErrorProps = {
  reset: () => void
}

export default function TradeError({ reset }: TradeErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Terminal unavailable</h1>
        <p className="mt-2 text-text-secondary">The trading terminal failed to load.</p>
        <Button className="mt-6" onClick={reset}>
          Reload terminal
        </Button>
      </div>
    </main>
  )
}
