import { NextResponse } from "next/server";
import { fetchAllCases } from "@/lib/activityinfo";
import { calcStats } from "@/lib/risk-calculator";
import { enrichCases, hasReferral } from "@/lib/enrich";

export async function GET() {
  try {
    const raw = await fetchAllCases();
    const cases = enrichCases(raw);
    const open = cases.filter(c => c.case_status === "Aberto");

    const now = Date.now();
    const d7 = 7 * 86400000;
    const d30 = 30 * 86400000;

    const all = calcStats(cases);
    const ostats = calcStats(open);

    const stats = {
      total: all.total,
      open: all.open,
      closed: all.closed,
      critical: all.critical,
      high: all.high,
      no_ref: ostats.no_ref,
      delayed: ostats.delayed,
      open_critical: ostats.critical,
      open_no_ref: ostats.no_ref,
      open_delayed: ostats.delayed,
      new7d: open.filter(c => c.identification_date && now - new Date(c.identification_date).getTime() < d7).length,
      open30: open.filter(c => c.identification_date && now - new Date(c.identification_date).getTime() > d30).length,
      withReferral: open.filter(c => hasReferral(c)).length,
      by_district: {} as Record<string, number>,
      by_project: {} as Record<string, number>,
      by_violence: {} as Record<string, number>,
      by_manager: {} as Record<string, number>,
    };

    for (const c of open) {
      const d = c.district || "Desconhecido";
      stats.by_district[d] = (stats.by_district[d] || 0) + 1;
      const p = c.project || "N/A";
      stats.by_project[p] = (stats.by_project[p] || 0) + 1;
      const v = c.violence_type_short || c.violence_type || "N/A";
      stats.by_violence[v] = (stats.by_violence[v] || 0) + 1;
      const m = c.case_manager || "Sem gestor";
      stats.by_manager[m] = (stats.by_manager[m] || 0) + 1;
    }

    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
