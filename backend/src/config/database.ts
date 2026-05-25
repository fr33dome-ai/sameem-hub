import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global { var __prisma: PrismaClient | undefined; }
export const prisma = global.__prisma ?? new PrismaClient({ log: ['error', 'warn'] });
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

prisma.$on?.('warn' as never, (e: unknown) => logger.warn({ e }, 'prisma warn'));
prisma.$on?.('error' as never, (e: unknown) => logger.error({ e }, 'prisma error'));
