import { cookies } from "next/headers";
import { RECRUITER_COOKIE, isValidSessionToken } from "@/lib/recruiterAuth";
import { RecruiterPasscodeForm } from "@/components/RecruiterPasscodeForm";
import { listCandidates } from "@/lib/db";

export const dynamic = "force-dynamic";

const verdictStyles: Record<string, string> = {
  strong: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  borderline: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  weak: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
};

export default async function RecruiterPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(RECRUITER_COOKIE)?.value;

  if (!isValidSessionToken(token)) {
    return <RecruiterPasscodeForm />;
  }

  const candidates = await listCandidates();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Candidate pipeline</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {candidates.length} application{candidates.length === 1 ? "" : "s"} — booked and highest-scoring first.
      </p>

      <div className="mt-8 space-y-4">
        {candidates.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No applications yet.</p>
        )}
        {candidates.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{c.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{c.fitScore}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${verdictStyles[c.verdict]}`}>
                  {c.verdict}
                </span>
              </div>
            </div>

            {c.bookedSlot && (
              <p className="mt-3 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                Call booked: {new Date(c.bookedSlot).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" })} EST
              </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Strengths</h4>
                <ul className="mt-1.5 list-inside list-disc text-sm text-slate-700 dark:text-slate-300">
                  {c.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Gaps</h4>
                {c.gaps.length ? (
                  <ul className="mt-1.5 list-inside list-disc text-sm text-slate-700 dark:text-slate-300">
                    {c.gaps.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">None flagged.</p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span>EST overlap risk: <span className="font-medium text-slate-900 dark:text-slate-100">{c.estOverlapRisk}</span></span>
              <span>English fluency signal: <span className="font-medium text-slate-900 dark:text-slate-100">{c.englishFluencySignal}</span></span>
            </div>

            <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
              <span className="font-semibold">Recruiter briefing: </span>
              {c.recruiterBriefing}
            </p>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
                View submitted profile
              </summary>
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-950/60 dark:text-slate-400">
                {c.profileText}
              </p>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
