import { redirect } from "next/navigation"
import { requireCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function JoinRoomPage() {
  const user = await requireCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  redirect("/dashboard")
}
