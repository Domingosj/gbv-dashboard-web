"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { fmtViolence, getTimeSinceIdentif, calculateDaysSinceReferral, calculateComprehensiveRiskScore } from "@/lib/risk-calculator";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SurvivorJourneyPage() {
  const { id } = useParams<{ id: string }>();
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher);
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const c = cases.find(c => c.case_id === id);
  if (!c) return <p className="text-text-secondary p-8">Caso não encontrado</p>;

  const ref = calculateDaysSinceReferral(c);
  const time = getTimeSinceIdentif(c);
  const safe = (c.is_safe || "").toLowerCase() === "sim" || !c.is_safe;

  const dates = [
    { label: "Incidente", date: c.incident_date },
    { label: "Identificação", date: c.identification_date },
    { label: "Entrevista", date: c.interview_date },
    { label: "Encerramento", date: c.closure_date },
  ].filter(d => d.date);

  const referralTypes = [
    { label: "Médico", value: c.referred_medical },
    { label: "Psicossocial", value: c.referred_psychosocial },
    { label: "Polícia", value: c.referred_police },
    { label: "Jurídico", value: c.referred_legal },
    { label: "Abrigo", value: c.referred_safe_house },
    { label: "Proteção Infantil", value: c.referred_child_protection },
  ];

  const badgeColor = (s?: string) => {
    if (!s) return "grey" as const;
    if (/sim/i.test(s)) return "green" as const;
    if (/indisponível|indisponivel/i.test(s)) return "red" as const;
    return "grey" as const;
  };
  const badgeLabel = (s?: string) => {
    if (!s) return "Não";
    if (/sim/i.test(s)) return "Sim";
    if (/indisponível|indisponivel/i.test(s)) return "Indisponível";
    return s;
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <a href="/cases" className="text-label text-primary hover:underline">← Casos</a>
        <h1 className="text-page-title text-text-primary">{c.case_id}</h1>
        <GCRBadge color={safe ? "green" : "red"}>{safe ? "Segura" : "Não Segura"}</GCRBadge>
        <GCRBadge color={c.case_status === "Aberto" ? "green" : "grey"}>{c.case_status || "N/A"}</GCRBadge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <GCRCard title="Visão Geral">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Distrito", c.district],
                ["Província", c.province],
                ["Tipo de Violência", fmtViolence(c.violence_type)],
                ["Faixa Etária", c.age_group],
                ["Sexo", c.sex],
                ["Estado Civil", c.marital_status],
                ["Projeto", c.project],
                ["Parceiro", c.partner],
                ["Gestor", c.case_manager],
                ["Deficiência", c.disability],
                ["País de Origem", c.origin_country],
                ["Consentimento", c.consent],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-label text-text-secondary">{label}</p>
                  <p className="text-body font-medium">{value || "N/A"}</p>
                </div>
              ))}
            </div>
          </GCRCard>

          <GCRCard title="Cronologia">
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-border" />
              {dates.map((d) => (
                <div key={d.label} className="relative">
                  <div className="absolute -left-4 mt-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                  <p className="text-body font-medium">{d.label}</p>
                  <p className="text-caption text-text-secondary">{new Date(d.date!).toLocaleDateString("pt-MZ")}</p>
                </div>
              ))}
            </div>
          </GCRCard>

          {c.incident_description && (
            <GCRCard title="Descrição do Incidente">
              <p className="text-body text-text-primary leading-relaxed">{c.incident_description}</p>
            </GCRCard>
          )}
        </div>

        <div className="space-y-5">
          <GCRCard title="Risco & Segurança">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-label text-text-secondary">Score de Risco</span>
                <span className="font-semibold">{c.risk_score || calculateComprehensiveRiskScore(c)}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label text-text-secondary">Nível</span>
                <span>{c.priority_icon} {c.priority_level || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label text-text-secondary">Estado Emocional</span>
                <span className="font-medium">{c.emotional_state || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label text-text-secondary">Tempo desde ID</span>
                <span className="font-medium">{time}</span>
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-label text-text-secondary mb-1">Porquê não segura</p>
                <p className="text-body">{c.why_not_safe || "N/A"}</p>
              </div>
              {c.safety_measures && (
                <div className="pt-3 border-t border-border">
                  <p className="text-label text-text-secondary mb-1">Medidas de Segurança</p>
                  <p className="text-body">{c.safety_measures}</p>
                </div>
              )}
            </div>
          </GCRCard>

          <GCRCard title="Referências">
            <div className="space-y-2">
              {referralTypes.map((r) => (
                <div key={r.label} className="flex justify-between items-center">
                  <span className="text-label text-text-secondary">{r.label}</span>
                  <GCRBadge color={badgeColor(r.value)}>{badgeLabel(r.value)}</GCRBadge>
                </div>
              ))}
            </div>
          </GCRCard>

          <GCRCard title="Perpetrador">
            <div className="space-y-2">
              {[
                ["Relação", c.perpetrator_relationship],
                ["Sexo", c.perpetrator_sex],
                ["Idade", c.perpetrator_age],
                ["Número", c.perpetrator_count],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-label text-text-secondary">{label}</span>
                  <span className="font-medium">{value || "N/A"}</span>
                </div>
              ))}
            </div>
          </GCRCard>

          <GCRCard title="Alerta de Referência">
            <div className={`p-3 rounded-lg ${ref.status === "CRITICO" ? "bg-critical/10" : ref.status === "SEM_REFERENCIA" ? "bg-warning/10" : "bg-info/10"}`}>
              <p className="text-body font-medium">{ref.alert_icon} {ref.alert}</p>
              <p className="text-caption text-text-secondary mt-1">
                {ref.has_referral ? `${ref.days_waiting} dias desde a última referência` : "Nenhuma referência registada"}
              </p>
            </div>
          </GCRCard>
        </div>
      </div>
    </div>
  );
}
