"use client";

import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import { groupByField, sortedEntries } from "@/lib/utils";

export function DistributionPanel({ cases }: { cases: GBVCase[] }) {
  const open = cases.filter(c => c.case_status === "Aberto");

  // Get distributions
  const byViolence = groupByField(open, c => c.violence_type_short || c.violence_type);
  const byAge = groupByField(open, c => c.age_group);
  const byManager = groupByField(open, c => c.case_manager);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">Distribuição de Casos</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Violence types */}
        <GCRCard title="Tipos de Violência">
          <div className="space-y-2">
            {sortedEntries(byViolence, 5).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-text-secondary truncate">{label}</span>
                <GCRBadge color={count > 10 ? "red" : count > 5 ? "amber" : "blue"}>{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>

        {/* Age groups */}
        <GCRCard title="Faixa Etária">
          <div className="space-y-2">
            {sortedEntries(byAge).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-text-secondary">{label}</span>
                <GCRBadge color="blue">{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>

        {/* Case managers */}
        <GCRCard title="Carga por Gestor">
          <div className="space-y-2">
            {sortedEntries(byManager, 5).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-text-secondary truncate">{label}</span>
                <GCRBadge color={count > 15 ? "red" : count > 10 ? "amber" : "green"}>{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>
    </div>
  );
}