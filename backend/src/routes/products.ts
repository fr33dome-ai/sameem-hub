import { Router } from 'express';
import { prisma } from '../config/database';
const r = Router();
r.get('/', async (req, res, next) => {
  try {
    res.json(await prisma.product.findMany({
      where: { tenantId: req.user!.tenantId, deletedAt: null },
      orderBy: { sortOrder: 'asc' }
    }));
  } catch (e) { next(e); }
});
export default r;
