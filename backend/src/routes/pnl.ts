import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import * as svc from '../services/pnl.service';
const r = Router();

const EntryInput = z.object({
  statement: z.enum(['income','balance','cashflow']),
  category: z.string().min(1),
  name: z.string().min(1),
  amount: z.number(),
  recurring: z.boolean().default(true),
  notes: z.string().optional()
});

r.get('/entries', async (req, res, next) => {
  try { res.json(await svc.listEntries(req.user!.tenantId)); } catch (e) { next(e); }
});

r.post('/entries', async (req, res, next) => {
  try {
    const input = EntryInput.parse(req.body);
    const row = await prisma.pnLEntry.create({
      data: { tenantId: req.user!.tenantId, ...input }
    });
    res.status(201).json(row);
  } catch (e) { next(e); }
});

r.patch('/entries/:id', async (req, res, next) => {
  try {
    const input = EntryInput.partial().parse(req.body);
    res.json(await prisma.pnLEntry.update({ where: { id: req.params.id }, data: input }));
  } catch (e) { next(e); }
});

r.delete('/entries/:id', async (req, res, next) => {
  try {
    await prisma.pnLEntry.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.status(204).end();
  } catch (e) { next(e); }
});

r.get('/income-statement', async (req, res, next) => {
  try { res.json(await svc.computeIncomeStatement(req.user!.tenantId)); } catch (e) { next(e); }
});
r.get('/balance-sheet', async (req, res, next) => {
  try { res.json(await svc.computeBalanceSheet(req.user!.tenantId)); } catch (e) { next(e); }
});
r.get('/cash-flow', async (req, res, next) => {
  try { res.json(await svc.computeCashFlow(req.user!.tenantId)); } catch (e) { next(e); }
});

export default r;
