# Deploy Sameem Hub to Netlify

End-to-end walkthrough. ~30 minutes if you already have a GitHub account and a
database provider. Tested against Netlify Next.js Runtime v5 (Apr 2026).

---

## 0 — Prerequisites

| Tool / Account | Why |
| -------------- | --- |
| GitHub         | Netlify deploys from a Git repo |
| Netlify        | The hosting target (free tier works for staging) |
| Postgres host  | Netlify doesn't host databases. Pick one: |
|                | • **Neon** (`neon.tech`) — recommended, eu-central-1 closest to KSA |
|                | • **Supabase** — bundles Postgres + Auth |
|                | • **Railway** — managed Postgres |
|                | • **AWS RDS me-south-1** — for PDPL-strict workloads |
| Upstash (Redis)| Rate-limiting + sessions. Free tier ample for dev |
| S3-compatible  | For file uploads. AWS S3, Cloudflare R2, Backblaze B2 |

---

## 1 — Push to GitHub

```bash
cd "Sameem Hub - Production"
git init
git add .
git commit -m "Sameem Hub v1.7 — production-ready Netlify deployment"
git branch -M main
git remote add origin git@github.com:<you>/sameem-hub.git
git push -u origin main
```

> ⚠️ `.env*` is ignored by default (see `.gitignore`). Never push real secrets.

---

## 2 — Provision the database (Neon example)

1. Sign up at https://neon.tech
2. Create a project, name it `sameem-hub`, region **AWS eu-central-1** (closest
   to KSA). For strict PDPL data-residency, use AWS me-south-1 + Neon
   read-replica.
3. Copy the **pooled connection string** — it looks like
   `postgresql://USER:PASS@ep-xyz-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`
4. Save it; you'll paste this as `DATABASE_URL` in Netlify.

### Run migrations + seed against the new DB

```bash
export DATABASE_URL="postgresql://...neon.tech/...?sslmode=require"
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
```

(You can also do this from a Netlify build-hook one-off later.)

---

## 3 — Provision Redis (Upstash)

1. https://upstash.com → Create database → Region closest to KSA.
2. Copy the **`rediss://` URL** (note: `rediss`, with two `s` — TLS).
3. Save as `REDIS_URL`.

---

## 4 — Provision S3 object storage

Any S3-compatible service works. Cheapest: Cloudflare R2 (no egress fees).

1. Create a bucket `sameem-hub-uploads`.
2. Create an access key / secret pair scoped to that bucket only.
3. Note the `endpoint`, `region`, key, and secret.

---

## 5 — Import to Netlify

1. https://app.netlify.com → **Add new site → Import an existing project**
2. Pick your GitHub repo `sameem-hub`
3. Netlify reads `netlify.toml` and pre-fills:
   - **Base directory:** *(blank — root of repo)*
   - **Build command:** `npm run netlify:build`
   - **Publish directory:** `frontend/.next`
   - **Functions directory:** `netlify/functions`
4. Click **Show advanced → New variable** and paste every key from
   `.env.production.example` with real values:

   | Key | Value |
   | --- | ----- |
   | `DATABASE_URL` | (from step 2) |
   | `REDIS_URL` | (from step 3) |
   | `JWT_SECRET` | 64 random hex chars — `openssl rand -hex 32` |
   | `JWT_REFRESH_SECRET` | another 64 random hex chars |
   | `JWT_ACCESS_TTL` | `15m` |
   | `JWT_REFRESH_TTL` | `7d` |
   | `APP_URL` | `https://<your-site>.netlify.app` (update after first deploy if using a custom domain) |
   | `NEXT_PUBLIC_API_URL` | `/api` |
   | `S3_REGION` | e.g. `auto` for R2, or `me-south-1` for AWS |
   | `S3_BUCKET` | `sameem-hub-uploads` |
   | `S3_ACCESS_KEY_ID` | from step 4 |
   | `S3_SECRET_ACCESS_KEY` | from step 4 |
   | `S3_ENDPOINT` | from step 4 (omit for AWS native) |
   | `SENTRY_DSN` | optional |
   | `PDPL_DATA_RESIDENCY` | `me-south-1` |
   | `NODE_VERSION` | `20` *(already in netlify.toml, but env override wins)* |

5. Click **Deploy site**.

First build takes 3–5 minutes (cold install of frontend + backend).

---

## 6 — Verify the deploy

After build succeeds, visit your Netlify URL:

| URL | Expected |
| --- | -------- |
| `https://<site>.netlify.app/`                | Next.js — redirects to `/login` |
| `https://<site>.netlify.app/classic`         | The v1.7 single-file dashboard loads |
| `https://<site>.netlify.app/api/v1/health`   | `{"status":"ok","db":"ok",...}` |
| `https://<site>.netlify.app/api/v1/health/live` | `{"status":"ok"}` |

If `/api/v1/health` reports `db: "down"`:
- check the **Functions** tab in Netlify → click `api` → view logs
- usual culprit is a `DATABASE_URL` typo or missing `?sslmode=require`

---

## 7 — Custom domain (optional)

1. Netlify → Site settings → **Domain management → Add custom domain**
2. Add `app.sameemhub.sa` (or whatever you registered)
3. Netlify provisions a free Let's Encrypt cert (no action required)
4. Update env vars: `APP_URL=https://app.sameemhub.sa,https://<site>.netlify.app`
5. Redeploy

---

## 8 — Saudi compliance checklist

Before going live with real customer data:

- [ ] Database region is `me-south-1` OR you have a documented cross-border
      transfer basis under PDPL Article 29
- [ ] ZATCA cert uploaded + tested against the sandbox (`gw-fatoora-sb.zatca.gov.sa`)
      before flipping `ZATCA_API_BASE` to production
- [ ] All admin accounts have 2FA enabled at the Netlify org level
- [ ] Sentry DSN configured so error logs don't leak PII into Netlify build logs
- [ ] Backup schedule confirmed at your Postgres provider (Neon: PITR, default
      7 days on free tier)
- [ ] Run a tabletop incident review with the team — NCA-ECC §2-9

---

## 9 — Day-2 operations

| Task                          | How |
| ----------------------------- | --- |
| **Deploy a new version**      | `git push` to main — Netlify auto-rebuilds |
| **Run a one-off migration**   | Netlify → **Functions** → trigger a build hook, or use the Netlify CLI |
| **Roll back**                 | Netlify → **Deploys** → "Publish this deploy" on a known-good build |
| **View API logs**             | Netlify → **Functions → api → Recent invocations** |
| **Edit env vars**             | Site settings → Environment variables → **Save** triggers no rebuild; need to redeploy |
| **Local debug a function**    | `npx netlify dev` runs the function locally on :8888 |

---

## Troubleshooting

**Build fails with "Cannot find module '@prisma/client'"**
→ Prisma generate must run during build. Make sure `backend/package.json` has
`"postinstall": "prisma generate"` (or the `npm run netlify:build` script
includes `prisma generate` before `tsc`).

**Function cold starts are slow (~3s)**
→ Normal for the first request after idle. Netlify functions warm up after a
few requests. For sub-second cold starts, move hot endpoints to Edge Functions
(future enhancement — see `docs/EDGE_FUNCTIONS.md`).

**`/classic` shows a blank page**
→ Hard refresh (Ctrl/Cmd-Shift-R). The file is cached for 24h by the
`Cache-Control` header in `netlify.toml`.

**CORS errors from the frontend**
→ Check `APP_URL` env var is set to the *exact* origin of your frontend,
including https://. The backend reads `APP_URL.split(',')` as the CORS
allow-list.
