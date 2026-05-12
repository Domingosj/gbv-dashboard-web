"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { fmtViolence, getTimeSinceIdentif, calculateDaysSinceReferral, calculateComprehensiveRiskScore } from "@/lib/risk-calculator";
import GCRBadge from "@/components/ui/GCRBadge";
import { CalendarDays, MapPin, User, AlertTriangle, Scale, HeartPulse, ShieldAlert, ArrowLeft, Clock, FileText, Users, Gavel } from "lucide-react";

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
  const riskScore = c.risk_score || calculateComprehensiveRiskScore(c);
  const level = c.priority_level || "BAIXO";

  const levelColors: Record<string, string> = { CRÍTICO: "bg-critical text-white", ALTO: "bg-warning text-white", MÉDIO: "bg-warning text-white", BAIXO: "bg-success text-white" };

  const dates = [
    { label: "Incidente", date: c.incident_date, icon: CalendarDays, color: "text-critical" },
    { label: "Identificação", date: c.identification_date, icon: FileText, color: "text-info" },
    { label: "Entrevista", date: c.interview_date, icon: Users, color: "text-info" },
    { label: "Encerramento", date: c.closure_date, icon: ShieldAlert, color: "text-success" },
  ].filter(d => d.date);

  const referrals = [
    { label: "Médico", value: c.referred_medical, icon: HeartPulse },
    { label: "Psicossocial", value: c.referred_psychosocial, icon: Users },
    { label: "Polícia", value: c.referred_police, icon: ShieldAlert },
    { label: "Jurídico", value: c.referred_legal, icon: Gavel },
    { label: "Abrigo", value: c.referred_safe_house, icon: ShieldAlert },
    { label: "Proteção Infantil", value: c.referred_child_protection, icon: Users },
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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href="/cases" className="flex items-center gap-1.5 text-label text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Casos
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-text-primary font-sans">{c.case_id}</h1>
              <span className={`px-3 py-0.5 rounded-full text-caption font-medium ${levelColors[level] || "bg-gray-100 text-text-secondary"}`}>
                {c.priority_icon} {level}
              </span>
            </div>
            <div className="flex items-center gap-4 text-body text-text-secondary">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{c.district || "N/A"}, {c.province || "N/A"}</span>
              <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{c.case_manager || "N/A"}</span>
              <span className="flex items-center gap-1.5"><FolderKanbanIcon />{c.project || "N/A"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl text-center ${safe ? "bg-success/10" : "bg-critical/10"}`}>
              <p className={`text-sm font-semibold ${safe ? "text-success" : "text-critical"}`}>{safe ? "Segura" : "Não Segura"}</p>
              <p className="text-caption text-text-secondary">{c.case_status || "N/A"}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gray-50 text-center">
              <p className="text-sm font-semibold text-text-primary">{riskScore}/100</p>
              <p className="text-caption text-text-secondary">Risco</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gray-50 text-center">
              <p className="text-sm font-semibold text-text-primary">{time}</p>
              <p className="text-caption text-text-secondary">Desde ID</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Dados da Sobrevivente</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {[
                { label: "Idade", value: c.age_group, icon: User },
                { label: "Sexo", value: c.sex, icon: User },
                { label: "Estado Civil", value: c.marital_status, icon: Users },
                { label: "Deficiência", value: c.disability, icon: User },
                { label: "País de Origem", value: c.origin_country, icon: MapPin },
                { label: "Consentimento", value: c.consent, icon: FileText },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-1.5 text-caption text-text-secondary mb-1"><Icon className="w-3.5 h-3.5" />{label}</div>
                  <p className="text-body font-semibold">{value || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-critical" /> Detalhes do Incidente</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: "Tipo de Violência", value: fmtViolence(c.violence_type), icon: AlertTriangle },
                { label: "Prática Nociva", value: c.harmful_practice, icon: ShieldAlert },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-1.5 text-caption text-text-secondary mb-1"><Icon className="w-3.5 h-3.5" />{label}</div>
                  <p className="text-body font-semibold">{value || "N/A"}</p>
                </div>
              ))}
            </div>
            {c.incident_description && (
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-caption text-text-secondary mb-1">Descrição Completa</p>
                <p className="text-body text-text-primary leading-relaxed">{c.incident_description}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-info" /> Cronologia do Caso</h2>
            <div className="relative pl-8 space-y-5">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
              {dates.map((d) => (
                <div key={d.label} className="relative">
                  <div className={`absolute -left-5 p-1 rounded-full bg-white border-2 ${d.color.replace("text", "border")}`}>
                    <d.icon className={`w-3.5 h-3.5 ${d.color}`} />
                  </div>
                  <p className="text-body font-semibold text-text-primary">{d.label}</p>
                  <p className="text-caption text-text-secondary">{new Date(d.date!).toLocaleDateString("pt-MZ")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-critical" /> Risco e Segurança</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-body text-text-secondary">Estado Emocional</span>
                <span className="font-semibold flex items-center gap-1.5"><HeartPulse className="w-4 h-4 text-critical" />{c.emotional_state || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-body text-text-secondary">Incidente Anterior</span>
                <GCRBadge color={(c.previous_incident || "").toLowerCase() === "sim" ? "red" : "green"}>{c.previous_incident || "Não"}</GCRBadge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-body text-text-secondary">Relatou noutro local</span>
                <GCRBadge color={(c.reported_elsewhere || "").toLowerCase() === "sim" ? "amber" : "green"}>{c.reported_elsewhere || "Não"}</GCRBadge>
              </div>
              {c.why_not_safe && (
                <div className="pt-2">
                  <p className="text-caption text-text-secondary mb-1">Motivo de insegurança</p>
                  <p className="text-body bg-critical/5 p-3 rounded-xl">{c.why_not_safe}</p>
                </div>
              )}
              {c.safety_measures && (
                <div className="pt-2">
                  <p className="text-caption text-text-secondary mb-1">Medidas de Segurança</p>
                  <p className="text-body bg-info/5 p-3 rounded-xl">{c.safety_measures}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><Scale className="w-5 h-5 text-info" /> Referências</h2>
            <div className="space-y-3">
              {referrals.map((r) => (
                <div key={r.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="flex items-center gap-2 text-body text-text-secondary"><r.icon className="w-4 h-4 text-text-secondary" />{r.label}</span>
                  <GCRBadge color={badgeColor(r.value)}>{badgeLabel(r.value)}</GCRBadge>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"><Gavel className="w-5 h-5 text-warning" /> Perpetrador</h2>
            <div className="space-y-3">
              {[
                { label: "Relação", value: c.perpetrator_relationship, icon: Users },
                { label: "Sexo", value: c.perpetrator_sex, icon: User },
                { label: "Idade", value: c.perpetrator_age, icon: CalendarDays },
                { label: "Número", value: c.perpetrator_count, icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="flex items-center gap-2 text-body text-text-secondary"><Icon className="w-4 h-4" />{label}</span>
                  <span className="font-medium">{value || "N/A"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${ref.status === "CRITICO" ? "border-critical/30 bg-critical/5" : ref.status === "SEM_REFERENCIA" ? "border-warning/30 bg-warning/5" : "border-info/30 bg-info/5"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className={`w-5 h-5 ${ref.status === "CRITICO" ? "text-critical" : ref.status === "SEM_REFERENCIA" ? "text-warning" : "text-info"}`} />
              <p className={`text-body font-semibold ${ref.status === "CRITICO" ? "text-critical" : ref.status === "SEM_REFERENCIA" ? "text-warning" : "text-info"}`}>{ref.alert}</p>
            </div>
            <p className="text-caption text-text-secondary ml-7">
              {ref.has_referral ? `${ref.days_waiting} dias desde a última referência` : "Nenhuma referência registada ainda"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FolderKanbanIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <path d="M8 10v4" /><path d="M12 10v2" /><path d="M16 10v6" />
    </svg>
  );
}
