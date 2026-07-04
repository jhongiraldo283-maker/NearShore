import { NextResponse } from "next/server";
import { getVacancyById, setVacancyStatus } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vacancyId = Number(id);
  if (!Number.isInteger(vacancyId)) {
    return NextResponse.json({ error: "Invalid vacancy id." }, { status: 400 });
  }

  try {
    const vacancy = await getVacancyById(vacancyId);
    if (!vacancy) return NextResponse.json({ error: "Role not found." }, { status: 404 });

    const nextStatus = vacancy.status === "open" ? "closed" : "open";
    await setVacancyStatus(vacancyId, nextStatus);
    return NextResponse.json({ status: nextStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error toggling vacancy.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
