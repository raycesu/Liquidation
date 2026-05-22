import { ProfileStatsOverviewCard } from "@/components/profile/profile-stats-overview-card"
import { ProfileTradingStyleCard } from "@/components/profile-trading-style-card"
import type { ProfileSummaryStats, ProfileTradingStyle } from "@/lib/types"

type ProfileTradingStatsPanelProps = {
  summary: ProfileSummaryStats
  tradingStyle: ProfileTradingStyle
}

export const ProfileTradingStatsPanel = ({ summary, tradingStyle }: ProfileTradingStatsPanelProps) => {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2 lg:gap-5">
      <ProfileStatsOverviewCard summary={summary} topSymbols={tradingStyle.topSymbols} />
      <ProfileTradingStyleCard style={tradingStyle} embedded />
    </div>
  )
}
