import { NextResponse } from "next/server";
import { generateSlots } from "@/lib/slots";
import { getBookedSlots } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [allSlots, booked] = await Promise.all([generateSlots(), getBookedSlots()]);
    const bookedSet = new Set(booked);
    const available = allSlots.filter((s) => !bookedSet.has(s.iso));
    return NextResponse.json({ slots: available });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error loading slots.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
