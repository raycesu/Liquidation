import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getSql } from "@/lib/db"
import type { UserProfile } from "@/lib/types"

export const needsProfileSetup = (user: UserProfile) => user.profile_setup_completed_at === null

export const requireCurrentUser = async () => {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    return null
  }

  return ensureUserProfile({
    id: clerkUser.id,
    username: clerkUser.username ?? clerkUser.fullName ?? clerkUser.primaryEmailAddress?.emailAddress.split("@")[0] ?? "trader",
    email: clerkUser.primaryEmailAddress?.emailAddress ?? `${clerkUser.id}@clerk.local`,
    imageUrl: clerkUser.imageUrl ?? null,
  })
}

export const requireOnboardedUser = async () => {
  const user = await requireCurrentUser()

  if (!user) {
    return null
  }

  if (needsProfileSetup(user)) {
    redirect("/onboarding")
  }

  return user
}

type EnsureUserProfileInput = {
  id: string
  username: string
  email: string
  imageUrl: string | null
}

export const ensureUserProfile = async ({ id, username, email, imageUrl }: EnsureUserProfileInput) => {
  const normalizedUsername = `${username.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-${id.slice(-6)}`
  const sql = getSql()
  const users = (await sql`
    insert into users (id, email, username, image_url)
    values (${id}, ${email}, ${normalizedUsername}, ${imageUrl})
    on conflict (id) do update
    set email = excluded.email,
        image_url = case
          when users.profile_setup_completed_at is null then excluded.image_url
          else users.image_url
        end
    returning id, email, username, image_url, profile_setup_completed_at::text, created_at::text
  `) as UserProfile[]

  return users[0] ?? null
}
