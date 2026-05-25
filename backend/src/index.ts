/**
 * Sameem Hub API — bare-node entrypoint (local dev / docker).
 * For Netlify serverless deployment, see ../../netlify/functions/api.ts
 */
import { createApp } from './app';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '4000', 10);
const app = createApp();

app.listen(PORT, () => {
  logger.info(`Sameem Hub API listening on :${PORT}`);
});
