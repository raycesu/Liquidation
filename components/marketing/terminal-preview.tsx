import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
const CHART_BARS = [
  { x: 44, o: 158, h: 146, l: 172, c: 150 },
  { x: 62, o: 150, h: 138, l: 156, c: 143 },
  { x: 80, o: 143, h: 132, l: 149, c: 136 },
  { x: 98, o: 136, h: 128, l: 141, c: 131 },
  { x: 116, o: 131, h: 118, l: 137, c: 123 },
  { x: 134, o: 123, h: 115, l: 129, c: 120 },
  { x: 152, o: 120, h: 108, l: 124, c: 112 },
  { x: 170, o: 112, h: 102, l: 116, c: 106 },
  { x: 188, o: 106, h: 97, l: 110, c: 100 },
  { x: 206, o: 100, h: 94, l: 105, c: 98 },
  { x: 224, o: 98, h: 90, l: 101, c: 92 },
  { x: 242, o: 92, h: 86, l: 96, c: 89 },
  { x: 260, o: 89, h: 80, l: 93, c: 84 },
  { x: 278, o: 84, h: 73, l: 88, c: 77 },
  { x: 296, o: 77, h: 68, l: 82, c: 71 },
  { x: 314, o: 71, h: 58, l: 75, c: 62 },
  { x: 332, o: 62, h: 50, l: 66, c: 55 },
  { x: 350, o: 55, h: 47, l: 61, c: 52 },
  { x: 368, o: 52, h: 43, l: 57, c: 48 },
  { x: 386, o: 48, h: 35, l: 54, c: 40 },
].map((bar, index) => {
  if (index > 12) {
    return {
      ...bar,
      o: bar.o + 12,
      c: bar.c + 18,
      h: bar.h + 8,
      l: bar.l + 16,
    }
  }

  return bar
})

const CandlestickChartSvg = () => (
  <svg
    viewBox="0 0 420 240"
    className="h-full w-full text-chart-3"
    aria-hidden
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id="terminal-chart-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgb(25 132 255 / 0.22)" />
        <stop offset="100%" stopColor="rgb(8 22 40 / 0)" />
      </linearGradient>
    </defs>
    <rect width="420" height="240" fill="url(#terminal-chart-fade)" />

    <g stroke="rgb(82 130 172 / 0.3)" strokeWidth="1">
      {Array.from({ length: 7 }).map((_, index) => {
        const y = 24 + index * 30
        return <line key={`h-${index}`} x1="38" y1={y} x2="398" y2={y} />
      })}
      {Array.from({ length: 9 }).map((_, index) => {
        const x = 38 + index * 45
        return <line key={`v-${index}`} x1={x} y1="24" x2={x} y2="204" />
      })}
    </g>

    <g fill="rgb(113 152 189)" fontSize="9" fontFamily="var(--font-mono)">
      <text x="8" y="28">
        98,000
      </text>
      <text x="10" y="58">
        97,600
      </text>
      <text x="10" y="88">
        97,200
      </text>
      <text x="10" y="118">
        96,800
      </text>
      <text x="10" y="148">
        96,400
      </text>
      <text x="10" y="178">
        96,000
      </text>
      <text x="10" y="208">
        95,600
      </text>
      <text x="40" y="226">
        09:00
      </text>
      <text x="126" y="226">
        11:00
      </text>
      <text x="212" y="226">
        13:00
      </text>
      <text x="298" y="226">
        15:00
      </text>
      <text x="368" y="226">
        17:00
      </text>
    </g>

    {CHART_BARS.map((bar, index) => {
      const bodyTop = Math.min(bar.o, bar.c)
      const bodyBottom = Math.max(bar.o, bar.c)
      const bodyHeight = Math.max(bodyBottom - bodyTop, 3)
      const isUp = bar.c < bar.o
      const color = isUp ? "rgb(4 187 114)" : "rgb(231 66 96)"

      return (
        <g key={index}>
          <line x1={bar.x} y1={bar.h} x2={bar.x} y2={bar.l} stroke={color} strokeWidth="1.5" />
          <rect
            x={bar.x - 5}
            y={bodyTop}
            width="10"
            height={bodyHeight}
            fill={color}
            rx="1.5"
          />
        </g>
      )
    })}
  </svg>
)

export const TerminalPreview = () => {
  return (
    <div className="pointer-events-none w-full select-none rounded-2xl border border-[#2a4567] bg-[#0a192c]/95 shadow-[0_26px_58px_rgb(2_8_20/0.58)]">
      <div className="border-b border-[#223d5e] px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-[#2a4567] bg-[#0e2239] px-2 font-mono text-xs text-text-primary"
            tabIndex={-1}
          >
            BTC-PERP
            <ChevronDown className="size-3.5 opacity-70" />
          </Button>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-secondary">Mark</p>
              <p className="font-mono text-sm text-text-primary">$96,240.00</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-text-secondary">24h change</p>
              <p className="font-mono text-sm text-profit">+240.00 / +2.40%</p>
            </div>
          </div>
          <div className="ml-auto shrink-0">
            <Badge className="bg-profit/10 text-[10px] text-profit">Live</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1.62fr)_minmax(248px,1fr)] lg:gap-3 lg:p-3.5">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="relative min-h-[210px] overflow-hidden rounded-xl border border-[#223d5e] bg-[#081628] sm:min-h-[240px] lg:min-h-[260px]">
            <CandlestickChartSvg />
          </div>
        </div>

        <div className="min-w-0">
          <Card className="h-full border-[#223d5e] bg-[#0c1c31]">
            <CardContent className="space-y-2.5 p-3 sm:p-3.5">
              <div className="flex items-center gap-4 border-b border-[#223d5e] pb-2">
                <span className="relative pb-2 text-xs font-medium text-text-primary sm:text-sm">
                  Market
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-accent-neon" />
                </span>
                <span className="pb-2 text-xs font-medium text-text-secondary sm:text-sm">Limit</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-[#10253d] p-1">
                <div className="rounded-md bg-profit/20 px-2 py-2 text-center text-xs font-semibold text-profit sm:px-3 sm:text-sm">
                  Buy / Long
                </div>
                <div className="rounded-md px-2 py-2 text-center text-xs font-semibold text-text-secondary sm:px-3 sm:text-sm">
                  Sell / Short
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Available to Trade</span>
                  <span className="font-mono text-text-primary">$10,000.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Current Position</span>
                  <span className="font-mono text-text-primary">0.00 BTC</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-text-secondary sm:text-xs">Size</label>
                <div className="relative">
                  <div className="h-10 rounded-md border border-input bg-[#081628] pl-3 pr-20 text-right font-mono text-sm leading-10 text-text-primary sm:h-10 sm:leading-10">
                    2,500.00
                  </div>
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary sm:text-xs">
                    USD
                  </span>
                  <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-[#223d5e] bg-[#0c1c31] px-1.5 py-0.5 text-[10px] text-text-primary sm:text-xs">
                    USD
                    <ChevronDown className="size-2.5 opacity-70" />
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div className="h-full w-[35%] rounded-full bg-primary" />
                </div>
                <div className="w-14 rounded-md border border-input bg-[#081628] py-1 text-center font-mono text-xs text-text-primary">
                  35%
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-text-secondary sm:text-xs">
                {["0%", "25%", "50%", "75%", "100%"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary sm:text-xs">Leverage</span>
                  <span className="font-mono text-[10px] text-accent-neon sm:text-xs">10x</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div className="h-full w-[18%] rounded-full bg-accent-neon/80" />
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-[#223d5e] bg-[#10253d] p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-text-secondary sm:text-xs">Risk Controls</span>
                  <div className="flex items-center gap-1">
                    <span className="rounded-md bg-profit/20 px-2 py-1 text-[10px] font-semibold text-profit sm:text-xs">
                      TP
                    </span>
                    <span className="rounded-md bg-loss/20 px-2 py-1 text-[10px] font-semibold text-loss sm:text-xs">
                      SL
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                  <div className="rounded-md border border-input bg-[#081628] px-2 py-1.5 font-mono text-text-primary">
                    TP 98,450
                  </div>
                  <div className="rounded-md border border-input bg-[#081628] px-2 py-1.5 font-mono text-text-primary">
                    SL 95,980
                  </div>
                </div>
              </div>

              <Button
                type="button"
                disabled
                className="h-9 w-full rounded-md bg-profit text-xs font-semibold text-[#02170c] opacity-95 sm:h-10 sm:text-sm"
              >
                Buy / Long BTC
              </Button>

              <div className="space-y-1 border-t border-[#223d5e] pt-2 text-[10px] sm:space-y-1.5 sm:text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Liquidation Price</span>
                  <span className="font-mono text-text-primary">87,420.50</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Order Value</span>
                  <span className="font-mono text-text-primary">$2,500.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Margin Required</span>
                  <span className="font-mono text-text-primary">$250.00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
