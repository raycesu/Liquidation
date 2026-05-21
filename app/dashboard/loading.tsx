import { MarketingBackdrop } from "@/components/marketing/marketing-backdrop"
import { Skeleton } from "@/components/ui/skeleton"
import { marketingFontClassName } from "@/lib/marketing-fonts"

export default function DashboardLoading() {
  return (
    <div
      data-theme="marketing-dark"
      className={`${marketingFontClassName} relative isolate min-h-screen overflow-hidden bg-background [font-family:var(--font-marketing-sans)]`}
    >
      <MarketingBackdrop />
      <main className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
          <header className="flex flex-col gap-4 border-b border-white/8 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="-ml-4 h-[3.3rem] w-56 rounded-md bg-muted object-left sm:-ml-5 sm:h-[3.6rem]" />
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <Skeleton className="h-10 w-28 rounded-full bg-muted" />
              <Skeleton className="h-10 w-32 rounded-full bg-muted" />
              <Skeleton className="size-11 shrink-0 rounded-full bg-muted" />
            </div>
          </header>

          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <Skeleton className="h-9 w-56 max-w-full rounded-md bg-muted sm:h-10" />
              <Skeleton className="h-6 w-[4.5rem] shrink-0 rounded-full bg-muted/80" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-64 rounded-2xl bg-muted/80" />
              <Skeleton className="h-64 rounded-2xl bg-muted/80 sm:block" />
              <Skeleton className="hidden h-64 rounded-2xl bg-muted/80 xl:block" />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
