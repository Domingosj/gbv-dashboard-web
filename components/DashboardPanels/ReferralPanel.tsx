"use client";

import { GBVCase } from "@/lib/types";
import { HeartPulse, Users, Shield, Gavel, Home, Heart } from "lucide-react";

export function ReferralPanel({ cases }: { cases: GBVCase[] }) {
  const open = cases.filter(c => c.case_status === "Aberto");

  const refs = [
    { label: "Médico", key: "referred_medical", icon: <HeartPulse className="w-5 h-5 text-primary" /> },
    { label: "Psicossocial", key: "referred_psychosocial", icon: <Users className="w-5 h-5 text-primary" /> },
    { label: "Polícia", key: "referred_police", icon: <Shield className="w-5 h-5 text-primary" /> },
    { label: "Jurídico", key: "referred_legal", icon: <Gavel className="w-5 h-5 text-primary" /> },
    { label: "Abrigo Seguro", key: "referred_safe_house", icon: <Home className="w-5 h-5 text-primary" /> },
    { label: "Proteção Infantil", key: "referred_child_protection", icon: <Heart className="w-5 h-5 text-primary" /> },
  ] as const;

  return (
    <div className="space-y-6">
      <h3 className="text-headline-lg text-on-surface">Vias de Referência</h3>

      <div className="space-y-4">
        {refs.map(({ label, key, icon }) => {
          const sim = open.filter(c => /sim/i.test((c as any)[key] || "")).length;
          const percentage = open.length > 0 ? (sim / open.length) * 100 : 0;

          return (
            <div key={key} className="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <span className="font-medium text-on-surface">{label}</span>
                </div>
                <span className="text-body-sm font-bold text-primary">
                  {sim}/{open.length}
                </span>
              </div>

              <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    percentage >= 75
                      ? "bg-success"
                      : percentage >= 50
                        ? "bg-warning"
                        : "bg-critical"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="text-caption text-on-surface-variant mt-1">
                {percentage.toFixed(0)}% de cobertura
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
