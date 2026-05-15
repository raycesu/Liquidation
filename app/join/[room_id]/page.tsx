import { redirect } from "next/navigation"
import { requireOnboardedUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function JoinRoomPage() {
  const user = await requireOnboardedUser()

  if (!user) {
    redirect("/sign-in")
  }

  redirect("/dashboard")
}
