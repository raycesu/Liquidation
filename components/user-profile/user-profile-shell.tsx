import Image from "next/image"
import Link from "next/link"
import { Suspense, type ReactNode } from "react"
import { UserProfileBackLink } from "@/components/user-profile/user-profile-back-link"
import { MarketingBackdrop } from "@/components/marketing/marketing-backdrop"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"
import { marketingFontClassName } from "@/lib/marketing-fonts"

type UserProfileShellProps = {
  children: ReactNode
}

export const UserProfileShell = ({ children }: UserProfileShellProps) => {
  return (
    <div
      data-theme="marketing-dark"
      className={`${marketingFontClassName} relative isolate flex h-dvh max-h-dvh flex-col overflow-hidden bg-background [font-family:var(--font-marketing-sans)]`}
    >
      <MarketingBackdrop />
      <header className="relative z-10 flex flex-col gap-4 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-6 lg:px-8">
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
        <Suspense
          fallback={
            <div
              className="h-10 w-[168px] rounded-full border border-white/10 bg-[#07172a]/70"
              aria-hidden
            />
          }
        >
          <UserProfileBackLink />
        </Suspense>
      </header>
      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex w-full max-w-4xl justify-center">{children}</div>
      </main>
    </div>
  )
}
