import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
const r = Router();

r.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query as { category?: string; search?: string };
    res.json(await prisma.reference.findMany({
      where: {
        tenantId: req.user!.tenantId,
        deletedAt: null,
        ...(category ? { category } : {}),
        ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { notes: { contains: search, mode: 'insensitive' } }] } : {})
      },
      orderBy: { sortOrder: 'asc' }
    }));
  } catch (e) { next(e); }
});

const LinkInput = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional()
});

r.post('/link', async (req, res, next) => {
  try {
    const input = LinkInput.parse(req.body);
    res.status(201).json(await prisma.reference.create({
      data: { tenantId: req.user!.tenantId, type: 'link' as never, addedById: req.user!.userId, ...input }
    }));
  } catch (e) { next(e); }
});

export default r;
