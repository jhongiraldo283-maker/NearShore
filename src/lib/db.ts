import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured on the server.");
  return neon(url);
}

export type VacancyStatus = "open" | "closed";

export type Vacancy = {
  id: number;
  slug: string;
  title: string;
  skills: string[];
  yearsExperience: number;
  seniority: string;
  language: string;
  timezoneOverlap: string;
  salaryRange: string;
  status: VacancyStatus;
  postText: string;
  createdAt: string;
  activeCandidateCount: number;
  totalCandidateCount: number;
};

export type VacancyInput = {
  slug: string;
  title: string;
  skills: string[];
  yearsExperience: number;
  seniority: string;
  language: string;
  timezoneOverlap: string;
  salaryRange: string;
  postText: string;
};

export type CandidateStatus = "new" | "invited" | "scheduled" | "no_show" | "discarded";

export type ScoreResult = {
  fitScore: number;
  verdict: "strong" | "borderline" | "weak";
  strengths: string[];
  gaps: string[];
  estOverlapRisk: "none" | "possible" | "high";
  englishFluencySignal: "strong" | "unclear" | "weak";
  recommendedAction: string;
  recruiterBriefing: string;
  summary: string;
};

export type CandidateFormInput = {
  name: string;
  email: string;
  yearsExperience: number;
  estAvailable: boolean;
  englishSelfLevel: string;
  cvFilename: string;
  cvMime: string;
  cvBase64: string;
  cvText: string;
};

export type Candidate = ScoreResult & {
  id: number;
  vacancyId: number;
  name: string;
  email: string;
  yearsExperience: number;
  estAvailable: boolean;
  englishSelfLevel: string;
  cvFilename: string;
  cvMime: string;
  cvText: string;
  status: CandidateStatus;
  previouslyDiscarded: boolean;
  bookedSlot: string | null;
  scheduleToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateCv = { filename: string; mime: string; base64: string };

const CANDIDATE_COLUMNS = `
  id, vacancy_id, name, email, years_experience, est_available, english_self_level,
  cv_filename, cv_mime, cv_text, fit_score, verdict, strengths, gaps, est_overlap_risk,
  english_fluency_signal, recommended_action, recruiter_briefing, summary, status,
  previously_discarded, booked_slot, schedule_token, created_at, updated_at
`;

let schemaReady: Promise<void> | null = null;

async function migrateLegacyCandidates() {
  const db = sql();
  const cols = await db`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'candidates'
  `;
  const colNames = new Set((cols as Record<string, unknown>[]).map((c) => c.column_name as string));
  if (colNames.size === 0 || colNames.has("vacancy_id")) return;

  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS vacancy_id INTEGER`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS years_experience INTEGER NOT NULL DEFAULT 0`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS est_available BOOLEAN NOT NULL DEFAULT true`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS english_self_level TEXT NOT NULL DEFAULT 'unknown'`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cv_filename TEXT NOT NULL DEFAULT 'legacy.txt'`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cv_mime TEXT NOT NULL DEFAULT 'text/plain'`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cv_base64 TEXT`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cv_text TEXT`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT ''`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS previously_discarded BOOLEAN NOT NULL DEFAULT false`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS schedule_token TEXT`;
  await db`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`;

  if (colNames.has("profile_text")) {
    await db`UPDATE candidates SET cv_text = profile_text WHERE cv_text IS NULL`;
    await db`ALTER TABLE candidates DROP COLUMN profile_text`;
  }
  await db`UPDATE candidates SET cv_text = '' WHERE cv_text IS NULL`;
  await db`UPDATE candidates SET cv_base64 = '' WHERE cv_base64 IS NULL`;
  await db`UPDATE candidates SET status = 'scheduled' WHERE booked_slot IS NOT NULL AND status = 'new'`;
  if (colNames.has("candidate_message")) {
    await db`ALTER TABLE candidates DROP COLUMN candidate_message`;
  }

  const bootstrap = await db`
    INSERT INTO vacancies
      (slug, title, skills, years_experience, seniority, language, timezone_overlap, salary_range, status, post_text)
    VALUES
      ('senior-full-stack-engineer-legacy', 'Senior Full Stack Engineer',
       ${JSON.stringify(["React", "Node.js", "AWS", "5+ years experience", "Fluent English", "EST overlap required"])},
       5, 'Senior', 'Fluent English', 'EST overlap required', 'Competitive',
       'open', 'Legacy role migrated automatically from the previous single-role demo.')
    ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
    RETURNING id
  `;
  const bootstrapId = (bootstrap[0] as { id: number }).id;
  await db`UPDATE candidates SET vacancy_id = ${bootstrapId} WHERE vacancy_id IS NULL`;
  await db`ALTER TABLE candidates ALTER COLUMN vacancy_id SET NOT NULL`;
}

async function ensureSchema() {
  if (!schemaReady) {
    const db = sql();
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS vacancies (
          id SERIAL PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          skills JSONB NOT NULL,
          years_experience INTEGER NOT NULL,
          seniority TEXT NOT NULL,
          language TEXT NOT NULL,
          timezone_overlap TEXT NOT NULL,
          salary_range TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'open',
          post_text TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      await db`
        CREATE TABLE IF NOT EXISTS discarded_candidates (
          email TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          discarded_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      await db`
        CREATE TABLE IF NOT EXISTS candidates (
          id SERIAL PRIMARY KEY,
          vacancy_id INTEGER NOT NULL REFERENCES vacancies(id),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          years_experience INTEGER NOT NULL,
          est_available BOOLEAN NOT NULL,
          english_self_level TEXT NOT NULL,
          cv_filename TEXT NOT NULL,
          cv_mime TEXT NOT NULL,
          cv_base64 TEXT NOT NULL,
          cv_text TEXT NOT NULL,
          fit_score INTEGER NOT NULL,
          verdict TEXT NOT NULL,
          strengths JSONB NOT NULL,
          gaps JSONB NOT NULL,
          est_overlap_risk TEXT NOT NULL,
          english_fluency_signal TEXT NOT NULL,
          recommended_action TEXT NOT NULL,
          recruiter_briefing TEXT NOT NULL,
          summary TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'new',
          previously_discarded BOOLEAN NOT NULL DEFAULT false,
          booked_slot TIMESTAMPTZ,
          schedule_token TEXT UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      await migrateLegacyCandidates();

      // Defensive dedupe in case legacy data has repeat (vacancy_id, email) pairs,
      // so the unique index below never fails on an existing database.
      await db`
        DELETE FROM candidates a USING candidates b
        WHERE a.vacancy_id = b.vacancy_id AND a.email = b.email AND a.id < b.id
      `;
      await db`CREATE UNIQUE INDEX IF NOT EXISTS candidates_vacancy_email_idx ON candidates (vacancy_id, email)`;
    })();
  }
  return schemaReady;
}

function toVacancy(row: Record<string, unknown>): Vacancy {
  return {
    id: row.id as number,
    slug: row.slug as string,
    title: row.title as string,
    skills: row.skills as string[],
    yearsExperience: row.years_experience as number,
    seniority: row.seniority as string,
    language: row.language as string,
    timezoneOverlap: row.timezone_overlap as string,
    salaryRange: row.salary_range as string,
    status: row.status as VacancyStatus,
    postText: row.post_text as string,
    createdAt: new Date(row.created_at as string).toISOString(),
    activeCandidateCount: Number(row.active_candidate_count ?? 0),
    totalCandidateCount: Number(row.total_candidate_count ?? 0),
  };
}

function toCandidate(row: Record<string, unknown>): Candidate {
  return {
    id: row.id as number,
    vacancyId: row.vacancy_id as number,
    name: row.name as string,
    email: row.email as string,
    yearsExperience: row.years_experience as number,
    estAvailable: row.est_available as boolean,
    englishSelfLevel: row.english_self_level as string,
    cvFilename: row.cv_filename as string,
    cvMime: row.cv_mime as string,
    cvText: row.cv_text as string,
    fitScore: row.fit_score as number,
    verdict: row.verdict as ScoreResult["verdict"],
    strengths: row.strengths as string[],
    gaps: row.gaps as string[],
    estOverlapRisk: row.est_overlap_risk as ScoreResult["estOverlapRisk"],
    englishFluencySignal: row.english_fluency_signal as ScoreResult["englishFluencySignal"],
    recommendedAction: row.recommended_action as string,
    recruiterBriefing: row.recruiter_briefing as string,
    summary: row.summary as string,
    status: row.status as CandidateStatus,
    previouslyDiscarded: row.previously_discarded as boolean,
    bookedSlot: row.booked_slot ? new Date(row.booked_slot as string).toISOString() : null,
    scheduleToken: (row.schedule_token as string | null) ?? null,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createVacancy(input: Omit<VacancyInput, "slug"> & { title: string }): Promise<Vacancy> {
  await ensureSchema();
  const db = sql();
  const slug = `${slugify(input.title)}-${randomUUID().slice(0, 6)}`;
  const rows = await db`
    INSERT INTO vacancies
      (slug, title, skills, years_experience, seniority, language, timezone_overlap, salary_range, post_text)
    VALUES
      (${slug}, ${input.title}, ${JSON.stringify(input.skills)}, ${input.yearsExperience}, ${input.seniority},
       ${input.language}, ${input.timezoneOverlap}, ${input.salaryRange}, ${input.postText})
    RETURNING *, 0 AS active_candidate_count, 0 AS total_candidate_count
  `;
  return toVacancy(rows[0] as Record<string, unknown>);
}

export async function listVacancies(): Promise<Vacancy[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    SELECT v.*,
      COUNT(c.id) FILTER (WHERE c.status <> 'discarded') AS active_candidate_count,
      COUNT(c.id) AS total_candidate_count
    FROM vacancies v
    LEFT JOIN candidates c ON c.vacancy_id = v.id
    GROUP BY v.id
    ORDER BY v.created_at DESC
  `;
  return rows.map((r) => toVacancy(r as Record<string, unknown>));
}

export async function getVacancyById(id: number): Promise<Vacancy | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    SELECT v.*,
      COUNT(c.id) FILTER (WHERE c.status <> 'discarded') AS active_candidate_count,
      COUNT(c.id) AS total_candidate_count
    FROM vacancies v
    LEFT JOIN candidates c ON c.vacancy_id = v.id
    WHERE v.id = ${id}
    GROUP BY v.id
  `;
  if (rows.length === 0) return null;
  return toVacancy(rows[0] as Record<string, unknown>);
}

export async function getVacancyBySlug(slug: string): Promise<Vacancy | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    SELECT v.*,
      COUNT(c.id) FILTER (WHERE c.status <> 'discarded') AS active_candidate_count,
      COUNT(c.id) AS total_candidate_count
    FROM vacancies v
    LEFT JOIN candidates c ON c.vacancy_id = v.id
    WHERE v.slug = ${slug}
    GROUP BY v.id
  `;
  if (rows.length === 0) return null;
  return toVacancy(rows[0] as Record<string, unknown>);
}

export async function setVacancyStatus(id: number, status: VacancyStatus): Promise<void> {
  await ensureSchema();
  const db = sql();
  await db`UPDATE vacancies SET status = ${status} WHERE id = ${id}`;
}

export async function isEmailDiscarded(email: string): Promise<boolean> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT 1 FROM discarded_candidates WHERE email = ${email}`;
  return rows.length > 0;
}

export async function upsertCandidate(
  vacancyId: number,
  input: CandidateFormInput,
  score: ScoreResult
): Promise<Candidate> {
  await ensureSchema();
  const db = sql();
  const previouslyDiscarded = await isEmailDiscarded(input.email);

  const rows = await db`
    INSERT INTO candidates
      (vacancy_id, name, email, years_experience, est_available, english_self_level,
       cv_filename, cv_mime, cv_base64, cv_text, fit_score, verdict, strengths, gaps,
       est_overlap_risk, english_fluency_signal, recommended_action, recruiter_briefing,
       summary, previously_discarded)
    VALUES
      (${vacancyId}, ${input.name}, ${input.email}, ${input.yearsExperience}, ${input.estAvailable},
       ${input.englishSelfLevel}, ${input.cvFilename}, ${input.cvMime}, ${input.cvBase64}, ${input.cvText},
       ${score.fitScore}, ${score.verdict}, ${JSON.stringify(score.strengths)}, ${JSON.stringify(score.gaps)},
       ${score.estOverlapRisk}, ${score.englishFluencySignal}, ${score.recommendedAction},
       ${score.recruiterBriefing}, ${score.summary}, ${previouslyDiscarded})
    ON CONFLICT (vacancy_id, email) DO UPDATE SET
      name = EXCLUDED.name,
      years_experience = EXCLUDED.years_experience,
      est_available = EXCLUDED.est_available,
      english_self_level = EXCLUDED.english_self_level,
      cv_filename = EXCLUDED.cv_filename,
      cv_mime = EXCLUDED.cv_mime,
      cv_base64 = EXCLUDED.cv_base64,
      cv_text = EXCLUDED.cv_text,
      fit_score = EXCLUDED.fit_score,
      verdict = EXCLUDED.verdict,
      strengths = EXCLUDED.strengths,
      gaps = EXCLUDED.gaps,
      est_overlap_risk = EXCLUDED.est_overlap_risk,
      english_fluency_signal = EXCLUDED.english_fluency_signal,
      recommended_action = EXCLUDED.recommended_action,
      recruiter_briefing = EXCLUDED.recruiter_briefing,
      summary = EXCLUDED.summary,
      previously_discarded = candidates.previously_discarded OR EXCLUDED.previously_discarded,
      status = 'new',
      booked_slot = NULL,
      schedule_token = NULL,
      updated_at = now()
    RETURNING ${db.unsafe(CANDIDATE_COLUMNS)}
  `;
  return toCandidate(rows[0] as Record<string, unknown>);
}

export async function listCandidatesForVacancy(vacancyId: number): Promise<Candidate[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    SELECT ${db.unsafe(CANDIDATE_COLUMNS)} FROM candidates
    WHERE vacancy_id = ${vacancyId}
    ORDER BY fit_score DESC, created_at DESC
  `;
  return rows.map((r) => toCandidate(r as Record<string, unknown>));
}

export async function getCandidateById(id: number): Promise<Candidate | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT ${db.unsafe(CANDIDATE_COLUMNS)} FROM candidates WHERE id = ${id}`;
  if (rows.length === 0) return null;
  return toCandidate(rows[0] as Record<string, unknown>);
}

export async function getCandidateByScheduleToken(token: string): Promise<Candidate | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT ${db.unsafe(CANDIDATE_COLUMNS)} FROM candidates WHERE schedule_token = ${token}`;
  if (rows.length === 0) return null;
  return toCandidate(rows[0] as Record<string, unknown>);
}

export async function getCandidateCv(id: number): Promise<CandidateCv | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT cv_filename, cv_mime, cv_base64 FROM candidates WHERE id = ${id}`;
  if (rows.length === 0) return null;
  const row = rows[0] as { cv_filename: string; cv_mime: string; cv_base64: string };
  return { filename: row.cv_filename, mime: row.cv_mime, base64: row.cv_base64 };
}

export async function inviteCandidate(id: number): Promise<Candidate | null> {
  await ensureSchema();
  const db = sql();
  const token = randomUUID();
  const rows = await db`
    UPDATE candidates SET status = 'invited', schedule_token = ${token}, updated_at = now()
    WHERE id = ${id} AND status IN ('new', 'invited', 'no_show')
    RETURNING ${db.unsafe(CANDIDATE_COLUMNS)}
  `;
  if (rows.length === 0) return null;
  return toCandidate(rows[0] as Record<string, unknown>);
}

export async function discardCandidate(id: number): Promise<Candidate | null> {
  await ensureSchema();
  const db = sql();
  const existing = await getCandidateById(id);
  if (!existing) return null;

  await db`
    INSERT INTO discarded_candidates (email, name)
    VALUES (${existing.email}, ${existing.name})
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, discarded_at = now()
  `;

  const rows = await db`
    UPDATE candidates SET status = 'discarded', previously_discarded = true, updated_at = now()
    WHERE id = ${id}
    RETURNING ${db.unsafe(CANDIDATE_COLUMNS)}
  `;
  return toCandidate(rows[0] as Record<string, unknown>);
}

export async function reinstateCandidate(id: number): Promise<Candidate | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    UPDATE candidates SET status = 'new', updated_at = now()
    WHERE id = ${id} AND status = 'discarded'
    RETURNING ${db.unsafe(CANDIDATE_COLUMNS)}
  `;
  if (rows.length === 0) return null;
  return toCandidate(rows[0] as Record<string, unknown>);
}

export async function markNoShow(id: number): Promise<Candidate | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    UPDATE candidates SET status = 'no_show', updated_at = now()
    WHERE id = ${id} AND status = 'scheduled'
    RETURNING ${db.unsafe(CANDIDATE_COLUMNS)}
  `;
  if (rows.length === 0) return null;
  return toCandidate(rows[0] as Record<string, unknown>);
}

export async function bookSlotByToken(token: string, slotIso: string): Promise<Candidate | null> {
  await ensureSchema();
  const db = sql();
  const taken = await db`SELECT 1 FROM candidates WHERE booked_slot = ${slotIso} AND status = 'scheduled'`;
  if (taken.length > 0) return null;

  const rows = await db`
    UPDATE candidates SET status = 'scheduled', booked_slot = ${slotIso}, updated_at = now()
    WHERE schedule_token = ${token} AND status = 'invited'
    RETURNING ${db.unsafe(CANDIDATE_COLUMNS)}
  `;
  if (rows.length === 0) return null;
  return toCandidate(rows[0] as Record<string, unknown>);
}

export async function getBookedSlots(): Promise<string[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT booked_slot FROM candidates WHERE status = 'scheduled' AND booked_slot IS NOT NULL`;
  return rows.map((r) => new Date((r as { booked_slot: string }).booked_slot).toISOString());
}
