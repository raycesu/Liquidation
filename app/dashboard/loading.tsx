import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 md:grid-cols-3">
        <Skeleton className="h-52 bg-surface-elevated" />
        <Skeleton className="h-52 bg-surface-elevated" />
        <Skeleton className="h-52 bg-surface-elevated" />
      </div>
    </main>
  )
}
