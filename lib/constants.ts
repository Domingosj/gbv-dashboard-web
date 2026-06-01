// Risk scoring weights for final priority calculation
export const RISK_WEIGHTS = {
  risk: 0.40,
  urgency: 0.35,
  gaps: 1.0,
  unsafe: 1.0,
} as const;

// Priority level thresholds
export const PRIORITY_THRESHOLDS = {
  CRITICO: 85,
  ALTO: 65,
  MEDIO: 40,
  BAIXO: 0,
} as const;

// Days thresholds for various calculations
export const DAYS_THRESHOLDS = {
  RECENT: 3,
  MEDIUM: 7,
  HIGH: 14,
  CRITICAL: 30,
} as const;

// Violence type scoring mapping
export const VIOLENCE_SCORES: Record<string, number> = {
  "violacao": 30,
  "agressao sexual": 28,
  "agressao fisica": 20,
  "abuso psicologico": 15,
  "casamento forcado": 22,
  "negacao de recursos": 12,
  "default": 10,
} as const;

// Age group scoring mapping — keys match the actual ActivityInfo values ("10 - 14" etc.)
export const AGE_GROUP_SCORES: Record<string, number> = {
  "10 - 14": 22,
  "15 - 19": 15,
  "20 - 24": 10,
  "25 - 49": 5,
} as const;

// Perpetrator relationship scoring
export const PERPETRATOR_RELATIONSHIP_SCORES: Record<string, number> = {
  "parceiro": 15,
  "intimo": 15,
  "cuidador": 12,
  "familia": 10,
  "familiar": 10,
  "colega": 7,
} as const;

// Emotional state scoring
export const EMOTIONAL_STATE_SCORES: Record<string, number> = {
  "assustado": 10,
  "temeroso": 10,
  "triste": 7,
  "deprimido": 7,
  "ansioso": 6,
  "nervoso": 6,
  "irritado": 5,
  "calmo": 0,
  "default": 3,
} as const;

// Days since identification urgency scoring (when no referral)
export const URGENCY_NO_REFERRAL: Record<string, number> = {
  "7+": 100,
  "3-6": 70,
  "1-2": 40,
  "0": 20,
} as const;

// Days since referral urgency scoring (when has referral)
export const URGENCY_WITH_REFERRAL: Record<string, number> = {
  "30+": 100,
  "14-29": 80,
  "7-13": 60,
  "3-6": 30,
  "0-2": 10,
} as const;

// Export type helpers for carousel and other components
export type PriorityLevel = keyof typeof PRIORITY_THRESHOLDS;
export type ReferralStatus = keyof typeof URGENCY_WITH_REFERRAL;

// Ensure all constants are properly typed
export const ALL_CONSTANTS = {
  RISK_WEIGHTS,
  PRIORITY_THRESHOLDS,
  DAYS_THRESHOLDS,
  VIOLENCE_SCORES,
  AGE_GROUP_SCORES,
  PERPETRATOR_RELATIONSHIP_SCORES,
  EMOTIONAL_STATE_SCORES,
  URGENCY_NO_REFERRAL,
  URGENCY_WITH_REFERRAL,
} as const;

// NOTE: If using a carousel/slider component, ensure proper initialization and check for variable hoisting issues.
