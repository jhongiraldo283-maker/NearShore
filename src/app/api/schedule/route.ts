import { NextResponse } from "next/server";
import { generateSlots } from "@/lib/slots";
import { bookSlotByToken } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { token?: string; slotIso?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { token, slotIso } = body;
  if (!token || !slotIso) {
    return NextResponse.json({ error: "Missing 'token' or 'slotIso'." }, { status: 400 });
  }

  const validSlots = new Set(generateSlots().map((s) => s.iso));
  if (!validSlots.has(slotIso)) {
    return NextResponse.json({ error: "That slot is no longer valid." }, { status: 400 });
  }

  try {
    const candidate = await bookSlotByToken(token, slotIso);
    if (!candidate) {
      return NextResponse.json(
        { error: "Ese horario ya fue tomado, o este link ya no está disponible para agendar. Contacta al reclutador." },
        { status: 409 }
      );
    }
    return NextResponse.json({ bookedSlot: candidate.bookedSlot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error booking slot.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
