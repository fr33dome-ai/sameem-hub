/**
 * Sameem Hub API — Netlify Function placeholder (v1.7.1)
 *
 * The real Express + Prisma API lives in /backend and will be wired up
 * here once DATABASE_URL is provisioned (see docs/DEPLOY_NETLIFY.md).
 *
 * This stub keeps the route reachable so the frontend can detect
 * "API not yet provisioned" instead of a 404.
 */
import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => ({
  statusCode: 503,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'not_provisioned',
    message: 'Sameem Hub API is not yet provisioned. Set DATABASE_URL and re-deploy.',
    timestamp: new Date().toISOString()
  })
});
