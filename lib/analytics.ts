import { GBVCase } from "./types";

// Group by a string field, return sorted entries
export function groupBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    result[k] = (result[k] || 0) + 1;
  }
  return result;
}

export function sortedEntries(data: Record<string, number>, limit?: number): [string, number][] {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return limit ? entries.slice(0, limit) : entries;
}

// Group by district
export function byDistrict(cases: GBVCase[]): Record<string, number> {
  return groupBy(cases, c => c.district || "Desconhecido");
}

// Group by province
export function byProvince(cases: GBVCase[]): Record<string, number> {
  return groupBy(cases, c => c.province || "N/E");
}

// Group by project
export function byProject(cases: GBVCase[]): Record<string, number> {
  return groupBy(cases, c => c.project || "N/A");
}

// Group by violence type (short)
export function byViolence(cases: GBVCase[]): Record<string, number> {
  return groupBy(cases, c => c.violence_type_short || c.violence_type || "N/A");
}

// Group by age group
export function byAge(cases: GBVCase[]): Record<string, number> {
  return groupBy(cases, c => c.age_group || "N/E");
}

// Group by sex
export function bySex(cases: GBVCase[]): Record<string, number> {
  return groupBy(cases, c => c.sex || "N/E");
}

// Group by case manager
export function byManager(cases: GBVCase[]): Record<string, number> {
  return groupBy(cases, c => c.case_manager || "Sem gestor");
}

// Group by perpetrator relationship
export function byPerpetratorRel(cases: GBVCase[]): Record<string, number> {
  return groupBy(cases, c => c.perpetrator_relationship || "N/E");
}

// Filter by province
export function filterByProvince(cases: GBVCase[], province: string): GBVCase[] {
  if (!province) return cases;
  return cases.filter(c => c.province === province);
}

// Get sorted unique provinces
export function getProvinces(cases: GBVCase[]): string[] {
  return Array.from(new Set(cases.map(c => c.province).filter((d): d is string => !!d))).sort();
}

// Compute total cases and percentages
export interface DistributionItem {
  label: string;
  count: number;
  pct: number;
}

export function distribution(data: Record<string, number>, total: number): DistributionItem[] {
  return Object.entries(data).map(([label, count]) => ({
    label,
    count,
    pct: total > 0 ? (count / total) * 100 : 0,
  })).sort((a, b) => b.count - a.count);
}
