-- =============================================================================
-- Sameem Hub — auth tables (v1.9)
-- =============================================================================
-- Run this ONCE in Neon → SQL Editor.
--
-- Why by hand: `prisma migrate` needs a direct (non-pooled) connection and a
-- migrations history table. For four tables it is simpler and safer to create
-- them explicitly. These definitions match backend/prisma/schema.prisma exactly
-- (snake_case column names come from the @map directives).
--
-- Safe to re-run: every statement uses IF NOT EXISTS.
-- =============================================================================

-- Needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------- tenants ---
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
);

-- ------------------------------------------------------------------ users ---
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
);

CREATE INDEX IF NOT EXISTS users_tenant_role_idx ON users (tenant_id, role);

-- ------------------------------------------------------- user_preferences ---
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language          TEXT NOT NULL DEFAULT 'en',
  theme             TEXT NOT NULL DEFAULT 'dark',
  pinned_kpis       TEXT[] NOT NULL DEFAULT '{}',
  dismissed_alerts  TEXT[] NOT NULL DEFAULT '{}',
  column_widths     JSONB NOT NULL DEFAULT '{}',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------- user_module_visibility --
CREATE TABLE IF NOT EXISTS user_module_visibility (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id  TEXT NOT NULL,
  is_hidden  BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, module_id)
);

-- =============================================================================
-- Verify
-- =============================================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
