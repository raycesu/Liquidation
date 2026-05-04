import type { Metadata } from "next"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { MarketingHome } from "@/components/marketing/marketing-home"
import { BRAND_NAME } from "@/lib/brand"

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Paper trading competitions`,
  description:
    "Join rooms with a shared virtual balance, trade crypto perpetuals with leverage against live prices, and compete on the leaderboard.",
}

export default async function HomePage() {
  const user = await currentUser()

  if (user) {
    redirect("/dashboard")
  }

  return <MarketingHome />
}
