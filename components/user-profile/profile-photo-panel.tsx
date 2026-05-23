"use client"

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
      title="Set Your Avatar"
      subtitle="Shown on leaderboards and competition pages"
      className="mx-auto max-w-[420px] p-6 sm:p-7 [&_h1]:text-xl"
    >
      <ProfilePhotoUploader />
      <div className="mt-5 text-center">
        <Link
          href={accountSettingsHref}
          className="text-sm text-[#87abcf] underline-offset-4 transition-colors hover:text-accent-neon hover:underline"
        >
          Manage account settings →
        </Link>
      </div>
    </AuthGlassCard>
  )
}
