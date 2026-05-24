import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"

type AuthPageShellProps = {
  children: ReactNode
}

export const AuthPageShell = ({ children }: AuthPageShellProps) => {
  return (
    <MarketingPageShell layout="flex">
      <header className="relative z-10 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
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
            className="h-11 w-auto sm:h-12"
            priority
            unoptimized
          />
          <span className="sr-only">{BRAND_NAME}</span>
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        {children}
      </main>
    </MarketingPageShell>
  )
}
