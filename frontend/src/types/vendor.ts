import type { ID, ISODate } from './common';

export type VendorType = 'Manufacturer'|'Retailer'|'Asset'|'PBR'|'Tech';
export type VendorStatus = 'Lead'|'Onboarding'|'Active'|'Top Performer'|'Underperformer'|'Churned';

export interface Vendor {
  id: ID;
  name: string;
  type: VendorType;
  status: VendorStatus;
  rating?: number;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  orders_ytd: number;
  gmv_ytd: number;
  commission_pct: number;
  payout_terms: string;     // Net 7 / Net 15 / Net 30 / ...
  joined?: ISODate;
  notes?: string;
}

export interface VendorContract {
  id: ID;
  file_name: string;
  size_bytes: number;
  uploaded_at: string;
}
