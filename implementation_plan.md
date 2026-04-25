# Cursor Implementation Plan: Liquidation 💧

**Project Name:** Liquidation  
**Description:** A paper-trading competition platform for crypto perpetual futures, inspired by Hyperliquid's UX but entirely simulated. Users can create competition rooms, invite peers, and trade crypto with up to 20x leverage using virtual capital based on live, real-time market data.  
**Design Theme:** Deep/Neon Blue (Hyperliquid-esque).  
**Cost Constraint:** 100% Free API usage, maximizing free tiers and client-side distribution to avoid rate limits.

---

## 1. Architecture & Free-Tier API Strategy

To ensure zero cost and avoid API rate limits, we are using a **Distributed Client-Side Market Data** architecture combined with a **Serverless Database Ledger**.

- **Market Data (Real-time): Binance Public WebSocket**
  - *Endpoint:* `wss://stream.binance.com:9443/ws/!ticker@arr`
  - *Strategy:* **Crucial:** Connections must be made on the *Client-Side* (browser). If your Next.js server connects to Binance for all users, your server IP will hit rate limits and be banned. By having the user's browser establish the WebSocket connection, Binance sees individual IP addresses. The free limits are virtually infinite this way.

- **Historical Data (Charts): Binance REST API (Klines)**
  - *Endpoint:* `https://api.binance.com/api/v3/klines`
  - *Strategy:* Fetched client-side for the `lightweight-charts` component. Generous 1200 weight/minute limit per user IP.

- **Database & Auth: Supabase (Free Tier)**
  - Handles user auth, room data, and the simulated position ledger. Generous free tier (500k edge functions, 50k MAU, 500MB DB).

- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.

---

## 2. UI/UX & Design System

The app will use a dark, high-contrast blue theme suited for a professional trading terminal.

**Tailwind Configuration Variables (`globals.css`):**

```css
:root {
  --background: #050a14;
  --surface: #0d1a2e;
  --surface-elevated: #102240;
  --border: #1a3a5c;
  --accent-blue: #0094ff;
  --accent-neon: #00d4ff;
  --text-primary: #e8f4ff;
  --text-secondary: #6b9ab8;
  --green: #00c97a;
  --red: #ff3b5c;
}
```

**Key UI Components to Build:**
- **Dashboard:** List of active/past competition rooms. Clean card layout.
- **Room Lobby:** Leaderboard + participant list + "Enter Terminal" button.
- **Trading Terminal (Main View):**
  - Left panel (60%): `lightweight-charts` price chart, symbol selector tabs (BTC, ETH, SOL).
  - Right panel (40%): Order entry form (Leverage slider, size input, Long/Short buttons), open positions table below.
- **Leaderboard:** Ranked by Total Equity, showing live PnL, ROE%, and margin usage.

---

## 3. Database Schema (Supabase PostgreSQL)

Provide this to Cursor to automatically generate your Supabase migrations.

### Table: `users`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary Key |
| `email` | string | |
| `username` | string | Unique |
| `created_at` | timestamp | |

### Table: `rooms` (Competitions)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary Key |
| `creator_id` | uuid | References `users` |
| `name` | string | |
| `starting_balance` | numeric | e.g., 10000 |
| `start_date` | timestamp | |
| `end_date` | timestamp | |
| `is_active` | boolean | |

### Table: `room_participants`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary Key |
| `room_id` | uuid | References `rooms` |
| `user_id` | uuid | References `users` |
| `available_margin` | numeric | Cash not locked in trades |
| `total_equity` | numeric | Updated periodically or upon trade close |

### Table: `positions` (The Perpetuals Engine)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary Key |
| `participant_id` | uuid | References `room_participants` |
| `symbol` | string | e.g., `'BTCUSDT'` |
| `side` | string | `'LONG'` or `'SHORT'` |
| `leverage` | integer | Max 20 |
| `size` | numeric | Total position size in USD |
| `margin_allocated` | numeric | Initial margin locked |
| `entry_price` | numeric | |
| `liquidation_price` | numeric | |
| `is_open` | boolean | Default `true` |
| `created_at` | timestamp | |

---

## 4. Perpetuals Engine Logic

When generating the trading server actions, implement the following math exactly.

### Opening a Position

**Example:** User wants to Long BTC. Size: $10,000, Leverage: 20x. Current Price: $65,000.

1. **Margin Check:**
   ```
   Required Margin = Size / Leverage
   $10,000 / 20 = $500
   Ensure available_margin >= $500
   ```

2. **Deduct Margin:**
   ```
   UPDATE room_participants
   SET available_margin = available_margin - $500
   WHERE id = participant_id
   ```

### Liquidation Price Math

Assume Maintenance Margin Rate = **0.5%**

- **Long Liquidation Price:**
  ```
  Entry Price * (1 - (1 / Leverage) + Maintenance Margin Rate)
  ```

- **Short Liquidation Price:**
  ```
  Entry Price * (1 + (1 / Leverage) - Maintenance Margin Rate)
  ```

### Live PNL Calculation (Client-Side, using WebSocket price)

- **Long PNL:**
  ```
  (Live Price - Entry Price) / Entry Price * Size
  ```

- **Short PNL:**
  ```
  (Entry Price - Live Price) / Entry Price * Size
  ```

### ROE% (Return on Equity)
```
ROE% = Unrealized PNL / Margin Allocated * 100
```

---

## 5. Liquidation Engine (Edge Case Handling)

Since the app is serverless, a continuous background loop is not viable on the free tier.

**Solution: Lazy Evaluation + Supabase pg_cron**

1. **Lazy Evaluation on Page Load:** Whenever any user loads the leaderboard or room dashboard, trigger a serverless function that fetches current prices from the Binance REST API and checks all open positions for that room against their `liquidation_price`. Any position where:
   - LONG: `live_price <= liquidation_price`
   - SHORT: `live_price >= liquidation_price`
   
   ...should be force-closed with a PnL of `-margin_allocated` (total loss of margin).

2. **Supabase pg_cron Sweep:** Set up a Supabase pg_cron job running every 5 minutes to sweep all open positions across all active rooms and liquidate those past their threshold. This is the safety net.

```sql
-- Example pg_cron setup in Supabase SQL editor
select cron.schedule(
  'liquidation-sweep',
  '*/5 * * * *',
  $$ select liquidate_underwater_positions(); $$
);
```

---

## 6. Phased Implementation Plan

Prompt Cursor with each phase one at a time in order.

---

### Phase 1: Foundation & Identity

**Cursor Prompt:**
```
Set up a Next.js App Router project with Tailwind CSS, configured with a dark blue trading theme (Hyperliquid style). Use these CSS variables in globals.css:
  --background: #050a14
  --surface: #0d1a2e
  --surface-elevated: #102240
  --border: #1a3a5c
  --accent-blue: #0094ff
  --accent-neon: #00d4ff
  --text-primary: #e8f4ff
  --text-secondary: #6b9ab8
  --green: #00c97a
  --red: #ff3b5c

Integrate shadcn/ui. Set up Supabase Auth (email/password). Create the full database schema for Users, Rooms, room_participants, and Positions tables as specified. Create a clean authenticated dashboard where users can see their active and past competition rooms as cards.
```

---

### Phase 2: Competition Management

**Cursor Prompt:**
```
Build the competition room creation flow. Allow users to set a room name, starting virtual balance (default 10,000 USDT), and an end date via a modal form. On submission, create a new row in the rooms table and add the creator to room_participants with available_margin set to the starting balance. Generate a unique shareable join link (e.g., /join/[room_id]). When a new user visits this link and is authenticated, add them to room_participants with the room's starting_balance as their available_margin. Redirect them to the room lobby.
```

---

### Phase 3: Trading Terminal & Live Market Data

**Cursor Prompt:**
```
Build the main Trading Terminal page at /room/[room_id]/trade. Layout: split screen with the chart panel on the left (60% width) and an order entry panel on the right (40% width).

For market data, create a custom React Hook called useBinanceTicker that establishes a WebSocket connection CLIENT-SIDE to wss://stream.binance.com:9443/ws/!ticker@arr. It should parse the incoming stream and expose a simple map of { symbol: currentPrice } for BTCUSDT, ETHUSDT, and SOLUSDT.

Add symbol selector tabs above the chart (BTC, ETH, SOL).

Integrate the lightweight-charts library for the price chart. On symbol change, fetch historical OHLCV data client-side from https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=200 and populate the candlestick chart.
```

---

### Phase 4: Order Execution & Perpetuals Math

**Cursor Prompt:**
```
Implement the order entry panel and Server Actions for placing a trade.

Order entry UI (right panel):
- A leverage slider from 1x to 20x with a live display
- A position size input in USD
- Display the calculated Required Margin: (Size / Leverage)
- A "Long" button (green) and a "Short" button (red)

Server Action logic (place_order):
1. Fetch the participant's current available_margin from the DB.
2. Calculate Required Margin = Size / Leverage.
3. If available_margin < Required Margin, return an error: "Insufficient margin."
4. Fetch the current price from Binance REST API (not WebSocket, since this is server-side): GET https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT
5. Calculate liquidation_price:
   - LONG: entry_price * (1 - (1 / leverage) + 0.005)
   - SHORT: entry_price * (1 + (1 / leverage) - 0.005)
6. Write the new position to the positions table with is_open = true.
7. Deduct Required Margin from the participant's available_margin.
```

---

### Phase 5: Position Management & Leaderboard

**Cursor Prompt:**
```
Complete the trading terminal and build the leaderboard.

1. Open Positions Table: Below the chart, display a table of the user's open positions for this room. Columns: Symbol, Side, Size, Leverage, Entry Price, Liq. Price, Unrealized PNL (USD), ROE%.
   - Use the live price from the useBinanceTicker hook to calculate PNL in real-time:
     - Long PNL: (livePrice - entryPrice) / entryPrice * size
     - Short PNL: (entryPrice - livePrice) / entryPrice * size
     - ROE%: (unrealizedPnl / marginAllocated) * 100
   - Color PNL green if positive, red if negative.

2. Close Position Server Action: On "Close" button click, run a Server Action that:
   - Fetches the final price from Binance REST API.
   - Calculates final realized PNL.
   - Sets is_open = false on the position.
   - Adds (margin_allocated + realized_pnl) back to available_margin.
   - Updates total_equity = available_margin + sum of all open position values.

3. Leaderboard Page (/room/[room_id]/leaderboard): Rank all participants in the room by total_equity (available_margin + sum of unrealized PnL on open positions). Show columns: Rank, Username, Total Equity, Unrealized PNL, Available Margin.

4. On leaderboard page load, also trigger the lazy liquidation check: fetch current prices from Binance REST and liquidate any open positions where livePrice has crossed the liquidation_price.
```

---

## 7. Key Files & Folder Structure

```
/app
  /dashboard         → Authenticated home, room cards
  /room
    /[room_id]
      /page.tsx      → Room lobby + leaderboard
      /trade
        /page.tsx    → Trading terminal
  /join
    /[room_id]
      /page.tsx      → Join flow
/components
  /TradingChart.tsx  → lightweight-charts wrapper
  /OrderEntry.tsx    → Leverage slider + order form
  /OpenPositions.tsx → Live PNL table
  /Leaderboard.tsx   → Ranked equity table
/hooks
  /useBinanceTicker.ts → Client-side WebSocket hook
/actions
  /place_order.ts    → Server Action: open position
  /close_position.ts → Server Action: close position
  /liquidate.ts      → Server Action: lazy liquidation sweep
/lib
  /supabase.ts       → Supabase client
  /binance.ts        → REST helper (server-side price fetch)
```

---

## 8. Critical Implementation Notes for Cursor

1. **WebSocket is CLIENT-SIDE ONLY.** Never call the Binance WebSocket from a Server Component or Server Action. Only use it inside a `useEffect` hook in a Client Component (`'use client'`).

2. **Server Actions use Binance REST** for price fetches (not WebSocket), since Server Actions run on the server. Use `https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`.

3. **Supabase RLS Policies:** Enable Row Level Security on all tables. Users should only be able to read/write their own `room_participants` and `positions` rows. Leaderboard data (reading all participants in a room) requires a policy allowing SELECT for all authenticated users where `room_id` matches.

4. **Optimistic UI:** After placing a trade, optimistically add the position to the local state before the server confirms, to avoid UI lag on the terminal.

5. **No negative equity:** In the close_position server action, floor the PnL at `-margin_allocated` to prevent a participant's available_margin from going negative due to a race condition before liquidation fires.
