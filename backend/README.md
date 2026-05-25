# Sameem Hub Backend

Express + TypeScript + Prisma + PostgreSQL. Multi-tenant by design.

## Quick start

```bash
pnpm install
cp .env.example .env

# Start dependencies
docker compose -f ../deployment/docker-compose.yml up -d postgres redis minio

# Migrate & seed
pnpm prisma migrate dev
pnpm prisma db seed

# Run
pnpm dev   # → http://localhost:4000
```

Smoke test:
```bash
curl http://localhost:4000/v1/health
```

## Structure

```
src/
├── index.ts                Express entry
├── config/                 env, database, redis, s3
├── middleware/             authJwt, errorHandler, rateLimit, audit
├── routes/                 thin handlers per resource
├── services/               business logic — pnl, simulator, auth, vendor, …
├── utils/                  logger, errors, gaussian, percentile
└── types/                  shared types
prisma/
├── schema.prisma           canonical DB schema
├── migrations/             generated migrations
└── seed.ts                 dev/staging seed data
```

## Adding a new endpoint

1. Add route in `src/routes/<resource>.ts` — validate input with Zod
2. Add service in `src/services/<resource>.service.ts` — business logic
3. Add to `src/index.ts` router mount
4. Document in `../docs/engineering/API_SPEC.md`
5. Add integration test in `tests/integration/<resource>.test.ts`

## Database migrations

```bash
# Make a schema change in prisma/schema.prisma, then:
pnpm prisma migrate dev --name describe_change

# Production:
pnpm prisma migrate deploy
```

## Conventions

- Routes are thin. Services own logic. Prisma is the only DB layer.
- Every mutation includes audit logging (middleware/audit.ts).
- Errors thrown as typed `BaseError` subclasses. Handler converts to RFC 7807.
- Tenant scoping verified in services via `tenantId` from JWT.

## See also

- `../docs/engineering/API_SPEC.md` — endpoint contract
- `../docs/engineering/DATABASE_SCHEMA.sql` — full DDL (Prisma generates this)
- `../docs/architecture/SECURITY.md` — auth, PDPL, NCA-ECC
