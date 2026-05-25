import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
const r = Router();

const VendorInput = z.object({
  name: z.string().min(1),
  type: z.enum(['Manufacturer','Retailer','Asset','PBR','Tech']),
  status: z.enum(['Lead','Onboarding','Active','Top Performer','Underperformer','Churned']).default('Active'),
  rating: z.number().min(0).max(5).optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  website: z.string().url().optional(),
  commission_pct: z.number().min(0).max(100).default(10),
  payout_terms: z.string().default('Net 30')
});

r.get('/', async (req, res, next) => {
  try {
    const t = req.query.type as string | undefined;
    res.json(await prisma.vendor.findMany({
      where: {
        tenantId: req.user!.tenantId,
        deletedAt: null,
        ...(t ? { type: t as never } : {})
      },
      orderBy: { sortOrder: 'asc' }
    }));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const input = VendorInput.parse(req.body);
    const row = await prisma.vendor.create({
      data: {
        tenantId: req.user!.tenantId,
        ...input,
        status: input.status === 'Top Performer' ? ('TopPerformer' as never) : (input.status as never)
      }
    });
    res.status(201).json(row);
  } catch (e) { next(e); }
});

export default r;
