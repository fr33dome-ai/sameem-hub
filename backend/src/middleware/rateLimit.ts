import rateLimit from 'express-rate-limit';

export const rateLimitAuth = rateLimit({
  windowMs: 60_000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_PER_MIN || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { type: 'https://sameem.hub/errors/rate-limit', title: 'Too many auth requests', status: 429 }
});

export const rateLimitApi = rateLimit({
  windowMs: 60_000,
  max: parseInt(process.env.RATE_LIMIT_API_PER_MIN || '600', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip || 'anon',
  message: { type: 'https://sameem.hub/errors/rate-limit', title: 'Rate limit exceeded', status: 429 }
});
