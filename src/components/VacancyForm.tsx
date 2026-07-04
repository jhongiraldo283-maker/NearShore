"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SENIORITY_OPTIONS } from "@/lib/workflow";

export function VacancyForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [yearsExperience, setYearsExperience] = useState("5");
  const [seniority, setSeniority] = useState(SENIORITY_OPTIONS[2]);
  const [language, setLanguage] = useState("Fluent English");
  const [timezoneOverlap, setTimezoneOverlap] = useState("EST overlap required (minimum 4 hours)");
  const [salaryRange, setSalaryRange] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/vacancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, skills, yearsExperience, seniority, language, timezoneOverlap, salaryRange }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not create the role.");
        return;
      }
      router.push(`/recruiter/vacancies/${data.vacancy.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in-up rounded-xl border border-slate-200 bg-surface p-6 shadow-sm">
      <div>
        <label className="text-sm font-medium text-slate-700">Job title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Senior Full Stack Engineer"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none focus:border-action focus:ring-1 focus:ring-action"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">Required skills (comma separated)</label>
        <input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          required
          placeholder="React, Node.js, AWS"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none focus:border-action focus:ring-1 focus:ring-action"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Minimum years of experience</label>
          <input
            type="number"
            min={0}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none focus:border-action focus:ring-1 focus:ring-action"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Seniority</label>
          <select
            value={seniority}
            onChange={(e) => setSeniority(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none focus:border-action focus:ring-1 focus:ring-action"
          >
            {SENIORITY_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Language requirement</label>
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none focus:border-action focus:ring-1 focus:ring-action"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Timezone overlap</label>
          <input
            value={timezoneOverlap}
            onChange={(e) => setTimezoneOverlap(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none focus:border-action focus:ring-1 focus:ring-action"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">Salary range</label>
        <input
          value={salaryRange}
          onChange={(e) => setSalaryRange(e.target.value)}
          required
          placeholder="USD 3,500 - 5,000/month"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none focus:border-action focus:ring-1 focus:ring-action"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 rounded-lg bg-action px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-action-hover hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Posting..." : "Post role"}
      </button>

      {error && <p className="mt-4 animate-fade-in-up rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </form>
  );
}
