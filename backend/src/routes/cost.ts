import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
const r = Router();

const CostInput = z.object({
  item: z.string().min(1),
  type: z.enum(['Fixed','Variable','One-time']),
  category: z.string().optional(),
  monthly: z.number().nonnegative().default(0),
  onetime_date: z.string().optional(),
  notes: z.string().optional()
});

r.get('/', async (req, res, next) => {
  try {
    res.json(await prisma.costLine.findMany({
      where: { tenantId: req.user!.tenantId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    }));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const input = CostInput.parse(req.body);
    const row = await prisma.costLine.create({
      data: {
        tenantId: req.user!.tenantId,
        item: input.item,
        type: input.type === 'One-time' ? ('OneTime' as never) : (input.type as never),
        category: input.category,
        monthly: input.monthly,
        onetimeDate: input.onetime_date ? new Date(input.onetime_date) : undefined,
        notes: input.notes
      }
    });
    res.status(201).json(row);
  } catch (e) { next(e); }
});

export default r;
