"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { closePosition } from "@/actions/close-position"
import { setPositionTriggers } from "@/actions/set-position-triggers"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { TickerPrices } from "@/hooks/useBinanceTicker"
import { formatNumber, formatPercent, formatUsd } from "@/lib/format"
import { calculatePnl, calculateRoe } from "@/lib/perpetuals"
import type { ClosePositionResult } from "@/actions/close-position"
import type { SetPositionTriggersResult } from "@/actions/set-position-triggers"
import type { PendingOrder, Position } from "@/lib/types"

type PositionsTabProps = {
  roomId: string
  positions: Position[]
  pendingOrders: PendingOrder[]
  prices: TickerPrices
  onPositionClosed: (payload: ClosePositionResult) => void
  onTriggersUpdated: (payload: SetPositionTriggersResult) => void
}

const findTriggers = (orders: PendingOrder[], positionId: string) => {
  const tp = orders.find(
    (order) => order.position_id === positionId && order.type === "TAKE_PROFIT" && order.status === "PENDING",
  )
  const sl = orders.find(
    (order) => order.position_id === positionId && order.type === "STOP_LOSS" && order.status === "PENDING",
  )

  return { tp, sl }
}

export const PositionsTab = ({
  roomId,
  positions,
  pendingOrders,
  prices,
  onPositionClosed,
  onTriggersUpdated,
}: PositionsTabProps) => {
  const [isPending, startTransition] = useTransition()
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [tpDraft, setTpDraft] = useState("")
  const [slDraft, setSlDraft] = useState("")

  const handleClosePosition = (positionId: string) => {
    startTransition(async () => {
      const result = await closePosition({ positionId, roomId })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      onPositionClosed(result.data)
      toast.success(`Position closed. Realized PnL ${formatUsd(result.data.realizedPnl)}`)
    })
  }

  const handleOpenTriggerDialog = (position: Position) => {
    const { tp, sl } = findTriggers(pendingOrders, position.id)
    setEditingPosition(position)
    setTpDraft(tp ? String(tp.trigger_price) : "")
    setSlDraft(sl ? String(sl.trigger_price) : "")
  }

  const handleSubmitTriggers = () => {
    if (!editingPosition) {
      return
    }

    const tpValue = tpDraft.trim() === "" ? null : Number(tpDraft)
    const slValue = slDraft.trim() === "" ? null : Number(slDraft)

    if (tpValue != null && (!Number.isFinite(tpValue) || tpValue <= 0)) {
      toast.error("Invalid take profit price")
      return
    }

    if (slValue != null && (!Number.isFinite(slValue) || slValue <= 0)) {
      toast.error("Invalid stop loss price")
      return
    }

    startTransition(async () => {
      const result = await setPositionTriggers({
        positionId: editingPosition.id,
        roomId,
        takeProfitPrice: tpValue,
        stopLossPrice: slValue,
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      onTriggersUpdated(result.data)
      setEditingPosition(null)
      toast.success("Triggers updated")
    })
  }

  return (
    <>
      <Table className="text-xs [&_td]:px-3 [&_td]:py-2.5">
        <TableHeader className="[&_tr]:border-border/50 [&_th]:h-9 [&_th]:px-3 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.14em] [&_th]:text-text-secondary">
          <TableRow className="hover:bg-transparent">
            <TableHead>Coin</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Position Value</TableHead>
            <TableHead>Entry Price</TableHead>
            <TableHead>Mark Price</TableHead>
            <TableHead>PNL (ROE %)</TableHead>
            <TableHead>Liq. Price</TableHead>
            <TableHead>Margin</TableHead>
            <TableHead>TP/SL</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.length > 0 ? (
            positions.map((position) => {
              const livePrice = prices[position.symbol]
              const markPrice = livePrice ?? position.entry_price
              const positionValue = (position.size / position.entry_price) * markPrice
              const unrealizedPnl = livePrice
                ? calculatePnl({
                    entryPrice: position.entry_price,
                    livePrice,
                    side: position.side,
                    size: position.size,
                  })
                : 0
              const roe = calculateRoe({
                marginAllocated: position.margin_allocated,
                unrealizedPnl,
              })
              const pnlClassName = unrealizedPnl >= 0 ? "text-profit" : "text-loss"
              const sideClassName = position.side === "LONG" ? "text-profit" : "text-loss"
              const { tp, sl } = findTriggers(pendingOrders, position.id)

              return (
                <TableRow key={position.id} className="border-border/40 hover:bg-surface-elevated/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-text-primary">
                        {position.symbol.replace("USDT", "")}
                      </span>
                      <span className={`text-xs font-semibold ${sideClassName}`}>
                        {position.leverage}x {position.side === "LONG" ? "Long" : "Short"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{formatUsd(position.size)}</TableCell>
                  <TableCell className="font-mono">{formatUsd(positionValue)}</TableCell>
                  <TableCell className="font-mono">{formatNumber(position.entry_price)}</TableCell>
                  <TableCell className="font-mono">{formatNumber(markPrice)}</TableCell>
                  <TableCell className={`font-mono ${pnlClassName}`}>
                    {formatUsd(unrealizedPnl)}{" "}
                    <span className="text-xs">({formatPercent(roe)})</span>
                  </TableCell>
                  <TableCell className="font-mono">{formatNumber(position.liquidation_price)}</TableCell>
                  <TableCell className="font-mono">{formatUsd(position.margin_allocated)}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      aria-label="Edit take profit and stop loss"
                      onClick={() => handleOpenTriggerDialog(position)}
                      className="font-mono text-xs text-text-secondary underline-offset-2 hover:text-accent-neon hover:underline"
                    >
                      {tp ? formatNumber(tp.trigger_price) : "—"} / {sl ? formatNumber(sl.trigger_price) : "—"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending || position.id.startsWith("optimistic-")}
                      onClick={() => handleClosePosition(position.id)}
                    >
                      Close
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableCell colSpan={10} className="h-24 text-center text-text-secondary">
                No open positions yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={editingPosition != null} onOpenChange={(open) => !open && setEditingPosition(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit TP/SL{editingPosition ? ` — ${editingPosition.symbol.replace("USDT", "")}` : ""}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Set take profit and stop loss trigger prices for this position, or leave empty to remove.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="tp-draft" className="text-xs text-text-secondary">
                Take Profit Price
              </label>
              <Input
                id="tp-draft"
                value={tpDraft}
                type="number"
                min="0"
                step="0.01"
                placeholder="Leave empty to remove"
                onChange={(event) => setTpDraft(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sl-draft" className="text-xs text-text-secondary">
                Stop Loss Price
              </label>
              <Input
                id="sl-draft"
                value={slDraft}
                type="number"
                min="0"
                step="0.01"
                placeholder="Leave empty to remove"
                onChange={(event) => setSlDraft(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPosition(null)} type="button">
              Cancel
            </Button>
            <Button onClick={handleSubmitTriggers} disabled={isPending} type="button">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
