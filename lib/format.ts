/**
 * Format helpers - used by Home, Inventory, Orders, etc. for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format date string to Thai locale (used by Inventory, Orders, Fetch-logs, etc.)
 */
export function formatDate(dateString: string | null | undefined): string {
  if (dateString == null || dateString === '') return 'N/A';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}
