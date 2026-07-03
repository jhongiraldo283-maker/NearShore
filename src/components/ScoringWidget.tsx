"use client";

import { useState } from "react";

type ScoreResult = {
  fitScore: number;
  verdict: "strong" | "borderline" | "weak";
  strengths: string[];
  gaps: string[];
  estOverlapRisk: "none" | "possible" | "high";
  englishFluencySignal: "strong" | "unclear" | "weak";
  recommendedAction: string;
  recruiterBriefing: string;
};

const SAMPLE_PROFILE = `Maria Fernandez - Senior Software Engineer
6 years of experience building web applications.
Currently: Lead Frontend Engineer at a fintech startup (2 years), building with React, TypeScript and Node.js APIs deployed on AWS (Lambda, ECS, RDS).
Previously: Full stack developer at a logistics company (4 years), Node.js + React + AWS.
Based in Bogota, Colombia (GMT-5, same as EST). Available for immediate start.
Fluent English, has worked with US-based teams daily for the last 3 years, all standups and docs in English.
Looking for senior/staff level roles, open to contract or full-time.`;

const verdictStyles: Record<ScoreResult["verdict"], string> = {
  strong: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  borderline: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  weak: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
};

export function ScoringWidget() {
  const [profile, setProfile] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong scoring this profile.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not reach the scoring API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        This is Step 3 of the workflow, live. Paste a candidate profile (or resume text) below and Gemini will
        score it against the open <span className="font-medium">Senior Full Stack Engineer</span> req — the
        same call that would run automatically on every inbound application.
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          rows={8}
          placeholder="Paste a candidate profile or resume text here..."
          className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || !profile.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Scoring..." : "Score this candidate"}
          </button>
          <button
            type="button"
            onClick={() => setProfile(SAMPLE_PROFILE)}
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Use a sample profile
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 space-y-4 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{result.fitScore}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">/ 100 fit score</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${verdictStyles[result.verdict]}`}>
              {result.verdict}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Strengths
              </h4>
              <ul className="mt-1.5 list-inside list-disc text-sm text-slate-700 dark:text-slate-300">
                {result.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Gaps
              </h4>
              {result.gaps.length ? (
                <ul className="mt-1.5 list-inside list-disc text-sm text-slate-700 dark:text-slate-300">
                  {result.gaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">None flagged.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              EST overlap risk: <span className="font-medium text-slate-900 dark:text-slate-100">{result.estOverlapRisk}</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              English fluency signal: <span className="font-medium text-slate-900 dark:text-slate-100">{result.englishFluencySignal}</span>
            </span>
          </div>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
            <span className="font-semibold">Recommended action: </span>
            {result.recommendedAction}
          </p>

          <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
            <span className="font-semibold">Recruiter briefing (Step 6): </span>
            {result.recruiterBriefing}
          </p>
        </div>
      )}
    </div>
  );
}
