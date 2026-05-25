import { Router } from 'express';
import { prisma } from '../config/database';
const r = Router();
r.get('/', async (req, res, next) => {
  try {
    res.json(await prisma.task.findMany({
      where: { tenantId: req.user!.tenantId, deletedAt: null },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }]
    }));
  } catch (e) { next(e); }
});

r.post('/:id/complete', async (req, res, next) => {
  try {
    const row = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: 'Done' as never, completedAt: new Date(), progress: 100 }
    });
    res.json(row);
  } catch (e) { next(e); }
});

export default r;
