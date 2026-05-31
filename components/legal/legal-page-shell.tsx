import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"
import { cn } from "@/lib/utils"

type LegalPageShellProps = {
  title: string
  children: ReactNode
  className?: string
}

export const LegalPageShell = ({ title, children, className }: LegalPageShellProps) => (
  <MarketingPageShell layout="scroll">
    <header className="relative z-10 border-b border-white/8 bg-[#03101f]/40 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={`${BRAND_NAME} home`}
        >
          <Image
            src={BRAND_LOGO_SRC}
            alt=""
            width={BRAND_LOGO_WIDTH}
            height={BRAND_LOGO_HEIGHT}
            className="h-9 w-auto sm:h-10"
            priority
            unoptimized
          />
          <span className="sr-only">{BRAND_NAME}</span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-[#87abcf] underline-offset-4 transition-colors hover:text-[#d7ebff] hover:underline"
        >
          Back to home
        </Link>
      </div>
    </header>

    <main className={cn("relative z-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8", className)}>
      <div className="mx-auto max-w-4xl">
        <div className="sr-only">
          <h1>{title}</h1>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#f8fafc] p-6 shadow-[0_24px_80px_rgb(2_8_23/0.45)] sm:p-10">
          {children}
        </div>
      </div>
    </main>
  </MarketingPageShell>
)
