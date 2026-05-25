import type { ID, ISODate } from './common';
export type CostType = 'Fixed' | 'Variable' | 'One-time';
export interface CostLine {
  id: ID;
  item: string;
  type: CostType;
  category?: string;
  monthly: number;
  onetime_date?: ISODate;
  notes?: string;
  sort_order: number;
}
