"use client"

import { UserProfile } from "@clerk/nextjs"
import { UserProfileAccountRedirect } from "@/components/user-profile/user-profile-account-redirect"
import { clerkUserProfileAppearance } from "@/lib/clerk-user-profile-appearance"

export const UserProfilePanel = () => {
  return (
    <div className="flex w-full justify-center">
      <UserProfileAccountRedirect />
      <UserProfile path="/user-profile" routing="path" appearance={clerkUserProfileAppearance}>
        <UserProfile.Page label="account" />
        <UserProfile.Page label="security" />
      </UserProfile>
    </div>
  )
}
