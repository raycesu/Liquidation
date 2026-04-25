# Liquidation

Paper-trading competition platform for crypto perpetual futures built with Next.js, Clerk, and Neon.

## Prerequisites

- Node.js 20+
- npm
- A Clerk application
- A Neon database

## Environment variables

Copy `.env.example` into `.env.local` and provide real values.

```bash
cp .env.example .env.local
```

Required variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard`

## Install dependencies

```bash
npm install
```

## Run locally

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Authentication setup (Clerk)

1. Create a Clerk app in the [Clerk Dashboard](https://dashboard.clerk.com/)
2. Copy your publishable and secret keys into `.env.local`
3. Keep `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` for hosted auth pages
4. Route protection is handled in `proxy.ts` (currently protects `/dashboard`, `/room`, and `/join`)

## Database schema

The database schema lives in `neon/schema.sql`.

Apply it with your preferred Neon workflow or SQL client before running features that depend on persisted data.

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run test` - run Jest tests
- `npm run test:watch` - run Jest in watch mode
