import { currentUser } from "@clerk/nextjs/server"
import Image from "next/image"
import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ProfileCompetitionTable } from "@/components/profile-competition-table"
import { ProfileSettingsForm } from "@/components/profile-settings-form"
import { ProfileShareCardSection } from "@/components/profile-share-card"
import { ProfileTradingStyleCard } from "@/components/profile-trading-style-card"
import { SignOutButton } from "@/components/sign-out-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireCurrentUser } from "@/lib/auth"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"
import { formatPercent } from "@/lib/format"
import { loadProfileDashboardData } from "@/lib/profile-stats"

export const dynamic = "force-dynamic"

export default async function DashboardProfilePage() {
  const user = await requireCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const [clerkUser, profileData, headersList] = await Promise.all([
    currentUser(),
    loadProfileDashboardData(user.id),
    headers(),
  ])

  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? ""
  const proto = headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  const assetBaseUrl = host ? `${proto}://${host}` : ""

  const avatarUrl = clerkUser?.imageUrl ?? null
  const summary = profileData.summary

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Image
              src={BRAND_LOGO_SRC}
              alt={`${BRAND_NAME} logo`}
              width={BRAND_LOGO_WIDTH}
              height={BRAND_LOGO_HEIGHT}
              className="h-auto w-full max-w-md sm:max-w-lg md:max-w-xl"
              priority
              unoptimized
            />
            <h1 className="mt-2 text-4xl font-semibold text-text-primary">Your profile</h1>
            <p className="mt-2 max-w-2xl text-text-secondary">
              Stats and history across every competition you have joined.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to rooms</Link>
            </Button>
            <SignOutButton />
          </div>
        </header>

        <Card className="border-border bg-surface">
          <CardHeader className="flex flex-row flex-wrap items-center gap-6">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted ring-2 ring-accent-neon/30">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={`${user.username} avatar`}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
              ) : (
                <div
                  className="flex size-full items-center justify-center text-2xl font-semibold text-text-secondary"
                  aria-hidden
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-2xl text-text-primary">{user.username}</CardTitle>
              <p className="mt-1 text-sm text-text-secondary">
                Edit your username and upload an avatar from your profile settings.
              </p>
              <ProfileSettingsForm username={user.username} />
            </div>
          </CardHeader>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Competitions entered" value={String(summary.competitionsEntered)} />
          <StatTile
            label="All-time avg P&amp;L"
            value={summary.allTimeAvgPnlPercent != null ? formatPercent(summary.allTimeAvgPnlPercent) : "—"}
            valueClassName={
              summary.allTimeAvgPnlPercent != null && summary.allTimeAvgPnlPercent >= 0
                ? "text-profit"
                : summary.allTimeAvgPnlPercent != null
                  ? "text-loss"
                  : undefined
            }
          />
          <StatTile
            label="Best trade (ROE)"
            value={summary.bestTradeRoePercent != null ? formatPercent(summary.bestTradeRoePercent) : "—"}
            valueClassName={
              summary.bestTradeRoePercent != null && summary.bestTradeRoePercent >= 0 ? "text-profit" : "text-loss"
            }
          />
          <StatTile label="Account wipeouts" value={String(summary.timesLiquidated)} />
        </section>

        <ProfileTradingStyleCard style={profileData.tradingStyle} />

        <ProfileCompetitionTable rows={profileData.competitionRows} />

        <ProfileShareCardSection shareRoomOptions={profileData.shareRoomOptions} assetBaseUrl={assetBaseUrl} />
      </div>
    </main>
  )
}

const StatTile = ({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) => (
  <Card className="border-border bg-surface">
    <CardContent className="pt-6">
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums text-text-primary ${valueClassName ?? ""}`}>{value}</p>
    </CardContent>
  </Card>
)
