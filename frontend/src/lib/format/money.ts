/** Money formatting. Always SAR unless otherwise specified. */
export function formatMoney(amount: number | null | undefined, opts?: { currency?: string; locale?: string; compact?: boolean }): string {
  if (amount == null || isNaN(amount)) return '—';
  const currency = opts?.currency ?? 'SAR';
  const locale = opts?.locale ?? 'en-US';
  if (opts?.compact && Math.abs(amount) >= 1000) {
    const absolute = Math.abs(amount);
    if (absolute >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M ' + currency;
    if (absolute >= 1_000) return (amount / 1_000).toFixed(1) + 'K ' + currency;
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(n: number | null | undefined, locale = 'en-US'): string {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat(locale).format(n);
}
