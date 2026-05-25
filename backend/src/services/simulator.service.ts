/**
 * Monte Carlo simulator — server-side implementation.
 * Mirrors the Phase 1 single-file dashboard's runMonteCarlo() function.
 * Adds run persistence, history, and structured report generation.
 */
import { prisma } from '../config/database';

function gaussian(): number {
  // Box-Muller
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

export async function runSimulation(tenantId: string, input: {
  iterations: number;
  horizonMonths: number;
  startedById?: string;
}) {
  const N = Math.max(100, Math.min(20_000, input.iterations));
  const H = Math.max(1, Math.min(60, input.horizonMonths));

  const drivers = await prisma.mcDriver.findMany({ where: { tenantId }, orderBy: { sortOrder: 'asc' } });
  if (!drivers.length) throw new Error('No drivers configured for tenant');

  const settings = await prisma.pnLSettings.findUnique({ where: { tenantId } });
  const startingCash = Number(settings?.startingCash ?? 0);

  const dMap = new Map(drivers.map(d => [d.key, { mean: Number(d.mean), stddev: Number(d.mean) * Number(d.stddevPct) / 100 }]));
  const sample = (key: string) => {
    const d = dMap.get(key);
    if (!d) return 0;
    return d.mean + d.stddev * gaussian();
  };

  const revenues: number[] = [], nets: number[] = [], cashEnds: number[] = [], runways: number[] = [];
  const monthlyP: number[][] = Array.from({ length: H }, () => []);
  let cashOuts = 0;
  const startTime = Date.now();

  for (let i = 0; i < N; i++) {
    let cash = startingCash;
    let totalRev = 0, totalNet = 0;
    let outAt: number | null = null;
    const shock = Math.max(0.5, sample('market_shock'));
    for (let m = 0; m < H; m++) {
      const orders = Math.max(0, sample('orders_completed')) * shock;
      const aov    = Math.max(0, sample('avg_order_value'));
      const tr     = Math.max(0, sample('take_rate')) / 100;
      const burn   = Math.max(0, sample('monthly_burn'));
      const monthRev = orders * aov * tr;
      const monthNet = monthRev - burn;
      cash += monthNet;
      totalRev += monthRev;
      totalNet += monthNet;
      monthlyP[m].push(monthRev);
      if (cash < 0 && outAt === null) outAt = m + 1;
    }
    revenues.push(totalRev); nets.push(totalNet); cashEnds.push(cash);
    runways.push(outAt ?? H + 1);
    if (cash < 0) cashOuts++;
  }

  const sortNum = (a: number[]) => [...a].sort((x, y) => x - y);
  const rs = sortNum(revenues), ns = sortNum(nets), ce = sortNum(cashEnds), rw = sortNum(runways);
  const results = {
    iterations: N, horizon_months: H,
    revenue: { p10: percentile(rs, 0.1), p50: percentile(rs, 0.5), p90: percentile(rs, 0.9), mean: revenues.reduce((a, b) => a + b, 0) / N },
    net:     { p10: percentile(ns, 0.1), p50: percentile(ns, 0.5), p90: percentile(ns, 0.9), mean: nets.reduce((a, b) => a + b, 0) / N },
    cash:    { p10: percentile(ce, 0.1), p50: percentile(ce, 0.5), p90: percentile(ce, 0.9), mean: cashEnds.reduce((a, b) => a + b, 0) / N },
    runout_prob: cashOuts / N,
    runway_p50: percentile(rw, 0.5),
    histogram: revenues.slice(0, Math.min(N, 1000)),
    monthly_p10: monthlyP.map(arr => percentile(sortNum(arr), 0.1)),
    monthly_p50: monthlyP.map(arr => percentile(sortNum(arr), 0.5)),
    monthly_p90: monthlyP.map(arr => percentile(sortNum(arr), 0.9))
  };

  const runtimeMs = Date.now() - startTime;

  const run = await prisma.mcRun.create({
    data: {
      tenantId,
      startedById: input.startedById,
      iterations: N,
      horizonMonths: H,
      startingCash,
      driversSnapshot: drivers as never,
      completedAt: new Date(),
      runtimeMs,
      results: {
        create: {
          revenueP10: results.revenue.p10, revenueP50: results.revenue.p50, revenueP90: results.revenue.p90,
          netP10: results.net.p10, netP50: results.net.p50, netP90: results.net.p90,
          cashP10: results.cash.p10, cashP50: results.cash.p50, cashP90: results.cash.p90,
          runoutProb: results.runout_prob, runwayP50: results.runway_p50,
          histogram: results.histogram as never,
          monthlyP10: results.monthly_p10 as never,
          monthlyP50: results.monthly_p50 as never,
          monthlyP90: results.monthly_p90 as never
        }
      }
    },
    include: { results: true }
  });

  return { runId: run.id, ...results };
}

// Report generator with signals, recommendations, action plan
// Mirrors the Phase 1 generateMcReport() — see frontend/types/simulator.ts McReport
export async function generateReport(tenantId: string, runId: string) {
  const run = await prisma.mcRun.findFirst({
    where: { id: runId, tenantId },
    include: { results: true }
  });
  if (!run || !run.results) throw new Error('Run not found');

  const r = run.results;
  const signals: { level: 'red'|'amber'|'green'; area: string; metric: string; message: string }[] = [];
  const runout = Number(r.runoutProb ?? 0);

  if (runout >= 0.30) signals.push({ level: 'red', area: 'Cash Runway', metric: (runout * 100).toFixed(1) + '%',
    message: 'Critical: >30% probability of running out of cash within the horizon. Immediate action required.' });
  else if (runout >= 0.10) signals.push({ level: 'amber', area: 'Cash Runway', metric: (runout * 100).toFixed(1) + '%',
    message: '10-30% chance of cash depletion. Build contingency plans.' });
  else signals.push({ level: 'green', area: 'Cash Runway', metric: (runout * 100).toFixed(1) + '%',
    message: 'Healthy: low probability of cash depletion.' });

  const netP10 = Number(r.netP10 ?? 0);
  if (netP10 < 0) signals.push({ level: 'red', area: 'Profitability (Worst Case)', metric: String(Math.round(netP10)),
    message: 'Pessimistic scenario shows total net loss.' });

  // Recommendations
  const recommendations: { priority: string; area: string; what: string; why: string }[] = [];
  if (runout >= 0.30) {
    recommendations.push({ priority: 'Critical', area: 'Cash Preservation', what: 'Cut monthly burn 20-30% within 30 days', why: 'Reducing burn extends runway linearly.' });
    recommendations.push({ priority: 'Critical', area: 'Bridge Funding', what: 'Open conversations with 3+ financing partners', why: 'Lines of credit remove tail risk.' });
  }
  recommendations.push({ priority: 'Medium', area: 'Stress Testing', what: 'Re-run Monte Carlo monthly; compare actuals to P50', why: 'Drift below P50 signals miscalibration.' });

  const action_plan = {
    immediate: ['Run worst-case board update with P10 numbers', 'Lock current driver means as baseline', 'Identify pauseable cost lines'],
    short_term: ['Engage 3+ financing options', 'Renegotiate Net 60+ payment terms', 'Monthly cash-flow dashboard refresh'],
    long_term:  ['Build per-category unit economics', 'KSA-local supplier strategy', 'ZATCA Phase 3 readiness']
  };

  const report = {
    generated: new Date().toISOString(),
    runId,
    inputs: { iterations: run.iterations, horizon_months: run.horizonMonths, starting_cash: Number(run.startingCash) },
    outcomes: {
      revenue: { p10: Number(r.revenueP10), p50: Number(r.revenueP50), p90: Number(r.revenueP90) },
      net:     { p10: Number(r.netP10),     p50: Number(r.netP50),     p90: Number(r.netP90) },
      cash:    { p10: Number(r.cashP10),    p50: Number(r.cashP50),    p90: Number(r.cashP90) },
      runout_prob: runout,
      runway_p50: Number(r.runwayP50)
    },
    signals,
    recommendations,
    action_plan
  };

  await prisma.mcRunResults.update({ where: { runId }, data: { report: report as never } });
  return report;
}
