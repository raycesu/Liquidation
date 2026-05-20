"use client"

import type { KeyboardEvent } from "react"
import { useActionState, useState } from "react"
import { removeRoomParticipantAction } from "@/actions/rooms"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ActionResult } from "@/lib/types"
import { UserMinusIcon } from "lucide-react"

export type RoomMemberForManagement = {
  participantId: string
  userId: string
  username: string
  joinedAt: string
  isCreator: boolean
}

type RoomParticipantManagementProps = {
  roomId: string
  members: RoomMemberForManagement[]
}

const initialState: ActionResult<void> = {
  ok: true,
  data: undefined,
}

const joinedFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export const RoomParticipantManagement = ({ roomId, members }: RoomParticipantManagementProps) => {
  const [state, formAction, isPending] = useActionState(removeRoomParticipantAction, initialState)
  const [memberToRemove, setMemberToRemove] = useState<RoomMemberForManagement | null>(null)

  const handleOpenRemoveDialog = (member: RoomMemberForManagement) => {
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
    <section className="flex flex-col gap-5" aria-labelledby="room-participants-title">
      <header className="space-y-1">
        <h2
          id="room-participants-title"
          className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl"
        >
          Participants
        </h2>
        <p className="text-sm text-text-secondary">
          Remove traders with open positions closed. Useful for clearing duplicate or unwanted accounts.
        </p>
      </header>

      {!state.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden border-border/60 bg-surface/70 shadow-xl shadow-accent-blue/5 backdrop-blur-xl">
        <CardContent className="divide-y divide-border/40 p-0">
          <ul className="divide-y divide-border/40">
            {members.map((member) => (
              <li
                key={member.participantId}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium text-text-primary">
                    {member.username}
                    {member.isCreator ? (
                      <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-accent-neon">
                        Host
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Joined {joinedFormatter.format(new Date(member.joinedAt))}
                  </p>
                </div>
                {member.isCreator ? (
                  <span className="text-xs text-muted-foreground">Cannot remove host</span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-loss/40 text-loss hover:bg-loss/10 hover:text-loss"
                    onClick={() => handleOpenRemoveDialog(member)}
                    aria-label={`Remove ${member.username} from room`}
                  >
                    <UserMinusIcon className="size-4" aria-hidden />
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

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
    </section>
  )
}
