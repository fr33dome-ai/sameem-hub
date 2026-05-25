import { Router } from 'express';
import { prisma } from '../config/database';
const r = Router();

r.get('/', async (_req, res) => {
  let dbOk = false;
  try { await prisma.$queryRaw`SELECT 1`; dbOk = true; } catch (_e) {}
  res.json({ status: dbOk ? 'ok' : 'degraded', db: dbOk ? 'ok' : 'down', timestamp: new Date().toISOString() });
});
r.get('/live', (_req, res) => res.json({ status: 'ok' }));
r.get('/ready', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ready' }); }
  catch (_e) { res.status(503).json({ status: 'not_ready' }); }
});

export default r;
