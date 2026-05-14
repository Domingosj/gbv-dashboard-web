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
      <h3 className="text-lg font-semibold text-text-primary">Distribuição Geográfica</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provinces */}
        <GCRCard title="Casos por Província">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedEntries(byProvince).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-medium text-text-primary">{label}</span>
                <GCRBadge color={count > 20 ? "red" : count > 10 ? "amber" : "blue"}>{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>

        {/* Districts */}
        <GCRCard title="Casos por Distrito">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedEntries(byDistrict, 10).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-text-secondary truncate">{label}</span>
                <GCRBadge color={count > 10 ? "red" : count > 5 ? "amber" : "green"}>{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>
    </div>
  );
}