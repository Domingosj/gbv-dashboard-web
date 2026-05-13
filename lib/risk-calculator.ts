import { GBVCase, ReferralInfo } from "./types";
import {
  RISK_WEIGHTS,
  PRIORITY_THRESHOLDS,
  DAYS_THRESHOLDS,
  VIOLENCE_SCORES,
  AGE_GROUP_SCORES,
  PERPETRATOR_RELATIONSHIP_SCORES,
  EMOTIONAL_STATE_SCORES,
  URGENCY_WITH_REFERRAL,
  URGENCY_NO_REFERRAL,
} from "./constants";
import { matchesAny, isYes, normalizePt } from "./text-utils";
import { daysBetween, safeParseDate, getUrgencyBand } from "./date-utils";
import { hasReferral, countServiceGaps, isUnsafe } from "./enrich";

/**
 * Score violence type using normalized text matching
 */
function scoreViolenceType(violenceType: string | undefined): number {
  if (!violenceType) return VIOLENCE_SCORES.default;
  const normalized = normalizePt(violenceType);
  for (const [key, score] of Object.entries(VIOLENCE_SCORES)) {
    if (key !== "default" && normalized.includes(normalizePt(key))) {
      return score;
    }
  }
  return VIOLENCE_SCORES.default;
}

/**
 * Score age group using normalized matching
 */
function scoreAgeGroup(ageGroup: string | undefined): number {
  if (!ageGroup) return 0;
  for (const [key, score] of Object.entries(AGE_GROUP_SCORES)) {
    if (ageGroup.includes(key)) return score;
  }
  return 0;
}

/**
 * Score emotional state
 */
function scoreEmotionalState(state: string | undefined): number {
  if (!state) return EMOTIONAL_STATE_SCORES.default;
  const normalized = normalizePt(state);
  for (const [key, score] of Object.entries(EMOTIONAL_STATE_SCORES)) {
    if (key !== "default" && normalized.includes(normalizePt(key))) {
      return score;
    }
  }
  return EMOTIONAL_STATE_SCORES.default;
}

/**
 * Score perpetrator relationship
 */
function scorePerpetratorRelationship(relationship: string | undefined): number {
  if (!relationship) return 0;
  const normalized = normalizePt(relationship);
  for (const [key, score] of Object.entries(PERPETRATOR_RELATIONSHIP_SCORES)) {
    if (normalized.includes(normalizePt(key))) return score;
  }
  return 0;
}

export function calculateComprehensiveRiskScore(c: GBVCase): number {
  let score = 0;

  // Violence type scoring
  score += scoreViolenceType(c.violence_type);

  // Age group scoring
  score += scoreAgeGroup(c.age_group);

  // Safety assessment
  if (isUnsafe(c)) {
    score += 20;
    const why = normalizePt(c.why_not_safe);
    if (why.includes(normalizePt("perpetrador"))) score += 5;
    if (why.includes(normalizePt("casa")) || why.includes(normalizePt("mora"))) score += 5;
  }

  // Emotional state
  score += scoreEmotionalState(c.emotional_state);

  // Perpetrator relationship
  score += scorePerpetratorRelationship(c.perpetrator_relationship);

  // Time since identification bonus
  const daysSinceId = daysBetween(c.identification_date);
  if (daysSinceId !== null) {
    if (daysSinceId >= DAYS_THRESHOLDS.HIGH) score += 15;
    else if (daysSinceId >= DAYS_THRESHOLDS.MEDIUM) score += 10;
    else if (daysSinceId >= DAYS_THRESHOLDS.RECENT) score += 5;
  }

  // Referral status bonus
  if (!hasReferral(c)) score += 15;

  // Disability bonus
  if (isYes(c.disability)) score += 10;

  return Math.min(score, 100);
}

export function calculateDaysSinceReferral(c: GBVCase): ReferralInfo {
  const refCols = [
    "date_referred_safe_house",
    "date_referred_medical",
    "date_referred_psychosocial",
    "date_referred_police",
  ];
  const dates: number[] = [];
  for (const col of refCols) {
    const val = (c as any)[col];
    const d = safeParseDate(val);
    if (d) dates.push(d.getTime());
  }

  if (dates.length === 0) {
    let dw = daysBetween(c.identification_date) || 0;
    return {
      has_referral: false,
      days_waiting: dw,
      status: "SEM_REFERENCIA",
      alert: `⚠️ ${dw}d sem referência`,
      alert_icon: "⚠️",
    };
  }

  const last = Math.max(...dates);
  const dw = daysBetween(new Date(last)) || 0;

  if (c.case_status === "Aberto") {
    if (dw > DAYS_THRESHOLDS.CRITICAL)
      return {
        has_referral: true,
        days_waiting: dw,
        status: "CRITICO",
        alert: `🔴 ${dw}d sem desfecho`,
        alert_icon: "🔴",
      };
    if (dw > DAYS_THRESHOLDS.HIGH)
      return {
        has_referral: true,
        days_waiting: dw,
        status: "ALTO",
        alert: `🟠 ${dw}d sem desfecho`,
        alert_icon: "🟠",
      };
    if (dw > DAYS_THRESHOLDS.MEDIUM)
      return {
        has_referral: true,
        days_waiting: dw,
        status: "MEDIO",
        alert: `🟡 ${dw}d sem desfecho`,
        alert_icon: "🟡",
      };
    return {
      has_referral: true,
      days_waiting: dw,
      status: "RECENTE",
      alert: `🟢 ${dw}d desde referência`,
      alert_icon: "🟢",
    };
  }
  return {
    has_referral: true,
    days_waiting: 0,
    status: "ENCERRADO",
    alert: "Caso encerrado",
    alert_icon: "✅",
  };
}

export function getTimeSinceIdentif(c: GBVCase): string {
  if (!c.identification_date) return "N/A";
  const days = daysBetween(c.identification_date);
  if (days === null) return "N/A";
  if (days === 0) {
    const delta = Date.now() - new Date(c.identification_date).getTime();
    const h = Math.floor(delta / (1000 * 60 * 60));
    return h < 1 ? "< 1h" : `${h}h`;
  }
  if (days === 1) return "1 dia";
  if (days < 7) return `${days} dias`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} ${w === 1 ? "sem" : "sems"}`;
  }
  const m = Math.floor(days / 30);
  return `${m} ${m === 1 ? "mês" : "meses"}`;
}

interface CaseStats {
  total: number;
  open: number;
  closed: number;
  critical: number;
  high: number;
  no_ref: number;
  delayed: number;
}

export function calcStats(cases: GBVCase[]): CaseStats {
  let total = cases.length,
    open = 0,
    closed = 0,
    critical = 0,
    high = 0,
    noRef = 0,
    delayed = 0;
  for (const c of cases) {
    if (c.case_status === "Aberto") open++;
    else if (c.case_status === "Encerrado") closed++;
    if (c.priority_level === "CRÍTICO") critical++;
    if (c.priority_level === "ALTO") high++;
    if (!c.has_referral) noRef++;
    const ref = calculateDaysSinceReferral(c);
    if (ref.days_waiting > DAYS_THRESHOLDS.CRITICAL) delayed++;
  }
  return { total, open, closed, critical, high, no_ref: noRef, delayed };
}

export function fmtViolence(v: string | undefined | null): string {
  if (!v) return "N/A";
  const s = v.toString();
  const m: Record<string, string> = {
    violacao: "Violação",
    "agressao sexual": "Agressão Sexual",
    "agressao fisica": "Agressão Física",
    "abuso psicologico": "Abuso Psicológico",
    "casamento forcado": "Casamento Forçado",
    "negacao de recursos": "Negação Recursos",
  };
  const normalized = normalizePt(s);
  for (const [k, val] of Object.entries(m)) {
    if (normalized.includes(normalizePt(k))) return val;
  }
  return s.length > 30 ? s.slice(0, 30) + "..." : s;
}

export function prioritizeCases(cases: GBVCase[]): GBVCase[] {
  return cases
    .map(c => {
      const risk = calculateComprehensiveRiskScore(c);
      const ref = calculateDaysSinceReferral(c);
      const band = getUrgencyBand(ref.days_waiting);
      const urgency = ref.has_referral ? (URGENCY_WITH_REFERRAL as any)[band] : (URGENCY_NO_REFERRAL as any)[band];

      const gaps = countServiceGaps(c);
      const unsafe = isUnsafe(c) ? 30 : 0;

      const finalPriority =
        risk * RISK_WEIGHTS.risk +
        urgency * RISK_WEIGHTS.urgency +
        gaps * RISK_WEIGHTS.gaps +
        unsafe * RISK_WEIGHTS.unsafe;

      let level: "BAIXO" | "MÉDIO" | "ALTO" | "CRÍTICO";
      if (finalPriority >= PRIORITY_THRESHOLDS.CRITICO) level = "CRÍTICO";
      else if (finalPriority >= PRIORITY_THRESHOLDS.ALTO) level = "ALTO";
      else if (finalPriority >= PRIORITY_THRESHOLDS.MEDIO) level = "MÉDIO";
      else level = "BAIXO";

      const icons: Record<string, string> = {
        CRÍTICO: "🔴",
        ALTO: "🟠",
        MÉDIO: "🟡",
        BAIXO: "🟢",
      };

      return {
        ...c,
        risk_score: risk,
        referral_urgency: urgency,
        service_gaps: gaps,
        unsafe_penalty: unsafe,
        final_priority: finalPriority,
        priority_level: level,
        priority_icon: icons[level],
      };
    })
    .sort((a, b) => (b.final_priority || 0) - (a.final_priority || 0));
}
