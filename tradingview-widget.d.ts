/** Minimal typings for TradingView embed script (https://s3.tradingview.com/tv.js). */

type TradingViewPrimitiveOption = string | number | boolean

type TradingViewWidgetOptions = {
  autosize?: boolean
  symbol: string
  interval?: string
  timezone?: string
  theme?: "light" | "dark"
  style?: string
  locale?: string
  toolbar_bg?: string
  backgroundColor?: string
  custom_font_family?: string
  enable_publishing?: boolean
  allow_symbol_change?: boolean
  container_id: string
  hide_top_toolbar?: boolean
  hide_legend?: boolean
  hide_side_toolbar?: boolean
  save_image?: boolean
  studies?: string[]
  overrides?: Record<string, TradingViewPrimitiveOption>
  settings_overrides?: Record<string, TradingViewPrimitiveOption>
  width?: number | string
  height?: number | string
}

type TradingViewWidget = {
  remove?: () => void
}

type TradingViewNamespace = {
  widget: new (options: TradingViewWidgetOptions) => TradingViewWidget
}

declare global {
  interface Window {
    TradingView?: TradingViewNamespace
  }
}

export {}
