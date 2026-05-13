/**
 * Safely parse date and return null if invalid
 */
export function safeParseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Calculate days between two dates (or from date to now)
 * Returns null if invalid date
 */
export function daysBetween(fromDate: Date | string | null | undefined, toDate: Date = new Date()): number | null {
  const from = typeof fromDate === "string" ? safeParseDate(fromDate) : fromDate;
  if (!from || isNaN(from.getTime())) return null;
  return Math.floor((toDate.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get urgency band based on days (for bucketing)
 */
export function getUrgencyBand(days: number | null): string {
  if (days === null) return "unknown";
  if (days >= 30) return "30+";
  if (days >= 14) return "14-29";
  if (days >= 7) return "7-13";
  if (days >= 3) return "3-6";
  return "0-2";
}

/**
 * Check if date is within last N days
 */
export function isWithinDays(dateStr: string | null | undefined, days: number): boolean {
  const d = daysBetween(dateStr);
  return d !== null && d <= days;
}
