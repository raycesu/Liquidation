import { MarketingHero } from "@/components/marketing/marketing-hero"
import { MarketingNav } from "@/components/marketing/marketing-nav"

export const MarketingHome = () => {
  return (
    <div
      data-theme="marketing-dark"
      className="relative flex h-screen flex-col overflow-hidden bg-background"
    >
      <MarketingNav />
      <main className="min-h-0 flex-1">
        <MarketingHero />
      </main>
    </div>
  )
}
