import { MarketingPageShell } from "@/components/marketing/marketing-page-shell"
import { Skeleton } from "@/components/ui/skeleton"
import {
  lobbyHeaderCardClassName,
  lobbyLeaderboardCardClassName,
  lobbyStatCardClassName,
} from "@/lib/room-card-surface"
import { cn } from "@/lib/utils"

export default function RoomLoading() {
  return (
    <MarketingPageShell>
      <main className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <div className="flex flex-col gap-4">
            <section className={cn(lobbyHeaderCardClassName, "p-4 sm:p-5")}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-7 w-20 rounded-full bg-surface-elevated" />
                    <Skeleton className="h-7 w-16 rounded-full bg-surface-elevated" />
                  </div>
                  <Skeleton className="h-9 w-full max-w-sm bg-surface-elevated" />
                  <Skeleton className="h-4 w-48 max-w-md bg-surface-elevated" />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Skeleton className="h-11 w-36 rounded-full bg-surface-elevated" />
                  <Skeleton className="h-11 w-28 rounded-full bg-surface-elevated" />
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Skeleton className={cn(lobbyStatCardClassName, "h-24 animate-pulse")} />
              <Skeleton className={cn(lobbyStatCardClassName, "h-24 animate-pulse")} />
              <Skeleton className={cn(lobbyStatCardClassName, "h-24 animate-pulse")} />
              <Skeleton className={cn(lobbyStatCardClassName, "h-24 animate-pulse")} />
            </section>
          </div>

          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-7 w-44 bg-surface-elevated" />
              <Skeleton className="h-8 w-28 rounded-full bg-surface-elevated" />
            </div>
            <div className={cn("overflow-hidden rounded-xl bg-surface/70 backdrop-blur-xl", lobbyLeaderboardCardClassName)}>
              <Skeleton className="h-12 w-full rounded-none bg-surface-elevated" />
              <div className="space-y-1 p-5">
                <Skeleton className="h-16 w-full bg-surface-elevated" />
                <Skeleton className="h-16 w-full bg-surface-elevated" />
              </div>
            </div>
          </section>
        </div>
      </main>
    </MarketingPageShell>
  )
}
