"use client"

import { useState } from "react"
import { ProfileUsernameDialog } from "@/components/profile/profile-username-dialog"
import { Button } from "@/components/ui/button"

type ProfileSettingsFormProps = {
  username: string
}

/** @deprecated Use ProfileHero + ProfileUsernameDialog on the profile page instead. */
export const ProfileSettingsForm = ({ username }: ProfileSettingsFormProps) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Edit username
      </Button>
      <ProfileUsernameDialog username={username} open={open} onOpenChange={setOpen} />
    </>
  )
}
