/**
 * Normalize Portuguese text: lowercase, remove accents, trim
 */
export function normalizePt(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
}

/**
 * Check if text includes a keyword (normalized, case-insensitive, accent-insensitive)
 */
export function includesNormalized(text: string | null | undefined, keyword: string): boolean {
  return normalizePt(text).includes(normalizePt(keyword));
}

/**
 * Match text against multiple keywords (OR logic)
 */
export function matchesAny(text: string | null | undefined, keywords: string[]): boolean {
  const normalized = normalizePt(text);
  return keywords.some(k => normalized.includes(normalizePt(k)));
}

/**
 * Match text against all keywords (AND logic)
 */
export function matchesAll(text: string | null | undefined, keywords: string[]): boolean {
  const normalized = normalizePt(text);
  return keywords.every(k => normalized.includes(normalizePt(k)));
}

/**
 * Check if response means "yes" (Sim, sim, SIM, etc.)
 */
export function isYes(text: string | null | undefined): boolean {
  return matchesAny(text, ["sim"]);
}

/**
 * Check if response means "no" (Não, nao, NAO, etc.)
 */
export function isNo(text: string | null | undefined): boolean {
  return matchesAny(text, ["nao", "não"]);
}

/**
 * Check if service is unavailable
 */
export function isUnavailable(text: string | null | undefined): boolean {
  return matchesAny(text, ["indisponivel", "indisponível"]);
}
