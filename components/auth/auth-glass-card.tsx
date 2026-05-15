import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AuthGlassCardProps = {
  icon: LucideIcon
  title: string
  subtitle: string
  children: ReactNode
  className?: string
}

export const AuthGlassCard = ({
  icon: Icon,
  title,
  subtitle,
  children,
  className,
}: AuthGlassCardProps) => {
  return (
    <div
      className={cn(
        "w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#07172a]/55 p-8 shadow-[0_24px_80px_rgb(3_8_18/0.55),0_0_0_1px_rgb(17_201_255/0.08)_inset] backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
        <Icon className="size-5 text-accent-neon" aria-hidden />
      </div>
      <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight text-[#e6f3ff] [font-family:var(--font-marketing-heading)]">
        {title}
      </h1>
      <p className="mt-2 text-center text-sm leading-relaxed text-[#87abcf]">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}
