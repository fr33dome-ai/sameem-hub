/** Budget resource client. One file per resource. */
import api from './client';
import type { BudgetLine } from '@/types/budget';

export const budgetApi = {
  list: () => api.get<BudgetLine[]>('/budget').then(r => r.data),
  create: (input: Partial<BudgetLine>) =>
    api.post<BudgetLine>('/budget', input).then(r => r.data),
  update: (id: string, input: Partial<BudgetLine>) =>
    api.patch<BudgetLine>(`/budget/${id}`, input).then(r => r.data),
  remove: (id: string) => api.delete(`/budget/${id}`).then(r => r.data),
  reorder: (ids: string[]) =>
    api.post('/budget/reorder', { ids }).then(r => r.data)
};
