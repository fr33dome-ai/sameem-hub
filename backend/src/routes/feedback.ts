import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
const r = Router();

r.get('/', async (req, res, next) => {
  try {
    res.json(await prisma.feedback.findMany({
      where: { tenantId: req.user!.tenantId, deletedAt: null },
      include: { comments: true },
      orderBy: { createdAt: 'desc' }
    }));
  } catch (e) { next(e); }
});

const Input = z.object({
  type: z.enum(['Bug','Feature','Improvement','Question','Other']),
  priority: z.enum(['Critical','High','Medium','Low']),
  module: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional()
});

r.post('/', async (req, res, next) => {
  try {
    const input = Input.parse(req.body);
    res.status(201).json(await prisma.feedback.create({
      data: {
        tenantId: req.user!.tenantId,
        submitterId: req.user!.userId,
        votes: 1,
        ...input
      }
    }));
  } catch (e) { next(e); }
});

r.post('/:id/vote', async (req, res, next) => {
  try {
    const row = await prisma.feedback.update({
      where: { id: req.params.id },
      data: { votes: { increment: 1 } }
    });
    res.json(row);
  } catch (e) { next(e); }
});

export default r;
