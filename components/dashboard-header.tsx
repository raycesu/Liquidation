"use client"

import Image from "next/image"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"
import { LogOut, Plus, UserRoundIcon } from "lucide-react"
import { CreateRoomDialog } from "@/components/create-room-dialog"
import { JoinRoomDialog } from "@/components/join-room-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_NAME } from "@/lib/brand"
import { createRoomTriggerClassName, joinRoomTriggerClassName } from "@/lib/dashboard-nav-triggers"
import { cn } from "@/lib/utils"

type DashboardHeaderProps = {
  username: string
  imageUrl: string | null
  activeRoomCount: number
}

const accountMenuItemClassName =
  "gap-3 rounded-lg px-3 py-2.5 text-base text-text-primary outline-none focus:!bg-white/10 focus:!text-text-primary data-[highlighted]:!bg-white/10 data-[highlighted]:!text-text-primary"

const profileMenuIconClassName =
  "size-5 shrink-0 stroke-[#9eb8d6] transition-[stroke] in-data-[highlighted]:stroke-[#f0f7ff]"

const signOutMenuIconClassName =
  "size-5 shrink-0 stroke-[#ff3b5c] transition-[stroke] in-data-[highlighted]:stroke-[#ff6b85]"

const getInitials = (username: string) => {
  const parts = username.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) {
    return "?"
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || "?"
}

const formatActiveRoomLabel = (count: number) => {
  if (count === 1) {
    return "1 active room"
  }
  return `${count} active rooms`
}

export const DashboardHeader = ({ username, imageUrl, activeRoomCount }: DashboardHeaderProps) => {
  const { signOut } = useClerk()
  const initials = getInitials(username)

  const handleSignOut = () => {
    void signOut({ redirectUrl: "/sign-in" })
  }

  return (
    <header className="flex flex-col gap-4 border-b border-white/8 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href="/dashboard"
        className="-ml-8 mt-4 inline-flex shrink-0 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:-ml-9 mt-4"
        aria-label={`${BRAND_NAME} home`}
      >
        <Image
          src={BRAND_LOGO_SRC}
          alt={`${BRAND_NAME} logo`}
          width={BRAND_LOGO_WIDTH}
          height={BRAND_LOGO_HEIGHT}
          className="h-[3.3rem] w-auto max-w-[336px] object-left sm:h-[3.6rem]"
          priority
          unoptimized
        />
      </Link>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <JoinRoomDialog triggerVariant="outline" triggerSize="lg" triggerClassName={joinRoomTriggerClassName} />
        <CreateRoomDialog
          triggerVariant="default"
          triggerSize="lg"
          triggerClassName={createRoomTriggerClassName}
          triggerLeadingIcon={<Plus className="size-4 shrink-0" aria-hidden />}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 rounded-full p-0 ring-1 ring-border/80 transition-colors hover:bg-muted/50 hover:ring-accent-neon/30"
              aria-label="Open account menu"
            >
              <Avatar className="size-10">
                {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
                <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[260px] min-w-[260px] border border-white/10 bg-[#0f1624]/95 p-3 shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3.5 px-1 py-1">
              <Avatar className="size-10 shrink-0">
                {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
                <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-text-primary">{username}</p>
                <p className="text-sm text-muted-foreground">{formatActiveRoomLabel(activeRoomCount)}</p>
              </div>
            </div>

            <DropdownMenuSeparator className="my-2 bg-white/8" />

            <DropdownMenuItem asChild className={accountMenuItemClassName}>
              <Link href="/dashboard/profile" className="flex cursor-default items-center gap-3">
                <UserRoundIcon className={profileMenuIconClassName} aria-hidden />
                View profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2 bg-white/8" />

            <DropdownMenuItem
              variant="destructive"
              onSelect={handleSignOut}
              className={cn(
                accountMenuItemClassName,
                "text-destructive focus:!text-destructive data-[highlighted]:!text-destructive",
              )}
            >
              <LogOut className={signOutMenuIconClassName} aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
