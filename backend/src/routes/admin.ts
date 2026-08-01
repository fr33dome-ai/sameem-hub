/**
 * Admin / schema bootstrap.
 *
 * WHY THIS EXISTS
 * `prisma migrate deploy` needs a direct (non-pooled) connection and a shell,
 * neither of which a Netlify Function has. The alternative — pasting DDL into
 * a web SQL console — proved fragile: a partially-replaced editor buffer left
 * stray text, the batch failed as one transaction, and everything rolled back
 * silently while appearing to succeed.
 *
 * So the app creates its own tables. Every statement is idempotent
 * (`IF NOT EXISTS`), so running this twice is a no-op, and it can never drop
 * or alter existing data.
 *
 * Guarded by SYNC_SECRET rather than a JWT, because at the moment this runs
 * there are no users yet to authenticate as.
 */
import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { prisma } from '../config/database';

const r = Router();

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    try { timingSafeEqual(ab, ab); } catch { /* burn a comparison */ }
    return false;
  }
  return timingSafeEqual(ab, bb);
}

r.use((req, res, next) => {
  const expected = process.env.SYNC_SECRET;
  if (!expected) return res.status(503).json({ error: 'not_configured' });
  const provided = req.header('x-sameem-key') || '';
  if (!safeEqual(provided, expected)) return res.status(401).json({ error: 'unauthorized' });
  return next();
});

/** Each statement runs separately so one failure cannot roll back the rest. */
const STATEMENTS: Array<[string, string]> = [
  ['pgcrypto extension', `CREATE EXTENSION IF NOT EXISTS pgcrypto`],

  ['tenants', `
    CREATE TABLE IF NOT EXISTS tenants (
      id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name              TEXT NOT NULL,
      slug              TEXT NOT NULL UNIQUE,
      default_currency  TEXT NOT NULL DEFAULT 'SAR',
      default_language  TEXT NOT NULL DEFAULT 'en',
      default_theme     TEXT NOT NULL DEFAULT 'dark',
      timezone          TEXT NOT NULL DEFAULT 'Asia/Riyadh',
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at        TIMESTAMPTZ
    )`],

  ['users', `
    CREATE TABLE IF NOT EXISTS users (
      id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      tenant_id         TEXT NOT NULL REFERENCES tenants(id),
      email             TEXT NOT NULL,
      display_name      TEXT NOT NULL,
      password_hash     TEXT NOT NULL,
      recovery_email    TEXT,
      password_hint     TEXT,
      role              TEXT NOT NULL DEFAULT 'viewer',
      is_primary_admin  BOOLEAN NOT NULL DEFAULT false,
      last_active_at    TIMESTAMPTZ,
      mfa_enabled       BOOLEAN NOT NULL DEFAULT false,
      mfa_secret        TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at        TIMESTAMPTZ,
      CONSTRAINT users_tenant_email_key UNIQUE (tenant_id, email)
    )`],

  ['users index', `CREATE INDEX IF NOT EXISTS users_tenant_role_idx ON users (tenant_id, role)`],

  ['user_preferences', `
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      language          TEXT NOT NULL DEFAULT 'en',
      theme             TEXT NOT NULL DEFAULT 'dark',
      pinned_kpis       TEXT[] NOT NULL DEFAULT '{}',
      dismissed_alerts  TEXT[] NOT NULL DEFAULT '{}',
      column_widths     JSONB NOT NULL DEFAULT '{}',
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    )`],

  ['user_module_visibility', `
    CREATE TABLE IF NOT EXISTS user_module_visibility (
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      module_id  TEXT NOT NULL,
      is_hidden  BOOLEAN NOT NULL DEFAULT false,
      PRIMARY KEY (user_id, module_id)
    )`],

  ['workspace_state', `
    CREATE TABLE IF NOT EXISTS workspace_state (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      key          TEXT UNIQUE NOT NULL DEFAULT 'default',
      state        JSONB NOT NULL,
      version      INTEGER NOT NULL DEFAULT 1,
      last_device  TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )`],
];

r.post('/init-schema', async (_req, res, next) => {
  const applied: string[] = [];
  const failed: Array<{ step: string; error: string }> = [];

  for (const [label, sql] of STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(sql);
      applied.push(label);
    } catch (e) {
      failed.push({ step: label, error: e instanceof Error ? e.message : String(e) });
    }
  }

  try {
    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`
    );
    return res.json({
      ok: failed.length === 0,
      applied,
      failed,
      tables: tables.map(t => t.table_name),
    });
  } catch (e) { return next(e); }
});

/** Read-only check — which tables actually exist right now. */
r.get('/schema-status', async (_req, res, next) => {
  try {
    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`
    );
    const names = tables.map(t => t.table_name);
    const required = ['tenants', 'users', 'user_preferences', 'user_module_visibility', 'workspace_state'];
    return res.json({
      tables: names,
      missing: required.filter(t => !names.includes(t)),
      ready: required.every(t => names.includes(t)),
    });
  } catch (e) { return next(e); }
});

export default r;
