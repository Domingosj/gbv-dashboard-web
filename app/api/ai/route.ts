import { NextRequest } from "next/server";
import { OpenRouter } from "@openrouter/sdk";
import { fetchAllCases } from "@/lib/activityinfo";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

interface ServiceRow {
  organization: string;
  service_category: string;
  province: string;
  district: string;
  focal_point_name: string;
  focal_point_phone: string;
}

function loadServices(): ServiceRow[] {
  try {
    const csvPath = path.join(process.cwd(), "data", "services_cleaned.csv");
    const csv = fs.readFileSync(csvPath, "utf-8");
    const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
    return data as ServiceRow[];
  } catch {
    return [];
  }
}

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "query_cases",
      description: "Faz filtros flexíveis nos dados de casos VBG (ActivityInfo). Devolve casos filtrados ou agregações.",
      parameters: {
        type: "object",
        properties: {
          province: { type: "string", description: "Filtrar por província (ex: Cabo Delgado, Nampula, Gaza)" },
          district: { type: "string", description: "Filtrar por distrito" },
          violence_type: { type: "string", description: "Filtrar por tipo de violência (ex: Violência Sexual, Agressão Física)" },
          status: { type: "string", description: "Filtrar por estado do caso (Aberto, Encerrado)" },
          priority: { type: "string", description: "Filtrar por prioridade (CRÍTICO, ALTO, MÉDIO, BAIXO)" },
          age_group: { type: "string", description: "Filtrar por faixa etária (ex: 18-25, 26-35)" },
          case_manager: { type: "string", description: "Filtrar por gestor de caso" },
          days_since_identification: { type: "number", description: "Máximo de dias desde identificação (ex: 30 para último mês)" },
          group_by: { type: "string", description: "Agrupar resultados por (province, district, violence_type, status, priority, age_group)" },
          limit: { type: "number", description: "Limite de resultados (máx 100, default 20)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_services",
      description: "Pesquisa serviços disponíveis no catálogo por província, distrito ou tipo de serviço.",
      parameters: {
        type: "object",
        properties: {
          province: { type: "string", description: "Filtrar por província" },
          district: { type: "string", description: "Filtrar por distrito" },
          category: { type: "string", description: "Categoria do serviço (ex: Saúde, Proteção, VBG)" },
        },
        required: [],
      },
    },
  },
];

function queryCases(args: any, allCases: any[], openCases: any[]): string {
  let filtered = allCases;

  if (args.province) {
    const q = args.province.toLowerCase();
    filtered = filtered.filter((c: any) => (c.province || "").toLowerCase().includes(q));
  }
  if (args.district) {
    const q = args.district.toLowerCase();
    filtered = filtered.filter((c: any) => (c.district || "").toLowerCase().includes(q));
  }
  if (args.violence_type) {
    const q = args.violence_type.toLowerCase();
    filtered = filtered.filter((c: any) =>
      ((c.violence_type_short || c.violence_type || "")).toLowerCase().includes(q)
    );
  }
  if (args.status) {
    const q = args.status.toLowerCase();
    filtered = filtered.filter((c: any) => (c.case_status || "").toLowerCase().includes(q));
  }
  if (args.priority) {
    const q = args.priority.toLowerCase();
    filtered = filtered.filter((c: any) => (c.priority_level || "").toLowerCase().includes(q));
  }
  if (args.age_group) {
    const q = args.age_group.toLowerCase();
    filtered = filtered.filter((c: any) => (c.age_group || "").toLowerCase().includes(q));
  }
  if (args.case_manager) {
    const q = args.case_manager.toLowerCase();
    filtered = filtered.filter((c: any) => (c.case_manager || "").toLowerCase().includes(q));
  }
  if (args.days_since_identification) {
    const now = Date.now();
    const threshold = args.days_since_identification * 86400000;
    filtered = filtered.filter((c: any) =>
      c.identification_date && (now - new Date(c.identification_date).getTime()) < threshold
    );
  }

  const limit = args.limit || 20;

  if (args.group_by) {
    const grouped: Record<string, number> = {};
    for (const c of filtered) {
      const key = c[args.group_by] || "N/A";
      grouped[key] = (grouped[key] || 0) + 1;
    }
    return JSON.stringify(Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, limit));
  }

  return JSON.stringify(
    filtered.slice(0, limit).map((c: any) => ({
      case_id: c.case_id,
      province: c.province,
      district: c.district,
      violence_type: c.violence_type_short || c.violence_type,
      status: c.case_status,
      priority: c.priority_level,
      risk_score: c.risk_score,
      age_group: c.age_group,
      case_manager: c.case_manager,
      days_open: c.days_since_identification,
      has_referral: c.has_referral,
    }))
  );
}

function queryServices(args: any, services: ServiceRow[]): string {
  let filtered = services;

  if (args.province) {
    const q = args.province.toLowerCase();
    filtered = filtered.filter(s => (s.province || "").toLowerCase().includes(q));
  }
  if (args.district) {
    const q = args.district.toLowerCase();
    filtered = filtered.filter(s => (s.district || "").toLowerCase().includes(q));
  }
  if (args.category) {
    const q = args.category.toLowerCase();
    filtered = filtered.filter(s => (s.service_category || "").toLowerCase().includes(q));
  }

  return JSON.stringify(
    filtered.slice(0, 30).map(s => ({
      organization: s.organization,
      category: s.service_category,
      province: s.province,
      district: s.district,
      contact: s.focal_point_name,
      phone: s.focal_point_phone,
    }))
  );
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "sk-or-v1-your_key_here") {
      return new Response(
        JSON.stringify({ error: "OpenRouter API key not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const [allCases, services] = await Promise.all([
      fetchAllCases().catch(() => []),
      Promise.resolve(loadServices()),
    ]);

    const SYSTEM_PROMPT = `Tu és a Ana, assistente especializada em Violência Baseada no Gênero (VBG) em Moçambique.

A tua personalidade:
- Profissional e acolhedora (contexto humanitário)
- Responde em português de Moçambique (pt-MZ)
- Conversacional e natural — não és um robô de dashboard
- Tens liberdade para dar a melhor resposta possível

O QUE SABES FAZER:
1. És uma especialista em VBG — podes responder a qualquer pergunta sobre:
   - Boas práticas no acolhimento de sobreviventes (abordagem centrada na sobrevivente)
   - Vias de referência (saúde, psicossocial, polícia, jurídico, abrigo)
   - Tipos de violência (física, sexual, psicológica, económica)
   - Protocolos e normas (GBVIMS, Diretrizes do GBV AoR, OMS)
   - Prevenção e resposta à VBG em contextos humanitários
   - Leis e proteção em Moçambique

2. TENS ACESSO AOS DADOS REAIS DO DASHBOARD através das funções disponíveis.
   - Quando o user perguntar sobre números, casos, estatísticas — USA AS FUNÇÕES
   - Podes fazer perguntas complexas como "casos de violência sexual em Nampula no último mês"
   - A função query_cases é flexível — usa os filtros que precisares

3. Podes combinar o teu conhecimento com os dados. Exemplo:
   "Em Nampula há X casos de violência sexual. Segundo as boas práticas do GBV AoR, recomenda-se..."

FORMATAÇÃO DAS RESPOSTAS (IMPORTANTE):
- Usa markdown para apresentar dados de forma visualmente organizada
- Tabelas: quando apresentares múltiplos casos ou comparar dados por província/distrito/tipo. Ex:
  | Província | Casos | %
  | Cabo Delgado | 283 | 20%
  | Tete | 620 | 43%
- Listas: para enumerar itens, boas práticas, recomendações
- Negrito (**) para destacar números e termos importantes
- Cabeçalhos (## ou ###) para separar secções temáticas
- Citações (>) para destacar recomendações ou notas importantes
- Mantém o design limpo e escaneável — não sobrecarregues com formatação excessiva

REGRAS:
- NÃO te limites a responder com dados do dashboard. Usa o teu conhecimento geral sobre VBG
- Se o user disser "olá" — cumprimenta de forma natural, não despejes dados
- Sê concisa mas completa — máximo 4 parágrafos (ou mais se usares tabelas)
- Se não souberes algum dado específico, usa as funções para pesquisar`;

    const openrouter = new OpenRouter({ apiKey });

    const firstResponse = await openrouter.chat.send({
      chatRequest: {
        model: "openrouter/auto",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        tools: TOOLS,
        stream: false,
      },
    });

    const msg = (firstResponse as any).choices?.[0]?.message;
    if (msg?.tool_calls || msg?.toolCalls) {
      const toolCalls = msg?.tool_calls || msg?.toolCalls;
      const toolMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
        { role: "assistant", content: msg.content || null, toolCalls: toolCalls as any },
      ] as any;

      for (const tc of toolCalls) {
        let args: any = {};
        try { args = JSON.parse(tc.function.arguments); } catch {}
        let result = "";
        if (tc.function.name === "query_cases") {
          result = queryCases(args, allCases, allCases.filter((c: any) => c.case_status === "Aberto"));
        } else if (tc.function.name === "get_services") {
          result = queryServices(args, services);
        }
        toolMessages.push({
          role: "tool",
          toolCallId: tc.id,
          content: result,
        });
      }

      const stream = await openrouter.chat.send({
        chatRequest: {
          model: "openrouter/auto",
          messages: toolMessages,
          stream: true,
        },
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = (chunk as any).choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
            }
          } catch (err) {
            console.error("Stream error:", err);
          } finally { controller.close(); }
        },
      });

      return new Response(readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
      });
    }

    const textContent = (firstResponse as any).choices?.[0]?.message?.content || "";
    return new Response(textContent, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (err: any) {
    console.error("AI API error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
