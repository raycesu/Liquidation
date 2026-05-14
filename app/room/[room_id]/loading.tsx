import { Skeleton } from "@/components/ui/skeleton"

export default function RoomLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(23,201,255,0.18),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(10,140,255,0.14),transparent_30%),linear-gradient(180deg,rgba(3,9,20,0),rgba(3,9,20,0.92))]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-3xl border border-border/60 bg-surface/65 p-6 shadow-2xl shadow-accent-blue/10 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-3xl space-y-6">
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-7 w-24 rounded-full bg-surface-elevated" />
                <Skeleton className="h-7 w-44 rounded-full bg-surface-elevated" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-14 w-full max-w-xl bg-surface-elevated" />
                <Skeleton className="h-5 w-full max-w-2xl bg-surface-elevated" />
                <Skeleton className="h-5 w-3/4 max-w-lg bg-surface-elevated" />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-11 w-32 rounded-full bg-surface-elevated" />
              <Skeleton className="h-11 w-36 rounded-full bg-surface-elevated" />
              <Skeleton className="h-11 w-44 rounded-full bg-surface-elevated" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-36 rounded-xl bg-surface-elevated" />
          <Skeleton className="h-36 rounded-xl bg-surface-elevated" />
          <Skeleton className="h-36 rounded-xl bg-surface-elevated" />
          <Skeleton className="h-36 rounded-xl bg-surface-elevated" />
        </section>

        <section className="overflow-hidden rounded-xl border border-border/60 bg-surface/70 shadow-2xl shadow-accent-blue/5 backdrop-blur-xl">
          <div className="flex flex-col gap-3 border-b border-border/40 p-5 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-8 w-36 bg-surface-elevated" />
            <Skeleton className="h-8 w-28 rounded-full bg-surface-elevated" />
          </div>
          <div className="space-y-1 p-5">
            <Skeleton className="h-10 w-full bg-surface-elevated" />
            <Skeleton className="h-16 w-full bg-surface-elevated" />
            <Skeleton className="h-16 w-full bg-surface-elevated" />
            <Skeleton className="h-16 w-full bg-surface-elevated" />
          </div>
        </section>
      </div>
    </main>
  )
}
