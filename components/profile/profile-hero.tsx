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

const profileMenuContentClassName =
  "w-max min-w-0 !w-auto border border-white/[0.08] bg-[#0f1624]/95 p-1 shadow-xl backdrop-blur-md"

const profileMenuItemClassName =
  "w-full cursor-pointer gap-2.5 rounded-md px-3 py-2 text-sm text-text-primary outline-none focus:!bg-white/[0.08] focus:!text-text-primary data-[highlighted]:!bg-white/[0.08] data-[highlighted]:!text-text-primary"

const profileMenuIconClassName =
  "size-4 shrink-0 stroke-text-secondary transition-[stroke] in-data-[highlighted]:stroke-text-primary"

const profileMenuSeparatorClassName =
  "!mx-0 my-0 h-px w-full shrink-0 bg-[rgba(255,255,255,0.06)]"

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
                className="size-9 shrink-0 text-text-secondary hover:bg-muted/60 hover:text-text-primary data-[state=open]:bg-white/[0.14] data-[state=open]:text-text-primary"
                aria-label="Profile actions"
              >
                <MoreHorizontal className="size-5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className={profileMenuContentClassName}
              sideOffset={8}
            >
              <DropdownMenuItem
                className={profileMenuItemClassName}
                onSelect={() => setIsUsernameDialogOpen(true)}
              >
                <Pencil className={profileMenuIconClassName} aria-hidden />
                Edit username
              </DropdownMenuItem>
              <DropdownMenuSeparator className={profileMenuSeparatorClassName} />
              <DropdownMenuItem asChild className={profileMenuItemClassName}>
                <Link
                  href="/user-profile/photo?redirect_url=/dashboard/profile"
                  className="flex w-full items-center gap-2.5"
                >
                  <ImageIcon className={profileMenuIconClassName} aria-hidden />
                  Change photo
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
