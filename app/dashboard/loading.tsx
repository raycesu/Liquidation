import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-40 rounded-md bg-muted" />
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Skeleton className="h-9 w-24 rounded-lg bg-muted" />
            <Skeleton className="h-9 w-28 rounded-lg bg-muted" />
            <Skeleton className="size-9 shrink-0 rounded-full bg-muted" />
          </div>
        </header>

        <section className="space-y-6">
          <Skeleton className="h-9 w-56 max-w-full rounded-md bg-muted sm:h-10" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-64 rounded-2xl bg-muted/80" />
            <Skeleton className="h-64 rounded-2xl bg-muted/80 sm:block" />
            <Skeleton className="hidden h-64 rounded-2xl bg-muted/80 xl:block" />
          </div>
        </section>
      </div>
    </main>
  )
}
