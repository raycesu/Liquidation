"use client"

import { MarketingBackdrop } from "@/components/marketing/marketing-backdrop"
import { Button } from "@/components/ui/button"
import { marketingFontClassName } from "@/lib/marketing-fonts"

type DashboardErrorProps = {
  reset: () => void
}

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <div
      data-theme="marketing-dark"
      className={`${marketingFontClassName} relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background p-6 [font-family:var(--font-marketing-sans)]`}
    >
      <MarketingBackdrop />
      <div className="relative z-10 rounded-xl border border-border bg-surface/90 p-6 text-center backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard unavailable</h1>
        <p className="mt-2 text-text-secondary">Refresh the room list and try again.</p>
        <Button className="mt-6" onClick={reset}>
          Reload dashboard
        </Button>
      </div>
    </div>
  )
}
