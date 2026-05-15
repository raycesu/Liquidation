import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { MarketingHome } from "@/components/marketing/marketing-home"
import { needsProfileSetup, requireCurrentUser } from "@/lib/auth"
import { BRAND_NAME } from "@/lib/brand"

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Paper trading competitions`,
  description:
    "Join rooms with a shared virtual balance, trade crypto perpetuals with leverage against live prices, and compete on the leaderboard.",
}

export default async function HomePage() {
  const user = await requireCurrentUser()

  if (user) {
    if (needsProfileSetup(user)) {
      redirect("/onboarding")
    }

    redirect("/dashboard")
  }

  return <MarketingHome />
}
