import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { getVacancyBySlug, upsertCandidate, type ScoreResult, type Vacancy } from "@/lib/db";
import { extractPdfText } from "@/lib/pdf";

export const runtime = "nodejs";

const MAX_CV_BYTES = 5 * 1024 * 1024;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    fitScore: { type: Type.INTEGER },
    verdict: { type: Type.STRING, enum: ["strong", "borderline", "weak"] },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
    estOverlapRisk: { type: Type.STRING, enum: ["none", "possible", "high"] },
    englishFluencySignal: { type: Type.STRING, enum: ["strong", "unclear", "weak"] },
    recommendedAction: { type: Type.STRING },
    recruiterBriefing: { type: Type.STRING },
    summary: { type: Type.STRING },
  },
  required: [
    "fitScore",
    "verdict",
    "strengths",
    "gaps",
    "estOverlapRisk",
    "englishFluencySignal",
    "recommendedAction",
    "recruiterBriefing",
    "summary",
  ],
};

function buildSystemPrompt(vacancy: Vacancy): string {
  return `You are the automated screening step in a recruiting pipeline for Nearshore Business Solutions.
Score the candidate against this open role:

Role: ${vacancy.title} (${vacancy.seniority})
Required skills: ${vacancy.skills.join(", ")}
Years of experience required: ${vacancy.yearsExperience}+
Language requirement: ${vacancy.language}
Timezone overlap requirement: ${vacancy.timezoneOverlap}
Salary range: ${vacancy.salaryRange}

You will receive the candidate's CV text AND their own self-reported form answers (years of
experience, EST business-hours availability, self-perceived English level). Cross-check the
self-reported answers against the CV text and call out explicitly when a claim is
self-reported but not corroborated by the CV (e.g. English level claimed as advanced but the
CV shows no evidence of English-speaking work environments; EST availability claimed but
location/timezone unclear from the CV).

Give:
- fitScore: 0-100 overall match.
- verdict: "strong", "borderline", or "weak".
- strengths: short bullet points — skills/experience that match (razones a favor).
- gaps: short bullet points — real gaps AND uncertain/unverifiable claims (razones en contra
  o inciertas).
- estOverlapRisk: "none", "possible", or "high".
- englishFluencySignal: "strong", "unclear", or "weak" — based on written evidence, not the
  self-report alone.
- recommendedAction: one sentence (engage, nurture, or decline, and why).
- recruiterBriefing: 2-3 sentences a recruiter reads 30 seconds before the call.
- summary: a 3-4 sentence executive summary of the candidate for a recruiter deciding
  whether to reach out.`;
}

function buildContents(input: {
  yearsExperience: number;
  estAvailable: boolean;
  englishSelfLevel: string;
  cvText: string;
}): string {
  return `Candidate self-reported form answers:
- Years of experience: ${input.yearsExperience}
- Available during EST business hours: ${input.estAvailable ? "Yes" : "No"}
- Self-perceived English level: ${input.englishSelfLevel}

CV text (extracted from uploaded PDF):
${input.cvText}`;
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const vacancy = await getVacancyBySlug(slug);
  if (!vacancy) {
    return NextResponse.json({ error: "Vacante no encontrada." }, { status: 404 });
  }
  if (vacancy.status === "closed") {
    return NextResponse.json({ error: "Esta vacante ya no está disponible.", closed: true }, { status: 410 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido." }, { status: 400 });
  }

  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const yearsExperience = Number(form.get("yearsExperience"));
  const estAvailable = form.get("estAvailable") === "yes";
  const englishSelfLevel = String(form.get("englishSelfLevel") || "").trim();
  const cvFile = form.get("cv");

  if (!name) return NextResponse.json({ error: "Falta el nombre completo." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }
  if (!Number.isFinite(yearsExperience) || yearsExperience < 0) {
    return NextResponse.json({ error: "Años de experiencia inválidos." }, { status: 400 });
  }
  if (!englishSelfLevel) return NextResponse.json({ error: "Falta el nivel de inglés." }, { status: 400 });
  if (!(cvFile instanceof File)) {
    return NextResponse.json({ error: "Falta el CV en PDF." }, { status: 400 });
  }
  if (cvFile.type !== "application/pdf" && !cvFile.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "El CV debe ser un archivo PDF." }, { status: 400 });
  }
  if (cvFile.size > MAX_CV_BYTES) {
    return NextResponse.json({ error: "El PDF es demasiado grande (máximo 5MB)." }, { status: 400 });
  }

  const cvBuffer = Buffer.from(await cvFile.arrayBuffer());
  let cvText: string;
  try {
    cvText = await extractPdfText(cvBuffer);
  } catch (err) {
    console.error("extractPdfText failed", err);
    return NextResponse.json(
      { error: "No se pudo leer el PDF. Verifica que no esté corrupto o protegido con contraseña." },
      { status: 400 }
    );
  }
  if (!cvText) {
    return NextResponse.json(
      { error: "No se pudo extraer texto del PDF (¿es un escaneo de imagen sin texto seleccionable?)." },
      { status: 400 }
    );
  }

  const client = new GoogleGenAI({ apiKey });
  let score: ScoreResult;
  try {
    const response = await client.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      contents: buildContents({ yearsExperience, estAvailable, englishSelfLevel, cvText }),
      config: {
        systemInstruction: buildSystemPrompt(vacancy),
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return NextResponse.json({ error: "Model returned no text content." }, { status: 502 });
    score = JSON.parse(text) as ScoreResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error calling Gemini API.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  try {
    await upsertCandidate(
      vacancy.id,
      {
        name,
        email,
        yearsExperience,
        estAvailable,
        englishSelfLevel,
        cvFilename: cvFile.name,
        cvMime: cvFile.type || "application/pdf",
        cvBase64: cvBuffer.toString("base64"),
        cvText,
      },
      score
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error saving candidate.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
