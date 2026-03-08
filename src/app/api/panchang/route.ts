import { NextRequest, NextResponse } from "next/server";
import { calculatePanchang } from "@/lib/panchangEngine";

export async function POST(req: NextRequest) {
  try {
    const { isoDate } = await req.json();
    const date = isoDate ? new Date(isoDate) : new Date();
    const result = calculatePanchang(date);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
