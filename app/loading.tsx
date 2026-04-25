import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Skeleton className="h-10 w-64 bg-surface-elevated" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40 bg-surface-elevated" />
          <Skeleton className="h-40 bg-surface-elevated" />
          <Skeleton className="h-40 bg-surface-elevated" />
        </div>
      </div>
    </main>
  )
}
