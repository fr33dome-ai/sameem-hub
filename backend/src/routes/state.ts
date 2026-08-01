/**
 * Workspace state sync — v1.8
 * =============================================================================
 * The v1.7 dashboard holds its entire state in one JSON object. These two
 * endpoints let it live in Postgres instead of browser localStorage, so the
 * same data appears on every device.
 *
 *   GET  /v1/state   → { state, version, updatedAt }  (204 if never saved)
 *   PUT  /v1/state   → { ok, version, updatedAt }
 *
 * Auth: a single shared secret in the `x-sameem-key` header, compared in
 * constant time. This is deliberately NOT full JWT auth — there is one user
 * today. Swap for the JWT middleware in Phase 2 when there are real tenants.
 */
import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../config/database';

const r = Router();

const WORKSPACE_KEY = process.env.WORKSPACE_KEY || 'default';

/** Constant-time compare that tolerates length mismatch without leaking it. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    // Still burn a comparison so timing doesn't reveal length.
    try { timingSafeEqual(ab, ab); } catch { /* noop */ }
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/** Gate every route below behind the shared secret. */
r.use((req, res, next) => {
  const expected = process.env.SYNC_SECRET;
  if (!expected) {
    return res.status(503).json({
      error: 'sync_not_configured',
      message: 'SYNC_SECRET is not set on the server.',
    });
  }
  const provided = req.header('x-sameem-key') || '';
  if (!safeEqual(provided, expected)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  return next();
});

/** Read the current workspace state. 204 when nothing has been saved yet. */
r.get('/', async (_req, res, next) => {
  try {
    const row = await prisma.workspaceState.findUnique({
      where: { key: WORKSPACE_KEY },
    });
    if (!row) return res.status(204).end();
    return res.json({
      state: row.state,
      version: row.version,
      updatedAt: row.updatedAt,
      lastDevice: row.lastDevice,
    });
  } catch (e) {
    return next(e);
  }
});

const PutSchema = z.object({
  state: z.record(z.any()),
  /** Version the client last saw. Used to detect a stale overwrite. */
  baseVersion: z.number().int().nonnegative().optional(),
  device: z.string().max(120).optional(),
});

/**
 * Write the workspace state.
 *
 * Conflict handling is last-write-wins, but when `baseVersion` is behind the
 * stored version we still write and set `staleWrite: true` in the response so
 * the client can warn the user that they may have clobbered another device.
 * With a single user this is rare; with a small team it is the honest tradeoff
 * against building real operational transforms.
 */
r.put('/', async (req, res, next) => {
  try {
    const { state, baseVersion, device } = PutSchema.parse(req.body);

    const existing = await prisma.workspaceState.findUnique({
      where: { key: WORKSPACE_KEY },
      select: { version: true },
    });

    const staleWrite =
      existing != null &&
      baseVersion != null &&
      baseVersion < existing.version;

    const nextVersion = (existing?.version ?? 0) + 1;

    const row = await prisma.workspaceState.upsert({
      where: { key: WORKSPACE_KEY },
      create: {
        key: WORKSPACE_KEY,
        state,
        version: nextVersion,
        lastDevice: device ?? null,
      },
      update: {
        state,
        version: nextVersion,
        lastDevice: device ?? null,
      },
    });

    return res.json({
      ok: true,
      version: row.version,
      updatedAt: row.updatedAt,
      staleWrite,
    });
  } catch (e) {
    return next(e);
  }
});

export default r;
