# Sameem Hub Frontend

Next.js 14 + TypeScript + Tailwind. App Router. Bilingual EN/AR with full RTL.

## Quick start

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

Open http://localhost:3000.

## Structure

See `docs/engineering/CODE_STRUCTURE.md` at the repo root.

## Key conventions

- Server components by default — `'use client'` only when needed
- Tanstack Query for server state; Zustand for ephemeral UI state
- Tailwind utility classes; design tokens in `app/globals.css` (CSS variables)
- All money rendered via `formatMoney()` helper, never raw template strings
- All user-facing strings in `lib/i18n/{en,ar}.json` — keys only in components
- Forms use React Hook Form + Zod resolvers

## Scripts

- `pnpm dev` — local dev with hot reload
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — ESLint
- `pnpm typecheck` — tsc --noEmit
- `pnpm test` — Vitest unit tests
- `pnpm test:e2e` — Playwright E2E

## Building a new module page

1. Create folder `src/modules/<name>/` with module-specific components.
2. Create page `src/app/(app)/<name>/page.tsx` as a server component that fetches initial data.
3. Inside, use client components for editable widgets.
4. Add navigation entry in `Sidebar.tsx`.
5. Add i18n keys in `lib/i18n/en.json` and `ar.json`.
6. Add types in `src/types/<name>.ts`.
7. Add API client in `src/lib/api/<name>.ts`.

Reference: `src/modules/pnl/` (most complex example).
