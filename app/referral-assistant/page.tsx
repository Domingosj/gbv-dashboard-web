"use client";

import useSWR from "swr";
import { useState } from "react";
import { Service, GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ReferralAssistantPage() {
  const { data: services } = useSWR<Service[]>("/api/services", fetcher);
  const { data: cases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  if (!services || !cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const districts = Array.from(new Set(services.map(s => s.district))).sort();
  const categories = Array.from(new Set(services.map(s => s.service_category))).sort();

  let filtered = services;
  if (selectedDistrict) filtered = filtered.filter(s => s.district === selectedDistrict);
  if (selectedCategory) filtered = filtered.filter(s => s.service_category === selectedCategory);

  const openCases = cases.filter(c => c.case_status === "Aberto");

  const serviceNeeds = [
    { label: "Médico", count: openCases.filter(c => !/sim/i.test(c.referred_medical || "")).length, color: "blue" as const },
    { label: "Psicossocial", count: openCases.filter(c => !/sim/i.test(c.referred_psychosocial || "")).length, color: "blue" as const },
    { label: "Polícia", count: openCases.filter(c => !/sim/i.test(c.referred_police || "")).length, color: "blue" as const },
    { label: "Jurídico", count: openCases.filter(c => !/sim/i.test(c.referred_legal || "")).length, color: "blue" as const },
    { label: "Abrigo Seguro", count: openCases.filter(c => !/sim/i.test(c.referred_safe_house || "")).length, color: "blue" as const },
    { label: "Proteção Infantil", count: openCases.filter(c => !/sim/i.test(c.referred_child_protection || "")).length, color: "blue" as const },
  ];

  const districtsWithCases = Array.from(new Set(openCases.map(c => c.district).filter((d): d is string => !!d))).sort();
  const districtCoverage = districtsWithCases.map(d => ({
    district: d,
    caseCount: openCases.filter(c => c.district === d).length,
    serviceCount: services.filter(s => s.district.toLowerCase() === d.toLowerCase()).length,
  })).sort((a, b) => b.caseCount - a.caseCount);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Assistente de Referência</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="Necessidades de Serviço (Casos Abertos)">
          <div className="space-y-3">
            {serviceNeeds.map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-body text-text-secondary">{s.label}</span>
                <span className="font-semibold">{s.count} <span className="text-caption text-text-secondary">necessitam</span></span>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Cobertura por Distrito">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {districtCoverage.map(d => (
              <div key={d.district} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div>
                  <span className="text-body font-medium">{d.district}</span>
                  <span className="text-caption text-text-secondary ml-2">{d.caseCount} casos</span>
                </div>
                <GCRBadge color={d.serviceCount > 0 ? "green" : "red"}>
                  {d.serviceCount > 0 ? `${d.serviceCount} serviços` : "Sem serviços"}
                </GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>

      <GCRCard title="Catálogo de Serviços">
        <div className="flex gap-4 mb-4">
          <select className="genesis-input w-64" value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}>
            <option value="">Todos os distritos</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="genesis-input w-64" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-label text-text-secondary self-center">{filtered.length} serviços</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Organização</th>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Categoria</th>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Tipo</th>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Distrito</th>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.organization}</td>
                  <td className="px-4 py-3"><GCRBadge color="blue">{s.service_category}</GCRBadge></td>
                  <td className="px-4 py-3 text-text-secondary">{s.service_type}</td>
                  <td className="px-4 py-3">{s.district}</td>
                  <td className="px-4 py-3">
                    <span className="text-caption">{s.focal_point_name}: {s.focal_point_phone}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GCRCard>
    </div>
  );
}
