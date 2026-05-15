# Liquidation

Paper-trading competition platform for perpetual-style markets. Competitors join rooms with a shared virtual balance, trade with leverage against live prices, and are ranked on equity and performance. Built with **Next.js 16** (App Router), **React 19**, **Clerk**, **Neon Postgres**, **Tailwind CSS**, and **shadcn/ui**.

Signed-out visitors see a **marketing landing page** at `/`. Signed-in users without a completed profile are sent to **`/onboarding`** to choose a username (and optionally set a profile photo); everyone else lands on **`/dashboard`**. Protected routes redirect unauthenticated visitors to Clerk sign-in.

## Features

### Marketing and auth

- **Landing page** — Full-viewport marketing hero and nav for signed-out users (`components/marketing/*`).
- **Custom sign-in / sign-up** — Branded glass-card flows with email/password and **Google OAuth** (`components/auth/*`), plus SSO callback routes under `app/sign-in/sso-callback` and `app/sign-up/sso-callback`.
- **Onboarding** — After first sign-up, users complete **`/onboarding`**: username (with suggestions and case-insensitive uniqueness) and optional avatar before entering the app. `requireOnboardedUser()` enforces this on dashboard, room, and trade routes.

### Competitions and social layer

- **Dashboard** — Room cards with available margin, equity, competition status, and quick actions to create or join a room.
- **Rooms** — Create competitions with name, optional **description**, schedule, starting balance, and active state. Each room gets a unique **six-character join code** (e.g. `A1B2C3`) shown in the lobby.
- **Join flow** — Enter a join code from the dashboard **Join room** dialog; the lobby displays the code for participants to share. Legacy `/join/[room_id]` redirects to the dashboard.
- **Room lobby** — Competition metadata, join code, description, status (upcoming / active / ended), and an embedded **PnL leaderboard** preview with a link to the full leaderboard page.
- **Leaderboard** — Dedicated `/room/[room_id]/leaderboard` page with paginated rankings by equity and performance.

### Trading terminal

- **TradingView charts** — Per-symbol charts aligned with each market’s configured TradingView symbol.
- **Live prices** — Client-side **Binance USDT-M perpetual** ticker stream for low-latency, per-user WebSocket usage (avoids concentrating exchange calls on your server).
- **Asset selector** — Browse **crypto, equities, commodities, and indices** from a generated catalog that combines **Hyperliquid** universe metadata (including `xyz:` markets) with **Binance** where prices are routed through futures; HL-only mids are used when Binance does not list the contract.
- **Order entry** — **Market** and **limit** orders, leverage up to per-asset caps (from Hyperliquid metadata, up to 50× where the schema allows), size in USD or base, and optional **take-profit / stop-loss** on entry.
- **Positions** — Open positions with live mark context, close positions, and attach or edit **TP/SL triggers** on existing positions.
- **Open orders** — Pending limit and trigger orders with cancel support.
- **Trade history** — Fills and realized PnL for the current room participant.
- **Order watcher** — Server-side checks for pending limits and triggers as prices move (`lib/trading-rules.ts`); **liquidation** uses live marks when positions cross liquidation price.

### Profile and account

- **`/dashboard/profile`** — Tabbed experience: **Trading Stats** (summary metrics and trading-style visuals), **Competition History**, and **Share competitions** (export-friendly competition summary card via `html-to-image`).
- **Profile settings** — Update username with validation and case-insensitive uniqueness checks.
- **`/user-profile`** — Clerk account and security settings in a custom shell; **`/user-profile/photo`** for profile photo upload and sync to the app database.

### Developer experience

- **Server Actions** for trading, rooms, profile onboarding, and order/liquidation engine helpers.
- **Zod** validation, **Jest** + Testing Library for unit and component tests.
- **TypeScript** throughout.
- **Trading engine API** — `POST /api/engine/run` (secured with `ENGINE_CRON_SECRET`) fills limits/TP/SL and liquidates underwater positions across all active rooms. Use an external scheduler ([cron-job.org](https://cron-job.org), recommended) because Vercel Hobby cron is once per day. The terminal also polls every 3s while open for low-latency fills.

## Stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16, App Router |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix, Sonner |
| Auth | Clerk (`@clerk/nextjs`), custom sign-in/up UI |
| Database | Neon serverless Postgres (`@neondatabase/serverless`) |
| Market catalog | Generated from Hyperliquid + Binance (`npm run markets:refresh`) |
| Live ticks | Binance futures WebSocket (client hook) |
| Server pricing helpers | `lib/pricing.ts`, `lib/hyperliquid.ts` |
| Share cards | `html-to-image` |

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

Optional (required for production order fills when users are offline):

- `ENGINE_CRON_SECRET` — Bearer token for `POST /api/engine/run` (same value in your external cron provider)

## Background trading engine (cron)

Vercel **Hobby** cron only runs **once per day**, which is too slow for limits, TP/SL, and liquidation. The app uses an **external HTTP scheduler** instead.

| Layer | When it runs | Purpose |
|-------|----------------|---------|
| **Terminal polling** | Every 3s while `/trade` is open | Fast fills for active traders |
| **External cron** | Every 1 min (recommended) | Fills and liquidation when nobody is online |

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
5. Open the job’s **History** after a minute and confirm **200** responses.

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
| `app/room/[room_id]` | Lobby, join code, leaderboard preview |
| `app/room/[room_id]/leaderboard` | Full paginated leaderboard |
| `app/room/[room_id]/trade` | Trading terminal |
| `app/join/[room_id]` | Legacy redirect to dashboard |
| `app/user-profile/[[...user-profile]]` | Account settings and `/photo` route |
| `app/api/engine/run` | External cron target: order fills + liquidation |
| `lib/trading-engine/*` | Order engine, liquidation, cron orchestration |
| `hooks/useTradingEngineSync.ts` | Terminal polling (3s) while trade UI is open |
| `actions/*` | Server Actions (orders, rooms, profile, liquidation) |
| `components/trading-terminal.tsx` | Chart, ticker, order entry, positions panel |
| `components/marketing/*` | Landing page shell |
| `components/auth/*` | Sign-in, sign-up, OAuth |
| `components/profile/*` | Profile page tabs and trading-style visuals |
| `components/room/pnl-leaderboard-section.tsx` | Shared lobby/full leaderboard UI |
| `lib/auth.ts` | `requireCurrentUser`, `requireOnboardedUser`, profile setup gate |
| `lib/markets.ts` / `lib/markets.generated.ts` | Tradable markets and metadata |
| `lib/perpetuals.ts` | Margin, liquidation price, sizing helpers |
| `lib/trading-rules.ts` | Limit and trigger fill logic |
| `hooks/useBinanceTicker.ts` | Client Binance `!ticker@arr` subscription |
| `proxy.ts` | Clerk middleware and protected route matcher |

## License

Private / `UNLICENSED` (see `package.json`).
