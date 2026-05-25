/**
 * P&L Service — three-statement model.
 * Computes Income, Balance, Cash Flow from a single editable pnl_entries table.
 */
import { prisma } from '../config/database';

type Stmt = 'income' | 'balance' | 'cashflow';

async function sumCategory(tenantId: string, statement: Stmt, category: string): Promise<number> {
  const result = await prisma.pnLEntry.aggregate({
    where: { tenantId, statement, category, deletedAt: null },
    _sum: { amount: true }
  });
  return Number(result._sum.amount ?? 0);
}

export async function computeIncomeStatement(tenantId: string) {
  const [revenue, cogs, opex, da, interest, tax, otherIn, otherOut] = await Promise.all([
    sumCategory(tenantId, 'income', 'Revenue'),
    sumCategory(tenantId, 'income', 'COGS'),
    sumCategory(tenantId, 'income', 'OpEx'),
    sumCategory(tenantId, 'income', 'D&A'),
    sumCategory(tenantId, 'income', 'Interest'),
    sumCategory(tenantId, 'income', 'Tax'),
    sumCategory(tenantId, 'income', 'Other Income'),
    sumCategory(tenantId, 'income', 'Other Expense')
  ]);
  const grossProfit = revenue - cogs;
  const ebitda      = grossProfit - opex + otherIn - otherOut;
  const ebit        = ebitda - da;
  const preTax      = ebit - interest;
  const netIncome   = preTax - tax;
  return {
    total_revenue: revenue,
    cogs,
    gross_profit: grossProfit,
    opex,
    other_income: otherIn,
    other_expense: otherOut,
    ebitda,
    da,
    ebit,
    interest,
    pre_tax_income: preTax,
    tax,
    net_income: netIncome
  };
}

export async function computeBalanceSheet(tenantId: string) {
  const [curA, fixA, intA, curL, ltL, eq] = await Promise.all([
    sumCategory(tenantId, 'balance', 'Current Asset'),
    sumCategory(tenantId, 'balance', 'Fixed Asset'),
    sumCategory(tenantId, 'balance', 'Intangible Asset'),
    sumCategory(tenantId, 'balance', 'Current Liability'),
    sumCategory(tenantId, 'balance', 'Long-term Liability'),
    sumCategory(tenantId, 'balance', 'Equity')
  ]);
  const totalAssets    = curA + fixA + intA;
  const totalLiab      = curL + ltL;
  const totalLiabEq    = totalLiab + eq;
  const difference     = totalAssets - totalLiabEq;
  return {
    current_assets: curA,
    fixed_assets: fixA,
    intangible_assets: intA,
    total_assets: totalAssets,
    current_liabilities: curL,
    longterm_liabilities: ltL,
    total_liabilities: totalLiab,
    equity: eq,
    total_liab_equity: totalLiabEq,
    balanced: Math.abs(difference) < 1,
    difference
  };
}

export async function computeCashFlow(tenantId: string) {
  const settings = await prisma.pnLSettings.findUnique({ where: { tenantId } });
  const startingCash = Number(settings?.startingCash ?? 0);
  const [op, inv, fin] = await Promise.all([
    sumCategory(tenantId, 'cashflow', 'Operating'),
    sumCategory(tenantId, 'cashflow', 'Investing'),
    sumCategory(tenantId, 'cashflow', 'Financing')
  ]);
  const netChange = op + inv + fin;
  return {
    starting_cash: startingCash,
    operating: op,
    investing: inv,
    financing: fin,
    net_change: netChange,
    ending_cash: startingCash + netChange
  };
}

export async function listEntries(tenantId: string, filters?: { statement?: Stmt; category?: string }) {
  return prisma.pnLEntry.findMany({
    where: { tenantId, deletedAt: null, ...filters },
    orderBy: [{ statement: 'asc' }, { category: 'asc' }, { sortOrder: 'asc' }]
  });
}
