import { Router } from 'express';
import { prisma } from '../config/database';
import { requireRole } from '../middleware/authJwt';
const r = Router();

r.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    res.json(await prisma.user.findMany({
      where: { tenantId: req.user!.tenantId, deletedAt: null },
      select: { id: true, email: true, displayName: true, role: true, isPrimaryAdmin: true, lastActiveAt: true, mfaEnabled: true }
    }));
  } catch (e) { next(e); }
});

// Self
r.get('/me', async (req, res, next) => {
  try {
    res.json(await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, displayName: true, role: true, isPrimaryAdmin: true, mfaEnabled: true }
    }));
  } catch (e) { next(e); }
});

export default r;
