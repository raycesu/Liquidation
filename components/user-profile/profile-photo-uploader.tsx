"use client"

import { useUser } from "@clerk/nextjs"
import { Camera, Loader2, Trash2 } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { syncProfileImage } from "@/actions/sync-profile-image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

const getInitials = (name: string | null | undefined) => {
  if (!name?.trim()) {
    return "TR"
  }

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export const ProfilePhotoUploader = () => {
  const { isLoaded, user } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const displayName = user?.fullName ?? user?.username ?? "Trader"
  const avatarUrl = user?.imageUrl ?? null

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleSyncAndNotify = async (message: string) => {
    const syncResult = await syncProfileImage()

    if (!syncResult.ok) {
      toast.error(syncResult.error)
      return
    }

    await user?.reload()
    toast.success(message)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file || !user) {
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please choose a JPEG, PNG, WebP, or GIF image")
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Image must be 5 MB or smaller")
      return
    }

    setIsUploading(true)

    try {
      await user.setProfileImage({ file })
      await handleSyncAndNotify("Profile photo updated")
    } catch {
      toast.error("Unable to upload your photo. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!user) {
      return
    }

    setIsUploading(true)

    try {
      await user.setProfileImage({ file: null })
      await handleSyncAndNotify("Profile photo removed")
    } catch {
      toast.error("Unable to remove your photo. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="size-7 animate-spin text-accent-neon" aria-label="Loading profile photo" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/[0.04] ring-2 ring-accent-neon/40 shadow-[0_0_24px_rgb(16_199_255/0.18)]">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${displayName} profile photo`}
            fill
            className="object-cover"
            sizes="96px"
            unoptimized
          />
        ) : (
          <div
            className="flex size-full items-center justify-center text-2xl font-semibold text-[#87abcf]"
            aria-hidden
          >
            {getInitials(displayName)}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
        aria-label="Upload profile photo"
      />

      <div className="mt-5 flex w-full flex-col gap-2.5">
        <Button
          type="button"
          className={cn(
            "h-11 w-full rounded-xl border border-[#b8ebff]/70 bg-[#ecf8ff] text-sm font-semibold text-[#03101f]",
            "shadow-[0_10px_24px_rgb(17_191_255/0.18)] hover:bg-white",
          )}
          onClick={handlePickFile}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Updating photo...
            </>
          ) : (
            <>
              <Camera className="size-4" aria-hidden />
              Upload new photo
            </>
          )}
        </Button>

        {avatarUrl ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-xl border-white/12 bg-white/[0.04] text-[#87abcf] hover:border-white/20 hover:bg-white/[0.08] hover:text-[#e6f3ff]"
            onClick={handleRemovePhoto}
            disabled={isUploading}
          >
            <Trash2 className="size-4" aria-hidden />
            Remove photo
          </Button>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-[#6e93b8]">JPEG, PNG, WebP, or GIF · Max 5 MB</p>
    </div>
  )
}
