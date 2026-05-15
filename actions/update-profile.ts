"use server"

import { revalidatePath } from "next/cache"
import { requireOnboardedUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import type { ActionResult } from "@/lib/types"
import { isUniqueViolation, normalizeUsername, usernameSchema } from "@/lib/username"

export type UpdateProfileData = {
  username: string
}

export const updateProfile = async (
  _previousState: ActionResult<UpdateProfileData>,
  formData: FormData,
): Promise<ActionResult<UpdateProfileData>> => {
  const parsed = usernameSchema.safeParse(formData.get("username"))

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid profile details",
    }
  }

  const user = await requireOnboardedUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to update your profile" }
  }

  const normalizedUsername = normalizeUsername(parsed.data)
  const sql = getSql()

  try {
    await sql`
      update users
      set username = ${normalizedUsername}
      where id = ${user.id}
    `
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "Username already taken" }
    }

    return { ok: false, error: "Unable to update username right now" }
  }

  revalidatePath("/dashboard/profile")
  return {
    ok: true,
    data: {
      username: normalizedUsername,
    },
  }
}
