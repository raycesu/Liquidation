import type { ReactNode } from "react"
import { MarketingBackdrop } from "@/components/marketing/marketing-backdrop"
import { marketingFontClassName } from "@/lib/marketing-fonts"
import { cn } from "@/lib/utils"

type MarketingPageShellProps = {
  children: ReactNode
  className?: string
  layout?: "scroll" | "viewport" | "flex"
}

const layoutClassNames = {
  scroll: "min-h-screen",
  viewport: "flex h-dvh max-h-dvh flex-col",
  flex: "flex min-h-screen flex-col",
} as const

export const MarketingPageShell = ({
  children,
  className,
  layout = "scroll",
}: MarketingPageShellProps) => (
  <div
    data-theme="marketing-dark"
    className={cn(
      marketingFontClassName,
      "relative isolate overflow-hidden bg-background [font-family:var(--font-marketing-sans)]",
      layoutClassNames[layout],
      className,
    )}
  >
    <MarketingBackdrop />
    {children}
  </div>
)
