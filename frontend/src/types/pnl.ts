import type { ID, ISODate } from './common';

export type PnLStatement = 'income' | 'balance' | 'cashflow';
export type IncomeCategory  = 'Revenue'|'COGS'|'OpEx'|'D&A'|'Interest'|'Tax'|'Other Income'|'Other Expense';
export type BalanceCategory = 'Current Asset'|'Fixed Asset'|'Intangible Asset'|'Current Liability'|'Long-term Liability'|'Equity';
export type CashFlowCategory = 'Operating'|'Investing'|'Financing';
export type PnLCategory = IncomeCategory | BalanceCategory | CashFlowCategory;

export interface PnLEntry {
  id: ID;
  statement: PnLStatement;
  category: PnLCategory;
  name: string;
  amount: number;          // SAR
  recurring: boolean;
  period_start?: ISODate;
  period_end?: ISODate;
  notes?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PnLAssumptions {
  gross_margin: number;
  commission_rate: number;
  vendor_churn_monthly: number;
  revenue_growth_monthly: number;
  vat_rate: number;
  tax_rate: number;
  starting_cash: number;
}

export interface IncomeStatement {
  total_revenue: number;
  cogs: number;
  gross_profit: number;
  opex: number;
  other_income: number;
  other_expense: number;
  ebitda: number;
  da: number;
  ebit: number;
  interest: number;
  pre_tax_income: number;
  tax: number;
  net_income: number;
}

export interface BalanceSheet {
  current_assets: number;
  fixed_assets: number;
  intangible_assets: number;
  total_assets: number;
  current_liabilities: number;
  longterm_liabilities: number;
  total_liabilities: number;
  equity: number;
  total_liab_equity: number;
  balanced: boolean;
  difference: number;
}

export interface CashFlowStatement {
  starting_cash: number;
  operating: number;
  investing: number;
  financing: number;
  net_change: number;
  ending_cash: number;
}
