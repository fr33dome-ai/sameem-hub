/**
 * Netlify serverless wrapper for the Sameem Hub Express API. (v1.8)
 *
 * Re-uses the Express app from /backend so routes, middleware and the Prisma
 * client are identical to a bare-node deployment.
 *
 * PATH HANDLING — the reason this isn't just `serverless(app)`:
 * Netlify's rewrite (`/api/*` -> `/.netlify/functions/api/:splat`, status 200)
 * is a rewrite, not a redirect, so the function receives the ORIGINAL url —
 * `/api/v1/health`. Express mounts its routes at `/v1/...`, so without
 * stripping the prefix every request 404s. Both prefixes are handled here:
 *
 *   /api/v1/health                        -> /v1/health   (normal path)
 *   /.netlify/functions/api/v1/health     -> /v1/health   (direct, for debugging)
 *
 * Keeping this in the function file means backend/src/app.ts stays free of
 * deployment-specific details and still runs unchanged under plain Node.
 */
import serverless from 'serverless-http';
import { createApp } from '../../backend/src/app';

const app = createApp();

const PREFIXES = [/^\/\.netlify\/functions\/api/, /^\/api/];

function stripPrefix(url: string): string {
  for (const re of PREFIXES) {
    if (re.test(url)) {
      const stripped = url.replace(re, '');
      return stripped === '' || stripped.startsWith('?') ? '/' + stripped : stripped;
    }
  }
  return url;
}

const wrapped = serverless(app, {
  request(req: { url?: string; path?: string }) {
    if (typeof req.url === 'string') req.url = stripPrefix(req.url);
    if (typeof req.path === 'string') req.path = stripPrefix(req.path);
  },
});

export const handler = wrapped;
