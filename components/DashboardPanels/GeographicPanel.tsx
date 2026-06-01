"use client";

import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import { groupByField, sortedEntries } from "@/lib/utils";

export function GeographicPanel({ cases }: { cases: GBVCase[] }) {
  const open = cases.filter(c => c.case_status === "Aberto");

  const byDistrict = groupByField(open, c => c.district);
  const byProvince = groupByField(open, c => c.province);

  return (
    <div className="space-y-6">
      <h3 className="text-headline-lg text-on-surface">Distribuição Geográfica</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GCRCard title="Casos por Província">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedEntries(byProvince).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                <span className="text-body-sm font-medium text-on-surface">{label}</span>
                <GCRBadge color={count > 20 ? "red" : count > 10 ? "amber" : "blue"}>{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Casos por Distrito">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedEntries(byDistrict, 10).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                <span className="text-body-sm text-on-surface-variant truncate">{label}</span>
                <GCRBadge color={count > 10 ? "red" : count > 5 ? "amber" : "green"}>{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>
    </div>
  );
}
