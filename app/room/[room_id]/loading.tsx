import { Skeleton } from "@/components/ui/skeleton"

export default function RoomLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <Skeleton className="h-12 w-80 bg-surface-elevated" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-36 bg-surface-elevated" />
          <Skeleton className="h-36 bg-surface-elevated" />
          <Skeleton className="h-36 bg-surface-elevated" />
        </div>
        <Skeleton className="h-96 bg-surface-elevated" />
      </div>
    </main>
  )
}
