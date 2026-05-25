import type { ID } from './common';

export interface McDriver {
  id: ID;
  key: string;
  label_en: string;
  label_ar?: string;
  mean: number;
  stddev_pct: number;
  sort_order: number;
}

export interface McRun {
  id: ID;
  iterations: number;
  horizon_months: number;
  starting_cash: number;
  started_at: string;
  completed_at?: string;
  runtime_ms?: number;
  results?: McResults;
}

export interface Percentiles {
  p10: number; p50: number; p90: number; mean: number;
}

export interface McResults {
  revenue: Percentiles;
  net: Percentiles;
  cash: Percentiles;
  runout_prob: number;       // 0-1
  runway_p50: number;        // months
  histogram?: number[];
  monthly_p10?: number[];
  monthly_p50?: number[];
  monthly_p90?: number[];
}

export type SignalLevel = 'red' | 'amber' | 'green';

export interface McSignal {
  level: SignalLevel;
  area: string;
  metric: string;
  message: string;
}

export interface McRecommendation {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  area: string;
  what: string;
  why: string;
}

export interface McReport {
  generated: string;
  inputs: { iterations: number; horizon_months: number; starting_cash: number; monthly_burn: number };
  drivers: Array<{ label: string; label_ar?: string; mean: number; stddev_pct: number; p10: string; p90: string; uncertainty: 'high'|'medium'|'low'; consideration: string }>;
  outcomes: McResults;
  signals: McSignal[];
  recommendations: McRecommendation[];
  action_plan: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
}
