import { Inter_Tight, Manrope } from "next/font/google"
import { MarketingHero } from "@/components/marketing/marketing-hero"
import { MarketingNav } from "@/components/marketing/marketing-nav"

const marketingSans = Manrope({
  variable: "--font-marketing-sans",
  subsets: ["latin"],
})

const marketingHeading = Inter_Tight({
  variable: "--font-marketing-heading",
  subsets: ["latin"],
})

export const MarketingHome = () => {
  return (
    <div
      data-theme="marketing-dark"
      className={`${marketingSans.variable} ${marketingHeading.variable} relative isolate flex h-screen h-dvh max-h-dvh flex-col overflow-hidden bg-background [font-family:var(--font-marketing-sans)]`}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_18%,rgb(17_201_255/0.28),transparent_34%),radial-gradient(ellipse_78%_54%_at_50%_38%,rgb(10_140_255/0.22),transparent_62%),radial-gradient(ellipse_60%_38%_at_50%_98%,rgb(6_40_80/0.75),transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] [background-image:linear-gradient(rgb(138_194_244/0.22)_1px,transparent_1px),linear-gradient(90deg,rgb(138_194_244/0.22)_1px,transparent_1px)] [background-size:54px_54px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--background)_0%,rgb(5_10_20/0)_18%,rgb(5_10_20/0)_82%,var(--background)_100%),linear-gradient(180deg,rgb(5_10_20/0)_0%,rgb(5_10_20/0.15)_58%,var(--background)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-72 max-w-4xl rounded-full bg-[#17c9ff]/10 blur-[90px] sm:h-96"
        aria-hidden
      />

      <MarketingNav />
      <main className="relative min-h-0 flex-1">
        <MarketingHero />
      </main>
    </div>
  )
}
