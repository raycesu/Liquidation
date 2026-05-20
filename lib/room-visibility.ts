import type { Room } from "@/lib/types"

export const isPublicRoom = (room: Pick<Room, "is_public">) => room.is_public

export const isPrivateRoom = (room: Pick<Room, "is_public">) => !room.is_public

export const getRoomVisibilityLabel = (room: Pick<Room, "is_public">) =>
  isPublicRoom(room) ? "Public" : "Private"
