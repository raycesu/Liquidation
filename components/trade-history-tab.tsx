"use client"

import { TablePagination } from "@/components/table-pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useClientPagination } from "@/hooks/use-client-pagination"
import { formatDateTime, formatNumber, formatUsd } from "@/lib/format"
import type { Trade, TradeDirection } from "@/lib/types"

type TradeHistoryTabProps = {
  trades: Trade[]
}

const directionLabel: Record<TradeDirection, string> = {
  OPEN_LONG: "Open Long",
  OPEN_SHORT: "Open Short",
  CLOSE_LONG: "Close Long",
  CLOSE_SHORT: "Close Short",
}

const directionClassName: Record<TradeDirection, string> = {
  OPEN_LONG: "text-profit",
  OPEN_SHORT: "text-loss",
  CLOSE_LONG: "text-loss",
  CLOSE_SHORT: "text-profit",
}

export const TradeHistoryTab = ({ trades }: TradeHistoryTabProps) => {
  const { visibleItems: visibleTrades, currentPage, totalPages, pageItems, setPage } = useClientPagination(trades)

  return (
    <>
    <Table className="text-xs [&_td]:px-3 [&_td]:py-2.5">
      <TableHeader className="[&_tr]:border-border/50 [&_th]:h-9 [&_th]:px-3 [&_th]:text-[10px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.14em] [&_th]:text-text-secondary">
        <TableRow className="hover:bg-transparent">
          <TableHead>Time</TableHead>
          <TableHead>Coin</TableHead>
          <TableHead>Direction</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Trade Value</TableHead>
          <TableHead>Fee</TableHead>
          <TableHead>Closed PNL</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.length > 0 ? (
          visibleTrades.map((trade) => {
            const baseSize = trade.price > 0 ? trade.size / trade.price : 0
            const isClose = trade.direction === "CLOSE_LONG" || trade.direction === "CLOSE_SHORT"
            const realizedPnl = trade.realized_pnl ?? 0
            const pnlClassName = realizedPnl >= 0 ? "text-profit" : "text-loss"

            return (
              <TableRow key={trade.id} className="border-border/40 hover:bg-surface-elevated/30">
                <TableCell className="font-mono text-xs text-text-secondary">
                  {formatDateTime(trade.created_at)}
                </TableCell>
                <TableCell className="font-mono font-semibold text-text-primary">
                  {trade.symbol.replace("USDT", "")}
                </TableCell>
                <TableCell className={directionClassName[trade.direction]}>{directionLabel[trade.direction]}</TableCell>
                <TableCell className="font-mono">{formatNumber(trade.price)}</TableCell>
                <TableCell className="font-mono">
                  {baseSize > 0 ? `${baseSize.toFixed(4)} ${trade.symbol.replace("USDT", "")}` : formatUsd(trade.size)}
                </TableCell>
                <TableCell className="font-mono">{formatUsd(trade.trade_value)}</TableCell>
                <TableCell className="font-mono text-text-secondary">
                  {trade.fee > 0 ? formatUsd(trade.fee) : "—"}
                </TableCell>
                <TableCell className={`font-mono ${isClose ? pnlClassName : "text-text-secondary"}`}>
                  {isClose ? formatUsd(realizedPnl) : "—"}
                </TableCell>
              </TableRow>
            )
          })
        ) : (
          <TableRow className="border-border/40 hover:bg-transparent">
            <TableCell colSpan={8} className="h-24 text-center text-text-secondary">
              No trades yet
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>

    <TablePagination
      currentPage={currentPage}
      totalPages={totalPages}
      pageItems={pageItems}
      onPageChange={setPage}
      ariaLabelPrefix="Trade history"
    />
    </>
  )
}
