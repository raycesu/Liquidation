import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { OnboardingProfileForm } from "@/components/onboarding-profile-form"
import { Card, CardContent } from "@/components/ui/card"
import { needsProfileSetup, requireCurrentUser } from "@/lib/auth"
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
    <AuthPageShell>
      <div className="w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Create your Trader Identity
          </h1>
          <p className="text-sm text-text-secondary">Pick a username and photo to get started.</p>
        </div>

        <Card className="border-border bg-surface">
          <CardContent className="px-5 pb-4 pt-[18px]">
            <OnboardingProfileForm avatarUrl={avatarUrl} suggestedUsername={suggestedUsername} />
          </CardContent>
        </Card>
      </div>
    </AuthPageShell>
  )
}
