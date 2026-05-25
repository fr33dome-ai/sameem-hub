import type { ID, Tenant } from './common';

export type Role = 'admin' | 'finance' | 'ops' | 'growth' | 'viewer';

export interface User {
  id: ID;
  tenant_id: ID;
  email: string;
  display_name: string;
  role: Role;
  is_primary_admin: boolean;
  hidden_modules: string[];
  mfa_enabled: boolean;
  last_active_at?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Session {
  user: User;
  tenant: Tenant;
  tokens: AuthTokens;
}
