import { Router } from 'express';
import { prisma } from '../config/database';
const r = Router();
r.get('/', async (req, res, next) => {
  try {
    res.json(await prisma.project.findMany({
      where: { tenantId: req.user!.tenantId, deletedAt: null },
      include: { tasks: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    }));
  } catch (e) { next(e); }
});
export default r;
