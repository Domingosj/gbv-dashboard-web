import { GBVCase } from "./types";

// Compute whether a case has any referral
export function hasReferral(c: GBVCase): boolean {
  const refFields = ["referred_medical", "referred_psychosocial", "referred_police",
    "referred_legal", "referred_safe_house", "referred_child_protection", "referred_livelihood"];
  return refFields.some(k => /sim/i.test((c as any)[k] || ""));
}

// Compute days since identification
export function daysSinceIdentif(c: GBVCase): number | null {
  if (!c.identification_date) return null;
  return Math.floor((Date.now() - new Date(c.identification_date).getTime()) / (1000 * 60 * 60 * 24));
}

// Compute days since last referral
export function daysSinceReferral(c: GBVCase): number | null {
  const refDates = ["date_referred_safe_house", "date_referred_medical", "date_referred_psychosocial", "date_referred_police"];
  const dates: number[] = [];
  for (const col of refDates) {
    const v = (c as any)[col];
    if (v) {
      const d = new Date(v).getTime();
      if (!isNaN(d)) dates.push(d);
    }
  }
  if (dates.length === 0) return null;
  return Math.floor((Date.now() - Math.max(...dates)) / (1000 * 60 * 60 * 24));
}

// Count service gaps (unavailable services)
export function countServiceGaps(c: GBVCase): number {
  const refFields = ["referred_medical", "referred_psychosocial", "referred_police",
    "referred_child_protection", "referred_safe_house"];
  return refFields.filter(k => /indisponível|indisponivel/i.test((c as any)[k] || "")).length;
}

// Check if survivor is unsafe
export function isUnsafe(c: GBVCase): boolean {
  const s = (c.is_safe || "").toLowerCase();
  return s === "não" || s === "nao";
}

// Enrich a single case with all computed fields
export function enrichCase(c: GBVCase): GBVCase {
  const hr = hasReferral(c);
  const dsi = daysSinceIdentif(c);
  const dsr = daysSinceReferral(c);
  const gaps = countServiceGaps(c);
  const unsafe = isUnsafe(c);

  return {
    ...c,
    has_referral: hr,
    days_since_identification: dsi ?? undefined,
  };
}

// Enrich an array of cases
export function enrichCases(cases: GBVCase[]): GBVCase[] {
  return cases.map(enrichCase);
}

// Get enrichment status summary
export function getEnrichmentStats(cases: GBVCase[]): Record<string, number> {
  const enriched = enrichCases(cases);
  return {
    total: enriched.length,
    withReferral: enriched.filter(c => c.has_referral).length,
    noReferral: enriched.filter(c => !c.has_referral).length,
    unsafe: enriched.filter(c => isUnsafe(c)).length,
    avgDaysOpen: enriched.reduce((s, c) => s + (c.days_since_identification || 0), 0) / Math.max(enriched.length, 1),
    serviceGaps: enriched.reduce((s, c) => s + countServiceGaps(c), 0),
  };
}
