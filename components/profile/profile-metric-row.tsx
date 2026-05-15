import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type ProfileMetricRowProps = {
  label: string
  value: ReactNode
  valueClassName?: string
}

export const ProfileMetricRow = ({ label, value, valueClassName }: ProfileMetricRowProps) => (
  <div className="flex items-center justify-between gap-4 border-b border-border/50 py-3 last:border-0">
    <span className="text-sm text-text-secondary">{label}</span>
    <span className={cn("text-right text-sm font-semibold tabular-nums text-text-primary", valueClassName)}>
      {value}
    </span>
  </div>
)
