"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { requireCurrentUser } from "@/lib/auth"
import { getSql } from "@/lib/db"
import type { ActionResult } from "@/lib/types"

export type SyncProfileImageData = {
  imageUrl: string | null
}

export const syncProfileImage = async (): Promise<ActionResult<SyncProfileImageData>> => {
  const user = await requireCurrentUser()

  if (!user) {
    return { ok: false, error: "You must be signed in to update your profile photo" }
  }

  const clerkUser = await currentUser()
  const imageUrl = clerkUser?.imageUrl ?? null
  const sql = getSql()

  await sql`
    update users
    set image_url = ${imageUrl}
    where id = ${user.id}
  `

  revalidatePath("/dashboard/profile")
  revalidatePath("/onboarding")
  revalidatePath("/dashboard")

  return {
    ok: true,
    data: {
      imageUrl,
    },
  }
}
