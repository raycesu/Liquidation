"use client"

import type { LucideIcon } from "lucide-react"
import type { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  id: string
  label: string
  icon: LucideIcon
  error?: string | null
  endAdornment?: React.ReactNode
}

export const AuthField = ({
  id,
  label,
  icon: Icon,
  error,
  endAdornment,
  type = "text",
  ...inputProps
}: AuthFieldProps) => {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#6e93b8]"
          aria-hidden
        />
        <input
          id={id}
          type={type}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] pr-11 pl-10 text-sm text-[#e6f3ff] shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] outline-none transition-colors placeholder:text-[#6e93b8] focus-visible:border-accent-neon/50 focus-visible:ring-3 focus-visible:ring-accent-neon/20",
            error && "border-destructive/60 focus-visible:border-destructive/60 focus-visible:ring-destructive/20",
          )}
          {...inputProps}
        />
        {endAdornment ? (
          <div className="absolute top-1/2 right-2 -translate-y-1/2">{endAdornment}</div>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
