"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ReferralPathwaysPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const open = cases.filter(c => c.case_status === "Aberto");
  const total = cases.length;

  const serviceTypes = [
    { key: "referred_medical", label: "Médico" },
    { key: "referred_psychosocial", label: "Psicossocial" },
    { key: "referred_police", label: "Polícia" },
    { key: "referred_legal", label: "Jurídico" },
    { key: "referred_safe_house", label: "Abrigo Seguro" },
    { key: "referred_child_protection", label: "Proteção Infantil" },
    { key: "referred_livelihood", label: "Subsistência" },
  ] as const;

  const totals = serviceTypes.map(({ key, label }) => {
    const sim = open.filter(c => /sim/i.test((c as any)[key] || "")).length;
    const nao = open.filter(c => (c as any)[key] && !/sim/i.test((c as any)[key] || "")).length;
    const indisponivel = open.filter(c => /indisponível|indisponivel/i.test((c as any)[key] || "")).length;
    return { label, sim, nao, indisponivel, total: open.length };
  });

  const districtRefRate = Array.from(new Set(open.map(c => c.district).filter((d): d is string => !!d))).map(d => {
    const dc = open.filter(c => c.district === d);
    const ref = dc.filter(c => c.has_referral).length;
    return { district: d, total: dc.length, referred: ref, rate: ((ref / dc.length) * 100).toFixed(0) };
  }).sort((a, b) => Number(b.rate) - Number(a.rate));

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Vias de Referência</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="Referências por Tipo de Serviço">
          <div className="space-y-4">
            {totals.map(t => (
              <div key={t.label}>
                <div className="flex justify-between text-label mb-1">
                  <span className="text-text-secondary">{t.label}</span>
                  <span className="font-semibold">{t.sim} / {t.total}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(t.sim / t.total) * 100}%` }} />
                </div>
                <div className="flex gap-4 mt-1 text-caption text-text-secondary">
                  <span>{t.sim} referidos</span>
                  <span>{t.nao} não referidos</span>
                  {t.indisponivel > 0 && <span className="text-critical">{t.indisponivel} indisponível</span>}
                </div>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Taxa de Referência por Distrito">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {districtRefRate.map(d => (
              <div key={d.district} className="flex items-center gap-3 py-1.5">
                <span className="text-body w-32 truncate">{d.district}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${d.rate}%`, backgroundColor: Number(d.rate) > 50 ? "#256B5A" : "#D9A441" }} />
                </div>
                <span className="text-label w-16 text-right">{d.referred}/{d.total}</span>
                <GCRBadge color={Number(d.rate) > 50 ? "green" : "amber"}>{d.rate}%</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>

      <GCRCard title="Visão Geral do Pipeline">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de Casos", value: total, color: "text-primary" },
            { label: "Casos Abertos", value: open.length, color: "text-info" },
            { label: "Com Referência", value: open.filter(c => c.has_referral).length, color: "text-success" },
            { label: "Sem Referência", value: open.filter(c => !c.has_referral).length, color: "text-critical" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 rounded-lg bg-gray-50 text-center">
              <p className={`text-metric ${color}`}>{value}</p>
              <p className="text-label text-text-secondary mt-1">{label}</p>
            </div>
          ))}
        </div>
      </GCRCard>
    </div>
  );
}
