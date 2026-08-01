/**
 * Auth service — signup, login, refresh, recovery.
 * Uses bcrypt for password hashing; JWT for sessions.
 *
 * NOTE: bcryptjs (pure JavaScript) rather than argon2 or native bcrypt.
 * Native modules need a compile step that fails on Netlify's build image and
 * bloats the Lambda bundle. bcryptjs is slower per hash but needs no toolchain,
 * which matters far more at current scale. Revisit if login volume grows.
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { ConflictError, UnauthorizedError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';

function signTokens(payload: { userId: string; tenantId: string; role: string }) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
  const refreshToken = jwt.sign(payload, JWT_REFRESH, { expiresIn: REFRESH_TTL });
  return { accessToken, refreshToken };
}

export async function signup(input: {
  email: string; password: string; displayName: string;
  recoveryEmail?: string; tenantName?: string;
}) {
  const existing = await prisma.user.findFirst({ where: { email: input.email, deletedAt: null } });
  if (existing) throw new ConflictError('Email already registered');

  const passwordHash = await bcrypt.hash(input.password, 12);

  // Create tenant + first user (becomes primary admin)
  const tenant = await prisma.tenant.create({
    data: {
      name: input.tenantName || `${input.displayName}'s Workspace`,
      slug: input.email.split('@')[0].toLowerCase() + '-' + Date.now().toString(36),
      users: {
        create: {
          email: input.email,
          displayName: input.displayName,
          passwordHash,
          recoveryEmail: input.recoveryEmail,
          role: 'admin',
          isPrimaryAdmin: true,
          preferences: { create: {} }
        }
      }
    },
    include: { users: true }
  });

  const user = tenant.users[0];
  const tokens = signTokens({ userId: user.id, tenantId: tenant.id, role: user.role });
  return {
    user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, tenantId: tenant.id },
    tokens
  };
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findFirst({ where: { email: input.email, deletedAt: null } });
  if (!user) throw new UnauthorizedError('Invalid credentials');
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError('Invalid credentials');
  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  const tokens = signTokens({ userId: user.id, tenantId: user.tenantId, role: user.role });
  return {
    user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, tenantId: user.tenantId },
    tokens
  };
}

export async function refresh(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH) as { userId: string; tenantId: string; role: string };
    return signTokens(payload);
  } catch (_e) {
    throw new UnauthorizedError('Invalid refresh token');
  }
}

export async function requestPasswordRecovery(_email: string) {
  // Phase 1.x: send password hint to recoveryEmail.
  // Phase 2: send time-limited reset token via SES.
  // (Implementation omitted in skeleton — see deployment/email/ for provider config.)
  return;
}

export async function confirmPasswordRecovery(_input: { token: string; newPassword: string }) {
  // Stub for token verification + password reset.
  throw new UnauthorizedError('Not implemented in Phase 1 skeleton — see services/auth.service.ts');
}
