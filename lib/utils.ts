import { GBVCase } from "./types";

/**
 * Get unique strings from array, sorted
 */
export function uniqueStrings(items: (string | undefined | null)[]): string[] {
  return Array.from(new Set(items.filter((d): d is string => !!d))).sort();
}

/**
 * Get unique provinces from cases
 */
export function getProvinces(cases: GBVCase[]): string[] {
  return uniqueStrings(cases.map(c => c.province));
}

/**
 * Get unique districts from cases
 */
export function getDistricts(cases: GBVCase[]): string[] {
  return uniqueStrings(cases.map(c => c.district));
}

/**
 * Generic groupBy with count
 */
export function groupByField<T>(items: T[], keyFn: (item: T) => string | undefined): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const k = keyFn(item) || "N/A";
    result[k] = (result[k] || 0) + 1;
  }
  return result;
}

/**
 * Sort record entries by count descending
 */
export function sortedEntries(data: Record<string, number>, limit?: number): [string, number][] {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return limit ? entries.slice(0, limit) : entries;
}
