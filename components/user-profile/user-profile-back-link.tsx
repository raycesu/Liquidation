"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { DEFAULT_USER_PROFILE_REDIRECT, resolveUserProfileRedirect } from "@/lib/user-profile-redirect"
import { cn } from "@/lib/utils"

export const UserProfileBackLink = () => {
  const searchParams = useSearchParams()
  const redirectPath = resolveUserProfileRedirect(searchParams.get("redirect_url"))

  return (
    <Link
      href={redirectPath}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2.5 rounded-full border border-white/10",
        "bg-[#07172a]/70 px-3 py-2 text-sm font-medium text-[#e6f3ff] shadow-[0_10px_28px_rgb(3_8_18/0.4),inset_0_1px_0_rgb(255_255_255/0.07)]",
        "backdrop-blur-md transition-[border-color,background-color,box-shadow,transform] duration-200",
        "hover:-translate-y-px hover:border-accent-neon/35 hover:bg-[#0a2038]/85",
        "hover:shadow-[0_12px_32px_rgb(16_199_255/0.14),inset_0_1px_0_rgb(255_255_255/0.09)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-neon/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a14]",
      )}
      aria-label={
        redirectPath === DEFAULT_USER_PROFILE_REDIRECT
          ? "Back to your profile"
          : `Back to ${redirectPath}`
      }
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full border border-white/12 bg-white/[0.06]",
          "text-accent-neon transition-colors group-hover:border-accent-neon/35 group-hover:bg-accent-neon/10",
        )}
        aria-hidden
      >
        <ArrowLeft className="size-3.5" />
      </span>
      <span className="pr-0.5 tracking-tight">Back to profile</span>
    </Link>
  )
}
