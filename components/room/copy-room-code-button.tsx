"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CopyRoomCodeButtonProps = {
  code: string
  className?: string
}

export const CopyRoomCodeButton = ({ code, className }: CopyRoomCodeButtonProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success("Room code copied")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy room code")
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "size-7 shrink-0 rounded-md text-text-secondary hover:bg-background/50 hover:text-text-primary",
        className,
      )}
      onClick={handleCopy}
      aria-label={copied ? "Room code copied" : "Copy room code"}
    >
      {copied ? (
        <Check className="size-3.5 text-profit" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </Button>
  )
}
