import { Skeleton } from "@/components/ui/skeleton"

export default function TradeLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto grid w-full max-w-[1600px] gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(360px,1fr)]">
        <Skeleton className="h-[640px] bg-surface-elevated" />
        <Skeleton className="h-[420px] bg-surface-elevated" />
      </div>
    </main>
  )
}
