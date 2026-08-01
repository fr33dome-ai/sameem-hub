/**
 * User management — admin creates and manages real accounts.
 *
 * Every query is scoped to `req.user.tenantId`, which comes from the verified
 * JWT and never from the request body. That is what stops an admin of one
 * workspace from reading or editing users in another.
 *
 * Module visibility is stored server-side (UserModuleVisibility) rather than
 * only in the dashboard's local state. Hiding a tab in the browser is a
 * convenience; storing it here is what makes it meaningful.
 */
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { requireRole } from '../middleware/authJwt';
import * as svc from '../services/auth.service';
import { ForbiddenError, NotFoundError } from '../utils/errors';

const r = Router();

const ROLES = ['admin', 'editor', 'viewer'] as const;

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  isPrimaryAdmin: true,
  lastActiveAt: true,
  createdAt: true,
} as const;

/** Attach hidden module ids to each user so the dashboard can render them. */
async function withHiddenModules(tenantId: string, users: Array<{ id: string }>) {
  const vis = await prisma.userModuleVisibility.findMany({
    where: { userId: { in: users.map(u => u.id) } },
  });
  const byUser = new Map<string, string[]>();
  for (const v of vis as Array<{ userId: string; moduleId: string; isHidden: boolean }>) {
    if (!v.isHidden) continue;
    const list = byUser.get(v.userId) || [];
    list.push(v.moduleId);
    byUser.set(v.userId, list);
  }
  return users.map(u => ({ ...u, hiddenModules: byUser.get(u.id) || [] }));
}

/* ---------------------------------- self --------------------------------- */
r.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user!.userId, deletedAt: null },
      select: userSelect,
    });
    if (!user) throw new NotFoundError('User not found');
    const [withVis] = await withHiddenModules(req.user!.tenantId, [user]);
    res.json(withVis);
  } catch (e) { next(e); }
});

/* --------------------------------- list ---------------------------------- */
r.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.user!.tenantId, deletedAt: null },
      select: userSelect,
      orderBy: [{ isPrimaryAdmin: 'desc' }, { createdAt: 'asc' }],
    });
    res.json(await withHiddenModules(req.user!.tenantId, users));
  } catch (e) { next(e); }
});

/* --------------------------------- create -------------------------------- */
const CreateSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  password: z.string().min(10, 'Use at least 10 characters'),
  role: z.enum(ROLES).default('viewer'),
  hiddenModules: z.array(z.string()).optional(),
});

r.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const input = CreateSchema.parse(req.body);
    const user = await svc.createUserInTenant({
      tenantId: req.user!.tenantId,
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      role: input.role,
    });
    if (input.hiddenModules?.length) {
      await prisma.userModuleVisibility.createMany({
        data: input.hiddenModules.map(moduleId => ({
          userId: user.id, moduleId, isHidden: true,
        })),
        skipDuplicates: true,
      });
    }
    res.status(201).json({ ...user, hiddenModules: input.hiddenModules || [] });
  } catch (e) { next(e); }
});

/* --------------------------------- update -------------------------------- */
const UpdateSchema = z.object({
  displayName: z.string().min(1).optional(),
  role: z.enum(ROLES).optional(),
  hiddenModules: z.array(z.string()).optional(),
  password: z.string().min(10).optional(),
});

r.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const input = UpdateSchema.parse(req.body);
    const target = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId, deletedAt: null },
    });
    if (!target) throw new NotFoundError('User not found');

    // The primary admin must always remain an admin, or the workspace can be
    // locked out of its own user management.
    if (target.isPrimaryAdmin && input.role && input.role !== 'admin') {
      throw new ForbiddenError('The primary admin must keep the admin role');
    }

    if (input.displayName || input.role) {
      await prisma.user.update({
        where: { id: target.id },
        data: {
          ...(input.displayName ? { displayName: input.displayName } : {}),
          ...(input.role ? { role: input.role } : {}),
        },
      });
    }

    if (input.password) {
      await svc.adminSetPassword(req.user!.tenantId, target.id, input.password);
    }

    if (input.hiddenModules) {
      await prisma.userModuleVisibility.deleteMany({ where: { userId: target.id } });
      if (input.hiddenModules.length) {
        await prisma.userModuleVisibility.createMany({
          data: input.hiddenModules.map(moduleId => ({
            userId: target.id, moduleId, isHidden: true,
          })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await prisma.user.findFirst({
      where: { id: target.id }, select: userSelect,
    });
    const [withVis] = await withHiddenModules(req.user!.tenantId, [updated!]);
    res.json(withVis);
  } catch (e) { next(e); }
});

/* --------------------------------- delete -------------------------------- */
/** Soft delete — keeps audit history and avoids orphaning owned records. */
r.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const target = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId, deletedAt: null },
    });
    if (!target) throw new NotFoundError('User not found');
    if (target.isPrimaryAdmin) throw new ForbiddenError('The primary admin cannot be removed');
    if (target.id === req.user!.userId) throw new ForbiddenError('You cannot remove your own account');

    await prisma.user.update({
      where: { id: target.id },
      data: { deletedAt: new Date() },
    });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default r;
