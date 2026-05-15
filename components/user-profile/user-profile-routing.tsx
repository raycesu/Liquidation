"use client"

import { usePathname } from "next/navigation"
import { ProfilePhotoPanel } from "@/components/user-profile/profile-photo-panel"
import { UserProfilePanel } from "@/components/user-profile/user-profile-panel"

export const UserProfileRouting = () => {
  const pathname = usePathname()
  const segment = pathname.replace(/^\/user-profile\/?/, "").split("/")[0] ?? ""
  const isPhotoRoute = segment === "photo"

  if (isPhotoRoute) {
    return <ProfilePhotoPanel />
  }

  return <UserProfilePanel />
}
