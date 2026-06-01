"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { MonthlyChart } from "@/components/Charts";
import {
  ChevronLeft, ChevronRight, Pause, Play,
  Maximize2, Minimize2, X,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());
const INTERVAL = 12000;

// ── helpers ──────────────────────────────────────────────────────────────────

function SlideHeading({ title }: { title: string }) {
  return (
    <p className="text-2xl font-semibold text-on-surface-variant mb-6 text-center tracking-wide uppercase">
      {title}
    </p>
  );
}

function BigBar({ label, value, max, pct, color = "#005243" }: {
  label: string; value: number; max: number; pct?: number; color?: string;
}) {
  const w = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xl text-on-surface truncate mr-4">{label}</span>
        <span className="text-xl font-bold text-on-surface shrink-0">
          {value}{pct !== undefined ? <span className="text-base font-normal text-on-surface-variant ml-2">({pct.toFixed(0)}%)</span> : null}
        </span>
      </div>
      <div className="h-6 bg-surface-container rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function CarouselPage() {
  const router = useRouter();
  const { data: rawCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: rawOpenCases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [paused, setPaused] = useState(false);
  const [clock, setClock] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [provFilter, setProvFilter] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("pt-MZ")), 1000);
    return () => clearInterval(t);
  }, []);

  // Track fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const allCases = Array.isArray(rawCases) ? rawCases : [];
  const allOpen  = Array.isArray(rawOpenCases) ? rawOpenCases : [];

  // Province filter
  const provinces = useMemo(
    () => Array.from(new Set(allCases.map(c => c.province).filter(Boolean))).sort() as string[],
    [allCases]
  );
  const cases = useMemo(
    () => provFilter ? allCases.filter(c => c.province === provFilter) : allCases,
    [allCases, provFilter]
  );
  const open = useMemo(
    () => provFilter ? allOpen.filter(c => c.province === provFilter) : allOpen,
    [allOpen, provFilter]
  );

  // Pre-compute slide data
  const sexData = useMemo(() => {
    const m: Record<string, number> = { Feminino: 0, Masculino: 0 };
    for (const c of cases) {
      if (!c.sex) continue;
      if (/femenino|feminino/i.test(c.sex)) m.Feminino++;
      else if (/masculino/i.test(c.sex)) m.Masculino++;
    }
    return Object.entries(m).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  }, [cases]);

  const ageData = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of cases) { const a = c.age_group || "N/E"; m[a] = (m[a] || 0) + 1; }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [cases]);

  const provData = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of cases) { if (c.province) { m[c.province] = (m[c.province] || 0) + 1; } }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [cases]);

  const violData = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of open) { const v = c.violence_type_short || c.violence_type; if (v) { m[v] = (m[v] || 0) + 1; } }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [open]);

  const perpData = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of open) { if (c.perpetrator_relationship) { m[c.perpetrator_relationship] = (m[c.perpetrator_relationship] || 0) + 1; } }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [open]);

  const noRefCount = useMemo(() => open.filter(c => !c.has_referral).length, [open]);
  const criticalCount = useMemo(() => open.filter(c => c.priority_level === "CRÍTICO").length, [open]);
  const closedCount = useMemo(() => cases.filter(c => c.case_status === "Encerrado").length, [cases]);
  const unsafeCount = useMemo(
    () => open.filter(c => /^n[ãa]o$/i.test((c.is_safe || "").trim())).length,
    [open]
  );

  // ── slides ──────────────────────────────────────────────────────────────────

  const slides = useMemo(() => {
    if (!cases.length) return [];
    const total = cases.length;
    const openTotal = open.length;

    return [
      {
        id: "overview",
        label: "Visão Geral",
        content: (
          <div className="flex flex-col items-center justify-center h-full gap-10">
            <SlideHeading title="Visão Geral" />
            <div className="text-[9rem] font-extrabold text-primary leading-none">{total}</div>
            <div className="text-3xl text-on-surface-variant">Casos Registados</div>
            <div className="grid grid-cols-3 gap-16 text-center mt-4">
              {[
                { label: "Abertos",    value: openTotal,    color: "text-info" },
                { label: "Encerrados", value: closedCount,  color: "text-success" },
                { label: "Críticos",   value: criticalCount, color: "text-critical" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className={`text-7xl font-bold ${color}`}>{value}</div>
                  <div className="text-2xl text-on-surface-variant mt-3">{label}</div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "referral",
        label: "Referências e Segurança",
        content: (
          <div className="flex flex-col items-center justify-center h-full gap-8 w-full max-w-2xl mx-auto">
            <SlideHeading title="Referências e Segurança" />
            <div className="grid grid-cols-2 gap-10 w-full">
              {[
                { label: "Sem Referência",  value: noRefCount,      pct: openTotal > 0 ? (noRefCount / openTotal) * 100 : 0,      color: "#D9A441" },
                { label: "Não Seguras",     value: unsafeCount,     pct: openTotal > 0 ? (unsafeCount / openTotal) * 100 : 0,     color: "#C65A5A" },
                { label: "Casos Abertos",   value: openTotal,       pct: total > 0 ? (openTotal / total) * 100 : 0,               color: "#005243" },
                { label: "Taxa Encerram.",  value: closedCount,     pct: total > 0 ? (closedCount / total) * 100 : 0,             color: "#2E8B57" },
              ].map(({ label, value, pct, color }) => (
                <div key={label} className="flex flex-col items-center justify-center p-8 rounded-2xl bg-surface-container-low border border-outline-variant">
                  <div className="text-6xl font-extrabold mb-2" style={{ color }}>{value}</div>
                  <div className="text-xl text-on-surface-variant text-center">{label}</div>
                  <div className="text-lg font-semibold mt-1" style={{ color }}>{pct.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "trend",
        label: "Casos por Mês",
        content: (
          <div className="h-full w-full max-w-5xl mx-auto flex flex-col">
            <SlideHeading title="Casos por Mês" />
            <div className="flex-1">
              <MonthlyChart cases={cases} />
            </div>
          </div>
        ),
      },
      {
        id: "sex",
        label: "Casos por Sexo",
        content: (
          <div className="flex flex-col items-center justify-center h-full gap-6 max-w-xl mx-auto w-full">
            <SlideHeading title="Casos por Sexo" />
            {sexData.map(([l, c], i) => (
              <BigBar key={l} label={l} value={c} max={sexData[0]?.[1] || 1}
                pct={total > 0 ? (c / total) * 100 : 0}
                color={i === 0 ? "#E91E8C" : "#2563EB"} />
            ))}
          </div>
        ),
      },
      {
        id: "age",
        label: "Faixa Etária",
        content: (
          <div className="flex flex-col items-center justify-center h-full gap-5 max-w-xl mx-auto w-full">
            <SlideHeading title="Faixa Etária" />
            {ageData.map(([l, c]) => (
              <BigBar key={l} label={l} value={c} max={ageData[0]?.[1] || 1}
                pct={total > 0 ? (c / total) * 100 : 0}
                color="#166965" />
            ))}
          </div>
        ),
      },
      {
        id: "province",
        label: "Casos por Província",
        content: (
          <div className="flex flex-col items-center justify-center h-full gap-5 max-w-xl mx-auto w-full">
            <SlideHeading title="Casos por Província" />
            {provData.map(([l, c]) => (
              <BigBar key={l} label={l} value={c} max={provData[0]?.[1] || 1}
                pct={total > 0 ? (c / total) * 100 : 0}
                color="#005243" />
            ))}
          </div>
        ),
      },
      {
        id: "violence",
        label: "Tipos de Violência",
        content: (
          <div className="flex flex-col items-center justify-center h-full gap-5 max-w-2xl mx-auto w-full">
            <SlideHeading title="Tipos de Violência (casos abertos)" />
            {violData.map(([l, c]) => (
              <BigBar key={l} label={l} value={c} max={violData[0]?.[1] || 1}
                pct={openTotal > 0 ? (c / openTotal) * 100 : 0}
                color="#C65A5A" />
            ))}
          </div>
        ),
      },
      {
        id: "perpetrator",
        label: "Relação com Perpetrador",
        content: (
          <div className="flex flex-col items-center justify-center h-full gap-5 max-w-2xl mx-auto w-full">
            <SlideHeading title="Relação com Perpetrador" />
            {perpData.map(([l, c]) => (
              <BigBar key={l} label={l} value={c} max={perpData[0]?.[1] || 1}
                pct={openTotal > 0 ? (c / openTotal) * 100 : 0}
                color="#644119" />
            ))}
          </div>
        ),
      },
    ];
  }, [cases, open, sexData, ageData, provData, violData, perpData,
      noRefCount, criticalCount, closedCount, unsafeCount]);

  const total = slides.length;

  const go = useCallback((idx: number, dir: "next" | "prev") => {
    setDirection(dir);
    setCurrent(idx);
  }, []);

  const next = useCallback(() => go((current + 1) % (total || 1), "next"), [current, total, go]);
  const prev = useCallback(() => go((current - 1 + total) % (total || 1), "prev"), [current, total, go]);

  // Autoplay
  useEffect(() => {
    if (paused || total === 0) return;
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [paused, next, total]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "p") setPaused(p => !p);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "Escape" && !document.fullscreenElement) router.push("/summary");
      if (e.key === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, router, toggleFullscreen]);

  if (!rawCases || !rawOpenCases) {
    return <p className="text-on-surface-variant p-8">Carregando...</p>;
  }

  const slide = slides[current];

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-white flex flex-col select-none">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-outline-variant shrink-0 bg-white">

        {/* Logo */}
        <Image src="/gcr-logo.png" alt="GCR" width={120} height={32} className="object-contain object-left shrink-0" priority />

        <div className="w-px h-8 bg-outline-variant shrink-0" />

        {/* Province filter */}
        <select
          value={provFilter}
          onChange={e => { setProvFilter(e.target.value); setCurrent(0); }}
          className="text-sm border border-outline-variant rounded-lg px-3 py-1.5 bg-white text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Todas as províncias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <div className="w-px h-8 bg-outline-variant shrink-0" />

        {/* Slide title + counter */}
        <span className="text-lg font-semibold text-on-surface truncate">{slide?.label}</span>
        <span className="text-sm text-on-surface-variant shrink-0">{current + 1} / {total}</span>

        {/* Dot indicators */}
        <div className="flex gap-1.5 items-center flex-1 justify-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i, i > current ? "next" : "prev")}
              className={`rounded-full transition-all duration-200 ${
                i === current ? "bg-primary w-6 h-2" : "bg-surface-container-highest w-2 h-2 hover:bg-primary/40"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Clock */}
        <span className="text-sm text-on-surface-variant font-mono shrink-0">{clock}</span>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant" title="Anterior (←)">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant" title="Pausar (Space)">
            {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button onClick={next} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant" title="Próximo (→)">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-outline-variant mx-1" />
          <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant" title="Ecrã inteiro (F)">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={() => router.push("/summary")} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant" title="Sair (Esc)">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div className="h-1 bg-surface-container shrink-0 overflow-hidden">
        <div
          key={`${current}-${paused}`}
          className="h-full bg-primary"
          style={paused ? { width: "0%" } : {
            animation: `progressAdvance ${INTERVAL}ms linear forwards`,
          }}
        />
      </div>

      {/* ── Slide content ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative">
        {slide && (
          <div
            key={current}
            className="absolute inset-0 flex items-center justify-center px-8 py-6"
            style={{
              animation: `${direction === "next" ? "slideInRight" : "slideInLeft"} 0.35s ease-out`,
            }}
          >
            {slide.content}
          </div>
        )}
      </div>
    </div>
  );
}
