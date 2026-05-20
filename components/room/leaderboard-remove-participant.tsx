"use client"

import Image from "next/image"
import type { KeyboardEvent, ReactNode } from "react"
import { createContext, useActionState, useContext, useState } from "react"
import { removeRoomParticipantAction } from "@/actions/rooms"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ActionResult } from "@/lib/types"
import { cn } from "@/lib/utils"
import { UserMinusIcon } from "lucide-react"

const getInitials = (username: string) =>
  username
    .split(/[\s-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TR"

type MemberToRemove = {
  userId: string
  username: string
}

type LeaderboardRemoveContextValue = {
  openRemoveDialog: (member: MemberToRemove) => void
}

const LeaderboardRemoveContext = createContext<LeaderboardRemoveContextValue | null>(null)

const initialState: ActionResult<void> = {
  ok: true,
  data: undefined,
}

type LeaderboardRemoveProviderProps = {
  roomId: string
  children: ReactNode
}

export const LeaderboardRemoveProvider = ({ roomId, children }: LeaderboardRemoveProviderProps) => {
  const [state, formAction, isPending] = useActionState(removeRoomParticipantAction, initialState)
  const [memberToRemove, setMemberToRemove] = useState<MemberToRemove | null>(null)

  const handleOpenRemoveDialog = (member: MemberToRemove) => {
    setMemberToRemove(member)
  }

  const handleCloseRemoveDialog = () => {
    setMemberToRemove(null)
  }

  const handleRemoveDialogKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") {
      return
    }

    handleCloseRemoveDialog()
  }

  return (
    <LeaderboardRemoveContext.Provider value={{ openRemoveDialog: handleOpenRemoveDialog }}>
      {!state.ok ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {children}

      <Dialog open={memberToRemove !== null} onOpenChange={(open) => !open && handleCloseRemoveDialog()}>
        <DialogContent onKeyDown={handleRemoveDialogKeyDown}>
          <DialogHeader>
            <DialogTitle>Remove participant?</DialogTitle>
            <DialogDescription>
              {memberToRemove
                ? `${memberToRemove.username} will lose access to this room. They cannot be removed while they have open positions.`
                : null}
            </DialogDescription>
          </DialogHeader>
          {memberToRemove ? (
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="roomId" value={roomId} />
              <input type="hidden" name="targetUserId" value={memberToRemove.userId} />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={handleCloseRemoveDialog} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={isPending}>
                  {isPending ? "Removing..." : "Remove participant"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </LeaderboardRemoveContext.Provider>
  )
}

type LeaderboardRemoveIconButtonProps = {
  userId: string
  username: string
}

const LeaderboardRemoveIconButton = ({ userId, username }: LeaderboardRemoveIconButtonProps) => {
  const context = useContext(LeaderboardRemoveContext)

  if (!context) {
    return null
  }

  const handleClick = () => {
    context.openRemoveDialog({ userId, username })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "size-7 shrink-0 text-loss opacity-0 transition-opacity",
        "hover:bg-loss/10 hover:text-loss",
        "group-hover/row:opacity-100 group-hover/trader:opacity-100 group-focus-within/trader:opacity-100",
        "focus-visible:opacity-100",
      )}
      onClick={handleClick}
      aria-label={`Remove ${username} from room`}
    >
      <UserMinusIcon className="size-3.5" aria-hidden />
    </Button>
  )
}

type LeaderboardTraderNameCellProps = {
  username: string
  userId: string
  avatarUrl?: string | null
  canRemove: boolean
}

export const LeaderboardTraderNameCell = ({
  username,
  userId,
  avatarUrl,
  canRemove,
}: LeaderboardTraderNameCellProps) => {
  return (
    <div className="group/trader flex items-center gap-3">
      <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-accent-neon/20 bg-gradient-to-br from-accent-blue/40 via-surface-elevated to-accent-neon/20 ring-1 ring-white/5">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${username} avatar`}
            fill
            className="object-cover"
            sizes="44px"
            unoptimized
          />
        ) : (
          <span className="flex size-full items-center justify-center text-xs font-semibold text-text-primary">
            {getInitials(username)}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <p className="truncate font-medium text-text-primary">{username}</p>
        {canRemove ? <LeaderboardRemoveIconButton userId={userId} username={username} /> : null}
      </div>
    </div>
  )
}
