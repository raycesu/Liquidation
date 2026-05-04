import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TerminalPreview } from "@/components/marketing/terminal-preview"

export const MarketingHero = () => {
  return (
    <section className="relative flex h-full min-h-0 items-center overflow-hidden py-4 sm:py-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_82%_12%,rgb(25_156_255/0.24),transparent_56%),radial-gradient(ellipse_68%_55%_at_10%_88%,rgb(16_199_255/0.16),transparent_60%),radial-gradient(ellipse_48%_42%_at_84%_70%,rgb(11_82_196/0.22),transparent_64%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(5_10_20/0)_0%,rgb(5_10_20/0.4)_64%,var(--background)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_1px_1px,rgb(157_205_255/0.45)_1px,transparent_0),linear-gradient(rgb(93_145_196/0.2)_1px,transparent_1px),linear-gradient(90deg,rgb(93_145_196/0.2)_1px,transparent_1px)] [background-size:28px_28px,52px_52px,52px_52px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[-8%] top-[8%] h-[420px] w-[420px] rounded-full bg-[#008dff]/10 blur-[120px]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid h-full items-center gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1.08fr)] lg:gap-12 xl:gap-16">
          <div className="max-w-2xl lg:max-w-none">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#3dc9ff] sm:text-sm">
              Paper trading. Real competition.
            </p>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.03em] text-text-primary sm:text-5xl lg:text-6xl xl:text-[5.1rem] xl:leading-[0.96]">
              Trade perps.
              <br />
              Crush the leaderboard.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg lg:text-[1.2rem] lg:leading-relaxed">
              Join a room with a shared virtual balance, trade crypto perpetuals with leverage against live
              prices, and compete to finish with the highest equity when the clock runs out.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-11 rounded-full border border-[#50d6a4]/40 bg-gradient-to-r from-[#0ecf79] to-[#07b868] px-8 text-[0.95rem] font-semibold text-[#04130b] shadow-[0_10px_22px_rgb(6_125_74/0.45)] hover:from-[#19dd89] hover:to-[#08c070]"
              >
                <Link href="/sign-up">Start trading</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 rounded-full border-[#34557c] bg-[#0f2137]/85 px-8 text-[0.95rem] text-[#d6e8fa] hover:bg-[#17314f]"
              >
                <Link href="/sign-in">Browse rooms</Link>
              </Button>
            </div>
          </div>

          <div className="relative min-w-0 self-end lg:justify-self-end">
            <div
              className="pointer-events-none absolute -inset-5 rounded-3xl bg-[#1f9cff]/20 blur-3xl lg:-inset-10"
              aria-hidden
            />
            <div
              className="relative ml-auto w-full max-w-[680px] lg:translate-y-8 xl:translate-y-10"
              role="region"
              aria-label="Preview of the trading terminal"
            >
              <TerminalPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
