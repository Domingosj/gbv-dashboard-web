"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { fmtViolence, getTimeSinceIdentif, calculateDaysSinceReferral, calculateComprehensiveRiskScore } from "@/lib/risk-calculator";
import GCRBadge from "@/components/ui/GCRBadge";
import { CalendarDays, MapPin, User, AlertTriangle, Scale, HeartPulse, ShieldAlert, ArrowLeft, Clock, FileText, Users, Gavel, Phone } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Service {
  id: string;
  organization: string;
  service_category: string;
  service_type: string;
  province: string;
  district: string;
  location: string;
  focal_point_name: string;
  focal_point_phone: string;
  focal_point_email: string;
}

const REFERRAL_TYPES = [
  { key: "referred_medical", dateKey: "date_referred_medical", label: "Médico", icon: HeartPulse, needsKeywords: ["saúde", "saude", "medical", "médico", "nutrição", "nutricao"] },
  { key: "referred_psychosocial", dateKey: "date_referred_psychosocial", label: "Psicossocial", icon: Users, needsKeywords: ["psicossocial", "mental", "psychosocial"] },
  { key: "referred_police", dateKey: "date_referred_police", label: "Polícia", icon: ShieldAlert, needsKeywords: ["polícia", "policia", "prm", "proteção"] },
  { key: "referred_legal", dateKey: "date_referred_legal", label: "Jurídico", icon: Gavel, needsKeywords: ["jurídico", "juridico", "legal", "pgr"] },
  { key: "referred_safe_house", dateKey: "date_referred_safe_house", label: "Abrigo", icon: ShieldAlert, needsKeywords: ["abrigo", "safe", "house", "vb"] },
  { key: "referred_child_protection", dateKey: "date_referred_child_protection", label: "Proteção Infantil", icon: Users, needsKeywords: ["criança", "crianca", "child", "infantil"] },
];

function matchServiceCategory(category: string, keywords: string[]): boolean {
  const c = category.toLowerCase();
  return keywords.some(k => c.includes(k));
}

export default function SurvivorJourneyPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeURIComponent(rawId || "");
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher);
  const { data: services } = useSWR<Service[]>("/api/services", fetcher, { refreshInterval: 300000 });

  if (!cases) return <p className="text-on-surface-variant p-8">Carregando...</p>;
  const c = cases.find(c => c.case_id === id || c.record_id === id);
  if (!c) return <p className="text-on-surface-variant p-8">Caso não encontrado</p>;

  const ref = calculateDaysSinceReferral(c);
  const time = getTimeSinceIdentif(c);
  const safe = (c.is_safe || "").toLowerCase() === "sim" || !c.is_safe;
  const riskScore = c.risk_score || calculateComprehensiveRiskScore(c);
  const level = c.priority_level || "BAIXO";
  const levelColors: Record<string, string> = { CRÍTICO: "bg-critical text-white", ALTO: "bg-warning text-white", MÉDIO: "bg-warning text-white", BAIXO: "bg-success text-white" };

  const dates = [
    { label: "Incidente", date: c.incident_date, icon: CalendarDays, color: "text-critical" },
    { label: "Identificação", date: c.identification_date, icon: FileText, color: "text-primary" },
    { label: "Entrevista", date: c.interview_date, icon: Users, color: "text-primary" },
    { label: "Encerramento", date: c.closure_date, icon: ShieldAlert, color: "text-success" },
  ].filter(d => d.date);

  const referrals = REFERRAL_TYPES.map(rt => ({
    ...rt,
    value: (c as any)[rt.key] as string | undefined,
    date: (c as any)[rt.dateKey] as string | undefined,
  }));

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

  const districtServices = useMemo(() => {
    if (!services || !c.district) return [];
    return services.filter(s =>
      s.district?.toLowerCase() === c.district?.toLowerCase() ||
      s.district?.toLowerCase() === c.district?.toLowerCase().replace(/^cidade de /, "")
    );
  }, [services, c.district]);

  const suggestions = useMemo(() => {
    return REFERRAL_TYPES.map(rt => {
      const alreadyReferred = /sim/i.test((c as any)[rt.key] || "");
      const matching = districtServices.filter(s => matchServiceCategory(s.service_category, rt.needsKeywords));
      return { ...rt, alreadyReferred, matching };
    }).filter(s => !s.alreadyReferred);
  }, [c, districtServices]);



  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href="/cases" className="flex items-center gap-1.5 text-label text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Casos
        </a>
      </div>

      <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-headline-lg-mobile font-bold text-on-surface font-sans">{c.case_id}</h1>
              <span className={`px-3 py-0.5 rounded-full text-caption font-medium ${levelColors[level] || "bg-surface-container text-on-surface-variant"}`}>
                {c.priority_icon} {level}
              </span>
            </div>
            <div className="flex items-center gap-4 text-body-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{c.district || "N/A"}, {c.province || "N/A"}</span>
              <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{c.case_manager || "N/A"}</span>
              <span className="flex items-center gap-1.5"><FolderKanbanIcon />{c.project || "N/A"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl text-center ${safe ? "bg-success/10" : "bg-critical/10"}`}>
              <p className={`text-sm font-semibold ${safe ? "text-success" : "text-critical"}`}>{safe ? "Segura" : "Não Segura"}</p>
              <p className="text-caption text-on-surface-variant">{c.case_status || "N/A"}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-surface-container text-center">
              <p className="text-sm font-semibold text-on-surface">{riskScore}/100</p>
              <p className="text-caption text-on-surface-variant">Risco</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-surface-container text-center">
              <p className="text-sm font-semibold text-on-surface">{time}</p>
              <p className="text-caption text-on-surface-variant">Desde ID</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6">
            <h2 className="text-title-md font-semibold text-on-surface mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Dados da Sobrevivente</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {[
                { label: "Idade", value: c.age_group, icon: User },
                { label: "Sexo", value: c.sex, icon: User },
                { label: "Estado Civil", value: c.marital_status, icon: Users },
                { label: "Deficiência", value: c.disability, icon: User },
                { label: "País de Origem", value: c.origin_country, icon: MapPin },
                { label: "Consentimento", value: c.consent, icon: FileText },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-3 rounded-lg bg-surface-container">
                  <div className="flex items-center gap-1.5 text-caption text-on-surface-variant mb-1"><Icon className="w-3.5 h-3.5" />{label}</div>
                  <p className="text-body-sm font-semibold text-on-surface">{value || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6">
            <h2 className="text-title-md font-semibold text-on-surface mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-critical" /> Detalhes do Incidente</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: "Tipo de Violência", value: fmtViolence(c.violence_type), icon: AlertTriangle },
                { label: "Prática Nociva", value: c.harmful_practice, icon: ShieldAlert },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-3 rounded-lg bg-surface-container">
                  <div className="flex items-center gap-1.5 text-caption text-on-surface-variant mb-1"><Icon className="w-3.5 h-3.5" />{label}</div>
                  <p className="text-body-sm font-semibold text-on-surface">{value || "N/A"}</p>
                </div>
              ))}
            </div>
            {c.incident_description && (
              <div className="p-4 rounded-lg bg-surface-container">
                <p className="text-caption text-on-surface-variant mb-1">Descrição Completa</p>
                <p className="text-body-sm text-on-surface leading-relaxed">{c.incident_description}</p>
              </div>
            )}
          </div>

          {/* Feature 7: Histórico de Referências */}
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6">
            <h2 className="text-title-md font-semibold text-on-surface mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Histórico de Referências</h2>
            {referrals.filter(r => /sim/i.test(r.value || "")).length === 0 ? (
              <p className="text-body-sm text-on-surface-variant text-center py-4">Nenhuma referência registada para este caso</p>
            ) : (
              <div className="relative pl-8 space-y-5">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-outline-variant" />
                {referrals.filter(r => /sim/i.test(r.value || "")).map((r) => (
                  <div key={r.key} className="relative">
                    <div className="absolute -left-5 p-1 rounded-full bg-surface-container-lowest border-2 border-primary">
                      <r.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-body-sm font-semibold text-on-surface">{r.label}</p>
                    <p className="text-caption text-on-surface-variant">
                      Referenciado
                      {r.date ? ` em ${new Date(r.date).toLocaleDateString("pt-MZ")}` : ""}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-caption font-medium bg-success/10 text-success">Concluído</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6">
            <h2 className="text-title-md font-semibold text-on-surface mb-4 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> Cronologia do Caso</h2>
            <div className="relative pl-8 space-y-5">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-outline-variant" />
              {dates.map((d) => (
                <div key={d.label} className="relative">
                  <div className={`absolute -left-5 p-1 rounded-full bg-surface-container-lowest border-2 ${d.color.replace("text", "border")}`}>
                    <d.icon className={`w-3.5 h-3.5 ${d.color}`} />
                  </div>
                  <p className="text-body-sm font-semibold text-on-surface">{d.label}</p>
                  <p className="text-caption text-on-surface-variant">{new Date(d.date!).toLocaleDateString("pt-MZ")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6">
            <h2 className="text-title-md font-semibold text-on-surface mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-critical" /> Risco e Segurança</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                <span className="text-body-sm text-on-surface-variant">Estado Emocional</span>
                <span className="font-semibold flex items-center gap-1.5"><HeartPulse className="w-4 h-4 text-critical" />{c.emotional_state || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                <span className="text-body-sm text-on-surface-variant">Incidente Anterior</span>
                <GCRBadge color={(c.previous_incident || "").toLowerCase() === "sim" ? "red" : "green"}>{c.previous_incident || "Não"}</GCRBadge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                <span className="text-body-sm text-on-surface-variant">Relatou noutro local</span>
                <GCRBadge color={(c.reported_elsewhere || "").toLowerCase() === "sim" ? "amber" : "green"}>{c.reported_elsewhere || "Não"}</GCRBadge>
              </div>
              {c.why_not_safe && (
                <div className="pt-2">
                  <p className="text-caption text-on-surface-variant mb-1">Motivo de insegurança</p>
                  <p className="text-body-sm bg-critical/5 p-3 rounded-lg">{c.why_not_safe}</p>
                </div>
              )}
              {c.safety_measures && (
                <div className="pt-2">
                  <p className="text-caption text-on-surface-variant mb-1">Medidas de Segurança</p>
                  <p className="text-body-sm bg-primary/5 p-3 rounded-lg">{c.safety_measures}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6">
            <h2 className="text-title-md font-semibold text-on-surface mb-4 flex items-center gap-2"><Scale className="w-5 h-5 text-primary" /> Referências</h2>
            <div className="space-y-3">
              {referrals.map((r) => (
                <div key={r.key} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                  <span className="flex items-center gap-2 text-body-sm text-on-surface-variant"><r.icon className="w-4 h-4 text-on-surface-variant" />{r.label}</span>
                  <GCRBadge color={badgeColor(r.value)}>{badgeLabel(r.value)}</GCRBadge>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6">
            <h2 className="text-title-md font-semibold text-on-surface mb-4 flex items-center gap-2"><Gavel className="w-5 h-5 text-warning" /> Perpetrador</h2>
            <div className="space-y-3">
              {[
                { label: "Relação", value: c.perpetrator_relationship, icon: Users },
                { label: "Sexo", value: c.perpetrator_sex, icon: User },
                { label: "Idade", value: c.perpetrator_age, icon: CalendarDays },
                { label: "Número", value: c.perpetrator_count, icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                  <span className="flex items-center gap-2 text-body-sm text-on-surface-variant"><Icon className="w-4 h-4" />{label}</span>
                  <span className="font-medium text-on-surface">{value || "N/A"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-lg border p-5 ${ref.status === "CRITICO" ? "border-critical/30 bg-critical/5" : ref.status === "SEM_REFERENCIA" ? "border-warning/30 bg-warning/5" : "border-primary/30 bg-primary/5"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className={`w-5 h-5 ${ref.status === "CRITICO" ? "text-critical" : ref.status === "SEM_REFERENCIA" ? "text-warning" : "text-primary"}`} />
              <p className={`text-body-sm font-semibold ${ref.status === "CRITICO" ? "text-critical" : ref.status === "SEM_REFERENCIA" ? "text-warning" : "text-primary"}`}>{ref.alert}</p>
            </div>
            <p className="text-caption text-on-surface-variant ml-7">
              {ref.has_referral ? `${ref.days_waiting} dias desde a última referência` : "Nenhuma referência registada ainda"}
            </p>
          </div>

          {/* Sugestões de Referência */}
          {c.district && services && suggestions.length > 0 && (
            <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6">
              <h2 className="text-title-md font-semibold text-on-surface mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Sugestões para {c.district}</h2>
              <div className="space-y-4">
                {suggestions.map((s) => (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-body-sm font-medium text-on-surface">
                        <s.icon className="w-4 h-4 text-primary" /> {s.label}
                      </span>
                      <span className="text-caption text-on-surface-variant">
                        {s.matching.length} {s.matching.length === 1 ? "dispon\u00edvel" : "dispon\u00edveis"}
                      </span>
                    </div>
                    {s.matching.length > 0 ? (
                      <div className="space-y-1.5">
                        {s.matching.slice(0, 2).map((svc) => (
                          <div key={svc.id} className="p-2 rounded-md bg-surface-container text-caption">
                            <p className="font-medium text-on-surface">{svc.organization}</p>
                            <p className="text-on-surface-variant">{svc.focal_point_name}</p>
                            {svc.focal_point_phone && (
                              <a href={`tel:${svc.focal_point_phone}`} className="inline-flex items-center gap-1 text-primary hover:underline mt-0.5">
                                <Phone className="w-3 h-3" /> {svc.focal_point_phone}
                              </a>
                            )}
                          </div>
                        ))}
                        {s.matching.length > 2 && (
                          <p className="text-caption text-on-surface-variant">+{s.matching.length - 2} serviços</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-caption text-on-surface-variant italic">Nenhum serviço disponível neste distrito</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
