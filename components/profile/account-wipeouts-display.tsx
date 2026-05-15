"use client"

import { formatProfileDate } from "@/lib/format"
import type { ProfileWipeoutEvent } from "@/lib/types"

type AccountWipeoutsDisplayProps = {
  wipeouts: ProfileWipeoutEvent[]
}

export const AccountWipeoutsDisplay = ({ wipeouts }: AccountWipeoutsDisplayProps) => {
  if (wipeouts.length === 0) {
    return <div className="min-h-5" aria-hidden />
  }

  return (
    <div className="flex max-w-[min(100%,14rem)] flex-wrap items-center justify-end gap-1 sm:max-w-none">
      {wipeouts.map((wipeout) => {
        const tooltip = `${formatProfileDate(wipeout.wipedAtIso)} · ${wipeout.roomName}`

        return (
          <span
            key={`${wipeout.roomId}-${wipeout.wipedAtIso}`}
            className="group relative inline-flex cursor-default"
            tabIndex={0}
            aria-label={`Account wipeout on ${tooltip}`}
          >
            <span
              className="text-base leading-none drop-shadow-[0_0_8px_rgba(255,77,112,0.75)] saturate-150"
              aria-hidden
            >
              💀
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-white/12 bg-[#0a1627]/95 px-2.5 py-1.5 text-center text-xs font-medium text-text-primary opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              {tooltip}
            </span>
          </span>
        )
      })}
    </div>
  )
}
