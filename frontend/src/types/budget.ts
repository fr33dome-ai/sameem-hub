import type { ID } from './common';

export interface BudgetLine {
  id: ID;
  category: string;
  department?: string;
  allocated: number;
  spent: number;
  notes?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
