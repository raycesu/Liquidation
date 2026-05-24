"use client"

import { MarketingPageShell } from "@/components/marketing/marketing-page-shell"
import { Button } from "@/components/ui/button"

type DashboardErrorProps = {
  reset: () => void
}

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <MarketingPageShell layout="flex" className="items-center justify-center p-6">
      <div className="relative z-10 rounded-xl border border-border bg-surface/90 p-6 text-center backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard unavailable</h1>
        <p className="mt-2 text-text-secondary">Refresh the room list and try again.</p>
        <Button className="mt-6" onClick={reset}>
          Reload dashboard
        </Button>
      </div>
    </MarketingPageShell>
  )
}
