import {
  Activity,
  BarChart3,
  Crosshair,
  Lock,
  TrendingUp,
  UserCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const FEATURES = [
  {
    icon: Activity,
    title: "Live prices",
    description: "Binance USDT-M perpetual stream, real-time per user.",
  },
  {
    icon: Lock,
    title: "Private rooms",
    description: "Invite-only competitions with custom balances and schedules.",
  },
  {
    icon: Crosshair,
    title: "TP/SL on entry",
    description: "Set take-profit and stop-loss when opening any position.",
  },
  {
    icon: BarChart3,
    title: "Live rankings",
    description: "Leaderboard updates as positions move in real time.",
  },
  {
    icon: TrendingUp,
    title: "Up to 50× leverage",
    description: "Per-asset caps from Hyperliquid metadata.",
  },
  {
    icon: UserCircle,
    title: "Trader profiles",
    description: "Track placements, P&L history, and trading style across rooms.",
  },
] as const

export const FeatureHighlights = () => {
  return (
    <section
      id="features"
      className="scroll-mt-24 border-t border-border bg-background py-16 sm:py-20 lg:scroll-mt-28 lg:py-24"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="features-heading"
          className="font-heading text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl"
        >
          Built for serious paper trading
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary sm:text-base">
          Everything you need to run a fair, fast-moving perps competition.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-5">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-border bg-card ring-1 ring-foreground/5">
              <CardContent className="flex flex-col gap-3 p-5 sm:p-6">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-4" aria-hidden />
                </div>
                <h3 className="text-base font-semibold text-text-primary">{title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
