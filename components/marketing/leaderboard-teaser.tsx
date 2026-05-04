import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Row = {
  rank: 1 | 2 | 3 | 4
  initials: string
  username: string
  pnl: string
  liquidated?: boolean
}

const ROWS: Row[] = [
  { rank: 1, initials: "MK", username: "matrix_trader", pnl: "+18.4%" },
  { rank: 2, initials: "SR", username: "shortsqueeze_rick", pnl: "+12.1%" },
  { rank: 3, initials: "LP", username: "leopardprint", pnl: "+6.7%" },
  { rank: 4, initials: "ZX", username: "zero_ex", pnl: "-100.0%", liquidated: true },
]

const rankRing: Record<number, string> = {
  1: "ring-amber-400/60 bg-amber-400/15 text-amber-200",
  2: "ring-slate-300/50 bg-slate-300/10 text-slate-200",
  3: "ring-amber-700/50 bg-amber-800/20 text-amber-100/90",
  4: "ring-border bg-muted text-muted-foreground",
}

export const LeaderboardTeaser = () => {
  return (
    <section
      id="leaderboard"
      className="scroll-mt-24 bg-surface/40 py-16 sm:py-20 lg:scroll-mt-28 lg:py-24"
      aria-labelledby="leaderboard-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="leaderboard-heading"
          className="font-heading text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl"
        >
          Live leaderboard
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary sm:text-base">
          Preview of how rankings look inside a room — mock data for illustration.
        </p>

        <Card className="mx-auto mt-10 max-w-lg border-border bg-card ring-1 ring-foreground/10">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-secondary">Room</p>
                <p className="text-lg font-semibold text-text-primary">Weekly Perp Cup</p>
              </div>
              <div className="text-right text-xs text-text-secondary">
                <p>24 traders</p>
                <p className="mt-0.5 font-mono text-text-primary">3d 14h left</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {ROWS.map((row) => (
                <li key={row.username} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-inset sm:size-10 sm:text-sm",
                      rankRing[row.rank],
                    )}
                    aria-label={`Rank ${row.rank}`}
                  >
                    {row.rank}
                  </div>
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground sm:size-10 sm:text-sm",
                      row.liquidated && "opacity-60",
                    )}
                  >
                    {row.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-medium text-text-primary sm:text-base",
                        row.liquidated && "text-muted-foreground line-through decoration-destructive/80",
                      )}
                    >
                      {row.username}
                    </p>
                    {row.liquidated ? (
                      <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Liquidated</p>
                    ) : null}
                  </div>
                  <div
                    className={cn(
                      "shrink-0 font-mono text-sm font-medium tabular-nums sm:text-base",
                      row.liquidated ? "text-destructive" : "text-profit",
                    )}
                  >
                    {row.pnl}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center">
          <Button asChild variant="link" className="text-base text-primary">
            <Link href="/sign-in">View all competitions</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
