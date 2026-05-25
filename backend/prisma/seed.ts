/**
 * Prisma seed — populates a demo Sameem Hub tenant with realistic data.
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'sameem-demo' },
    update: {},
    create: {
      name: 'Sameem Hub Demo',
      slug: 'sameem-demo',
      defaultCurrency: 'SAR',
      defaultLanguage: 'en',
      defaultTheme: 'dark',
      timezone: 'Asia/Riyadh'
    }
  });

  const passwordHash = await argon2.hash('DemoPass!23', { type: argon2.argon2id });
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@sameem.hub' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@sameem.hub',
      displayName: 'Abdullah',
      passwordHash,
      role: 'admin',
      isPrimaryAdmin: true,
      recoveryEmail: 'admin@sameem.hub',
      preferences: { create: {} }
    }
  });

  await prisma.pnLSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id, startingCash: 2150000 }
  });

  // Sample budget
  if ((await prisma.budgetLine.count({ where: { tenantId: tenant.id } })) === 0) {
    await prisma.budgetLine.createMany({
      data: [
        { tenantId: tenant.id, category: 'Marketing — Paid', department: 'Growth', allocated: 180000, spent: 142000, sortOrder: 1 },
        { tenantId: tenant.id, category: 'Engineering',      department: 'Tech',   allocated: 450000, spent: 432000, sortOrder: 2 },
        { tenantId: tenant.id, category: '3D Asset Production', department: 'Product', allocated: 240000, spent: 187000, sortOrder: 3 }
      ]
    });
  }

  // Sample MC drivers
  if ((await prisma.mcDriver.count({ where: { tenantId: tenant.id } })) === 0) {
    await prisma.mcDriver.createMany({
      data: [
        { tenantId: tenant.id, key: 'orders_completed', labelEn: 'Monthly Orders',   labelAr: 'طلبات شهرية',     mean: 195,    stddevPct: 25, sortOrder: 1 },
        { tenantId: tenant.id, key: 'avg_order_value',  labelEn: 'Avg Order Value',  labelAr: 'متوسط قيمة الطلب', mean: 2461,   stddevPct: 20, sortOrder: 2 },
        { tenantId: tenant.id, key: 'take_rate',        labelEn: 'Take Rate %',      labelAr: 'نسبة العمولة %',   mean: 12,     stddevPct: 10, sortOrder: 3 },
        { tenantId: tenant.id, key: 'monthly_burn',     labelEn: 'Monthly Burn',     labelAr: 'الاستنزاف',        mean: 320000, stddevPct: 15, sortOrder: 4 },
        { tenantId: tenant.id, key: 'market_shock',     labelEn: 'Market Shock',     labelAr: 'صدمة سوقية',       mean: 1,      stddevPct: 25, sortOrder: 5 }
      ]
    });
  }

  console.log('Seed complete. Login: admin@sameem.hub / DemoPass!23');
  console.log('Tenant:', tenant.slug);
  console.log('Admin user:', admin.email);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
