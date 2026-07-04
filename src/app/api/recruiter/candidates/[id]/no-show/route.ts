import { NextResponse } from "next/server";
import { markNoShow } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidateId = Number(id);
  if (!Number.isInteger(candidateId)) {
    return NextResponse.json({ error: "Invalid candidate id." }, { status: 400 });
  }

  try {
    const candidate = await markNoShow(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: "This candidate doesn't have a scheduled call." }, { status: 409 });
    }
    return NextResponse.json({ candidate });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error marking no-show.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
