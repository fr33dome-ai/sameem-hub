import api from './client';
import type { PnLEntry, PnLStatement, PnLAssumptions, IncomeStatement, BalanceSheet, CashFlowStatement } from '@/types/pnl';

export const pnlApi = {
  listEntries: (filters?: { statement?: PnLStatement; category?: string }) =>
    api.get<PnLEntry[]>('/pnl/entries', { params: filters }).then(r => r.data),
  createEntry: (input: Partial<PnLEntry>) =>
    api.post<PnLEntry>('/pnl/entries', input).then(r => r.data),
  updateEntry: (id: string, input: Partial<PnLEntry>) =>
    api.patch<PnLEntry>(`/pnl/entries/${id}`, input).then(r => r.data),
  deleteEntry: (id: string) => api.delete(`/pnl/entries/${id}`).then(r => r.data),

  income: () => api.get<IncomeStatement>('/pnl/income-statement').then(r => r.data),
  balance: () => api.get<BalanceSheet>('/pnl/balance-sheet').then(r => r.data),
  cashflow: () => api.get<CashFlowStatement>('/pnl/cash-flow').then(r => r.data),

  getAssumptions: () => api.get<PnLAssumptions>('/pnl/assumptions').then(r => r.data),
  updateAssumptions: (input: Partial<PnLAssumptions>) =>
    api.patch<PnLAssumptions>('/pnl/assumptions', input).then(r => r.data),

  forecast: (months = 12) =>
    api.get<{ months: { revenue: number; cost: number; net: number }[] }>('/pnl/forecast', { params: { months } }).then(r => r.data)
};
