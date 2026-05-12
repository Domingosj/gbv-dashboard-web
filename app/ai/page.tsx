"use client";

import useSWR from "swr";
import { useState, useRef, useEffect } from "react";
import { GBVCase } from "@/lib/types";
import { calcStats, getTimeSinceIdentif } from "@/lib/risk-calculator";
import GCRCard from "@/components/ui/GCRCard";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Message {
  role: "user" | "assistant";
  content: string;
}

function answerQuery(query: string, allCases: GBVCase[], openCases: GBVCase[]): string {
  const q = query.toLowerCase();

  if (q.includes("aberto") && (q.includes("quanto") || q.includes("total") || q.includes("conta"))) {
    return `**Casos Abertos:** ${openCases.length} de ${allCases.length} total.\n\n_Taxa de abertura: ${((openCases.length / allCases.length) * 100).toFixed(1)}%_`;
  }

  if (q.includes("crítico") || q.includes("critico") || q.includes("urgente")) {
    const critical = openCases.filter(c => c.priority_level === "CRÍTICO");
    if (critical.length === 0) return "**Nenhum caso crítico** no momento.";
    const top = critical.slice(0, 5).map(c => `• ${c.case_id} — ${c.district || "N/A"} (Risco: ${c.risk_score})`).join("\n");
    return `**${critical.length} casos críticos** necessitam ação imediata:\n\n${top}\n\n_Ver Lista Prioritária para detalhes completos._`;
  }

  if (q.includes("referência") || q.includes("referencia") || q.includes("sem ref")) {
    const noRef = openCases.filter(c => !c.has_referral);
    return `**${noRef.length} casos abertos sem referência** (${((noRef.length / openCases.length) * 100).toFixed(0)}% dos casos abertos).\n\n_Consulte Assistente de Referência para ver serviços disponíveis._`;
  }

  if (q.includes("distrito") || q.includes("regi") || q.includes("província") || q.includes("provincia")) {
    const dist: Record<string, number> = {};
    for (const c of openCases) { const d = c.district || "Desconhecido"; dist[d] = (dist[d] || 0) + 1; }
    const top = Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return `**Casos por Distrito:**\n\n${top.map(([d, n]) => `• ${d}: ${n} casos`).join("\n")}\n\n_Total: ${Object.keys(dist).length} distritos com casos ativos._`;
  }

  if (q.includes("gestor") || q.includes("manager") || q.includes("sobrecarga") || q.includes("carga")) {
    const mgr: Record<string, number> = {};
    for (const c of openCases) { const m = c.case_manager || "Sem gestor"; mgr[m] = (mgr[m] || 0) + 1; }
    const sorted = Object.entries(mgr).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5);
    const overloaded = sorted.filter(([, v]) => v > 15);
    let resp = `**Carga por Gestor:**\n\n${top.map(([m, n]) => `• ${m}: ${n} casos`).join("\n")}`;
    if (overloaded.length > 0) resp += `\n\n**${overloaded.length} gestor(es) com carga elevada** (>15 casos).`;
    return resp;
  }

  if (q.includes("violência") || q.includes("violencia") || q.includes("tipo")) {
    const vt: Record<string, number> = {};
    for (const c of allCases) { const v = c.violence_type_short || c.violence_type || "N/A"; vt[v] = (vt[v] || 0) + 1; }
    const top = Object.entries(vt).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return `**Tipos de Violência (mais comuns):**\n\n${top.map(([v, n]) => `• ${v}: ${n} casos (${((n / allCases.length) * 100).toFixed(1)}%)`).join("\n")}`;
  }

  if (q.includes("tendência") || q.includes("tendencia") || q.includes("evolução") || q.includes("evolucao") || q.includes("mês") || q.includes("mes")) {
    const months: Record<string, number> = {};
    for (const c of allCases) { if (!c.identification_date) continue; const m = c.identification_date.slice(0, 7); months[m] = (months[m] || 0) + 1; }
    const recent = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
    return `**Evolução Mensal (últimos 6 meses):**\n\n${recent.map(([m, n]) => `• ${m}: ${n} casos`).join("\n")}`;
  }

  if (q.includes("criança") || q.includes("crianca") || q.includes("menor") || q.includes("adolescente")) {
    const minors = openCases.filter(c => (c.age_group || "").includes("0-11") || (c.age_group || "").includes("12-17"));
    return `**Menores envolvidos:** ${minors.length} casos ativos.\n\n_Recomenda-se coordenação com serviços de proteção infantil._`;
  }

  if (q.includes("encerrado") || q.includes("fechado") || q.includes("taxa")) {
    const s = calcStats(allCases);
    return `**Taxa de Encerramento:** ${s.total ? ((s.closed / s.total) * 100).toFixed(1) : 0}%\n• ${s.closed} encerrados de ${s.total} total\n• ${s.open} ainda ativos`;
  }

  if (q.includes("ajuda") || q.includes("help") || q.includes("comando") || q.includes("o que pode")) {
    return (
      "**Comandos disponíveis:**\n\n" +
      "• \"casos abertos\" — total de casos ativos\n" +
      "• \"casos críticos\" — lista de prioridade máxima\n" +
      "• \"sem referência\" — casos sem referência\n" +
      "• \"distritos\" — casos por distrito\n" +
      "• \"gestores\" — carga de trabalho por gestor\n" +
      "• \"tipos de violência\" — distribuição\n" +
      "• \"tendência mensal\" — evolução ao longo do tempo\n" +
      "• \"menores\" — casos envolvendo crianças/adolescentes\n" +
      "• \"taxa encerramento\" — taxa de fecho de casos\n\n" +
      "_Dica: Faça perguntas em português sobre os dados do dashboard._"
    );
  }

  return (
    "Não entendi a sua pergunta. Tente:\n\n" +
    "• \"quantos casos abertos?\"\n" +
    "• \"casos críticos\"\n" +
    "• \"sem referência\"\n" +
    "• \"distritos com mais casos\"\n" +
    "• \"carga dos gestores\"\n" +
    "• \"ajuda\" para ver todos os comandos"
  );
}


export default function AIPage() {
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher);
  const { data: openCases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher);
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Olá! Pergunte-me sobre os dados do dashboard. Por exemplo: \"quantos casos abertos?\", \"casos críticos\", ou \"ajuda\" para ver todos os comandos."
  }]);
  const [input, setInput] = useState("");
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function handleSend() {
    const q = input.trim();
    if (!q || !allCases || !openCases) return;
    setMessages(prev => [...prev, { role: "user", content: q }]);
    const response = answerQuery(q, allCases, openCases);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    }, 300);
    setInput("");
  }

  if (!allCases || !openCases) return <p className="text-text-secondary p-8">Carregando...</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-page-title text-text-primary mb-6">Assistente IA</h1>

      <GCRCard>
        <div className="h-[500px] overflow-y-auto space-y-4 pr-2 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-gray-50 text-text-primary rounded-bl-md border border-border"
              }`}>
                <p className="text-body whitespace-pre-line leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          <div ref={chatEnd} />
        </div>

        <div className="flex gap-3 border-t border-border pt-4">
          <input
            type="text"
            placeholder="Faça uma pergunta sobre os dados..."
            className="genesis-input flex-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} className="genesis-btn-primary px-5 py-2 rounded-button text-sm font-medium">
            Enviar
          </button>
        </div>
      </GCRCard>

      <div className="flex flex-wrap gap-2 mt-4">
        {["Quantos casos abertos?", "Casos críticos", "Sem referência", "Distritos com mais casos", "Carga dos gestores", "Tendência mensal"].map(s => (
          <button
            key={s}
            onClick={() => { setInput(s); }}
            className="text-caption px-3 py-1.5 rounded-full bg-gray-100 text-text-secondary hover:bg-gray-200 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
