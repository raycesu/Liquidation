import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Droplet } from "lucide-react"
import { Button } from "@/components/ui/button"
import heroTerminalImage from "@/public/images/Hero.png"

export const MarketingHero = () => {
  return (
    <section className="relative flex h-full min-h-0 flex-col items-center overflow-hidden px-4 pb-0 pt-3 sm:px-6 sm:pt-5 lg:px-8">
      <div className="relative z-20 flex w-full max-w-6xl shrink-0 flex-col items-center text-center">
        <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-[#315376]/70 bg-[#07172a]/70 px-3 py-1.5 text-xs font-semibold tracking-[-0.01em] text-[#d7ebff] shadow-[0_12px_34px_rgb(3_8_18/0.36)] backdrop-blur-xl sm:mt-2">
          <Droplet className="size-3.5 fill-accent-neon/20 text-accent-neon" aria-hidden />
          <span>For Traders. For Degens. For the Leaderboard.</span>
        </div>

        <h1 className="mt-4 max-w-5xl bg-gradient-to-b from-white via-[#edf7ff] to-[#9eb7cf] bg-clip-text text-[clamp(2.8rem,6.2vw,5.75rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-transparent drop-shadow-[0_18px_48px_rgb(0_0_0/0.38)] [font-family:var(--font-marketing-heading)] [text-wrap:balance]">
          Fake Money
          <br />
          Real Competition
        </h1>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="mt-6 h-11 rounded-full !border-[#d8f3ff]/75 !bg-[#ecf8ff] px-7 text-[0.95rem] font-semibold !text-[#03101f] shadow-[0_16px_34px_rgb(17_191_255/0.28),inset_0_1px_0_rgb(255_255_255/0.9)] hover:!border-white hover:!bg-white hover:!text-[#03101f] hover:shadow-[0_14px_30px_rgb(255_255_255/0.16),inset_0_1px_0_rgb(255_255_255/0.95)] sm:mt-7"
        >
          <Link href="/sign-up">
            Get started
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <div className="relative z-10 mt-10 flex min-h-0 w-full max-w-6xl translate-y-24 flex-1 items-end sm:mt-12 lg:mt-16 lg:translate-y-28">
        <div
          className="pointer-events-none absolute inset-x-6 bottom-[-18%] h-2/3 rounded-full bg-[#0f8dff]/20 blur-[70px]"
          aria-hidden
        />
        <div className="relative mx-auto w-full overflow-hidden rounded-t-[1.65rem] border border-[#47688d]/70 bg-[#07172a]/80 p-1.5 shadow-[0_-18px_70px_rgb(17_201_255/0.16),0_30px_80px_rgb(0_0_0/0.45)] backdrop-blur">
          <div className="overflow-hidden rounded-t-[1.35rem] border border-white/8 bg-[#07111f]">
            <Image
              src={heroTerminalImage}
              alt="Liquidation trading terminal showing a BTC-USD perpetual futures chart and order panel"
              className="h-auto w-full object-cover object-top"
              sizes="(min-width: 1280px) 1152px, (min-width: 768px) 92vw, 96vw"
              priority
              placeholder="blur"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
