import { NextResponse } from "next/server";
import { isRecruiterRequest } from "@/lib/recruiterAuth";
import { getCandidateById, getVacancyById, inviteCandidate } from "@/lib/db";
import { sendSchedulingEmail } from "@/lib/email";

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
    const existing = await getCandidateById(candidateId);
    if (!existing) return NextResponse.json({ error: "Candidato no encontrado." }, { status: 404 });

    const vacancy = await getVacancyById(existing.vacancyId);
    if (!vacancy) return NextResponse.json({ error: "Vacante no encontrada." }, { status: 404 });

    const candidate = await inviteCandidate(candidateId);
    if (!candidate || !candidate.scheduleToken) {
      return NextResponse.json({ error: "No se pudo invitar a este candidato en su estado actual." }, { status: 409 });
    }

    const result = await sendSchedulingEmail({
      to: candidate.email,
      name: candidate.name,
      vacancyTitle: vacancy.title,
      token: candidate.scheduleToken,
    });

    if (!result.ok) {
      return NextResponse.json({ error: `Invitado, pero el correo no se pudo enviar: ${result.error}`, candidate }, { status: 502 });
    }

    return NextResponse.json({ candidate });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error inviting candidate.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
