import { currentUser } from "@clerk/nextjs/server"
import Image from "next/image"
import { redirect } from "next/navigation"
import { OnboardingProfileForm } from "@/components/onboarding-profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { needsProfileSetup, requireCurrentUser } from "@/lib/auth"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"
import { suggestUsername } from "@/lib/suggest-username"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const user = await requireCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  if (!needsProfileSetup(user)) {
    redirect("/dashboard")
  }

  const clerkUser = await currentUser()
  const suggestedUsername = suggestUsername({
    clerkUsername: clerkUser?.username ?? null,
    fullName: clerkUser?.fullName ?? null,
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
    userId: user.id,
    currentUsername: user.username,
  })
  const avatarUrl = clerkUser?.imageUrl ?? user.image_url

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src={BRAND_LOGO_SRC}
            alt={`${BRAND_NAME} logo`}
            width={BRAND_LOGO_WIDTH}
            height={BRAND_LOGO_HEIGHT}
            className="h-auto w-full max-w-xs"
            priority
            unoptimized
          />
          <h1 className="text-2xl font-semibold text-text-primary">Set up your trading profile</h1>
          <p className="text-sm text-text-secondary">
            Choose a username for competitions. You can add a profile photo now or later.
          </p>
        </div>

        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-text-primary">Profile</CardTitle>
            <CardDescription>Your username appears on leaderboards and in competition rooms.</CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingProfileForm avatarUrl={avatarUrl} suggestedUsername={suggestedUsername} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
