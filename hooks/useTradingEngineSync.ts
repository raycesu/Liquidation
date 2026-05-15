"use client"

import { useEffect, useRef } from "react"
import { checkPendingOrders, type CheckPendingOrdersResult } from "@/actions/check-pending-orders"
import { liquidateRoom, type LiquidateRoomResult } from "@/actions/liquidate"

const TRADING_ENGINE_POLL_MS = 3000

type UseTradingEngineSyncProps = {
  roomId: string
  enabled?: boolean
  onOrdersSynced: (result: CheckPendingOrdersResult) => void
  onLiquidationSynced: (result: LiquidateRoomResult) => void
}

export const useTradingEngineSync = ({
  roomId,
  enabled = true,
  onOrdersSynced,
  onLiquidationSynced,
}: UseTradingEngineSyncProps) => {
  const onOrdersSyncedRef = useRef(onOrdersSynced)
  const onLiquidationSyncedRef = useRef(onLiquidationSynced)

  onOrdersSyncedRef.current = onOrdersSynced
  onLiquidationSyncedRef.current = onLiquidationSynced

  useEffect(() => {
    if (!enabled) {
      return
    }

    let cancelled = false

    const tick = async () => {
      const [ordersResult, liquidationResult] = await Promise.all([
        checkPendingOrders({ roomId }),
        liquidateRoom(roomId),
      ])

      if (cancelled) {
        return
      }

      if (ordersResult.ok) {
        onOrdersSyncedRef.current(ordersResult.data)
      }

      if (liquidationResult.ok) {
        onLiquidationSyncedRef.current(liquidationResult.data)
      }
    }

    void tick()

    const intervalId = window.setInterval(() => {
      void tick()
    }, TRADING_ENGINE_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [roomId, enabled])
}
