import { Skeleton } from "@/components/ui/skeleton"

export default function RoomLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(23,201,255,0.18),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(10,140,255,0.14),transparent_30%),linear-gradient(180deg,rgba(3,9,20,0),rgba(3,9,20,0.92))]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <section className="overflow-hidden rounded-3xl border border-border/60 border-l-2 border-l-accent-neon bg-background p-4 shadow-2xl shadow-accent-blue/10 backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-20 rounded-full bg-surface-elevated" />
                  <Skeleton className="h-7 w-16 rounded-full bg-surface-elevated" />
                </div>
                <Skeleton className="h-9 w-full max-w-sm bg-surface-elevated" />
                <Skeleton className="h-4 w-full max-w-md bg-surface-elevated" />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Skeleton className="h-10 w-32 rounded-full bg-surface-elevated" />
                <Skeleton className="h-10 w-40 rounded-full bg-surface-elevated" />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-2xl shadow-accent-blue/10 backdrop-blur-xl">
            <div className="flex flex-col divide-y divide-border/40 p-3 sm:flex-row sm:divide-x sm:divide-y-0 sm:p-0">
              <Skeleton className="h-10 flex-1 rounded-none bg-surface-elevated sm:mx-4 sm:my-3" />
              <Skeleton className="h-10 flex-1 rounded-none bg-surface-elevated sm:mx-4 sm:my-3" />
              <Skeleton className="h-10 flex-1 rounded-none bg-surface-elevated sm:mx-4 sm:my-3" />
              <Skeleton className="h-10 flex-1 rounded-none bg-surface-elevated sm:mx-4 sm:my-3" />
              <Skeleton className="h-10 flex-1 rounded-none bg-surface-elevated sm:mx-4 sm:my-3" />
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-7 w-44 bg-surface-elevated" />
            <Skeleton className="h-8 w-28 rounded-full bg-surface-elevated" />
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-surface/70 shadow-2xl shadow-accent-blue/5 backdrop-blur-xl">
            <Skeleton className="h-12 w-full rounded-none bg-surface-elevated" />
            <div className="space-y-1 p-5">
              <Skeleton className="h-16 w-full bg-surface-elevated" />
              <Skeleton className="h-16 w-full bg-surface-elevated" />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
