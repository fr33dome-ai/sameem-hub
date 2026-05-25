# Sameem Hub — Production Monorepo

**Stack:** Next.js 14 (App Router) + Express/Prisma API as Netlify Functions + PostgreSQL + S3-compatible object storage + Redis (rate-limit / sessions).

**Status:** Production-deployment-ready for **Netlify** (one-click import).
**Includes:** the frozen **v1.7 single-file dashboard** at `/classic` for a zero-regression migration path.

---

## What's inside

```
Sameem Hub - Production/
├─ frontend/                  Next.js 14 — App Router, Tailwind, React-Query, Zustand
│  ├─ src/app/                pages + layouts
│  ├─ src/components/         shared components
│  ├─ src/types/              shared TypeScript types
│  └─ public/
│     └─ classic.html         ← v1.7 frozen dashboard (656 KB, served at /classic)
│
├─ backend/                   Express 4 — extracted into a factory in src/app.ts
│  ├─ src/app.ts              createApp() — shared between bare-node + serverless
│  ├─ src/index.ts            local dev / docker entry (app.listen)
│  ├─ src/routes/             14 route modules (auth, kpis, budget, pnl, …)
│  ├─ src/services/           business logic (auth, budget, pnl, simulator)
│  ├─ src/middleware/         JWT, rate-limit, error handler
│  └─ prisma/                 schema + seed
│
├─ netlify/
│  └─ functions/
│     └─ api.ts               serverless-http wrapper → re-uses backend/src/app
│
├─ netlify.toml               build, redirects, headers, function bundling
├─ package.json               root workspace orchestrator (npm workspaces)
├─ .env.production.example    full env-var template (DATABASE_URL, JWT_SECRET, …)
└─ docs/
   └─ DEPLOY_NETLIFY.md       step-by-step deployment walkthrough
```

---

## Local development

```bash
npm run install:all           # installs root + frontend + backend
npm run dev:backend           # API on :4000
npm run dev:frontend          # Next.js on :3000  (proxies /api → backend)
```

Or, to test the full Netlify deploy locally:

```bash
npx netlify dev               # serves :8888, runs functions + Next.js together
```

---

## Deploy to Netlify

See **[`docs/DEPLOY_NETLIFY.md`](docs/DEPLOY_NETLIFY.md)** for the full walkthrough.

TL;DR:

1. Push this folder to a GitHub repo
2. Netlify → "Import from Git" → select the repo
3. Build settings auto-detect from `netlify.toml` — confirm and continue
4. Set environment variables from `.env.production.example`
5. Provision the database (Neon recommended for ME-region latency)
6. Click **Deploy** → in ~3 min you have a live site

---

## URL map after deploy

| Path                       | Serves                                                |
| -------------------------- | ----------------------------------------------------- |
| `/`                        | Next.js root — redirects to `/login` or `/overview`   |
| `/login` `/overview` `…`   | Next.js App Router pages                              |
| `/classic`                 | v1.7 single-file dashboard (localStorage-backed)      |
| `/api/v1/*`                | Express API via Netlify Function                      |
| `/.netlify/functions/api/*`| Direct function URL (kept available for debugging)    |

The `/classic` route is the **frozen Phase 1 dashboard** — a safety net for
existing users while the multi-tenant SaaS rolls out. It uses only
localStorage; no backend dependency.

---

## Saudi-first compliance

This deployment template is configured for KSA compliance:

- **PDPL (Personal Data Protection Law)** — `PDPL_DATA_RESIDENCY=me-south-1`.
  Choose a database region in or near KSA (Neon eu-central-1, or AWS me-south-1
  Postgres). Add a KSA read-replica if PDPL Article 29 cross-border rules apply
  to your data class.
- **ZATCA e-invoicing** — env vars wired (`ZATCA_API_BASE`, `ZATCA_CERT_PATH`,
  `ZATCA_VAT_NUMBER`). VAT rate is 15% (Saudi standard).
- **NCA-ECC** — Helmet + HSTS + strict CORS + JWT rotation already on by default.
- **MISA / SASO** — Product Registry env var stub provided.

See `backend/README.md` for module-level details.

---

## Version

- **v1.7** — Sameem Hub OS, 24 modules, Planning + Value Chain + Agenda + Gantt
  + DOCX export + Bulk Edit/Delete + Sellers ratings count.
- **Phase 1 (frozen)** — single-file HTML, served at `/classic`.
- **Phase 2 (active)** — multi-tenant SaaS in this monorepo.
