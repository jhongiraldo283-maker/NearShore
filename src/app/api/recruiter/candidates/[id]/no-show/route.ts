import { NextResponse } from "next/server";
import { isRecruiterRequest } from "@/lib/recruiterAuth";
import { markNoShow } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isRecruiterRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const candidateId = Number(id);
  if (!Number.isInteger(candidateId)) {
    return NextResponse.json({ error: "Invalid candidate id." }, { status: 400 });
  }

  try {
    const candidate = await markNoShow(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: "Este candidato no tiene una llamada agendada." }, { status: 409 });
    }
    return NextResponse.json({ candidate });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error marking no-show.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
