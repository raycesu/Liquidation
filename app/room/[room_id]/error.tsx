"use client"

import { Button } from "@/components/ui/button"

type RoomErrorProps = {
  reset: () => void
}

export default function RoomError({ reset }: RoomErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Room unavailable</h1>
        <p className="mt-2 text-text-secondary">The lobby could not be loaded.</p>
        <Button className="mt-6" onClick={reset}>
          Reload room
        </Button>
      </div>
    </main>
  )
}
