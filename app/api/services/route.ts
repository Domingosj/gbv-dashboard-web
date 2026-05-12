import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), "data", "services_cleaned.csv");
    const csv = fs.readFileSync(csvPath, "utf-8");
    const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
