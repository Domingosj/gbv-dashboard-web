import { GBVCase, ReferralInfo } from "./types";

export function calculateComprehensiveRiskScore(c: GBVCase): number {
  let score = 0;

  const vt = (c.violence_type || "").toLowerCase();
  if (vt.includes("violação")) score += 30;
  else if (vt.includes("agressão sexual")) score += 28;
  else if (vt.includes("agressão física")) score += 20;
  else if (vt.includes("abuso psicológico")) score += 15;
  else if (vt.includes("casamento forçado")) score += 22;
  else if (vt.includes("negação de recursos")) score += 12;
  else score += 10;

  const age = c.age_group || "";
  if (age.includes("0-11") || age.includes("0 - 11")) score += 25;
  else if (age.includes("12-17") || age.includes("12 - 17")) score += 22;
  else if (age.includes("18-25") || age.includes("18 - 25")) score += 10;
  else if (age.includes("25-49") || age.includes("25 - 49")) score += 5;

  const safe = (c.is_safe || "").toLowerCase();
  if (safe === "não" || safe === "nao") {
    score += 20;
    const why = (c.why_not_safe || "").toLowerCase();
    if (why.includes("perpetrador")) score += 5;
    if (why.includes("casa") || why.includes("mora")) score += 5;
  }

  const emo = (c.emotional_state || "").toLowerCase();
  if (emo.includes("assustado") || emo.includes("temeroso")) score += 10;
  else if (emo.includes("triste") || emo.includes("deprimido")) score += 7;
  else if (emo.includes("ansioso") || emo.includes("nervoso")) score += 6;
  else if (emo.includes("irritado")) score += 5;
  else if (emo.includes("calmo")) score += 0;
  else score += 3;

  const rel = (c.perpetrator_relationship || "").toLowerCase();
  if (rel.includes("parceiro") || rel.includes("íntimo") || rel.includes("intimo")) score += 15;
  else if (rel.includes("cuidador")) score += 12;
  else if (rel.includes("família") || rel.includes("familia") || rel.includes("familiar")) score += 10;
  else if (rel.includes("colega")) score += 7;

  if (c.identification_date) {
    const days = Math.floor(
      (Date.now() - new Date(c.identification_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days >= 7) score += 15;
    else if (days >= 3) score += 10;
    else if (days >= 1) score += 5;
  }

  let hasRef = false;
  for (const col of ["referred_medical", "referred_psychosocial", "referred_police", "referred_safe_house"]) {
    const val = (c as any)[col];
    if (val && val.includes("Sim")) { hasRef = true; break; }
  }
  if (!hasRef) score += 15;

  if ((c.disability || "").toLowerCase() === "sim") score += 10;

  return Math.min(score, 100);
}

export function calculateDaysSinceReferral(c: GBVCase): ReferralInfo {
  const refCols = ["date_referred_safe_house", "date_referred_medical", "date_referred_psychosocial", "date_referred_police"];
  const dates: number[] = [];
  for (const col of refCols) {
    const val = (c as any)[col];
    if (val) {
      const d = new Date(val).getTime();
      if (!isNaN(d)) dates.push(d);
    }
  }

  if (dates.length === 0) {
    let dw = 0;
    if (c.identification_date) {
      dw = Math.floor((Date.now() - new Date(c.identification_date).getTime()) / (1000 * 60 * 60 * 24));
    }
    return { has_referral: false, days_waiting: dw, status: "SEM_REFERENCIA", alert: `⚠️ ${dw}d sem referência`, alert_icon: "⚠️" };
  }

  const last = Math.max(...dates);
  const dw = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));

  if (c.case_status === "Aberto") {
    if (dw > 30) return { has_referral: true, days_waiting: dw, status: "CRITICO", alert: `🔴 ${dw}d sem desfecho`, alert_icon: "🔴" };
    if (dw > 14) return { has_referral: true, days_waiting: dw, status: "ALTO", alert: `🟠 ${dw}d sem desfecho`, alert_icon: "🟠" };
    if (dw > 7) return { has_referral: true, days_waiting: dw, status: "MEDIO", alert: `🟡 ${dw}d sem desfecho`, alert_icon: "🟡" };
    return { has_referral: true, days_waiting: dw, status: "RECENTE", alert: `🟢 ${dw}d desde referência`, alert_icon: "🟢" };
  }
  return { has_referral: true, days_waiting: 0, status: "ENCERRADO", alert: "Caso encerrado", alert_icon: "✅" };
}

export function getTimeSinceIdentif(c: GBVCase): string {
  if (!c.identification_date) return "N/A";
  const delta = Date.now() - new Date(c.identification_date).getTime();
  const days = Math.floor(delta / (1000 * 60 * 60 * 24));
  if (days === 0) { const h = Math.floor(delta / (1000 * 60 * 60)); return h < 1 ? "< 1h" : `${h}h`; }
  if (days === 1) return "1 dia";
  if (days < 7) return `${days} dias`;
  if (days < 30) { const w = Math.floor(days / 7); return `${w} ${w === 1 ? "sem" : "sems"}`; }
  const m = Math.floor(days / 30);
  return `${m} ${m === 1 ? "mês" : "meses"}`;
}

export function calcStats(cases: GBVCase[]): CaseStats {
  let total = cases.length, open = 0, closed = 0, critical = 0, high = 0, noRef = 0, delayed = 0;
  for (const c of cases) {
    if (c.case_status === "Aberto") open++;
    else if (c.case_status === "Encerrado") closed++;
    if (c.priority_level === "CRÍTICO") critical++;
    if (c.priority_level === "ALTO") high++;
    if (!c.has_referral) noRef++;
    const ref = calculateDaysSinceReferral(c);
    if (ref.days_waiting > 30) delayed++;
  }
  return { total, open, closed, critical, high, no_ref: noRef, delayed };
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

export function fmtViolence(v: string | undefined | null): string {
  if (!v) return "N/A";
  const s = v.toString();
  const m: Record<string, string> = {
    "abuso psicológico": "Abuso Psicológico",
    "agressão física": "Agressão Física",
    "agressão sexual": "Agressão Sexual",
    "violação": "Violação",
    "casamento forçado": "Casamento Forçado",
    "negação de recursos": "Negação Recursos",
  };
  for (const [k, val] of Object.entries(m)) {
    if (s.toLowerCase().includes(k)) return val;
  }
  return s.length > 30 ? s.slice(0, 30) + "..." : s;
}

export function prioritizeCases(cases: GBVCase[]): GBVCase[] {
  return cases.map(c => {
    const risk = calculateComprehensiveRiskScore(c);
    const ref = calculateDaysSinceReferral(c);
    const urgency = ref.has_referral
      ? (ref.days_waiting >= 30 ? 100 : ref.days_waiting >= 14 ? 80 : ref.days_waiting >= 7 ? 60 : ref.days_waiting >= 3 ? 30 : 10)
      : (ref.days_waiting >= 7 ? 100 : ref.days_waiting >= 3 ? 70 : ref.days_waiting >= 1 ? 40 : 20);

    let gaps = 0;
    for (const col of ["referred_medical", "referred_psychosocial", "referred_police", "referred_child_protection", "referred_safe_house"]) {
      const val = (c as any)[col];
      if (val && val.includes("indisponível")) gaps++;
    }

    const unsafe = (c.is_safe || "").toLowerCase() === "não" || (c.is_safe || "").toLowerCase() === "nao" ? 30 : 0;

    const finalPriority = risk * 0.40 + urgency * 0.35 + gaps * 1.0 + unsafe;

    let level: "BAIXO" | "MÉDIO" | "ALTO" | "CRÍTICO";
    if (finalPriority >= 85) level = "CRÍTICO";
    else if (finalPriority >= 65) level = "ALTO";
    else if (finalPriority >= 40) level = "MÉDIO";
    else level = "BAIXO";

    const icons: Record<string, string> = { CRÍTICO: "🔴", ALTO: "🟠", MÉDIO: "🟡", BAIXO: "🟢" };

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
  }).sort((a, b) => (b.final_priority || 0) - (a.final_priority || 0));
}
