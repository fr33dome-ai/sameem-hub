import api from './client';
import type { McDriver, McRun, McReport } from '@/types/simulator';

export const simulatorApi = {
  listDrivers: () => api.get<McDriver[]>('/simulator/drivers').then(r => r.data),
  updateDriver: (id: string, input: Partial<McDriver>) =>
    api.patch<McDriver>(`/simulator/drivers/${id}`, input).then(r => r.data),
  run: (input: { iterations: number; horizon_months: number }) =>
    api.post<McRun>('/simulator/run', input).then(r => r.data),
  getRun: (runId: string) => api.get<McRun>(`/simulator/runs/${runId}`).then(r => r.data),
  getReport: (runId: string, format: 'json' | 'md' | 'html' = 'json') =>
    api.get<McReport>(`/simulator/runs/${runId}/report`, { params: { format } }).then(r => r.data),
  listRuns: () => api.get<McRun[]>('/simulator/runs').then(r => r.data)
};
