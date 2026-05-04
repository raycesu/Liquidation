"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import type { ActionResult } from "@/lib/types"

const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(/^[a-z0-9-]+$/, "Username can only include lowercase letters, numbers, and hyphens"),
})

export type UpdateProfileData = {
  username: string
}

const isUniqueViolation = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false
  }

  return "code" in error && error.code === "23505"
}

export const updateProfile = async (
  _previousState: ActionResult<UpdateProfileData>,
  formData: FormData,
): Promise<ActionResult<UpdateProfileData>> => {
  const parsed = updateProfileSchema.safeParse({
    username: formData.get("username"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid profile details",
    }
  }

  const user = await requireCurrentUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to update your profile" }
  }

  const normalizedUsername = parsed.data.username.toLowerCase()
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
