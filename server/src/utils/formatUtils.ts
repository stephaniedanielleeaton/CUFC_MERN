export function formatMoneyCents(amountCents: number | bigint | null | undefined, currency: string | null | undefined): string {
  if (amountCents == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
  }).format(Number(amountCents) / 100);
}

export function formatDateStr(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
