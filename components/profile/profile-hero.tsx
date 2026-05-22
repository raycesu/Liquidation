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
import { formatJoinMonthYear } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Calendar, ImageIcon, MoreHorizontal, Pencil, Trophy } from "lucide-react"

type ProfileHeroProps = {
  username: string
  imageUrl: string | null
  joinedAt: string
  competitionsEntered: number
}

const metaPillClassName =
  "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-text-secondary"

export const ProfileHero = ({
  username,
  imageUrl,
  joinedAt,
  competitionsEntered,
}: ProfileHeroProps) => {
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false)

  const initials = username.slice(0, 2).toUpperCase()
  const joinedLabel = formatJoinMonthYear(joinedAt)
  const competitionLabel =
    competitionsEntered === 1 ? "1 competition" : `${competitionsEntered} competitions`

  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative size-32 shrink-0 overflow-hidden rounded-full border border-border bg-muted ring-2 ring-accent-neon/30 sm:size-36">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${username} avatar`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 128px, 144px"
            unoptimized
          />
        ) : (
          <div
            className="flex size-full items-center justify-center text-3xl font-semibold text-text-secondary sm:text-4xl"
            aria-hidden
          >
            {initials}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
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

        <div className="flex flex-wrap gap-2">
          <span className={metaPillClassName}>
            <Calendar className="size-3.5 shrink-0 opacity-70" aria-hidden />
            {joinedLabel ? `Joined ${joinedLabel}` : "Joined —"}
          </span>
          <span className={cn(metaPillClassName)}>
            <Trophy className="size-3.5 shrink-0 opacity-70" aria-hidden />
            {competitionLabel}
          </span>
        </div>
      </div>

      <ProfileUsernameDialog
        username={username}
        open={isUsernameDialogOpen}
        onOpenChange={setIsUsernameDialogOpen}
      />
    </section>
  )
}
