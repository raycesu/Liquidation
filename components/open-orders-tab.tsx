"use client"

import { useMemo, useTransition } from "react"
import { toast } from "sonner"
import { cancelOrder } from "@/actions/cancel-order"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatNumber, formatUsd } from "@/lib/format"
import type { CancelOrderResult } from "@/actions/cancel-order"
import type { PendingOrder } from "@/lib/types"

type OpenOrdersTabProps = {
  roomId: string
  orders: PendingOrder[]
  onOrderCancelled: (payload: CancelOrderResult) => void
}

const orderTypeLabel: Record<PendingOrder["type"], string> = {
  LIMIT: "Limit",
  TAKE_PROFIT: "Take Profit",
  STOP_LOSS: "Stop Loss",
}

const formatTime = (iso: string) => {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return date.toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const getTriggerConditionLabel = (order: PendingOrder) => {
  if (order.type === "LIMIT") {
    return order.side === "LONG" ? "Mark <= limit price" : "Mark >= limit price"
  }

  if (order.type === "TAKE_PROFIT") {
    return order.side === "LONG" ? "Mark <= TP trigger" : "Mark >= TP trigger"
  }

  return order.side === "LONG" ? "Mark >= SL trigger" : "Mark <= SL trigger"
}

export const OpenOrdersTab = ({ roomId, orders, onOrderCancelled }: OpenOrdersTabProps) => {
  const [isPending, startTransition] = useTransition()
  const triggerByPositionId = useMemo(() => {
    return orders.reduce<Record<string, { tpPrice: number | null; slPrice: number | null }>>((acc, order) => {
      if (!order.position_id) {
        return acc
      }

      const current = acc[order.position_id] ?? { tpPrice: null, slPrice: null }

      if (order.type === "TAKE_PROFIT") {
        current.tpPrice = order.trigger_price
      }

      if (order.type === "STOP_LOSS") {
        current.slPrice = order.trigger_price
      }

      acc[order.position_id] = current
      return acc
    }, {})
  }, [orders])

  const handleCancel = (orderId: string) => {
    startTransition(async () => {
      const result = await cancelOrder({ orderId, roomId })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      onOrderCancelled(result.data)
      toast.success("Order cancelled")
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Coin</TableHead>
          <TableHead>Direction</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Original Size</TableHead>
          <TableHead>Order Value</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Trigger Conditions</TableHead>
          <TableHead>TP/SL</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length > 0 ? (
          orders.map((order) => {
            const sideClassName = order.side === "LONG" ? "text-profit" : "text-loss"
            const groupedTriggers = order.position_id ? triggerByPositionId[order.position_id] : null

            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs text-text-secondary">{formatTime(order.created_at)}</TableCell>
                <TableCell>{orderTypeLabel[order.type]}</TableCell>
                <TableCell className="font-mono font-semibold text-text-primary">
                  {order.symbol.replace("USDT", "")}
                </TableCell>
                <TableCell className={sideClassName}>{order.side === "LONG" ? "Long" : "Short"}</TableCell>
                <TableCell className="font-mono">{formatUsd(order.size)}</TableCell>
                <TableCell className="font-mono">
                  {/* Orders are fully filled/cancelled today, so original size mirrors current size. */}
                  {formatUsd(order.size)}
                </TableCell>
                <TableCell className="font-mono">{formatUsd(order.size)}</TableCell>
                <TableCell className="font-mono">{formatNumber(order.trigger_price)}</TableCell>
                <TableCell className="text-xs text-text-secondary">{getTriggerConditionLabel(order)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {groupedTriggers ? (
                    <div className="space-y-1">
                      <p className="text-text-secondary">
                        TP: {groupedTriggers.tpPrice != null ? formatNumber(groupedTriggers.tpPrice) : "—"}
                      </p>
                      <p className="text-text-secondary">
                        SL: {groupedTriggers.slPrice != null ? formatNumber(groupedTriggers.slPrice) : "—"}
                      </p>
                    </div>
                  ) : (
                    <span className="text-text-secondary">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleCancel(order.id)}>
                    Cancel
                  </Button>
                </TableCell>
              </TableRow>
            )
          })
        ) : (
          <TableRow>
            <TableCell colSpan={11} className="h-28 text-center text-text-secondary">
              No open orders
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
