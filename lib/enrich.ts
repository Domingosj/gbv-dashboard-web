import { GBVCase } from "./types";
import { isYes, isUnavailable, matchesAny } from "./text-utils";
import { daysBetween, safeParseDate } from "./date-utils";

/**
 * Check if case has ANY referral (consolidated logic)
 */
export function hasReferral(c: GBVCase): boolean {
  const refFields = [
    "referred_medical",
    "referred_psychosocial",
    "referred_police",
    "referred_legal",
    "referred_safe_house",
    "referred_child_protection",
    "referred_livelihood",
  ];
  return refFields.some(k => isYes((c as any)[k]));
}

/**
 * Compute days since identification (safely)
 */
export function daysSinceIdentif(c: GBVCase): number | null {
  return daysBetween(c.identification_date);
}

/**
 * Compute days since last referral (safely)
 */
export function daysSinceReferral(c: GBVCase): number | null {
  const refDates = [
    "date_referred_safe_house",
    "date_referred_medical",
    "date_referred_psychosocial",
    "date_referred_police",
  ];
  const dates: number[] = [];
  for (const col of refDates) {
    const v = (c as any)[col];
    const d = safeParseDate(v);
    if (d) dates.push(d.getTime());
  }
  if (dates.length === 0) return null;
  return daysBetween(new Date(Math.max(...dates)));
}

/**
 * Count service gaps (unavailable services) - safely
 */
export function countServiceGaps(c: GBVCase): number {
  const refFields = [
    "referred_medical",
    "referred_psychosocial",
    "referred_police",
    "referred_child_protection",
    "referred_safe_house",
  ];
  return refFields.filter(k => isUnavailable((c as any)[k])).length;
}

/**
 * Check if survivor is unsafe (safely)
 */
export function isUnsafe(c: GBVCase): boolean {
  return matchesAny(c.is_safe, ["nao", "não"]);
}

/**
 * Enrich a single case with all computed fields
 */
export function enrichCase(c: GBVCase): GBVCase {
  const hr = hasReferral(c);
  const dsi = daysSinceIdentif(c);

  return {
    ...c,
    has_referral: hr,
    days_since_identification: dsi ?? undefined,
  };
}

/**
 * Enrich an array of cases
 */
export function enrichCases(cases: GBVCase[]): GBVCase[] {
  return cases.map(enrichCase);
}

/**
 * Get enrichment status summary
 */
export function getEnrichmentStats(cases: GBVCase[]): Record<string, number> {
  const enriched = enrichCases(cases);
  const avgDays = enriched.reduce((s, c) => s + (c.days_since_identification || 0), 0) / Math.max(enriched.length, 1);
  return {
    total: enriched.length,
    withReferral: enriched.filter(c => c.has_referral).length,
    noReferral: enriched.filter(c => !c.has_referral).length,
    unsafe: enriched.filter(c => isUnsafe(c)).length,
    avgDaysOpen: avgDays,
    serviceGaps: enriched.reduce((s, c) => s + countServiceGaps(c), 0),
  };
}
