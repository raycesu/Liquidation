"use client"

import { Camera } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AuthGlassCard } from "@/components/auth/auth-glass-card"
import { ProfilePhotoUploader } from "@/components/user-profile/profile-photo-uploader"
import { resolveUserProfileRedirect } from "@/lib/user-profile-redirect"

export const ProfilePhotoPanel = () => {
  const searchParams = useSearchParams()
  const redirectUrl = resolveUserProfileRedirect(searchParams.get("redirect_url"))
  const accountSettingsHref = `/user-profile?redirect_url=${encodeURIComponent(redirectUrl)}`

  return (
    <AuthGlassCard
      icon={Camera}
      title="Profile photo"
      subtitle="Your photo appears on competition leaderboards. Upload a clear image so other traders can recognize you."
      className="mx-auto max-w-[420px] p-6 sm:p-7 [&_h1]:mt-4 [&_h1]:text-xl"
    >
      <ProfilePhotoUploader />
      <p className="mt-5 text-center text-sm text-[#6e93b8]">
        Need to update your name, email, or connected accounts?{" "}
        <Link
          href={accountSettingsHref}
          className="text-[#e6f3ff] underline-offset-4 hover:text-accent-neon hover:underline"
        >
          Account settings
        </Link>
      </p>
    </AuthGlassCard>
  )
}
