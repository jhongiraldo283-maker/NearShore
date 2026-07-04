import { NextResponse } from "next/server";
import { getCandidateCv } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidateId = Number(id);
  if (!Number.isInteger(candidateId)) {
    return NextResponse.json({ error: "Invalid candidate id." }, { status: 400 });
  }

  try {
    const cv = await getCandidateCv(candidateId);
    if (!cv) return NextResponse.json({ error: "CV no encontrado." }, { status: 404 });

    const bytes = Buffer.from(cv.base64, "base64");
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": cv.mime || "application/pdf",
        "Content-Disposition": `inline; filename="${cv.filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error loading CV.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
