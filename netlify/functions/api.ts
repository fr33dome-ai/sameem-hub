/**
 * Netlify serverless wrapper for the Sameem Hub Express API.
 * Re-uses the existing Express app from /backend so routes, middleware,
 * auth and Prisma client are identical to the bare-node deployment.
 *
 * Reached at:  https://<site>.netlify.app/.netlify/functions/api/v1/...
 * Or, via the redirect rule in netlify.toml:
 *              https://<site>.netlify.app/api/v1/...
 */
import serverless from 'serverless-http';
import { createApp } from '../../backend/src/app';

const app = createApp();

// Strip the /.netlify/functions/api prefix so Express sees /v1/... routes
export const handler = serverless(app, {
  basePath: '/.netlify/functions/api'
});
