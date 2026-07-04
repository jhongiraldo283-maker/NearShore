import { NextResponse } from "next/server";
import { discardCandidate } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidateId = Number(id);
  if (!Number.isInteger(candidateId)) {
    return NextResponse.json({ error: "Invalid candidate id." }, { status: 400 });
  }

  try {
    const candidate = await discardCandidate(candidateId);
    if (!candidate) return NextResponse.json({ error: "Candidato no encontrado." }, { status: 404 });
    return NextResponse.json({ candidate });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error discarding candidate.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
