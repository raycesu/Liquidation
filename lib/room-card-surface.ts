import { cn } from "@/lib/utils"

/** Radial cyan glow used on live dashboard room cards. */
export const liveRoomCardGlowClassName =
  "pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_0%_0%,rgb(16_199_255/0.14),transparent_42%),radial-gradient(circle_at_100%_0%,rgb(16_199_255/0.14),transparent_42%)]"

/** Faint cyan edge shared by lobby stat + header cards. */
export const lobbyCardAccentBorderClassName =
  "border border-accent-neon/25 ring-1 ring-accent-neon/20"

/** Shell shared by live dashboard room cards (border, ring, shadow). */
export const liveRoomCardShellClassName = cn(
  "relative overflow-hidden shadow-lg shadow-black/10 backdrop-blur-sm",
  lobbyCardAccentBorderClassName,
)

/** Diagonal fill for lobby stat cards — lighter top-left, deeper bottom-right. */
export const lobbyStatCardFillClassName =
  "bg-[linear-gradient(135deg,rgb(15_32_53)_0%,rgb(10_22_40)_100%)]"

export const lobbyStatCardClassName = cn(
  liveRoomCardShellClassName,
  lobbyStatCardFillClassName,
  "rounded-2xl px-4 py-3.5",
)

/** Semi-transparent diagonal fill for lobby header — same material as stat cards. */
export const lobbyHeaderCardFillClassName =
  "bg-[linear-gradient(135deg,rgb(15_32_53/0.75)_0%,rgb(10_22_40/0.75)_100%)]"

/** Glass shell for the lobby identity header (border, blur, shadow). */
export const lobbyHeaderCardClassName = cn(
  "relative overflow-hidden rounded-3xl shadow-lg shadow-black/10 backdrop-blur-[8px]",
  lobbyCardAccentBorderClassName,
  lobbyHeaderCardFillClassName,
)

/** Subtle accent border linking the lobby leaderboard to stat cards above. */
export const lobbyLeaderboardCardClassName =
  "border border-accent-neon/8 shadow-lg shadow-black/10"
