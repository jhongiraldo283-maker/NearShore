import { NextResponse } from "next/server";
import { deleteVacancy } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vacancyId = Number(id);
  if (!Number.isInteger(vacancyId)) {
    return NextResponse.json({ error: "Invalid role id." }, { status: 400 });
  }

  try {
    const deleted = await deleteVacancy(vacancyId);
    if (!deleted) return NextResponse.json({ error: "Role not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error deleting role.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
