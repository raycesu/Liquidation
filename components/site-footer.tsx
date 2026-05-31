import Link from "next/link"
import { PRIVACY_POLICY_PATH, TERMS_OF_SERVICE_PATH } from "@/lib/legal/routes"
import { cn } from "@/lib/utils"

type SiteFooterProps = {
  className?: string
}

export const SiteFooter = ({ className }: SiteFooterProps) => (
  <footer
    className={cn(
      "relative z-10 border-t border-white/8 bg-[#03101f]/60 px-4 py-4 text-center backdrop-blur-sm sm:px-6 lg:px-8",
      className,
    )}
  >
    <nav aria-label="Legal">
      <ul className="flex items-center justify-center gap-2 text-sm text-[#87abcf]">
        <li>
          <Link
            href={TERMS_OF_SERVICE_PATH}
            className="rounded-sm font-medium underline-offset-4 transition-colors hover:text-[#d7ebff] hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Terms
          </Link>
        </li>
        <li aria-hidden className="text-white/25">
          •
        </li>
        <li>
          <Link
            href={PRIVACY_POLICY_PATH}
            className="rounded-sm font-medium underline-offset-4 transition-colors hover:text-[#d7ebff] hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Privacy
          </Link>
        </li>
      </ul>
    </nav>
  </footer>
)
