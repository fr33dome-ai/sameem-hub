import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export async function list(tenantId: string) {
  return prisma.budgetLine.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  });
}

export async function create(tenantId: string, input: {
  category: string; department?: string; allocated?: number; spent?: number; notes?: string;
}) {
  const last = await prisma.budgetLine.findFirst({
    where: { tenantId, deletedAt: null },
    orderBy: { sortOrder: 'desc' }
  });
  return prisma.budgetLine.create({
    data: {
      tenantId,
      category: input.category,
      department: input.department,
      allocated: input.allocated ?? 0,
      spent: input.spent ?? 0,
      notes: input.notes,
      sortOrder: (last?.sortOrder ?? 0) + 1
    }
  });
}

export async function update(tenantId: string, id: string, input: {
  category?: string; department?: string; allocated?: number; spent?: number; notes?: string;
}) {
  const existing = await prisma.budgetLine.findFirst({ where: { id, tenantId, deletedAt: null } });
  if (!existing) throw new NotFoundError('Budget line not found');
  return prisma.budgetLine.update({ where: { id }, data: input });
}

export async function softDelete(tenantId: string, id: string) {
  const existing = await prisma.budgetLine.findFirst({ where: { id, tenantId, deletedAt: null } });
  if (!existing) throw new NotFoundError('Budget line not found');
  await prisma.budgetLine.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function reorder(tenantId: string, ids: string[]) {
  // Update sort_order in bulk
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.budgetLine.updateMany({ where: { id, tenantId, deletedAt: null }, data: { sortOrder: i } })
    )
  );
}
