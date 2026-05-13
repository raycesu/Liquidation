"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OpenOrdersTab } from "@/components/open-orders-tab"
import { PositionsTab } from "@/components/positions-tab"
import { TradeHistoryTab } from "@/components/trade-history-tab"
import type { CancelOrderResult } from "@/actions/cancel-order"
import type { ClosePositionResult } from "@/actions/close-position"
import type { SetPositionTriggersResult } from "@/actions/set-position-triggers"
import type { TickerPrices } from "@/hooks/useBinanceTicker"
import type { PendingOrder, Position, Trade } from "@/lib/types"

type PositionsPanelProps = {
  roomId: string
  positions: Position[]
  pendingOrders: PendingOrder[]
  trades: Trade[]
  prices: TickerPrices
  onPositionClosed: (payload: ClosePositionResult) => void
  onTriggersUpdated: (payload: SetPositionTriggersResult) => void
  onOrderCancelled: (payload: CancelOrderResult) => void
}

export const PositionsPanel = ({
  roomId,
  positions,
  pendingOrders,
  trades,
  prices,
  onPositionClosed,
  onTriggersUpdated,
  onOrderCancelled,
}: PositionsPanelProps) => {
  return (
    <Card className="border-border/70 bg-surface/80 shadow-2xl shadow-accent-blue/10 backdrop-blur">
      <CardContent className="p-0">
        <Tabs defaultValue="positions" className="gap-0">
          <TabsList variant="line" className="h-11 w-full justify-start gap-8 border-b border-border/60 bg-surface-elevated/25 px-4 pt-0">
            <TabsTrigger value="positions" className="flex-none rounded-none px-0 py-2 text-xs font-semibold uppercase tracking-[0.18em] data-active:text-accent-neon after:bg-accent-neon">
              Positions
            </TabsTrigger>
            <TabsTrigger value="open-orders" className="flex-none rounded-none px-0 py-2 text-xs font-semibold uppercase tracking-[0.18em] data-active:text-accent-neon after:bg-accent-neon">
              Open Orders
            </TabsTrigger>
            <TabsTrigger value="trade-history" className="flex-none rounded-none px-0 py-2 text-xs font-semibold uppercase tracking-[0.18em] data-active:text-accent-neon after:bg-accent-neon">
              Trade History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="positions" className="overflow-x-auto px-2 pb-2 pt-0">
            <PositionsTab
              roomId={roomId}
              positions={positions}
              pendingOrders={pendingOrders}
              prices={prices}
              onPositionClosed={onPositionClosed}
              onTriggersUpdated={onTriggersUpdated}
            />
          </TabsContent>
          <TabsContent value="open-orders" className="overflow-x-auto px-2 pb-2 pt-0">
            <OpenOrdersTab roomId={roomId} orders={pendingOrders} onOrderCancelled={onOrderCancelled} />
          </TabsContent>
          <TabsContent value="trade-history" className="overflow-x-auto px-2 pb-2 pt-0">
            <TradeHistoryTab trades={trades} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
