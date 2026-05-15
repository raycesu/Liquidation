"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

/** Clerk's Profile tab lives at `/user-profile`, not `/user-profile/account`. */
const ACCOUNT_ALIAS_PATH = "/user-profile/account"

export const UserProfileAccountRedirect = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname !== ACCOUNT_ALIAS_PATH) {
      return
    }

    const query = searchParams.toString()
    router.replace(query ? `/user-profile?${query}` : "/user-profile")
  }, [pathname, router, searchParams])

  return null
}
