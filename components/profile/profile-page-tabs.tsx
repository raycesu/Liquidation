"use client"

import { ProfileCompetitionTable } from "@/components/profile-competition-table"
import { ProfileShareCardSection } from "@/components/profile-share-card"
import { ProfileTradingStatsPanel } from "@/components/profile/profile-trading-stats-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type {
  ProfileCompetitionRow,
  ProfileShareRoomOption,
  ProfileSummaryStats,
  ProfileTradingStyle,
} from "@/lib/types"

type ProfilePageTabsProps = {
  summary: ProfileSummaryStats
  tradingStyle: ProfileTradingStyle
  competitionRows: ProfileCompetitionRow[]
  shareRoomOptions: ProfileShareRoomOption[]
  assetBaseUrl: string
}

const tabTriggerClassName = cn(
  "relative -mb-px flex-none shrink-0 rounded-none bg-transparent px-0 pb-3 pt-0.5 text-base font-medium shadow-none",
  "!border-0 !border-b-2 !border-transparent text-text-secondary/80 transition-colors duration-200",
  "hover:text-text-primary",
  "data-active:!border-white data-active:bg-transparent data-active:text-white data-active:font-semibold",
  "data-active:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]",
  "dark:data-active:bg-transparent",
  "after:hidden group-data-[variant=line]/tabs-list:after:opacity-0",
)

export const ProfilePageTabs = ({
  summary,
  tradingStyle,
  competitionRows,
  shareRoomOptions,
  assetBaseUrl,
}: ProfilePageTabsProps) => {
  return (
    <Tabs defaultValue="stats" className="w-full">
      <nav aria-label="Profile sections" className="w-full border-b border-white/10">
        <div className="overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList
            variant="line"
            className="h-auto w-max min-w-full justify-start gap-10 rounded-none border-0 bg-transparent p-0"
          >
            <TabsTrigger value="stats" className={tabTriggerClassName}>
              Trading Stats
            </TabsTrigger>
            <TabsTrigger value="history" className={tabTriggerClassName}>
              Competition History
            </TabsTrigger>
            <TabsTrigger value="share" className={tabTriggerClassName}>
              Share Trades
            </TabsTrigger>
          </TabsList>
        </div>
      </nav>

      <TabsContent value="stats" className="mt-6 outline-none">
        <ProfileTradingStatsPanel summary={summary} tradingStyle={tradingStyle} />
      </TabsContent>

      <TabsContent value="history" className="mt-6 outline-none">
        <ProfileCompetitionTable rows={competitionRows} />
      </TabsContent>

      <TabsContent value="share" className="mt-6 outline-none">
        <ProfileShareCardSection shareRoomOptions={shareRoomOptions} assetBaseUrl={assetBaseUrl} />
      </TabsContent>
    </Tabs>
  )
}
