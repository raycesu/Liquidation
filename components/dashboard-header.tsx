"use client"

import Image from "next/image"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"
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
import { UserRoundIcon } from "lucide-react"

type DashboardHeaderProps = {
  username: string
  imageUrl: string | null
}

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

export const DashboardHeader = ({ username, imageUrl }: DashboardHeaderProps) => {
  const { signOut } = useClerk()
  const initials = getInitials(username)

  const handleSignOut = () => {
    void signOut({ redirectUrl: "/sign-in" })
  }

  return (
    <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href="/dashboard"
        className="inline-flex shrink-0 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`${BRAND_NAME} home`}
      >
        <Image
          src={BRAND_LOGO_SRC}
          alt={`${BRAND_NAME} logo`}
          width={BRAND_LOGO_WIDTH}
          height={BRAND_LOGO_HEIGHT}
          className="h-8 w-auto max-w-[200px] sm:h-9"
          priority
          unoptimized
        />
      </Link>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <JoinRoomDialog
          triggerVariant="outline"
          triggerSize="lg"
          triggerClassName="border-border/80 bg-background/80 px-4 font-medium shadow-sm backdrop-blur-sm hover:bg-muted/60"
        />
        <CreateRoomDialog
          triggerVariant="default"
          triggerSize="lg"
          triggerClassName="px-4 font-medium shadow-sm shadow-primary/20"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-full p-0 ring-1 ring-border/80 hover:bg-muted/50"
              aria-label="Open account menu"
            >
              <Avatar className="size-8">
                {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
                <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48" sideOffset={8}>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-default gap-2">
                <UserRoundIcon className="size-4 opacity-70" aria-hidden />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
