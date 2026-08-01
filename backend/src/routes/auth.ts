/**
 * Auth routes — bootstrap, login, refresh, logout, recovery.
 *
 * SECURITY NOTE — why there is no open /signup:
 * An open signup endpoint on a single-tenant internal tool means anyone who
 * finds the URL can create themselves an admin account and read the company's
 * numbers. `/bootstrap` below creates the very first admin and then refuses
 * forever (it checks that zero users exist). Every account after that is
 * created by an admin via POST /v1/users.
 */
import { Router } from 'express';
import { z } from 'zod';
import * as svc from '../services/auth.service';
import { prisma } from '../config/database';
import { authJwt } from '../middleware/authJwt';
import { ForbiddenError } from '../utils/errors';

const r = Router();

/* ------------------------------------------------------------------ *
 * BOOTSTRAP — creates the first admin, once, then self-disables.
 * ------------------------------------------------------------------ */
const BootstrapSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10, 'Use at least 10 characters'),
  displayName: z.string().min(1),
  tenantName: z.string().min(1).optional(),
});

/** Lets the login screen decide whether to show "create first admin". */
r.get('/bootstrap-status', async (_req, res, next) => {
  try {
    const count = await prisma.user.count({ where: { deletedAt: null } });
    res.json({ needsBootstrap: count === 0, userCount: count });
  } catch (e) { next(e); }
});

r.post('/bootstrap', async (req, res, next) => {
  try {
    const count = await prisma.user.count({ where: { deletedAt: null } });
    if (count > 0) {
      throw new ForbiddenError('Already initialised. Ask an admin to create your account.');
    }
    const input = BootstrapSchema.parse(req.body);
    const result = await svc.signup(input);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

/* ------------------------------------------------------------------ *
 * SESSION
 * ------------------------------------------------------------------ */
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

r.post('/login', async (req, res, next) => {
  try {
    const input = LoginSchema.parse(req.body);
    const result = await svc.login(input);
    res.json(result);
  } catch (e) { next(e); }
});

r.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const tokens = await svc.refresh(refreshToken);
    res.json(tokens);
  } catch (e) { next(e); }
});

r.post('/logout', async (_req, res) => res.status(204).end());

/** Who am I? The dashboard calls this on boot to restore a session. */
r.get('/me', authJwt, async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user!.userId, deletedAt: null },
      select: {
        id: true, email: true, displayName: true, role: true,
        tenantId: true, isPrimaryAdmin: true, lastActiveAt: true,
      },
    });
    if (!user) return res.status(401).json({ error: 'user_not_found' });
    return res.json({ user });
  } catch (e) { return next(e); }
});

/* ------------------------------------------------------------------ *
 * PASSWORD
 * ------------------------------------------------------------------ */
r.post('/change-password', authJwt, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(10, 'Use at least 10 characters'),
    }).parse(req.body);
    await svc.changePassword(req.user!.userId, currentPassword, newPassword);
    res.status(204).end();
  } catch (e) { next(e); }
});

r.post('/recover/request', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    await svc.requestPasswordRecovery(email);
    // Always 204 — never reveal whether an email is registered.
    res.status(204).end();
  } catch (e) { next(e); }
});

export default r;
