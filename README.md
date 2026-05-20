# Liquidation

Paper-trading competition platform for perpetual-style markets. Competitors join rooms with a shared virtual balance, trade with leverage against live prices, and are ranked on equity and performance. Built with **Next.js 16** (App Router), **React 19**, **Clerk**, **Neon Postgres**, **Tailwind CSS**, and **shadcn/ui**.

Signed-out visitors see a **marketing landing page** at `/`. Signed-in users without a completed profile are sent to **`/onboarding`** to choose a username (and optionally set a profile photo); everyone else lands on **`/dashboard`**. Protected routes redirect unauthenticated visitors to Clerk sign-in.

## Features

### Marketing and auth

- **Landing page** — Full-viewport marketing hero (pill badge, gradient headline, terminal preview) and nav for signed-out users (`components/marketing/*`).
- **Custom sign-in / sign-up** — Branded glass-card flows with email/password and **Google OAuth** (`components/auth/*`), plus SSO callback routes under `app/sign-in/sso-callback` and `app/sign-up/sso-callback`.
- **Onboarding** — After first sign-up, users complete **`/onboarding`**: username (with suggestions and case-insensitive uniqueness) and optional avatar before entering the app. `requireOnboardedUser()` enforces this on dashboard, room, and trade routes.

### Competitions and social layer

- **Dashboard** — Room cards with rounded equity/margin figures, competition status, and quick actions to create or join a room. **Public** competitions you have not joined appear in a discover section with a one-click **Join room** action.
- **Public vs private rooms** — When creating a room, choose **Private** (hidden from browse; unique **six-character join code**, e.g. `A1B2C3`, shown in the lobby) or **Public** (listed on every trader’s dashboard; no join code). Enforced in Postgres via `is_public` and `rooms_visibility_join_code_check` (`lib/room-visibility.ts`).
- **Late join window** — Optional **`late_join_hours`** on create: leave blank to allow joins until the competition ends; **`0`** to require joining before start; or a positive number (e.g. `48`) to allow late joins for that many hours after start. Enforced in app guards (`lib/room-join-policy.ts`, `lib/competition-guards.ts`) and RLS on `room_participants` inserts.
- **Rooms** — Create competitions with name, optional **description**, schedule, starting balance, visibility, late-join policy, and active state.
- **Join flow** — **Private:** enter a join code from the dashboard **Join room** dialog (rate-limited per user). **Public:** join from the dashboard discover card or lobby. Legacy `/join/[room_id]` redirects to the dashboard.
- **Room lobby** — Competition metadata, visibility badge, join code (private only), late-join policy, description, status (upcoming / active / ended / settled), and a paginated **PnL leaderboard** (rank, trader, PnL, win rate, trades, free margin). Leaderboard metrics use the same PnL logic as profile competition history.
- **Host participant management** — Room creators can **remove participants** from the lobby (cannot remove themselves; target must have **no open positions**). `components/room/room-participant-management.tsx`, `removeRoomParticipant` in `actions/rooms.ts`.
- **End-of-competition settlement** — When `end_date` passes or a room is deactivated, the background engine **cancels all pending orders**, **closes open positions** at live marks, and sets **`settled_at`**. Trading and new joins are blocked after settlement (`lib/competition-guards.ts`, `lib/trading-engine/settle-room.ts`).

### Trading terminal

- **TradingView charts** — Per-symbol charts aligned with each market’s configured TradingView symbol.
- **Live prices** — Client-side **Binance USDT-M perpetual** ticker stream for low-latency, per-user WebSocket usage (avoids concentrating exchange calls on your server).
- **Server mark prices** — `lib/pricing.ts` batches Binance futures quotes and **falls back to Hyperliquid mids** when Binance is unavailable or missing a symbol (used by settlement, liquidation, and the order engine).
- **Asset selector** — Browse **crypto, equities, commodities, and indices** from a generated catalog that combines **Hyperliquid** universe metadata (including `xyz:` markets) with **Binance** where prices are routed through futures; HL-only mids are used when Binance does not list the contract.
- **Order entry** — **Market** and **limit** orders, leverage up to per-asset caps (from Hyperliquid metadata, up to 50× where the schema allows), size in USD or base (default size **0**), and optional **take-profit / stop-loss** on entry.
- **Limit brackets** — TP/SL placed with a limit order are stored as child trigger rows linked via **`parent_order_id`** and filled by the order engine when the parent limit executes.
- **Positions** — Open positions with live mark context, close positions, and attach or edit **TP/SL triggers** on existing positions.
- **Open orders** — Pending limits and triggers (grouped when linked to a position or parent limit), cancel support, paginated **10 rows per page**.
- **Trade history** — Fills, fees, and realized PnL for the current room participant, paginated like positions and open orders.
- **Trading fees** — Maker **0.02%** on limit fills; taker **0.05%** on market opens and closes (TP/SL, manual close). No trading fee on liquidation.
- **Funding (pure isolated margin)** — Hourly Hyperliquid-sourced funding is applied to each position’s **`margin_allocated`** (not wallet balance), which updates **liquidation price** and effective PnL. Longs pay / shorts receive when the HL rate is positive. Payments record **`actual_applied`** when margin cannot absorb the full debit. Positions at or below maintenance after funding are flagged for liquidation on the next engine pass (`lib/perpetuals.ts`, `lib/trading-engine/settle-position-funding.ts`, `run-funding-engine.ts`).
- **Order watcher** — Server-side checks for pending limits and triggers as prices move (`lib/trading-rules.ts`); **liquidation** uses live marks when positions cross liquidation price.

### Profile and account

- **`/dashboard/profile`** — Tabbed experience: **Trading Stats** (summary metrics and trading-style visuals), **Competition History** (expandable rows with a **stats strip**: win rate, average leverage, most-traded symbol, best/worst trades), and **Share competitions** (export-friendly PNG card via `html-to-image` and branded assets from `lib/brand.ts`).
- **Profile settings** — Update username with validation and case-insensitive uniqueness checks.
- **`/user-profile`** — Clerk account and security settings in a custom shell; **`/user-profile/photo`** for profile photo upload and sync to the app database.

### Developer experience

- **Server Actions** for trading, rooms, profile onboarding, and per-room order/liquidation polling helpers.
- **Modular trading engine** under `lib/trading-engine/*` — settlement, order fills, funding, liquidation, and shared close-position economics; orchestrated by `run-trading-engine.ts`.
- **Zod** validation, **Jest** + Testing Library for unit and component tests.
- **TypeScript** throughout.
- **Trading engine API** — `POST /api/engine/run` (secured with `ENGINE_CRON_SECRET`, rate-limited per IP) runs **settlement for due rooms**, then order fills, funding, and liquidation for all **ongoing** active rooms. Use an external scheduler ([cron-job.org](https://cron-job.org), recommended) because Vercel Hobby cron is once per day. The terminal also polls every 3s while open for low-latency fills.

## Stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16, App Router |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix, Sonner |
| Auth | Clerk (`@clerk/nextjs`), custom sign-in/up UI |
| Database | Neon serverless Postgres (`@neondatabase/serverless`) |
| Market catalog | Generated from Hyperliquid + Binance (`npm run markets:refresh`) |
| Live ticks | Binance futures WebSocket (client hook) |
| Server pricing | `lib/pricing.ts` (Binance + Hyperliquid fallback), `lib/hyperliquid.ts` |
| Share cards | `html-to-image`, `lib/brand.ts` |

## Prerequisites

- **Node.js** 20 or newer (22+ recommended for Next.js 16)
- **npm**
- A **Clerk** application (email/password and Google OAuth if you use the bundled Google button)
- A **Neon** (or compatible Postgres) database

## Environment variables

Copy the example file and fill in values:

```bash
cp .env.example .env.local
```

Required variables (see `.env.example` for the canonical list):

- `DATABASE_URL` — Neon connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding`

Optional (required for production order fills and settlement when users are offline):

- `ENGINE_CRON_SECRET` — Bearer token for `POST /api/engine/run` (same value in your external cron provider)

## Background trading engine (cron)

Vercel **Hobby** cron only runs **once per day**, which is too slow for limits, TP/SL, liquidation, and end-of-competition settlement. The app uses an **external HTTP scheduler** instead.

| Layer | When it runs | Purpose |
|-------|----------------|---------|
| **Terminal polling** | Every 3s while `/trade` is open | Fast fills and liquidation for active traders |
| **External cron** | Every 1 min (recommended) | Settlement, fills, funding, and liquidation when nobody is online |

Each cron invocation:

1. **Settles due rooms** — cancel pending orders, close positions at marks, set `settled_at`.
2. **Processes ongoing rooms** — fill/cancel limits and triggers, apply hourly funding, liquidate underwater positions.

The engine endpoint is **rate-limited** (10 requests per minute per client IP) to reduce abuse if the URL is exposed.

### Recommended: [cron-job.org](https://cron-job.org) (free)

- Free tier: multiple jobs, **as often as every 1 minute**
- Supports `POST` and custom `Authorization` headers
- No code in this repo beyond `POST /api/engine/run`

**Setup**

1. Generate a secret: `openssl rand -hex 32`
2. Add `ENGINE_CRON_SECRET` to Vercel (Production) and redeploy.
3. Create a free account at [cron-job.org](https://console.cron-job.org/).
4. **Cronjobs** → **Create cronjob**:
   - **Title:** Liquidation trading engine
   - **URL:** `https://YOUR-PRODUCTION-DOMAIN.vercel.app/api/engine/run`
   - **Schedule:** Every 1 minute (`*/1 * * * *` or the UI equivalent)
   - **Request method:** `POST`
   - **Headers:** `Authorization` = `Bearer YOUR_ENGINE_CRON_SECRET`
   - Enable the job and save.
5. Open the job’s **History** after a minute and confirm **200** responses (JSON body includes `settlement` and per-room counts).

**Test manually**

```bash
curl -X POST "https://YOUR-PRODUCTION-DOMAIN.vercel.app/api/engine/run" \
  -H "Authorization: Bearer YOUR_ENGINE_CRON_SECRET"
```

## Install and run

```bash
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000) (marketing when signed out; `/onboarding` or `/dashboard` when signed in, depending on profile setup).

```bash
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint
npm run typecheck
npm run test
npm run test:watch
```

## Authentication

1. Create an application in the [Clerk Dashboard](https://dashboard.clerk.com/).
2. Enable the sign-in methods you need (email/password, Google, etc.) and copy keys into `.env.local`.
3. Sign-in and sign-up routes use custom forms under `app/sign-in/[[...sign-in]]` and `app/sign-up/[[...sign-up]]` (`components/auth/sign-in-form.tsx`, `sign-up-form.tsx`).
4. New users are redirected to **`/onboarding`** after sign-up to set a public username before using dashboard or rooms.
5. Protected routes (`/dashboard`, `/room`, `/join`, `/onboarding`) use Clerk in **`proxy.ts`** (middleware matcher).

## Database

- **Base schema:** `neon/schema.sql` — apply first on a fresh database.
- **Migrations:** `neon/migrations/` — apply in filename order after the base schema:

| Migration | Purpose |
|-----------|---------|
| `002_expand_markets.sql` | Wider symbol/leverage constraints for the Hyperliquid-aligned market set |
| `003_users_username_case_insensitive_unique.sql` | Case-insensitive unique usernames |
| `004_remove_reduce_only.sql` | Schema cleanup for order flags |
| `005_add_user_image_url.sql` | Profile image URL on `users` |
| `006_profile_setup_completed.sql` | `profile_setup_completed_at` for onboarding gate |
| `006_add_room_join_codes.sql` | Unique six-character `join_code` per room |
| `007_add_room_description.sql` | Optional `description` on rooms |
| `008_drop_unused_equity_cache.sql` | Drops `latest_prices` and `room_participants.total_equity` (equity computed at read time) |
| `009_add_order_parent_order_id.sql` | `parent_order_id` on orders for bracket TP/SL linked to limits |
| `010_trading_fees_and_funding.sql` | Trade `fee` / `liquidity_role`, `funding_payments`, position `last_funding_hour` |
| `011_add_room_settled_at.sql` | `settled_at` on rooms and index for unsettled due rooms |
| `012_isolated_margin.sql` | `funding_payments.actual_applied`; recompute open-position liquidation prices from isolated margin |
| `013_late_join_hours.sql` | `late_join_hours` on rooms; RLS join cutoff aligned with app policy |
| `014_room_visibility.sql` | `is_public` on rooms; nullable join code for public rooms; discover RLS; creator can delete participants |

Apply with your Neon workflow, `psql`, or any SQL client. Order matters: schema first, then migrations in filename order.

## Market list refresh

Regenerate `lib/markets.generated.ts` from Hyperliquid (default + xyz) and Binance USDT-M perpetuals:

```bash
npm run markets:refresh
```

Commit the updated generated file when you intentionally change the tradable universe. CI and deploys then stay deterministic without calling Hyperliquid at build time for every asset.

## Project layout (high level)

| Path | Role |
|------|------|
| `app/page.tsx` | Marketing home (signed out) or redirect to onboarding/dashboard |
| `app/onboarding` | First-run username and profile setup |
| `app/sign-in`, `app/sign-up` | Custom auth UI and SSO callbacks |
| `app/dashboard` | Room list, join/create dialogs |
| `app/dashboard/profile` | Profile tabs: stats, history, share |
| `app/room/[room_id]` | Lobby, join code, paginated PnL leaderboard |
| `app/room/[room_id]/trade` | Trading terminal |
| `app/join/[room_id]` | Legacy redirect to dashboard |
| `app/user-profile/[[...user-profile]]` | Account settings and `/photo` route |
| `app/api/engine/run` | External cron target: settlement + engine per room |
| `lib/trading-engine/run-trading-engine.ts` | Cron orchestration (settlement, then ongoing rooms) |
| `lib/trading-engine/settle-room.ts` | End competition: cancel orders, close positions, `settled_at` |
| `lib/trading-engine/run-order-engine.ts` | Limit/trigger fills and bracket handling |
| `lib/trading-engine/run-funding-engine.ts` | Hourly HL funding on isolated position margin |
| `lib/trading-engine/settle-position-funding.ts` | Per-position funding settlement and liquidation reprice |
| `lib/trading-engine/liquidate.ts` | Mark-based liquidation |
| `lib/competition-guards.ts` | Block trading/join when competition ended, settled, or past late-join cutoff |
| `lib/room-join-policy.ts` | Late-join cutoff and join-window helpers |
| `lib/room-visibility.ts` | Public vs private room labels |
| `components/join-public-room-button.tsx` | One-click join for discoverable public rooms |
| `components/room/room-participant-management.tsx` | Host UI to remove participants |
| `lib/rate-limit.ts` | In-memory limits for engine cron and join-room |
| `hooks/useTradingEngineSync.ts` | Terminal polling (3s) while trade UI is open |
| `hooks/use-client-pagination.ts` | Shared pagination for terminal tables |
| `actions/*` | Server Actions (orders, rooms, profile, liquidation) |
| `components/trading-terminal.tsx` | Chart, ticker, order entry, tabbed positions/orders/history |
| `components/table-pagination.tsx` | Reusable table pager (terminal + lobby) |
| `components/marketing/*` | Landing page shell |
| `components/auth/*` | Sign-in, sign-up, OAuth |
| `components/profile/*` | Profile tabs, competition breakdown strip, trading-style visuals |
| `components/profile-share-card.tsx` | Shareable competition PNG export |
| `components/room/pnl-leaderboard-section.tsx` | Room lobby PnL leaderboard |
| `lib/room-leaderboard.ts` | Lobby leaderboard query and pagination helpers |
| `lib/profile-room-competition-stats.ts` | Per-room stats aligned with lobby PnL |
| `lib/auth.ts` | `requireCurrentUser`, `requireOnboardedUser`, profile setup gate |
| `lib/brand.ts` | Logo path and cache-busting revision for share cards |
| `lib/markets.ts` / `lib/markets.generated.ts` | Tradable markets and metadata |
| `lib/perpetuals.ts` | Margin, liquidation price, sizing helpers |
| `lib/trading-rules.ts` | Limit and trigger fill logic |
| `lib/open-orders-display.ts` | Hide child bracket rows; group linked orders in UI |
| `hooks/useBinanceTicker.ts` | Client Binance `!ticker@arr` subscription |
| `proxy.ts` | Clerk middleware and protected route matcher |

## License

Private / `UNLICENSED` (see `package.json`).
