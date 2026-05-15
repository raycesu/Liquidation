import type { Metadata } from "next"
import { Suspense } from "react"
import { UserProfileRouting } from "@/components/user-profile/user-profile-routing"
import { UserProfileShell } from "@/components/user-profile/user-profile-shell"

export const metadata: Metadata = {
  title: "Account settings · Liquidation",
}

export default function UserProfilePage() {
  return (
    <UserProfileShell>
      <Suspense
        fallback={
          <div
            className="mx-auto h-[min(22rem,calc(100dvh-11rem))] w-full max-w-[420px] animate-pulse rounded-3xl border border-white/10 bg-[#07172a]/55"
            aria-hidden
          />
        }
      >
        <UserProfileRouting />
      </Suspense>
    </UserProfileShell>
  )
}
