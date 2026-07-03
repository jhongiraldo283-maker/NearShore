import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { ROLE } from "@/lib/workflow";
import { insertCandidate, type ScoreResult } from "@/lib/db";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the automated screening step in a recruiting pipeline for Nearshore Business Solutions.
Score the candidate profile the user provides against this open role:

Role: ${ROLE.title}
Requirements: ${ROLE.requirements.join(", ")}

Give strengths and gaps as short bullet points, a one-sentence recommended action (engage
automatically, nurture, or decline, and why), and a 2-3 sentence recruiter briefing a
recruiter would read 30 seconds before the call.

Also write a candidateMessage: a short, warm, personalized message addressed directly to the
candidate, referencing specifics from their background.
- If verdict is "strong" or "borderline", the message should tell them they're a great fit
  and invite them to book a call with a recruiter.
- If verdict is "weak", the message should be a polite, encouraging note that this specific
  role isn't a fit right now, without inviting them to book a call.`;

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
    candidateMessage: { type: Type.STRING },
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
    "candidateMessage",
  ],
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
  }

  let body: { name?: string; email?: string; profile?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const profile = body.profile?.trim();

  if (!name) return NextResponse.json({ error: "Missing 'name'." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Missing or invalid 'email'." }, { status: 400 });
  }
  if (!profile) return NextResponse.json({ error: "Missing 'profile' text." }, { status: 400 });
  if (profile.length > 8000) {
    return NextResponse.json({ error: "Profile text is too long (max 8000 characters)." }, { status: 400 });
  }

  const client = new GoogleGenAI({ apiKey });

  let score: ScoreResult;
  try {
    const response = await client.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      contents: profile,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: "Model returned no text content." }, { status: 502 });
    }
    score = JSON.parse(text) as ScoreResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error calling Gemini API.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  try {
    const candidate = await insertCandidate(name, email, profile, score);
    return NextResponse.json({
      id: candidate.id,
      ...score,
      canBook: score.verdict !== "weak",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error saving candidate.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
