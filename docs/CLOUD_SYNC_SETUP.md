# Cloud Sync Setup — your 5 minutes

Everything on the code side is done and deployed. This is the only part that
needs you, because it involves creating an account.

**What you get when this is finished:** your dashboard data lives in a real
database instead of browser memory. Open it on your phone, laptop, or office PC
and see the same numbers. Automatic backups. No more "one browser-clear away
from losing everything."

---

## Before you start — 30-second backup

Open the dashboard and export your current data (Settings → Export Full State,
or the Save As HTML button). Put the file somewhere safe.

You almost certainly won't need it. Do it anyway.

---

## Step 1 — Create the database (3 min)

1. Go to **https://neon.tech** and sign up (GitHub login is fastest, no card).
2. Create a project:
   - **Name:** `sameem-hub`
   - **Region:** *AWS Europe (Frankfurt)* — closest option to Riyadh with low latency
   - Postgres version: leave default
3. On the dashboard that appears, find the **Connection string** box.
4. Make sure the toggle says **Pooled connection** (the host will contain `-pooler`).
5. Copy the whole string. It looks like:

```
postgresql://neondb_owner:AbC123xyz@ep-cool-name-123456-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

---

## Step 2 — Give it to Netlify (1 min)

1. Open **https://app.netlify.com/projects/sameem-hub/configuration/env**
2. Click **Add a variable** → **Add a single variable**
3. Key: `DATABASE_URL`
4. Value: paste the connection string from step 1
5. Scopes: leave all checked
6. **Save**

Then trigger a fresh deploy so the function picks it up:
**Deploys → Trigger deploy → Deploy site**

---

## Step 3 — Create the table (1 min)

The database is empty until we create the table. Easiest way — Neon's built-in
SQL editor:

1. In Neon, click **SQL Editor** in the left sidebar
2. Paste this and press Run:

```sql
CREATE TABLE IF NOT EXISTS workspace_state (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key          TEXT UNIQUE NOT NULL DEFAULT 'default',
  state        JSONB NOT NULL,
  version      INTEGER NOT NULL DEFAULT 1,
  last_device  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

You should see "Success". That's the whole schema — one table.

---

## Step 4 — Connect the dashboard (1 min)

1. Open **https://sameem-hub.netlify.app/classic**
2. Hard refresh: **Ctrl + Shift + R** (important — loads the new code)
3. Go to **Settings** → click **Cloud Sync**
4. Fill in:
   - **API base:** `https://sameem-hub.netlify.app/api` (should be pre-filled)
   - **Sync key:** the `SYNC_SECRET` value (sent to you separately — it is
     deliberately not written in this file, because this repo is public)
5. Click **Save settings**
6. Click **Test connection**

You want to see: *"Connected. Cloud is empty — press Push to upload."*

7. Click **Push this device up**

Done. Your data is now in the cloud.

---

## Step 5 — Prove it works (1 min)

The test that actually matters:

1. Open the same URL in a **different browser** (Edge, or Chrome incognito)
2. Settings → Cloud Sync → enter the same API base + key → **Save settings**
3. Click **Pull from cloud**
4. Your numbers appear

That's device sync working. From now on, pressing **Save** on any device pushes
to the cloud, and any other device picks it up on next load.

---

## How it behaves day to day

| Action | What happens |
| --- | --- |
| Press **Save** (or Ctrl+S) | Writes to this browser **and** the cloud |
| Open on another device | Offers to load the newer cloud copy |
| No internet | Keeps working on the local copy; syncs next time you save |
| Two devices edit at once | Last save wins, and you get a warning that it happened |

That last row is the honest limitation. With one person it will basically never
bite you. If two people start editing simultaneously, tell me and I'll add
proper per-field merging — but building that now would be solving a problem you
don't have yet.

---

## If something goes wrong

**"Wrong sync key"** — the key in the dashboard doesn't match `SYNC_SECRET` in
Netlify. Re-copy it, watch for a trailing space.

**"Server has no database configured yet"** — `DATABASE_URL` isn't set, or you
haven't redeployed since setting it. Redeploy.

**"Network error — working offline"** — the API isn't responding. Check
https://sameem-hub.netlify.app/api/v1/health — it should return JSON.

**Function errors** — Netlify → Functions → `api` → Recent invocations shows the
actual error message.

**Anything else** — your data is still safe in the browser and in the export you
made at the top of this doc. Cloud sync failing never destroys the local copy.
