import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { MarketingBackdrop } from "@/components/marketing/marketing-backdrop"
import { ProfileHero } from "@/components/profile/profile-hero"
import { ProfilePageHeader } from "@/components/profile/profile-page-header"
import { ProfilePageTabs } from "@/components/profile/profile-page-tabs"
import { requireOnboardedUser } from "@/lib/auth"
import { marketingFontClassName } from "@/lib/marketing-fonts"
import { loadProfileDashboardData } from "@/lib/profile-stats"

export const dynamic = "force-dynamic"

export default async function DashboardProfilePage() {
  const user = await requireOnboardedUser()

  if (!user) {
    redirect("/sign-in")
  }

  const headersList = await headers()
  const profileData = await loadProfileDashboardData(user.id)

  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? ""
  const proto = headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  const assetBaseUrl = host ? `${proto}://${host}` : ""

  return (
    <div
      data-theme="marketing-dark"
      className={`${marketingFontClassName} relative isolate min-h-screen overflow-hidden bg-background [font-family:var(--font-marketing-sans)]`}
    >
      <MarketingBackdrop />
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:py-8">
        <ProfilePageHeader />
        <section className="mt-6 flex flex-col gap-6">
          <ProfileHero username={user.username} imageUrl={user.image_url} />
          <ProfilePageTabs
            summary={profileData.summary}
            tradingStyle={profileData.tradingStyle}
            competitionRows={profileData.competitionRows}
            shareRoomOptions={profileData.shareRoomOptions}
            assetBaseUrl={assetBaseUrl}
          />
        </section>
      </main>
    </div>
  )
}
