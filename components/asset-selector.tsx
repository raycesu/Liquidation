"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SymbolMarketStats, SymbolStatsMap, TickerPrices } from "@/hooks/useBinanceTicker"
import { formatCompactUsd, formatNumber, formatPercent } from "@/lib/format"
import { getMarket, getMaxLeverage, MARKETS, type AssetCategory, type Market } from "@/lib/markets"
import { cn } from "@/lib/utils"

type AssetTab = "all" | AssetCategory

type AssetSelectorProps = {
  value: string
  onChange: (symbol: string) => void
  prices: TickerPrices
  statsBySymbol: SymbolStatsMap
}

const tabToCategories: Record<Exclude<AssetTab, "all">, AssetCategory> = {
  crypto: "crypto",
  equity: "equity",
  commodity: "commodity",
  index: "index",
}

const filterMarketsByTab = (tab: AssetTab): readonly Market[] => {
  if (tab === "all") {
    return MARKETS
  }
  const cat = tabToCategories[tab]
  return MARKETS.filter((m) => m.category === cat)
}

const filterBySearch = (markets: readonly Market[], query: string): Market[] => {
  const q = query.trim().toLowerCase()

  if (!q) {
    return [...markets]
  }

  return markets.filter((m) => {
    const hay = `${m.symbol} ${m.displayName} ${m.base} ${m.hlName}`.toLowerCase()
    return hay.includes(q)
  })
}

const sortByVolume = (a: Market, b: Market, stats: SymbolStatsMap): number => {
  const va = stats[a.symbol]?.quoteVolume ?? 0
  const vb = stats[b.symbol]?.quoteVolume ?? 0
  return vb - va
}

export const AssetSelector = ({ value, onChange, prices, statsBySymbol }: AssetSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<AssetTab>("all")
  const [search, setSearch] = useState("")

  const selected = getMarket(value)

  const rowSets = useMemo(() => {
    const build = (t: AssetTab) => {
      const base = filterMarketsByTab(t)
      const filtered = filterBySearch(base, search)
      filtered.sort((a, b) => sortByVolume(a, b, statsBySymbol))
      return filtered
    }

    return {
      all: build("all"),
      crypto: build("crypto"),
      equity: build("equity"),
      commodity: build("commodity"),
      index: build("index"),
    }
  }, [search, statsBySymbol])

  const handleSelect = (symbol: string) => {
    onChange(symbol)
    setOpen(false)
  }

  const selectedPrice = prices[value]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-w-[12rem] flex-col items-stretch gap-1 border-border/70 bg-surface-elevated/70 px-3 py-2 text-left shadow-lg shadow-accent-blue/5 hover:border-accent-neon/60 hover:bg-surface-elevated sm:flex-row sm:items-center sm:gap-3"
          aria-label="Open asset picker"
          aria-haspopup="dialog"
        >
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-text-primary">{selected?.displayName ?? value}</span>
              <Badge variant="secondary" className="bg-primary/15 font-mono text-xs text-accent-neon hover:bg-primary/15">
                {getMaxLeverage(value)}x
              </Badge>
            </div>
          </div>
          <span className="font-mono text-sm text-text-secondary sm:ml-auto">
            {selectedPrice != null ? `$${formatNumber(selectedPrice)}` : "—"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden border-border/70 bg-surface/95 p-0 shadow-2xl shadow-accent-blue/15 sm:max-w-3xl">
        <DialogHeader className="border-b border-border/60 bg-surface-elevated/35 px-4 py-3 text-left">
          <DialogTitle className="text-base font-semibold">Markets</DialogTitle>
          <DialogDescription className="sr-only">
            Search and pick a market. Table columns include price, 24 hour change, and volume.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-4 pb-2 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets…"
              className="pl-9"
              aria-label="Search markets"
            />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as AssetTab)} className="gap-2">
            <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="all" className="data-active:text-accent-neon after:bg-accent-neon">All</TabsTrigger>
              <TabsTrigger value="crypto" className="data-active:text-accent-neon after:bg-accent-neon">
                Crypto
              </TabsTrigger>
              <TabsTrigger value="equity" className="data-active:text-accent-neon after:bg-accent-neon">
                Equities
              </TabsTrigger>
              <TabsTrigger value="commodity" className="data-active:text-accent-neon after:bg-accent-neon">
                Commodities
              </TabsTrigger>
              <TabsTrigger value="index" className="data-active:text-accent-neon after:bg-accent-neon">
                Indices
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-0 max-h-[55vh] overflow-auto rounded-xl border border-border/70">
              <AssetTable
                markets={rowSets.all}
                activeSymbol={value}
                prices={prices}
                statsBySymbol={statsBySymbol}
                onSelect={handleSelect}
              />
            </TabsContent>
            <TabsContent value="crypto" className="mt-0 max-h-[55vh] overflow-auto rounded-xl border border-border/70">
              <AssetTable
                markets={rowSets.crypto}
                activeSymbol={value}
                prices={prices}
                statsBySymbol={statsBySymbol}
                onSelect={handleSelect}
              />
            </TabsContent>
            <TabsContent value="equity" className="mt-0 max-h-[55vh] overflow-auto rounded-xl border border-border/70">
              <AssetTable
                markets={rowSets.equity}
                activeSymbol={value}
                prices={prices}
                statsBySymbol={statsBySymbol}
                onSelect={handleSelect}
              />
            </TabsContent>
            <TabsContent value="commodity" className="mt-0 max-h-[55vh] overflow-auto rounded-xl border border-border/70">
              <AssetTable
                markets={rowSets.commodity}
                activeSymbol={value}
                prices={prices}
                statsBySymbol={statsBySymbol}
                onSelect={handleSelect}
              />
            </TabsContent>
            <TabsContent value="index" className="mt-0 max-h-[55vh] overflow-auto rounded-xl border border-border/70">
              <AssetTable
                markets={rowSets.index}
                activeSymbol={value}
                prices={prices}
                statsBySymbol={statsBySymbol}
                onSelect={handleSelect}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type AssetTableProps = {
  markets: Market[]
  activeSymbol: string
  prices: TickerPrices
  statsBySymbol: SymbolStatsMap
  onSelect: (symbol: string) => void
}

const AssetTable = ({ markets, activeSymbol, prices, statsBySymbol, onSelect }: AssetTableProps) => {
  if (markets.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-text-secondary">No markets match your search.</p>
    )
  }

  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-surface [&_tr]:border-border/60 [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-[0.12em] [&_th]:text-text-secondary">
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-text-secondary">Asset</TableHead>
          <TableHead className="text-right text-text-secondary">Price</TableHead>
          <TableHead className="text-right text-text-secondary">24h change</TableHead>
          <TableHead className="text-right text-text-secondary">24h volume</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {markets.map((m) => {
          const isActive = m.symbol === activeSymbol
          const price = prices[m.symbol]
          const stats: SymbolMarketStats | undefined = statsBySymbol[m.symbol]
          const changeClass =
            stats == null ? "text-text-secondary" : stats.changeAbs >= 0 ? "text-profit" : "text-loss"
          const changeLabel =
            stats == null
              ? "—"
              : `${stats.changeAbs >= 0 ? "+" : ""}${formatPercent(stats.changePercent)}`

          return (
            <TableRow
              key={m.symbol}
              data-state={isActive ? "selected" : undefined}
              className={cn(
                "cursor-pointer border-border/50",
                isActive && "bg-surface-elevated/80",
                !isActive && "hover:bg-surface-elevated/40",
              )}
              role="button"
              tabIndex={0}
              aria-label={`Select ${m.displayName}`}
              aria-pressed={isActive}
              onClick={() => onSelect(m.symbol)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelect(m.symbol)
                }
              }}
            >
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-text-primary">{m.displayName}</span>
                  <Badge variant="secondary" className="bg-blue-500/15 font-mono text-[10px] text-blue-300">
                    {m.maxLeverage}x
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-sm text-text-primary">
                {price != null ? `$${formatNumber(price)}` : "—"}
              </TableCell>
              <TableCell className={cn("text-right font-mono text-sm", changeClass)}>{changeLabel}</TableCell>
              <TableCell className="text-right font-mono text-sm text-text-primary">
                {stats != null ? formatCompactUsd(stats.quoteVolume) : "—"}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
