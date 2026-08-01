/**
 * Netlify serverless wrapper for the Sameem Hub Express API. (v1.8 — live)
 *
 * Re-uses the Express app from /backend so routes, middleware and the Prisma
 * client are identical to a bare-node deployment.
 *
 * Reached at:  /.netlify/functions/api/v1/...
 * Or via the netlify.toml redirect:  /api/v1/...
 */
import serverless from 'serverless-http';
import { createApp } from '../../backend/src/app';

const app = createApp();

export const handler = serverless(app, {
  basePath: '/.netlify/functions/api',
});
