"use client"

import { useMemo, useTransition } from "react"
import { toast } from "sonner"
import { cancelOrder } from "@/actions/cancel-order"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateTime, formatNumber, formatUsd } from "@/lib/format"
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
    <Table className="text-xs [&_td]:px-3 [&_td]:py-2.5">
      <TableHeader className="[&_tr]:border-border/50 [&_th]:h-9 [&_th]:px-3 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.14em] [&_th]:text-text-secondary">
        <TableRow className="hover:bg-transparent">
          <TableHead>Time</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Coin</TableHead>
          <TableHead>Direction</TableHead>
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
              <TableRow key={order.id} className="border-border/40 hover:bg-surface-elevated/30">
                <TableCell className="font-mono text-xs text-text-secondary">
                  {formatDateTime(order.created_at)}
                </TableCell>
                <TableCell>{orderTypeLabel[order.type]}</TableCell>
                <TableCell className="font-mono font-semibold text-text-primary">
                  {order.symbol.replace("USDT", "")}
                </TableCell>
                <TableCell className={sideClassName}>{order.side === "LONG" ? "Long" : "Short"}</TableCell>
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
          <TableRow className="border-border/40 hover:bg-transparent">
            <TableCell colSpan={9} className="h-24 text-center text-text-secondary">
              No open orders
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
