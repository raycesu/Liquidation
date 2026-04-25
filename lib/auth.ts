import { currentUser } from "@clerk/nextjs/server"
import { getSql } from "@/lib/db"
import type { UserProfile } from "@/lib/types"

export const requireCurrentUser = async () => {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    return null
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? `${clerkUser.id}@clerk.local`
  const baseUsername =
    clerkUser.username ??
    clerkUser.fullName ??
    clerkUser.primaryEmailAddress?.emailAddress.split("@")[0] ??
    "trader"
  const username = `${baseUsername.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-${clerkUser.id.slice(-6)}`
  const sql = getSql()
  const users = (await sql`
    insert into users (id, email, username)
    values (${clerkUser.id}, ${email}, ${username})
    on conflict (id) do update
    set email = excluded.email
    returning id, email, username, created_at::text
  `) as UserProfile[]

  return users[0] ?? null
}
