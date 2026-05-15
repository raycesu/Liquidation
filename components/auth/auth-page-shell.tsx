import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { MarketingBackdrop } from "@/components/marketing/marketing-backdrop"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"
import { marketingFontClassName } from "@/lib/marketing-fonts"

type AuthPageShellProps = {
  children: ReactNode
}

export const AuthPageShell = ({ children }: AuthPageShellProps) => {
  return (
    <div
      data-theme="marketing-dark"
      className={`${marketingFontClassName} relative isolate flex min-h-screen flex-col overflow-hidden bg-background [font-family:var(--font-marketing-sans)]`}
    >
      <MarketingBackdrop />
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
            className="h-8 w-auto sm:h-9"
            priority
            unoptimized
          />
          <span className="sr-only">{BRAND_NAME}</span>
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  )
}
