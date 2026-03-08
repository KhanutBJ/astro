import { NextRequest, NextResponse } from "next/server";
import { generateChart } from "@/lib/thaiAstroEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year, month, day, hour = 12, minute = 0,
            lat = 13.7563, lon = 100.5018, tz = "Asia/Bangkok" } = body;

    if (!year || !month || !day) {
      return NextResponse.json({ error: "year, month, day required" }, { status: 400 });
    }

    const result = generateChart({ year, month, day, hour, minute, lat, lon, tz });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
