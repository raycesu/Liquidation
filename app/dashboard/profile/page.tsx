import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell"
import { ProfileHero } from "@/components/profile/profile-hero"
import { ProfilePageHeader } from "@/components/profile/profile-page-header"
import { ProfilePageTabs } from "@/components/profile/profile-page-tabs"
import { requireOnboardedUser } from "@/lib/auth"
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
    <MarketingPageShell>
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:py-8">
        <ProfilePageHeader />
        <section className="mt-7 flex flex-col gap-6 sm:mt-8">
          <ProfileHero
            username={user.username}
            imageUrl={user.image_url}
            joinedAt={user.created_at}
            competitionsEntered={profileData.summary.competitionsEntered}
          />
          <ProfilePageTabs
            summary={profileData.summary}
            tradingStyle={profileData.tradingStyle}
            competitionRows={profileData.competitionRows}
            shareRoomOptions={profileData.shareRoomOptions}
            assetBaseUrl={assetBaseUrl}
          />
        </section>
      </main>
    </MarketingPageShell>
  )
}
