import { MarketingBackdrop } from "@/components/marketing/marketing-backdrop"
import { MarketingHero } from "@/components/marketing/marketing-hero"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { marketingFontClassName } from "@/lib/marketing-fonts"

export const MarketingHome = () => {
  return (
    <div
      data-theme="marketing-dark"
      className={`${marketingFontClassName} relative isolate flex h-screen h-dvh max-h-dvh flex-col overflow-hidden bg-background [font-family:var(--font-marketing-sans)]`}
    >
      <MarketingBackdrop />
      <MarketingNav />
      <main className="relative min-h-0 flex-1">
        <MarketingHero />
      </main>
    </div>
  )
}
