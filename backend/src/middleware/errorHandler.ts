import type { Request, Response, NextFunction } from 'express';
import { BaseError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Zod errors → 422
  if (err instanceof ZodError) {
    return res.status(422).json({
      type: 'https://sameem.hub/errors/validation',
      title: 'Validation failed',
      status: 422,
      errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
      requestId: req.id
    });
  }
  if (err instanceof BaseError) {
    return res.status(err.status).json({
      type: err.type,
      title: err.message,
      status: err.status,
      details: (err as ValidationError).details,
      requestId: req.id
    });
  }
  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({
    type: 'about:blank',
    title: 'Internal server error',
    status: 500,
    requestId: req.id
  });
}
