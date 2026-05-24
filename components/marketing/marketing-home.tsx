import { MarketingPageShell } from "@/components/marketing/marketing-page-shell"
import { MarketingHero } from "@/components/marketing/marketing-hero"
import { MarketingNav } from "@/components/marketing/marketing-nav"

export const MarketingHome = () => {
  return (
    <MarketingPageShell layout="viewport" className="h-screen">
      <MarketingNav />
      <main className="relative min-h-0 flex-1">
        <MarketingHero />
      </main>
    </MarketingPageShell>
  )
}
