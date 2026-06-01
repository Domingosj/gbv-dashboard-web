"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import ModuleTabs from "@/components/ModuleTabs";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Search, Phone, Mail, MapPin, Building2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { uniqueStrings } from "@/lib/utils";

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

const TABS = [
  { key: "explorer", label: "Explorador de Servi\u00e7os" },
  { key: "coverage", label: "Cobertura" },
];

function ServiceCard({ s }: { s: Service }) {
  return (
    <div className="gcr-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="text-body-sm font-semibold text-on-surface truncate">{s.organization}</p>
          <p className="text-caption text-on-surface-variant">{s.service_category}</p>
        </div>
        <GCRBadge color={s.district ? "blue" : "grey"}>{s.district || "N/A"}</GCRBadge>
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 text-caption text-on-surface-variant">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{s.province}, {s.district || "N/A"}</span>
        </div>
        {s.focal_point_name && (
          <div className="flex items-center gap-1.5 text-caption text-on-surface-variant">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{s.focal_point_name}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {s.focal_point_phone && (
          <a href={`tel:${s.focal_point_phone}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-caption font-medium hover:bg-primary/20 transition-colors">
            <Phone className="w-3 h-3" /> {s.focal_point_phone}
          </a>
        )}
        {s.focal_point_email && (
          <a href={`mailto:${s.focal_point_email}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-caption font-medium hover:bg-primary/20 transition-colors">
            <Mail className="w-3 h-3" /> Email
          </a>
        )}
      </div>
    </div>
  );
}

export default function ReferralPathwaysPage() {
  const [tab, setTab] = useState("explorer");
  const [search, setSearch] = useState("");
  const [provFilter, setProvFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const { data: services } = useSWR<Service[]>("/api/services", fetcher, { refreshInterval: 300000 });

  // Hooks must be called before any early return
  const filtered = useMemo(() => {
    if (!services) return [];
    let r = [...services];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(s =>
        [s.organization, s.service_category, s.service_type, s.district, s.province, s.focal_point_name]
          .some(v => (v || "").toLowerCase().includes(q))
      );
    }
    if (provFilter) r = r.filter(s => s.province === provFilter);
    if (catFilter) r = r.filter(s => s.service_category === catFilter);
    return r;
  }, [services, search, provFilter, catFilter]);

  const byProvince = useMemo(() => {
    if (!services) return [];
    const m: Record<string, number> = {};
    for (const s of services) {
      m[s.province] = (m[s.province] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [services]);

  const byDistrict = useMemo(() => {
    if (!services) return [];
    const m: Record<string, { total: number; categories: Set<string> }> = {};
    for (const s of services) {
      const key = `${s.province} > ${s.district}`;
      if (!m[key]) m[key] = { total: 0, categories: new Set() };
      m[key].total++;
      m[key].categories.add(s.service_category);
    }
    return Object.entries(m)
      .map(([k, v]) => ({ key: k, total: v.total, categories: v.categories.size }))
      .sort((a, b) => a.total - b.total);
  }, [services]);

  if (!services) {
    return <p className="text-on-surface-variant p-8">Carregando...</p>;
  }

  const provinces = uniqueStrings(services.map(s => s.province));
  const categories = uniqueStrings(services.map(s => s.service_category));

  const totalDistricts = byDistrict.length;
  const districtsWithSingleService = byDistrict.filter(d => d.total === 1).length;
  const allCategories = new Set(services.map(s => s.service_category));

  const COVERAGE_COLORS = ["#D34053", "#FFA70B", "#005243", "#166965", "#644119", "#90d4bf", "#6f7975"];

  return (
    <div>
      <h1 className="text-page-title text-on-surface mb-1">Vias de Referência</h1>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Catálogo nacional de serviços para referência de casos VBG
      </p>

      <ModuleTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />

      {tab === "explorer" && (
        <div>
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input
                  type="text"
                  placeholder="Pesquisar por organiza\u00e7\u00e3o, distrito, categoria..."
                  className="gcr-input pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <select className="gcr-input w-44" value={provFilter} onChange={e => setProvFilter(e.target.value)}>
              <option value="">Todas as províncias</option>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="gcr-input w-48" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">Todas as categorias</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="text-label text-on-surface-variant self-center whitespace-nowrap">
              {filtered.length} serviços
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-outline mb-3" />
              <p className="text-body-sm text-on-surface-variant">Nenhum serviço encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(s => (
                <ServiceCard key={s.id} s={s} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "coverage" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total de Servi\u00e7os", value: services.length, icon: Building2, color: "text-primary" },
              { label: "Prov\u00edncias", value: provinces.length, icon: MapPin, color: "text-primary" },
              { label: "Distritos Cobertos", value: totalDistricts, icon: CheckCircle2, color: "text-success" },
              { label: "Distritos Cr\u00edticos", value: districtsWithSingleService, icon: AlertTriangle, color: "text-critical" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="gcr-card p-4 text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                <p className="text-metric font-bold text-on-surface">{value}</p>
                <p className="text-caption text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>

          <GCRCard title="Servi\u00e7os por Prov\u00edncia">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byProvince.map(([p, c]) => ({ name: p, count: c }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#6f7975" }} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 12, fill: "#191c1e" }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {byProvince.map((_, i) => (
                    <Cell key={i} fill={COVERAGE_COLORS[i % COVERAGE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GCRCard>

          <GCRCard title="Cobertura por Distrito">
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="text-left px-3 py-2.5 text-label-caps text-on-surface-variant">Distrito</th>
                    <th className="text-center px-3 py-2.5 text-label-caps text-on-surface-variant">Serviços</th>
                    <th className="text-center px-3 py-2.5 text-label-caps text-on-surface-variant">Categorias</th>
                    <th className="text-center px-3 py-2.5 text-label-caps text-on-surface-variant">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {byDistrict.map((d) => (
                    <tr key={d.key} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-3 py-2.5 text-on-surface">{d.key}</td>
                      <td className="px-3 py-2.5 text-center font-semibold">{d.total}</td>
                      <td className="px-3 py-2.5 text-center text-on-surface-variant">{d.categories} / {allCategories.size}</td>
                      <td className="px-3 py-2.5 text-center">
                        {d.total === 0 ? (
                          <GCRBadge color="red">Sem serviços</GCRBadge>
                        ) : d.total === 1 ? (
                          <GCRBadge color="amber">Cr\u00edtico</GCRBadge>
                        ) : d.total <= 3 ? (
                          <GCRBadge color="blue">Limitado</GCRBadge>
                        ) : (
                          <GCRBadge color="green">Adequado</GCRBadge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GCRCard>
        </div>
      )}
    </div>
  );
}
