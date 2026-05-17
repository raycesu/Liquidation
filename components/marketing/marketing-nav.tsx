import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"

export const MarketingNav = () => {
  return (
    <header className="relative z-50 pt-4 sm:pt-6">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between px-4 sm:h-14 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={`${BRAND_NAME} home`}
        >
          <Image
            src={BRAND_LOGO_SRC}
            alt=""
            width={BRAND_LOGO_WIDTH}
            height={BRAND_LOGO_HEIGHT}
            className="h-10 w-auto sm:h-11"
            priority
            unoptimized
          />
          <span className="sr-only">{BRAND_NAME}</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="outline"
            size="default"
            className="h-10 rounded-full border-white/12 bg-white/[0.04] px-4 text-sm font-medium text-[#d7ebff] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl hover:border-[#7bd7ff]/35 hover:bg-white/[0.08] hover:text-white sm:px-5"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="default"
            className="h-10 rounded-full !border-[#d8f3ff]/75 !bg-[#ecf8ff] px-4 text-sm font-semibold !text-[#03101f] shadow-[0_10px_24px_rgb(17_191_255/0.18),inset_0_1px_0_rgb(255_255_255/0.9)] hover:!border-white hover:!bg-white hover:!text-[#03101f] hover:shadow-[0_10px_24px_rgb(255_255_255/0.16),inset_0_1px_0_rgb(255_255_255/0.95)] sm:px-5"
          >
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
