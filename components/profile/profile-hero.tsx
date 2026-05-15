"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ProfileUsernameDialog } from "@/components/profile/profile-username-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ImageIcon, MoreHorizontal, Pencil } from "lucide-react"

type ProfileHeroProps = {
  username: string
  imageUrl: string | null
}

export const ProfileHero = ({ username, imageUrl }: ProfileHeroProps) => {
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false)

  const initials = username.slice(0, 2).toUpperCase()

  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative size-28 shrink-0 overflow-hidden rounded-full border border-border bg-muted ring-2 ring-accent-neon/30">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${username} avatar`}
            fill
            className="object-cover"
            sizes="112px"
            unoptimized
          />
        ) : (
          <div
            className="flex size-full items-center justify-center text-3xl font-semibold text-text-secondary"
            aria-hidden
          >
            {initials}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          {username}
        </h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-text-secondary hover:bg-muted/60 hover:text-text-primary"
              aria-label="Profile actions"
            >
              <MoreHorizontal className="size-5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48" sideOffset={8}>
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onSelect={() => setIsUsernameDialogOpen(true)}
            >
              <Pencil className="size-4 opacity-70" aria-hidden />
              Edit username
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/user-profile/photo?redirect_url=/dashboard/profile"
                className="cursor-pointer gap-2"
              >
                <ImageIcon className="size-4 opacity-70" aria-hidden />
                Change profile photo
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileUsernameDialog
        username={username}
        open={isUsernameDialogOpen}
        onOpenChange={setIsUsernameDialogOpen}
      />
    </section>
  )
}
