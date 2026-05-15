"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import type { ActionResult } from "@/lib/types"
import { isUniqueViolation, normalizeUsername, usernameSchema } from "@/lib/username"

export type CompleteProfileSetupData = {
  username: string
}

export const completeProfileSetup = async (
  _previousState: ActionResult<CompleteProfileSetupData>,
  formData: FormData,
): Promise<ActionResult<CompleteProfileSetupData>> => {
  const parsed = usernameSchema.safeParse(formData.get("username"))

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid profile details",
    }
  }

  const user = await requireCurrentUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to continue" }
  }

  if (user.profile_setup_completed_at) {
    redirect("/dashboard")
  }

  const clerkUser = await currentUser()
  const normalizedUsername = normalizeUsername(parsed.data)
  const imageUrl = clerkUser?.imageUrl ?? user.image_url
  const sql = getSql()

  try {
    await sql`
      update users
      set
        username = ${normalizedUsername},
        image_url = ${imageUrl},
        profile_setup_completed_at = now()
      where id = ${user.id}
    `
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "Username already taken" }
    }

    return { ok: false, error: "Unable to save your profile right now" }
  }

  revalidatePath("/onboarding")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/profile")

  redirect("/dashboard")
}
