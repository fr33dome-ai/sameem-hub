import { Router } from 'express';
import { prisma } from '../config/database';
const r = Router();

r.get('/', async (req, res, next) => {
  try {
    const latest = await prisma.kpiSnapshot.findFirst({
      where: { tenantId: req.user!.tenantId },
      orderBy: { period: 'desc' }
    });
    res.json(latest ?? {});
  } catch (e) { next(e); }
});

export default r;
