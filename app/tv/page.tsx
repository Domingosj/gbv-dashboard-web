"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, RefreshCcw } from "lucide-react";

const SCREENS = [
  { path: "/operations", label: "Operações Diárias" },
  { path: "/operations", label: "Carga de Trabalho" },
  { path: "/operations", label: "Risco e Segurança" },
  { path: "/operations", label: "Progresso dos Casos" },
];
const INTERVAL = 15000;

// Tab indices for each screen: daily=0, workload=1, risk=2, progress=3
// The operations page receives tab via query param
const TAB_PARAMS = ["daily", "workload", "risk", "progress"];

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
    router.push(`/operations?tab=${TAB_PARAMS[idx]}`);
  }, [idx, router]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
      <Clock className="w-3.5 h-3.5" />
      <span>{clock}</span>
      <span className="text-white/60">|</span>
      <span>{SCREENS[idx].label}</span>
      <span className="text-white/60">|</span>
      <span className="text-white/60"><RefreshCcw className="w-3 w-3.5 inline" /> {INTERVAL / 1000}s</span>
      <button onClick={() => setIdx(i => (i + 1) % SCREENS.length)}
        className="ml-2 px-2 py-1 bg-white/20 rounded hover:bg-white/30 text-xs">Próximo</button>
    </div>
  );
}
