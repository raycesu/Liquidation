"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { closePosition } from "@/actions/close-position"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatNumber, formatPercent, formatUsd } from "@/lib/format"
import { calculatePnl, calculateRoe } from "@/lib/perpetuals"
import type { TickerPrices } from "@/hooks/useBinanceTicker"
import type { Position } from "@/lib/types"

type OpenPositionsProps = {
  roomId: string
  positions: Position[]
  prices: TickerPrices
  onPositionClosed: (positionId: string) => void
}

export const OpenPositions = ({ roomId, positions, prices, onPositionClosed }: OpenPositionsProps) => {
  const [isPending, startTransition] = useTransition()

  const handleClosePosition = (positionId: string) => {
    startTransition(async () => {
      const result = await closePosition({ positionId, roomId })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      onPositionClosed(result.data.positionId)
      toast.success(`Position closed. Realized PnL ${formatUsd(result.data.realizedPnl)}`)
    })
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle className="text-text-primary">Open positions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Lev.</TableHead>
              <TableHead>Entry</TableHead>
              <TableHead>Liq.</TableHead>
              <TableHead>Unrealized PnL</TableHead>
              <TableHead>ROE</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.length > 0 ? (
              positions.map((position) => {
                const livePrice = prices[position.symbol]
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

                return (
                  <TableRow key={position.id}>
                    <TableCell className="font-mono">{position.symbol}</TableCell>
                    <TableCell className={position.side === "LONG" ? "text-profit" : "text-loss"}>
                      {position.side}
                    </TableCell>
                    <TableCell className="font-mono">{formatUsd(position.size)}</TableCell>
                    <TableCell className="font-mono">{position.leverage}x</TableCell>
                    <TableCell className="font-mono">{formatNumber(position.entry_price)}</TableCell>
                    <TableCell className="font-mono">{formatNumber(position.liquidation_price)}</TableCell>
                    <TableCell className={`font-mono ${pnlClassName}`}>{formatUsd(unrealizedPnl)}</TableCell>
                    <TableCell className={`font-mono ${pnlClassName}`}>{formatPercent(roe)}</TableCell>
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
              <TableRow>
                <TableCell colSpan={9} className="h-28 text-center text-text-secondary">
                  No open positions.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
