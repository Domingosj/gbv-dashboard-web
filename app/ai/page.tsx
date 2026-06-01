"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import GCRCard from "@/components/ui/GCRCard";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

function MarkdownContent({ content, streaming }: { content: string; streaming?: boolean }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-on-surface prose-p:text-on-surface prose-strong:text-on-surface prose-code:text-primary prose-code:bg-surface-container prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-container prose-pre:border prose-pre:border-outline-variant prose-table:text-body-sm prose-th:bg-surface-container prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-1.5 prose-td:border-b prose-td:border-outline-variant/50 prose-tr:even:bg-surface-container-low prose-a:text-primary prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
      <ReactMarkdown
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-outline-variant">
              <table className="min-w-full divide-y divide-outline-variant/50">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-label-caps text-on-surface-variant bg-surface-container">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-body-sm text-on-surface">{children}</td>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return <code className="text-primary bg-surface-container px-1 py-0.5 rounded text-caption font-mono" {...props}>{children}</code>;
            }
            return (
              <pre className="bg-surface-container border border-outline-variant rounded-lg p-4 overflow-x-auto my-3">
                <code className="text-body-sm font-mono text-on-surface" {...props}>{children}</code>
              </pre>
            );
          },
          a: ({ href, children }) => (
            <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {streaming && <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse" />}
    </div>
  );
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Olá! Sou a **Ana**, assistente especializada em VBG. Posso ajudar com informações sobre os dados do dashboard, boas práticas no acolhimento de sobreviventes, vias de referência, ou responder a perguntas gerais sobre violência baseada no género em Moçambique. O que precisas?"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: q };
    const assistantMsg: Message = { role: "assistant", content: "", streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        const text = await res.text();
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: text, streaming: false };
          return copy;
        });
        return;
      }

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        fullText += text;
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: fullText, streaming: true };
          }
          return copy;
        });
      }

      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last.role === "assistant") {
          copy[copy.length - 1] = { ...last, content: fullText, streaming: false };
        }
        return copy;
      });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last.role === "assistant") {
          copy[copy.length - 1] = { ...last, content: `*Erro: ${err.message}*`, streaming: false };
        }
        return copy;
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-page-title text-on-surface mb-1">Assistente IA</h1>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Assistente com acesso aos dados reais do dashboard via OpenRouter
      </p>

      <GCRCard>
        <div className="h-[600px] overflow-y-auto space-y-4 pr-2 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                m.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-surface-container-low text-on-surface rounded-bl-md border border-outline-variant"
              }`}>
                {m.role === "user" ? (
                  <p className="text-body whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <MarkdownContent content={m.content} streaming={m.streaming} />
                )}
              </div>
            </div>
          ))}
          <div ref={chatEnd} />
        </div>

        <div className="flex gap-3 border-t border-outline-variant pt-4">
          <input
            type="text"
            placeholder={loading ? "A aguardar resposta..." : "Faça uma pergunta sobre os dados..."}
            className="gcr-input flex-1"
            value={input}
            disabled={loading}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="gcr-btn-primary px-5 py-2 rounded-button text-sm font-medium disabled:opacity-50"
          >
            {loading ? "..." : "Enviar"}
          </button>
        </div>
      </GCRCard>

      <div className="flex flex-wrap gap-2 mt-4">
        {[
          "Resumo dos dados do dashboard",
          "Casos de violência sexual em Nampula",
          "Boas práticas no acolhimento de sobreviventes",
          "O que são vias de referência VBG?",
          "Serviços disponíveis em Cabo Delgado",
          "Tipos de violência mais comuns"
        ].map(s => (
          <button
            key={s}
            onClick={() => setInput(s)}
            className="text-caption px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
