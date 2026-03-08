import { NextRequest, NextResponse } from "next/server";
import { findAuspiciousSlots } from "@/lib/panchangEngine";

export async function POST(req: NextRequest) {
  try {
    const { isoDate, days = 7 } = await req.json();
    const startDate = isoDate ? new Date(isoDate) : new Date();
    const slots = findAuspiciousSlots(startDate, Math.min(days, 14));
    return NextResponse.json({ slots });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
