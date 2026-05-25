/** Auth routes — signup, login, refresh, logout, password recovery. */
import { Router } from 'express';
import { z } from 'zod';
import * as svc from '../services/auth.service';

const r = Router();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
  recoveryEmail: z.string().email().optional(),
  tenantName: z.string().min(1).optional()
});

r.post('/signup', async (req, res, next) => {
  try {
    const input = SignupSchema.parse(req.body);
    const result = await svc.signup(input);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
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

r.post('/recover/request', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    await svc.requestPasswordRecovery(email);
    res.status(204).end();
  } catch (e) { next(e); }
});

r.post('/recover/confirm', async (req, res, next) => {
  try {
    const input = z.object({ token: z.string(), newPassword: z.string().min(8) }).parse(req.body);
    const result = await svc.confirmPasswordRecovery(input);
    res.json(result);
  } catch (e) { next(e); }
});

export default r;
