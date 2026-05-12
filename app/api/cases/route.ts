import { NextResponse } from "next/server";
import { fetchAllCases, loadOpenCases } from "@/lib/activityinfo";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    const data = filter === "open" ? await loadOpenCases() : await fetchAllCases();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
