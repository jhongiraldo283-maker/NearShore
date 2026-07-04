"use client";

import { useState } from "react";
import { ENGLISH_LEVEL_OPTIONS } from "@/lib/workflow";

export function ApplyForm({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [estAvailable, setEstAvailable] = useState("yes");
  const [englishSelfLevel, setEnglishSelfLevel] = useState(ENGLISH_LEVEL_OPTIONS[2]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cvFile) {
      setError("Please upload your CV as a PDF.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("email", email);
      formData.set("yearsExperience", yearsExperience);
      formData.set("estAvailable", estAvailable);
      formData.set("englishSelfLevel", englishSelfLevel);
      formData.set("cv", cvFile);

      const res = await fetch(`/api/apply/${slug}`, { method: "POST", body: formData });

      let data: { error?: string };
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error("Apply submit: response was not JSON", res.status, parseErr);
        setError(`The server returned an unexpected error (HTTP ${res.status}). Check the browser console for details.`);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Could not submit your application.");
        return;
      }
      setSubmitted(true);
    } catch (err) {
      console.error("Apply submit: network error", err);
      setError("Could not reach the server. Open the browser console (F12) to see the error detail.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="animate-fade-in-up rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-900">Thanks for applying!</p>
        <p className="mt-2 text-sm text-emerald-800">
          We received your application. If your profile is a good match for this role, a recruiter will
          reach out by email to schedule a call.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in-up rounded-xl border border-slate-200 bg-surface p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none focus:border-action focus:ring-1 focus:ring-action"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none focus:border-action focus:ring-1 focus:ring-action"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Years of experience</label>
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
          <label className="text-sm font-medium text-slate-700">Available during EST hours?</label>
          <select
            value={estAvailable}
            onChange={(e) => setEstAvailable(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none focus:border-action focus:ring-1 focus:ring-action"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">English level</label>
          <select
            value={englishSelfLevel}
            onChange={(e) => setEnglishSelfLevel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none focus:border-action focus:ring-1 focus:ring-action"
          >
            {ENGLISH_LEVEL_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">CV (PDF, max 5MB)</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 bg-background p-2.5 text-sm text-slate-900 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-action file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white focus:border-action focus:ring-1 focus:ring-action"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-lg bg-action px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-action-hover hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting application..." : "Submit application"}
      </button>

      {error && <p className="animate-fade-in-up mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </form>
  );
}
