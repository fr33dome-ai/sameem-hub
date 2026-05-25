export type ID = string;
export type ISODate = string;
export type ISODateTime = string;

export type Tenant = {
  id: ID;
  name: string;
  slug: string;
  default_currency: 'SAR' | 'USD' | 'EUR';
  default_language: 'en' | 'ar';
  default_theme: 'dark' | 'light';
  timezone: string;
};

export type SortOrder = 'asc' | 'desc';
export type Paginated<T> = { items: T[]; cursor?: string; total?: number };
