"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  const { data: rawCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: rawOpenCases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("pt-MZ")), 1000);
    return () => clearInterval(t);
  }, []);

  const cases = Array.isArray(rawCases) ? rawCases : [];
  const open = Array.isArray(rawOpenCases) ? rawOpenCases : [];

  const sexData = useMemo(() => {
    if (!cases.length) return [];
    const sex: Record<string, number> = {};
    for (const c of cases) { const x = c.sex || "N/E"; sex[x] = (sex[x] || 0) + 1; }
    return Object.entries(sex).sort((a, b) => b[1] - a[1]);
  }, [cases]);

  const ageData = useMemo(() => {
    if (!cases.length) return [];
    const age: Record<string, number> = {};
    for (const c of cases) { const a = c.age_group || "N/E"; age[a] = (age[a] || 0) + 1; }
    return Object.entries(age).sort((a, b) => b[1] - a[1]);
  }, [cases]);

  const provData = useMemo(() => {
    if (!cases.length) return [];
    const prov: Record<string, number> = {};
    for (const c of cases) { const p = c.province || "N/E"; prov[p] = (prov[p] || 0) + 1; }
    return Object.entries(prov).sort((a, b) => b[1] - a[1]);
  }, [cases]);

  const violData = useMemo(() => {
    if (!open.length) return [];
    const viol: Record<string, number> = {};
    for (const c of open) { const v = c.violence_type_short || c.violence_type || "N/E"; viol[v] = (viol[v] || 0) + 1; }
    return Object.entries(viol).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [open]);

  const mgrData = useMemo(() => {
    if (!open.length) return [];
    const mgr: Record<string, number> = {};
    for (const c of open) { const m = c.case_manager || "Sem gestor"; mgr[m] = (mgr[m] || 0) + 1; }
    return Object.entries(mgr).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [open]);

  const perpData = useMemo(() => {
    if (!open.length) return [];
    const perp: Record<string, number> = {};
    for (const c of open) { const r = c.perpetrator_relationship || "N/E"; perp[r] = (perp[r] || 0) + 1; }
    return Object.entries(perp).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [open]);

  const slides: Slide[] = useMemo(() => {
    if (!cases.length || !open.length) return [];
    return [
    {
      id: "overview",
      label: "Visão Geral",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full gap-8 sm:gap-12">
          <div className="text-6xl sm:text-8xl font-bold text-primary">{cases.length}</div>
          <div className="text-xl sm:text-3xl text-on-surface-variant">Casos Registados</div>
          <div className="grid grid-cols-3 gap-8 sm:gap-16 text-center mt-4">
            <div>
              <div className="text-4xl sm:text-6xl font-bold text-info">{open.length}</div>
              <div className="text-base sm:text-xl text-on-surface-variant mt-2">Abertos</div>
            </div>
            <div>
              <div className="text-4xl sm:text-6xl font-bold text-success">{cases.filter((c: GBVCase) => c.case_status === "Encerrado").length}</div>
              <div className="text-base sm:text-xl text-on-surface-variant mt-2">Encerrados</div>
            </div>
            <div>
              <div className="text-4xl sm:text-6xl font-bold text-critical">{open.filter((c: GBVCase) => c.priority_level === "CRÍTICO").length}</div>
              <div className="text-base sm:text-xl text-on-surface-variant mt-2">Críticos</div>
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
          <MonthlyChart cases={cases} />
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
              <div className="h-5 sm:h-7 bg-surface-container rounded-full overflow-hidden">
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
              <div className="h-5 sm:h-7 bg-surface-container rounded-full overflow-hidden">
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
              <div className="h-5 sm:h-7 bg-surface-container rounded-full overflow-hidden">
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
            <div key={l} className="w-full flex items-center justify-between py-3 border-b border-outline-variant text-lg sm:text-xl">
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
              <div className="h-4 sm:h-5 bg-surface-container rounded-full overflow-hidden">
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
            <div key={l} className="w-full flex items-center justify-between py-3 border-b border-outline-variant text-lg sm:text-xl">
              <span className="truncate mr-4">{l}</span>
              <span className="font-bold">{c}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];
  }, [cases, open, sexData, ageData, provData, violData, mgrData, perpData]);

  const slidesList = slides;
  const totalSlides = slidesList.length;

  const next = useCallback(() => setCurrent(i => (i + 1) % (totalSlides || 1)), [totalSlides]);

  useEffect(() => {
    if (paused || !cases.length || !open.length || totalSlides === 0) return;
    const interval = setInterval(next, 12000);
    return () => clearInterval(interval);
  }, [paused, cases, open, next, totalSlides]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "p") setPaused(p => !p);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") setCurrent(i => (i - 1 + totalSlides) % totalSlides);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, totalSlides]);

  if (!rawCases || !rawOpenCases) return <p className="text-on-surface-variant p-8">Carregando...</p>;

  const slide = slidesList[current];
  const slidesLen = totalSlides;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-6 sm:px-12 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xl sm:text-2xl font-bold text-on-surface">{slide.label}</span>
          <span className="text-base sm:text-lg text-on-surface-variant">{current + 1}/{slidesLen}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base sm:text-lg text-on-surface-variant font-mono">{clock}</span>
          <button onClick={() => setPaused(p => !p)} className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-sm">{paused ? "Continuar" : "Pausar"}</button>
          <button onClick={() => setCurrent((current - 1 + slidesLen) % slidesLen)} className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-lg">‹</button>
          <button onClick={next} className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-lg">›</button>
        </div>
      </div>
      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-8">
        {slide.render(cases, open)}
      </div>
    </div>
  );
}
