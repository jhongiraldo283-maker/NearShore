import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { isRecruiterRequest } from "@/lib/recruiterAuth";
import { createVacancy } from "@/lib/db";

export const runtime = "nodejs";

type PostTextInput = {
  title: string;
  skills: string[];
  yearsExperience: number;
  seniority: string;
  language: string;
  timezoneOverlap: string;
  salaryRange: string;
};

function fallbackPostText(input: PostTextInput): string {
  return [
    `¡Estamos contratando! ${input.title} (${input.seniority}).`,
    `Buscamos a alguien con ${input.yearsExperience}+ años de experiencia en ${input.skills.join(", ")}.`,
    `Idioma: ${input.language}. ${input.timezoneOverlap}.`,
    `Rango salarial: ${input.salaryRange}.`,
    ``,
    `Aplica aquí: {{APPLY_LINK}}`,
  ].join("\n");
}

async function generatePostText(input: PostTextInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const fallback = fallbackPostText(input);
  if (!apiKey) return fallback;

  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      contents: `Redacta un post corto y atractivo para LinkedIn anunciando esta vacante de trabajo remoto/nearshore. Tono profesional pero cercano, sin exceso de hashtags o emojis (máximo 2-3 emojis en total). Termina siempre con una línea propia que diga exactamente "Aplica aquí: {{APPLY_LINK}}" (déjalo literal, no lo reemplaces).

Título: ${input.title}
Seniority: ${input.seniority}
Skills requeridas: ${input.skills.join(", ")}
Años de experiencia: ${input.yearsExperience}+
Idioma requerido: ${input.language}
Overlap horario: ${input.timezoneOverlap}
Rango salarial: ${input.salaryRange}`,
    });
    const text = response.text?.trim();
    if (!text || !text.includes("{{APPLY_LINK}}")) return fallback;
    return text;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  if (!isRecruiterRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Partial<{
    title: string;
    skills: string;
    yearsExperience: number | string;
    seniority: string;
    language: string;
    timezoneOverlap: string;
    salaryRange: string;
  }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = body.title?.trim();
  const seniority = body.seniority?.trim();
  const language = body.language?.trim();
  const timezoneOverlap = body.timezoneOverlap?.trim();
  const salaryRange = body.salaryRange?.trim();
  const yearsExperience = Number(body.yearsExperience);
  const skills = (body.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!title) return NextResponse.json({ error: "Falta el título de la vacante." }, { status: 400 });
  if (skills.length === 0) return NextResponse.json({ error: "Falta al menos un skill requerido." }, { status: 400 });
  if (!Number.isFinite(yearsExperience) || yearsExperience < 0) {
    return NextResponse.json({ error: "Años de experiencia inválidos." }, { status: 400 });
  }
  if (!seniority) return NextResponse.json({ error: "Falta el seniority." }, { status: 400 });
  if (!language) return NextResponse.json({ error: "Falta el idioma requerido." }, { status: 400 });
  if (!timezoneOverlap) return NextResponse.json({ error: "Falta el overlap horario." }, { status: 400 });
  if (!salaryRange) return NextResponse.json({ error: "Falta el rango salarial." }, { status: 400 });

  const postTextInput = { title, skills, yearsExperience, seniority, language, timezoneOverlap, salaryRange };
  const postText = await generatePostText(postTextInput);

  try {
    const vacancy = await createVacancy({ ...postTextInput, postText });
    return NextResponse.json({ vacancy });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error creating vacancy.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
