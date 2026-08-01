/**
 * Workspace state sync — v1.9
 * =============================================================================
 * The dashboard holds its entire state in one JSON object. These endpoints keep
 * it in Postgres so the same data appears on every device.
 *
 *   GET  /v1/state   -> { state, version, updatedAt }  (204 if never saved)
 *   PUT  /v1/state   -> { ok, version, updatedAt }
 *
 * AUTH — this is the real security boundary.
 * A login screen inside a static HTML file can be bypassed with devtools. What
 * actually protects the company's numbers is that the *data* requires a valid,
 * signed, per-user token. So:
 *
 *   1. Bearer JWT  (preferred)  — a real account, identified and role-checked.
 *   2. x-sameem-key (legacy)    — the original shared secret, kept only so the
 *                                 pre-auth dashboard keeps working during the
 *                                 migration. Delete the SYNC_SECRET env var to
 *                                 turn it off; everything else keeps working.
 *
 * Viewers can read but not write, which is enforced here rather than by hiding
 * a button in the UI.
 */
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';

const r = Router();

const WORKSPACE_KEY = process.env.WORKSPACE_KEY || 'default';

type Caller =
  | { kind: 'user'; userId: string; tenantId: string; role: string; label: string }
  | { kind: 'legacy'; label: string };

declare module 'express-serve-static-core' {
  interface Request { caller?: Caller; }
}

/** Constant-time compare that doesn't leak length through timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    try { timingSafeEqual(ab, ab); } catch { /* burn a comparison */ }
    return false;
  }
  return timingSafeEqual(ab, bb);
}

function authenticate(req: Request, res: Response, next: NextFunction) {
  // 1. Preferred: a real user session.
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as {
        userId: string; tenantId: string; role: string;
      };
      req.caller = {
        kind: 'user',
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
        label: `user:${payload.userId}`,
      };
      return next();
    } catch {
      return res.status(401).json({ error: 'invalid_token' });
    }
  }

  // 2. Legacy shared secret — only if SYNC_SECRET is still configured.
  const expected = process.env.SYNC_SECRET;
  const provided = req.header('x-sameem-key');
  if (expected && provided) {
    if (safeEqual(provided, expected)) {
      req.caller = { kind: 'legacy', label: 'legacy-shared-key' };
      return next();
    }
    return res.status(401).json({ error: 'unauthorized' });
  }

  return res.status(401).json({
    error: 'unauthorized',
    message: 'Sign in to access workspace data.',
  });
}

r.use(authenticate);

/* --------------------------------- read ---------------------------------- */
r.get('/', async (_req, res, next) => {
  try {
    const row = await prisma.workspaceState.findUnique({ where: { key: WORKSPACE_KEY } });
    if (!row) return res.status(204).end();
    return res.json({
      state: row.state,
      version: row.version,
      updatedAt: row.updatedAt,
      lastDevice: row.lastDevice,
    });
  } catch (e) { return next(e); }
});

/* --------------------------------- write --------------------------------- */
const PutSchema = z.object({
  state: z.record(z.any()),
  baseVersion: z.number().int().nonnegative().optional(),
  device: z.string().max(120).optional(),
});

r.put('/', async (req, res, next) => {
  try {
    // Read-only roles are blocked here, not just in the UI.
    if (req.caller?.kind === 'user' && req.caller.role === 'viewer') {
      return res.status(403).json({
        error: 'read_only',
        message: 'Your account has view-only access.',
      });
    }

    const { state, baseVersion, device } = PutSchema.parse(req.body);

    const existing = await prisma.workspaceState.findUnique({
      where: { key: WORKSPACE_KEY },
      select: { version: true },
    });

    const staleWrite =
      existing != null && baseVersion != null && baseVersion < existing.version;

    const nextVersion = (existing?.version ?? 0) + 1;
    const label = device ? `${device} (${req.caller?.label})` : req.caller?.label ?? null;

    const row = await prisma.workspaceState.upsert({
      where: { key: WORKSPACE_KEY },
      create: { key: WORKSPACE_KEY, state, version: nextVersion, lastDevice: label },
      update: { state, version: nextVersion, lastDevice: label },
    });

    return res.json({
      ok: true,
      version: row.version,
      updatedAt: row.updatedAt,
      staleWrite,
    });
  } catch (e) { return next(e); }
});

export default r;
