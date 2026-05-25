import { Router } from 'express';
import { z } from 'zod';
import * as svc from '../services/simulator.service';

const r = Router();

const RunSchema = z.object({
  iterations: z.number().int().min(100).max(20000),
  horizon_months: z.number().int().min(1).max(60)
});

r.post('/run', async (req, res, next) => {
  try {
    const input = RunSchema.parse(req.body);
    const result = await svc.runSimulation(req.user!.tenantId, {
      iterations: input.iterations,
      horizonMonths: input.horizon_months,
      startedById: req.user!.userId
    });
    res.json(result);
  } catch (e) { next(e); }
});

r.get('/runs/:runId/report', async (req, res, next) => {
  try {
    const report = await svc.generateReport(req.user!.tenantId, req.params.runId);
    res.json(report);
  } catch (e) { next(e); }
});

export default r;
