import { GBVCase } from "./types";
import { groupByField, sortedEntries } from "./utils";

export function byDistrict(cases: GBVCase[]): Record<string, number> {
  return groupByField(cases, c => c.district);
}

export function byProvince(cases: GBVCase[]): Record<string, number> {
  return groupByField(cases, c => c.province);
}

export function byProject(cases: GBVCase[]): Record<string, number> {
  return groupByField(cases, c => c.project);
}

export function byViolence(cases: GBVCase[]): Record<string, number> {
  return groupByField(cases, c => c.violence_type_short || c.violence_type);
}

export function byAge(cases: GBVCase[]): Record<string, number> {
  return groupByField(cases, c => c.age_group);
}

export function bySex(cases: GBVCase[]): Record<string, number> {
  return groupByField(cases, c => c.sex);
}

export function byManager(cases: GBVCase[]): Record<string, number> {
  return groupByField(cases, c => c.case_manager);
}

export function byPerpetratorRel(cases: GBVCase[]): Record<string, number> {
  return groupByField(cases, c => c.perpetrator_relationship);
}

export function filterByProvince(cases: GBVCase[], province: string): GBVCase[] {
  if (!province) return cases;
  return cases.filter(c => c.province === province);
}
