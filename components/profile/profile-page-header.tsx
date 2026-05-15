import Image from "next/image"
import Link from "next/link"
import { SignOutButton } from "@/components/sign-out-button"
import { Button } from "@/components/ui/button"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"

const premiumButtonBase =
  "h-10 rounded-full border px-5 text-sm font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-all duration-200"

const backButtonClassName = cn(
  premiumButtonBase,
  "border-white/12 bg-white/[0.06] text-text-primary hover:border-accent-neon/35 hover:bg-white/[0.1] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_8px_32px_rgba(17,201,255,0.14)]",
)

const signOutButtonClassName = cn(
  premiumButtonBase,
  "border-white/8 bg-white/[0.03] text-text-secondary hover:border-white/16 hover:bg-white/[0.07] hover:text-text-primary hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_6px_24px_rgba(10,140,255,0.1)]",
)

export const ProfilePageHeader = () => {
  return (
    <header className="flex flex-col gap-4 border-b border-white/8 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href="/dashboard"
        className="inline-flex shrink-0 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`${BRAND_NAME} home`}
      >
        <Image
          src={BRAND_LOGO_SRC}
          alt={`${BRAND_NAME} logo`}
          width={BRAND_LOGO_WIDTH}
          height={BRAND_LOGO_HEIGHT}
          className="h-8 w-auto max-w-[200px] sm:h-9"
          priority
          unoptimized
        />
      </Link>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <Button asChild variant="outline" size="lg" className={backButtonClassName}>
          <Link href="/dashboard" className="inline-flex items-center gap-2">
            <ArrowLeft className="size-4 opacity-80" aria-hidden />
            Back to rooms
          </Link>
        </Button>
        <SignOutButton size="lg" className={signOutButtonClassName} />
      </div>
    </header>
  )
}
