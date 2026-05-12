"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { MonthlyChart } from "@/components/Charts";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Slide = {
  id: string;
  label: string;
  render: (cases: GBVCase[], open: GBVCase[]) => React.ReactNode;
};

export default function CarouselPage() {
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: openCases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("pt-MZ")), 1000);
    return () => clearInterval(t);
  }, []);

  const next = useCallback(() => setCurrent(i => (i + 1) % slides.length), []);

  useEffect(() => {
    if (paused || !allCases || !openCases) return;
    const interval = setInterval(next, 12000);
    return () => clearInterval(interval);
  }, [paused, allCases, openCases, next]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "p") setPaused(p => !p);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") setCurrent(i => (i - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next]);

  if (!allCases || !openCases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const open = openCases;

  const sex: Record<string, number> = {};
  for (const c of allCases) { const x = c.sex || "N/E"; sex[x] = (sex[x] || 0) + 1; }
  const sexData = Object.entries(sex).sort((a, b) => b[1] - a[1]);

  const age: Record<string, number> = {};
  for (const c of allCases) { const a = c.age_group || "N/E"; age[a] = (age[a] || 0) + 1; }
  const ageData = Object.entries(age).sort((a, b) => b[1] - a[1]);

  const prov: Record<string, number> = {};
  for (const c of allCases) { const p = c.province || "N/E"; prov[p] = (prov[p] || 0) + 1; }
  const provData = Object.entries(prov).sort((a, b) => b[1] - a[1]);

  const viol: Record<string, number> = {};
  for (const c of open) { const v = c.violence_type_short || c.violence_type || "N/E"; viol[v] = (viol[v] || 0) + 1; }
  const violData = Object.entries(viol).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const mgr: Record<string, number> = {};
  for (const c of open) { const m = c.case_manager || "Sem gestor"; mgr[m] = (mgr[m] || 0) + 1; }
  const mgrData = Object.entries(mgr).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const perp: Record<string, number> = {};
  for (const c of open) { const r = c.perpetrator_relationship || "N/E"; perp[r] = (perp[r] || 0) + 1; }
  const perpData = Object.entries(perp).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const slides: Slide[] = [
    {
      id: "overview",
      label: "Visão Geral",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full gap-8 sm:gap-12">
          <div className="text-6xl sm:text-8xl font-bold text-primary">{allCases.length}</div>
          <div className="text-xl sm:text-3xl text-text-secondary">Casos Registados</div>
          <div className="grid grid-cols-3 gap-8 sm:gap-16 text-center mt-4">
            <div>
              <div className="text-4xl sm:text-6xl font-bold text-info">{open.length}</div>
              <div className="text-base sm:text-xl text-text-secondary mt-2">Abertos</div>
            </div>
            <div>
              <div className="text-4xl sm:text-6xl font-bold text-success">{allCases.filter(c => c.case_status === "Encerrado").length}</div>
              <div className="text-base sm:text-xl text-text-secondary mt-2">Encerrados</div>
            </div>
            <div>
              <div className="text-4xl sm:text-6xl font-bold text-critical">{open.filter(c => c.priority_level === "CRÍTICO").length}</div>
              <div className="text-base sm:text-xl text-text-secondary mt-2">Críticos</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "trend",
      label: "Casos por Mês",
      render: () => (
        <div className="h-full w-full max-w-5xl mx-auto px-4">
          <MonthlyChart cases={allCases} />
        </div>
      ),
    },
    {
      id: "sex",
      label: "Casos por Sexo",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full gap-4 sm:gap-6 max-w-lg mx-auto w-full px-4">
          {sexData.map(([l, c], i) => (
            <div key={l} className="w-full">
              <div className="flex justify-between text-lg sm:text-xl mb-2"><span>{l}</span><span className="font-bold">{c}</span></div>
              <div className="h-5 sm:h-7 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(c / sexData[0][1]) * 100}%`, backgroundColor: i === 0 ? "#256B5A" : "#5E9C8A" }} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "age",
      label: "Faixa Etária",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full gap-4 max-w-lg mx-auto w-full px-4">
          {ageData.map(([l, c]) => (
            <div key={l} className="w-full">
              <div className="flex justify-between text-lg sm:text-xl mb-2"><span>{l}</span><span className="font-bold">{c}</span></div>
              <div className="h-5 sm:h-7 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-info" style={{ width: `${(c / ageData[0][1]) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "province",
      label: "Casos por Província",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full gap-4 max-w-lg mx-auto w-full px-4">
          {provData.map(([l, c]) => (
            <div key={l} className="w-full">
              <div className="flex justify-between text-lg sm:text-xl mb-2"><span>{l}</span><span className="font-bold">{c}</span></div>
              <div className="h-5 sm:h-7 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(c / provData[0][1]) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "violence",
      label: "Tipos de Violência",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full gap-4 max-w-lg mx-auto w-full px-4">
          {violData.map(([l, c]) => (
            <div key={l} className="w-full flex items-center justify-between py-3 border-b border-border text-lg sm:text-xl">
              <span>{l}</span>
              <span className="font-bold">{c}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "workload",
      label: "Carga por Gestor",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full gap-3 max-w-lg mx-auto w-full px-4">
          {mgrData.map(([l, c]) => (
            <div key={l} className="w-full">
              <div className="flex justify-between text-base sm:text-lg mb-1"><span>{l}</span><span className="font-bold">{c}</span></div>
              <div className="h-4 sm:h-5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(c / mgrData[0][1]) * 100}%`, backgroundColor: c > 15 ? "#C65A5A" : "#256B5A" }} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "perpetrator",
      label: "Relação com Perpetrador",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full gap-4 max-w-lg mx-auto w-full px-4">
          {perpData.map(([l, c]) => (
            <div key={l} className="w-full flex items-center justify-between py-3 border-b border-border text-lg sm:text-xl">
              <span className="truncate mr-4">{l}</span>
              <span className="font-bold">{c}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const slide = slides[current];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-6 sm:px-12 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xl sm:text-2xl font-bold text-text-primary">{slide.label}</span>
          <span className="text-base sm:text-lg text-text-secondary">{current + 1}/{slides.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base sm:text-lg text-text-secondary font-mono">{clock}</span>
          <button onClick={() => setPaused(p => !p)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-text-secondary hover:bg-gray-200 text-sm">{paused ? "Continuar" : "Pausar"}</button>
          <button onClick={() => setCurrent((current - 1 + slides.length) % slides.length)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-text-secondary hover:bg-gray-200 text-lg">‹</button>
          <button onClick={next} className="px-3 py-1.5 rounded-lg bg-gray-100 text-text-secondary hover:bg-gray-200 text-lg">›</button>
        </div>
      </div>
      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-8">
        {slide.render(allCases, open)}
      </div>
    </div>
  );
}
