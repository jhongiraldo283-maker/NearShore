import { NextResponse } from "next/server";
import { generateSlots } from "@/lib/slots";
import { bookSlot } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { candidateId?: number; slotIso?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { candidateId, slotIso } = body;
  if (!candidateId || !slotIso) {
    return NextResponse.json({ error: "Missing 'candidateId' or 'slotIso'." }, { status: 400 });
  }

  const validSlots = new Set(generateSlots().map((s) => s.iso));
  if (!validSlots.has(slotIso)) {
    return NextResponse.json({ error: "That slot is no longer valid." }, { status: 400 });
  }

  try {
    const candidate = await bookSlot(candidateId, slotIso);
    if (!candidate) {
      return NextResponse.json(
        { error: "That slot was just taken, or this candidate already has a booking. Please pick another." },
        { status: 409 }
      );
    }
    return NextResponse.json({ bookedSlot: candidate.bookedSlot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error booking slot.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
