# Liquidation

Paper-trading competition platform for perpetual-style markets. Competitors join rooms with a shared virtual balance, trade with leverage against live prices, and are ranked on equity and performance. Built with **Next.js 16** (App Router), **React 19**, **Clerk**, **Neon Postgres**, **Tailwind CSS**, and **shadcn/ui**.

The home route shows a marketing landing page for signed-out users and redirects signed-in users to `/dashboard`. Protected routes redirect unauthenticated visitors to Clerk sign-in.

## Features

### Competitions and social layer

- **Dashboard** — See every room you participate in, available margin, and total equity per competition.
- **Rooms** — Create competitions with name, schedule, starting balance, and active state; open the lobby for participants and leaderboard.
- **Join flow** — `/join/[room_id]` for accepting an invite-style link after sign-in.
- **Leaderboard** — Rankings by equity and performance within a room.

### Trading terminal

- **TradingView charts** — Per-symbol charts aligned with each market’s configured TradingView symbol.
- **Live prices** — Client-side **Binance USDT-M perpetual** ticker stream for low-latency, per-user WebSocket usage (avoids concentrating exchange calls on your server).
- **Asset selector** — Browse **crypto, equities, commodities, and indices** from a generated catalog that combines **Hyperliquid** universe metadata (including `xyz:` markets) with **Binance** where prices are routed through futures; HL-only mids are used when Binance does not list the contract.
- **Order entry** — **Market** and **limit** orders, leverage up to per-asset caps (from Hyperliquid metadata, up to 50× where the schema allows), size in USD or base, and optional **take-profit / stop-loss** on entry.
- **Positions** — Open positions with live mark context, close positions, and attach or edit **TP/SL triggers** on existing positions.
- **Open orders** — Pending limit and trigger orders with cancel support.
- **Trade history** — Fills and realized PnL for the current room participant.
- **Order watcher** — Server-side checks for pending limits and triggers as prices move; **liquidation** logic uses live marks when positions cross liquidation price.

### Profile

- **`/dashboard/profile`** — Cross-room summary, per-room competition breakdown, trading-style insights, and a **share card** (export-friendly summary).
- **Profile settings** — Update username with validation and case-insensitive uniqueness checks.
- **`/user-profile`** — Clerk-managed account page for avatar and account-level profile details.

### Developer experience

- **Server Actions** for trading and room operations (place/cancel orders, close positions, triggers, pending-order checks, liquidation).
- **Zod** validation, **Jest** + Testing Library for unit and component tests.
- **TypeScript** throughout.

## Stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16, App Router |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix, Sonner |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | Neon serverless Postgres (`@neondatabase/serverless`) |
| Market catalog | Generated from Hyperliquid + Binance (`npm run markets:refresh`) |
| Live ticks | Binance futures WebSocket (client hook) |
| Server pricing helpers | `lib/pricing.ts`, `lib/hyperliquid.ts` |

## Prerequisites

- **Node.js** 20 or newer (22+ recommended for Next.js 16)
- **npm**
- A **Clerk** application
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
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard`

## Install and run

```bash
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000) (redirects to `/dashboard` when signed in).

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
2. Copy the publishable and secret keys into `.env.local`.
3. Sign-in and sign-up routes live under `app/sign-in/[[...sign-in]]` and `app/sign-up/[[...sign-up]]`.
4. Protected routes (`/dashboard`, `/room`, `/join`) use Clerk in **`proxy.ts`** (middleware matcher).

## Database

- **Base schema:** `neon/schema.sql` — apply first on a fresh database.
- **Migrations:** `neon/migrations/` — e.g. `002_expand_markets.sql` widens symbol/leverage constraints for the expanded Hyperliquid-aligned market set, and `003_users_username_case_insensitive_unique.sql` enforces case-insensitive username uniqueness.

Apply with your Neon workflow, `psql`, or any SQL client. Order matters: schema first, then migrations in filename order if you maintain history that way.

## Market list refresh

Regenerate `lib/markets.generated.ts` from Hyperliquid (default + xyz) and Binance USDT-M perpetuals:

```bash
npm run markets:refresh
```

Commit the updated generated file when you intentionally change the tradable universe. CI and deploys then stay deterministic without calling Hyperliquid at build time for every asset.

## Project layout (high level)

| Path | Role |
|------|------|
| `app/dashboard` | Room list, profile |
| `app/dashboard/profile` | Profile analytics, settings, and share card |
| `app/room/[room_id]` | Lobby, leaderboard |
| `app/room/[room_id]/trade` | Trading terminal (server-loaded positions, orders, trades) |
| `app/join/[room_id]` | Join a room |
| `app/user-profile/[[...user-profile]]` | Clerk user profile management route |
| `actions/*` | Server Actions for trading, rooms, profile helpers |
| `components/trading-terminal.tsx` | Chart, ticker, order entry, positions panel |
| `lib/markets.ts` / `lib/markets.generated.ts` | Tradable markets and metadata |
| `lib/perpetuals.ts` | Margin, liquidation price, sizing helpers |
| `hooks/useBinanceTicker.ts` | Client Binance `!ticker@arr` subscription |

## License

Private / `UNLICENSED` (see `package.json`).
