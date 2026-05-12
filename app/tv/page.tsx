"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SCREENS = [
  { path: "/daily-operations", label: "Operações Diárias" },
  { path: "/workload", label: "Carga de Trabalho" },
  { path: "/risk-safety", label: "Risco e Segurança" },
  { path: "/case-progress", label: "Progresso dos Casos" },
];
const INTERVAL = 15000;

export default function TVPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = setInterval(() => setClock(new Date().toLocaleTimeString("pt-MZ")), 1000);
    const rot = setInterval(() => setIdx(i => (i + 1) % SCREENS.length), INTERVAL);
    return () => { clearInterval(tick); clearInterval(rot); };
  }, []);

  useEffect(() => {
    router.push(SCREENS[idx].path);
  }, [idx, router]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
      <span>{clock}</span>
      <span className="text-white/60">|</span>
      <span>{SCREENS[idx].label}</span>
      <span className="text-white/60">|</span>
      <span className="text-white/60">⏎ {INTERVAL / 1000}s</span>
      <button onClick={() => setIdx(i => (i + 1) % SCREENS.length)}
        className="ml-2 px-2 py-1 bg-white/20 rounded hover:bg-white/30 text-xs">Próximo</button>
    </div>
  );
}
