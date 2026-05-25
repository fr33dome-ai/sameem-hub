import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export type JwtPayload = { userId: string; tenantId: string; role: string };

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export function authJwt(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError('Missing bearer token'));
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch (_e) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function requireRole(...allowed: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowed.includes(req.user.role)) return next(new ForbiddenError('Role not allowed'));
    next();
  };
}
