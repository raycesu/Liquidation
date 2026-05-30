import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"

type AuthPageShellProps = {
  children: ReactNode
  logoClassName?: string
}

const defaultLogoClassName = "h-11 w-auto sm:h-12"

export const AuthPageShell = ({ children, logoClassName = defaultLogoClassName }: AuthPageShellProps) => {
  return (
    <MarketingPageShell layout="flex">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={`${BRAND_NAME} home`}
        >
          <Image
            src={BRAND_LOGO_SRC}
            alt=""
            width={BRAND_LOGO_WIDTH}
            height={BRAND_LOGO_HEIGHT}
            className={logoClassName}
            priority
            unoptimized
          />
          <span className="sr-only">{BRAND_NAME}</span>
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-6">
        {children}
      </main>
    </MarketingPageShell>
  )
}
