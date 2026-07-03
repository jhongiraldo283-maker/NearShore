import { neon } from "@neondatabase/serverless";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured on the server.");
  return neon(url);
}

export type ScoreResult = {
  fitScore: number;
  verdict: "strong" | "borderline" | "weak";
  strengths: string[];
  gaps: string[];
  estOverlapRisk: "none" | "possible" | "high";
  englishFluencySignal: "strong" | "unclear" | "weak";
  recommendedAction: string;
  recruiterBriefing: string;
  candidateMessage: string;
};

export type Candidate = ScoreResult & {
  id: number;
  name: string;
  email: string;
  profileText: string;
  bookedSlot: string | null;
  createdAt: string;
};

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  if (!schemaReady) {
    const db = sql();
    schemaReady = db`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        profile_text TEXT NOT NULL,
        fit_score INTEGER NOT NULL,
        verdict TEXT NOT NULL,
        strengths JSONB NOT NULL,
        gaps JSONB NOT NULL,
        est_overlap_risk TEXT NOT NULL,
        english_fluency_signal TEXT NOT NULL,
        recommended_action TEXT NOT NULL,
        recruiter_briefing TEXT NOT NULL,
        candidate_message TEXT NOT NULL,
        booked_slot TIMESTAMPTZ UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `.then(() => {});
  }
  return schemaReady;
}

function toCandidate(row: Record<string, unknown>): Candidate {
  return {
    id: row.id as number,
    name: row.name as string,
    email: row.email as string,
    profileText: row.profile_text as string,
    fitScore: row.fit_score as number,
    verdict: row.verdict as ScoreResult["verdict"],
    strengths: row.strengths as string[],
    gaps: row.gaps as string[],
    estOverlapRisk: row.est_overlap_risk as ScoreResult["estOverlapRisk"],
    englishFluencySignal: row.english_fluency_signal as ScoreResult["englishFluencySignal"],
    recommendedAction: row.recommended_action as string,
    recruiterBriefing: row.recruiter_briefing as string,
    candidateMessage: row.candidate_message as string,
    bookedSlot: row.booked_slot ? new Date(row.booked_slot as string).toISOString() : null,
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

export async function insertCandidate(
  name: string,
  email: string,
  profileText: string,
  score: ScoreResult
): Promise<Candidate> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    INSERT INTO candidates
      (name, email, profile_text, fit_score, verdict, strengths, gaps, est_overlap_risk, english_fluency_signal, recommended_action, recruiter_briefing, candidate_message)
    VALUES
      (${name}, ${email}, ${profileText}, ${score.fitScore}, ${score.verdict}, ${JSON.stringify(score.strengths)}, ${JSON.stringify(score.gaps)}, ${score.estOverlapRisk}, ${score.englishFluencySignal}, ${score.recommendedAction}, ${score.recruiterBriefing}, ${score.candidateMessage})
    RETURNING *
  `;
  return toCandidate(rows[0] as Record<string, unknown>);
}

export async function bookSlot(candidateId: number, slotIso: string): Promise<Candidate | null> {
  await ensureSchema();
  const db = sql();
  const existing = await db`SELECT 1 FROM candidates WHERE booked_slot = ${slotIso}`;
  if (existing.length > 0) return null;

  const rows = await db`
    UPDATE candidates
    SET booked_slot = ${slotIso}
    WHERE id = ${candidateId} AND booked_slot IS NULL
    RETURNING *
  `;
  if (rows.length === 0) return null;
  return toCandidate(rows[0] as Record<string, unknown>);
}

export async function getBookedSlots(): Promise<string[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT booked_slot FROM candidates WHERE booked_slot IS NOT NULL`;
  return rows.map((r) => new Date((r as { booked_slot: string }).booked_slot).toISOString());
}

export async function listCandidates(): Promise<Candidate[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    SELECT * FROM candidates
    ORDER BY booked_slot IS NULL, fit_score DESC, created_at DESC
  `;
  return rows.map((r) => toCandidate(r as Record<string, unknown>));
}

export async function getCandidate(id: number): Promise<Candidate | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT * FROM candidates WHERE id = ${id}`;
  if (rows.length === 0) return null;
  return toCandidate(rows[0] as Record<string, unknown>);
}
