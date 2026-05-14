import { GBVCase } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const EXPECTED_FIELDS = [
  "case_id", "project", "case_manager", "province", "district",
  "violence_type", "age_group", "sex", "case_status",
  "incident_date", "identification_date",
  "is_safe", "emotional_state",
  "perpetrator_relationship",
  "referred_medical", "referred_psychosocial", "referred_police",
  "referred_legal", "referred_safe_house", "referred_child_protection",
];

export function validateCases(cases: GBVCase[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cases || cases.length === 0) {
    return { valid: true, errors: [], warnings: ["No cases returned from API"] };
  }

  // Check for missing required fields
  const missingFields = new Set<string>();
  let emptyCaseIds = 0;
  let noStatus = 0;
  let noDistrict = 0;
  let noViolence = 0;
  let noIdentDate = 0;

  for (const c of cases) {
    if (!c.case_id) emptyCaseIds++;
    if (!c.case_status) noStatus++;
    if (!c.district) noDistrict++;
    if (!c.violence_type) noViolence++;
    if (!c.identification_date) noIdentDate++;

    for (const field of EXPECTED_FIELDS) {
      if ((c as any)[field] === undefined) {
        missingFields.add(field);
      }
    }
  }

  if (emptyCaseIds > 0) warnings.push(`${emptyCaseIds} cases missing case_id`);
  if (noStatus > 0) warnings.push(`${noStatus} cases missing case_status`);
  if (noDistrict > 0) warnings.push(`${noDistrict} cases missing district`);
  if (noViolence > 0) warnings.push(`${noViolence} cases missing violence_type`);
  if (noIdentDate > cases.length * 0.5) errors.push(`Over 50% of cases missing identification_date`);

  // Check for inconsistent dates (closure before identification)
  const badDates = cases.filter(c => c.identification_date && c.closure_date &&
    new Date(c.closure_date) < new Date(c.identification_date));
  if (badDates.length > 0) errors.push(`${badDates.length} cases have closure before identification`);

  // Check for invalid case_status values
  const validStatuses = ["Aberto", "Encerrado"];
  const badStatuses = cases.filter(c => c.case_status && !validStatuses.includes(c.case_status));
  if (badStatuses.length > 0) warnings.push(`${badStatuses.length} cases have unrecognized status: ${Array.from(new Set(badStatuses.map(c => c.case_status))).join(", ")}`);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateActivityInfoResponse(data: any): { valid: boolean; message: string } {
  if (!data) return { valid: false, message: "Empty response from ActivityInfo" };
  if (!Array.isArray(data)) return { valid: false, message: `Expected array, got ${typeof data}` };
  if (data.length === 0) return { valid: true, message: "Empty array (no cases)" };

  // Check if it looks like ActivityInfo data by looking for expected fields
  const sample = data[0];
  const hasExpectedField = ["ID do Incidente", "tipo_viol", "Estado do caso", "distrito.Name", "data_identf"]
    .some(f => f in sample);

  if (!hasExpectedField) {
    const keys = Object.keys(sample).slice(0, 5).join(", ");
    return { valid: false, message: `Response doesn't match ActivityInfo format. Sample keys: ${keys}` };
  }

  return { valid: true, message: `OK: ${data.length} records` };
}
