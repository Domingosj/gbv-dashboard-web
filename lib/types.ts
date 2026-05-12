export type PriorityLevel = "BAIXO" | "MÉDIO" | "ALTO" | "CRÍTICO";

export interface GBVCase {
  record_id?: string;
  case_id: string;
  project?: string;
  partner?: string;
  case_manager?: string;
  incident_date?: string;
  identification_date?: string;
  interview_date?: string;
  closure_date?: string;
  age_group?: string;
  sex?: string;
  marital_status?: string;
  disability?: string;
  vulnerabilities?: string;
  province?: string;
  district?: string;
  origin_country?: string;
  violence_type?: string;
  violence_type_short?: string;
  incident_location?: string;
  incident_description?: string;
  harmful_practice?: string;
  perpetrator_count?: string;
  perpetrator_sex?: string;
  perpetrator_age?: string;
  perpetrator_relationship?: string;
  referred_safe_house?: string;
  referred_medical?: string;
  referred_psychosocial?: string;
  referred_police?: string;
  referred_legal?: string;
  referred_child_protection?: string;
  referred_livelihood?: string;
  date_referred_safe_house?: string;
  date_referred_medical?: string;
  date_referred_psychosocial?: string;
  date_referred_police?: string;
  emotional_state?: string;
  is_safe?: string;
  why_not_safe?: string;
  safety_measures?: string;
  case_status?: string;
  closure_reason?: string;
  validated?: string;
  consent?: string;
  source?: string;
  wants_followup?: string;
  previous_incident?: string;
  referred_by?: string;
  // Calculated
  days_since_identification?: number;
  has_referral?: boolean;
  risk_score?: number;
  referral_urgency?: number;
  service_gaps?: number;
  unsafe_penalty?: number;
  final_priority?: number;
  priority_level?: PriorityLevel;
  priority_icon?: string;
}

export interface CaseStats {
  total: number;
  open: number;
  closed: number;
  critical: number;
  high: number;
  no_ref: number;
  delayed: number;
  new_7d?: number;
  no_safety_plan?: number;
  unsafe?: number;
  minor_serious?: number;
  prev_incident?: number;
  family_perp?: number;
  referred_counts?: Record<string, number>;
  avg_days_to_referral?: number;
  avg_days_to_closure?: number;
  closure_reasons?: Record<string, number>;
}

export interface ReferralInfo {
  has_referral: boolean;
  days_waiting: number;
  status: string;
  alert: string;
  alert_icon: string;
}

export interface Service {
  organization: string;
  service_category: string;
  service_type: string;
  province: string;
  district: string;
  location: string;
  focal_point_name: string;
  focal_point_phone: string;
  focal_point_email?: string;
}

export const PRIORITY_CONFIG: Record<PriorityLevel, { color: string; bg: string; icon: string }> = {
  CRÍTICO: { color: "#C65A5A", bg: "rgba(198,90,90,0.08)", icon: "🔴" },
  ALTO: { color: "#D9A441", bg: "rgba(217,164,65,0.08)", icon: "🟠" },
  MÉDIO: { color: "#D9A441", bg: "rgba(217,164,65,0.08)", icon: "🟡" },
  BAIXO: { color: "#2E8B57", bg: "rgba(46,139,87,0.08)", icon: "🟢" },
};
