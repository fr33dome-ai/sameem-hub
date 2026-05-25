/**
 * Sameem Hub API — Express app factory.
 * Extracted from index.ts so the same app can be used by:
 *   • bare-node server (backend/src/index.ts → app.listen)
 *   • Netlify serverless handler (netlify/functions/api.ts → serverless-http)
 */
import 'dotenv/config';
import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitAuth, rateLimitApi } from './middleware/rateLimit';
import { authJwt } from './middleware/authJwt';

import authRoutes       from './routes/auth';
import usersRoutes      from './routes/users';
import kpisRoutes       from './routes/kpis';
import budgetRoutes     from './routes/budget';
import costRoutes       from './routes/cost';
import pnlRoutes        from './routes/pnl';
import vendorsRoutes    from './routes/vendors';
import productsRoutes   from './routes/products';
import projectsRoutes   from './routes/projects';
import tasksRoutes      from './routes/tasks';
import simulatorRoutes  from './routes/simulator';
import referencesRoutes from './routes/references';
import feedbackRoutes   from './routes/feedback';
import healthRoutes     from './routes/health';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: process.env.APP_URL?.split(',') ?? ['http://localhost:3000'],
    credentials: true
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(pinoHttp({ logger }));

  // Public routes
  app.use('/v1/health', healthRoutes);
  app.use('/v1/auth', rateLimitAuth, authRoutes);

  // Protected routes — JWT required
  app.use('/v1', rateLimitApi, authJwt);
  app.use('/v1/users',      usersRoutes);
  app.use('/v1/kpis',       kpisRoutes);
  app.use('/v1/budget',     budgetRoutes);
  app.use('/v1/cost',       costRoutes);
  app.use('/v1/pnl',        pnlRoutes);
  app.use('/v1/vendors',    vendorsRoutes);
  app.use('/v1/products',   productsRoutes);
  app.use('/v1/projects',   projectsRoutes);
  app.use('/v1/tasks',      tasksRoutes);
  app.use('/v1/simulator',  simulatorRoutes);
  app.use('/v1/references', referencesRoutes);
  app.use('/v1/feedback',   feedbackRoutes);

  app.use(errorHandler);
  return app;
}
