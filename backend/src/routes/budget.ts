import { Router } from 'express';
import { z } from 'zod';
import * as svc from '../services/budget.service';

const r = Router();

r.get('/', async (req, res, next) => {
  try { res.json(await svc.list(req.user!.tenantId)); } catch (e) { next(e); }
});

const CreateSchema = z.object({
  category: z.string().min(1),
  department: z.string().optional(),
  allocated: z.number().nonnegative().default(0),
  spent: z.number().nonnegative().default(0),
  notes: z.string().optional()
});
r.post('/', async (req, res, next) => {
  try {
    const input = CreateSchema.parse(req.body);
    res.status(201).json(await svc.create(req.user!.tenantId, input));
  } catch (e) { next(e); }
});

r.patch('/:id', async (req, res, next) => {
  try {
    const input = CreateSchema.partial().parse(req.body);
    res.json(await svc.update(req.user!.tenantId, req.params.id, input));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try { await svc.softDelete(req.user!.tenantId, req.params.id); res.status(204).end(); }
  catch (e) { next(e); }
});

r.post('/reorder', async (req, res, next) => {
  try {
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(req.body);
    await svc.reorder(req.user!.tenantId, ids);
    res.status(204).end();
  } catch (e) { next(e); }
});

export default r;
