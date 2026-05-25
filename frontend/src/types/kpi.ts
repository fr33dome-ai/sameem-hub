import type { ID, ISODate } from './common';

export interface KpiSnapshot {
  id: ID;
  period: ISODate;
  revenue_monthly?: number;
  orders_completed?: number;
  avg_order_value?: number;
  gmv_monthly?: number;
  cac?: number;
  ltv?: number;
  conversion_rate?: number;
  configurator_sessions?: number;
  requests_submitted?: number;
  vendor_count?: number;
  churn_monthly?: number;
  cash_in_bank?: number;
  monthly_burn?: number;
  take_rate?: number;
  extra?: Record<string, number>;
}
