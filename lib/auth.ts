import { currentUser } from "@clerk/nextjs/server"
import { getSql } from "@/lib/db"
import type { UserProfile } from "@/lib/types"

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
        image_url = excluded.image_url
    returning id, email, username, image_url, created_at::text
  `) as UserProfile[]

  return users[0] ?? null
}

export const getCurrentUserProfile = async () => {
  const clerkUser = await currentUser()
  if (!clerkUser) {
    return null
  }

  const sql = getSql()
  const users = (await sql`
    select id, email, username, image_url, created_at::text
    from users
    where id = ${clerkUser.id}
    limit 1
  `) as UserProfile[]

  return users[0] ?? null
}
