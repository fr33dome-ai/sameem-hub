# Sameem Hub — What We Just Built (in plain language)

**Date:** 2026-05-25
**Status:** LIVE on the internet 🌍

---

## 1. The 30-second story

You used to have **one file on your computer** (`sameem-hub.html`) that you
double-clicked to open in Chrome. Today we put that file on the internet
so anyone, anywhere, can open it just by typing a web address.

The dashboard itself didn't change. What changed is **where it lives** and
**who can reach it**.

> **Live now:** https://sameem-hub.netlify.app

---

## 2. Before vs. After (the simple comparison)

|                        | The HTML file (before)                                  | The Live Website (now)                                   |
| ---------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| **Where it lives**     | On your laptop, in OneDrive                             | On Netlify's servers (cloud)                             |
| **How to open it**     | Double-click the file                                   | Type the URL in any browser                              |
| **Who can use it**     | Only you (or anyone you email the file to)              | Anyone in the world with the link                        |
| **Data storage**       | Browser's local memory — different on every device      | Same Browser memory for now (will move to database soon) |
| **Updates**            | You manually edit and save the file                     | Push to GitHub → Netlify auto-rebuilds in 3 minutes      |
| **Login system**       | None (everyone is "admin")                              | Coming next — no logins yet                              |
| **Backup**             | Whatever OneDrive does                                  | GitHub keeps every version forever                       |
| **Custom domain**      | Not possible                                            | Possible (e.g. app.sameemhub.sa)                         |
| **Security**           | None (it's just a file)                                 | HTTPS, security headers, popup-blocked frames            |

---

## 3. What's actually under the hood now

Think of it like a **house with three rooms**:

```
                  https://sameem-hub.netlify.app
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
        Front Door         Classic         (Future: API)
         "  / "          "/classic"          "/api/*"
            │                 │                 │
    Modern landing       The v1.7         Returns 503 for
    page with two       dashboard you      now — will serve
    buttons              already know       data when DB added
```

1. **Front Door (`/`)** — A simple welcome page with two buttons:
   "Open v1.7 Dashboard" and "View source on GitHub".
   It tells visitors what Sameem Hub is.

2. **Classic Dashboard (`/classic`)** — This is the **same exact `sameem-hub.html` file** you've been using.
   All 24 modules, bilingual EN/AR, RTL support, Monte Carlo, Planning, Agenda — everything works identically.
   It's served from Netlify's global CDN, so it loads fast worldwide.

3. **API endpoint (`/api/*`)** — Reserved for the real backend.
   Right now it just returns "not provisioned yet". Once we add a database,
   this is where user logins, real-time data, and multi-tenant features live.

---

## 4. What the two folders are for

```
C:\Users\Yoloa\OneDrive\Dokument\Claude\Projects\Sameem Hub\
│
├─ sameem-hub.html              ← Your working file. Keep editing this.
│                                 (When you save, copy it to Production
│                                  too if you want the live site to update)
│
├─ Sameem Hub - Phase 1\        ← Old backup folder. Historical only.
│
├─ Sameem Hub - Phase 2\        ← Old planning folder. Historical only.
│
└─ Sameem Hub - Production\     ← ★ The repository that ships to Netlify.
    ├─ frontend\public\
    │   └─ classic.html         ← Copy of sameem-hub.html (auto-served at /classic)
    ├─ frontend\src\app\
    │   └─ page.tsx             ← The landing page code
    ├─ backend\                 ← Real API code (waiting for database)
    ├─ netlify\functions\       ← Where the API will live as serverless functions
    ├─ netlify.toml             ← Tells Netlify how to build everything
    └─ package.json             ← Lists all the dependencies
```

**Rule of thumb:** for now, keep editing `sameem-hub.html`. When you want the
internet version to reflect your latest changes, copy that file to
`Sameem Hub - Production\frontend\public\classic.html`, then commit and push
to GitHub. Netlify takes it from there.

---

## 5. How auto-deploy works (the magic part)

```
   You edit code on your laptop
              │
              ▼
   You run: git commit + git push
              │
              ▼
   GitHub receives the new code
              │
              ▼
   GitHub pings Netlify: "new code!"
              │
              ▼
   Netlify pulls the code, runs the build
              │
              ▼
   In ~3 minutes: your live site is updated
```

You never touch a server. You never SSH. You never upload files. **You just push to GitHub.**

---

## 6. What works right now ✅

- The landing page at `/` loads instantly.
- The full v1.7 dashboard at `/classic` works exactly as before — 24 modules,
  Monte Carlo, Planning, Agenda Board, multi-workflow, bulk edit, etc.
- Every change you push to GitHub triggers a new deploy automatically.
- HTTPS is on by default (free SSL certificate from Netlify).
- Security headers are set (PDPL/NCA-ECC friendly).
- Two commits already pushed; next commit goes live in 3 minutes.

## 7. What's missing right now ❌

These were intentionally **deferred** to ship the first version fast:

- **No database yet** — the dashboard still uses browser localStorage.
  Each device has its own data.
- **No user logins yet** — anyone with the URL sees the same dashboard.
- **No real backend API** — `/api/*` returns "not provisioned" placeholder.
- **No Tailwind / fancy fonts on the landing** — used inline styles for speed.
  This was a tactical choice to avoid build errors on first deploy.
- **Repo is public** — anyone can read the code. (Saudi-Free plan limitation.
  Can switch to private once you upgrade Netlify or add yourself as a
  recognized contributor.)

---

## 8. The plan from here (in order)

### Step 1 — Add a real database (this week)
- Sign up for **Neon** (https://neon.tech) — free Postgres hosting.
- Pick the region closest to KSA (Frankfurt or Bahrain).
- Paste the connection string into Netlify's env vars as `DATABASE_URL`.
- Re-enable the Express API in `netlify/functions/api.ts`.

### Step 2 — User accounts
- The backend code already has `signup`, `login`, `refresh`, `logout` routes.
- Once the DB is connected, users can register and log in.
- Each user gets their own private workspace (multi-tenant).

### Step 3 — Migrate dashboard data to the database
- Today: each browser stores its own copy of vendors, sellers, etc.
- Future: the dashboard pulls from the API. Same dashboard on every device.

### Step 4 — Saudi compliance
- ZATCA e-invoicing integration (sandbox first, then production).
- PDPL data residency in `me-south-1` region.
- NCA-ECC controls: 2FA, audit logs, encryption-at-rest.
- SASO product registry hookup.

### Step 5 — Custom domain
- Buy `sameemhub.sa` or use any domain you already own.
- Point it at Netlify. Free SSL renews automatically.
- URL becomes `https://app.sameemhub.sa` instead of `*.netlify.app`.

### Step 6 — Production polish
- Bring back Tailwind + Tajawal Arabic font on the landing page.
- Convert the 24 frozen modules to React components one by one.
- Or keep `/classic` as the legacy stable version while building the new SaaS in parallel.

---

## 9. Things you can do today

1. **Visit your live site** — https://sameem-hub.netlify.app
2. **Open `/classic`** and use it normally — it's the same dashboard you've always had, now reachable from anywhere.
3. **Edit anything in the repo** (via GitHub web UI or PowerShell) and push — Netlify rebuilds automatically.
4. **Bookmark the Netlify dashboard** — https://app.netlify.com/projects/sameem-hub — for build logs, env vars, and deploy history.
5. **Share the URL** with anyone who needs to see it.

---

## 10. Useful links to bookmark

| What                          | URL                                                       |
| ----------------------------- | --------------------------------------------------------- |
| Live site                     | https://sameem-hub.netlify.app                            |
| Live v1.7 dashboard           | https://sameem-hub.netlify.app/classic                    |
| GitHub source code            | https://github.com/abdullahrajeh21-cloud/sameem-hub       |
| Netlify project (build logs)  | https://app.netlify.com/projects/sameem-hub               |
| Netlify env vars              | https://app.netlify.com/projects/sameem-hub/configuration/env |
| Deploy walkthrough            | `Sameem Hub - Production/docs/DEPLOY_NETLIFY.md`          |

---

## 11. If something breaks

1. **Site shows old content?** Hard refresh (Ctrl+Shift+R).
2. **Deploy fails?** Open Netlify → Deploys → click the failed one → read the log.
3. **Need to roll back?** Netlify → Deploys → find a green ("Published") deploy → "Publish this deploy" button.
4. **Want to make repo private again?** GitHub → Settings → Danger zone → Change visibility → Private. *(But re-link your Git contributor on Netlify first or Free-plan builds will fail again.)*

---

*Designed and built by Abdullah Aldossari · v1.7 frozen on 2026-05-23 · Deployed 2026-05-25.*
