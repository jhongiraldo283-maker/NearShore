"use client";

import { useState } from "react";
import { SAMPLE_PROFILE } from "@/lib/workflow";

type ApplyResult = {
  id: number;
  fitScore: number;
  verdict: "strong" | "borderline" | "weak";
  strengths: string[];
  gaps: string[];
  estOverlapRisk: "none" | "possible" | "high";
  englishFluencySignal: "strong" | "unclear" | "weak";
  candidateMessage: string;
  canBook: boolean;
};

type Slot = { iso: string; label: string };

const verdictStyles: Record<ApplyResult["verdict"], string> = {
  strong: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  borderline: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  weak: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
};

type Stage = "form" | "result" | "booked";

export function ApplyFlow() {
  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplyResult | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookedLabel, setBookedLabel] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !profile.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, profile }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong submitting your application.");
      } else {
        setResult(data);
        setStage("result");
        if (data.canBook) loadSlots();
      }
    } catch {
      setError("Could not reach the application API.");
    } finally {
      setSubmitting(false);
    }
  }

  async function loadSlots() {
    setSlotsLoading(true);
    try {
      const res = await fetch("/api/slots");
      const data = await res.json();
      if (res.ok) setSlots(data.slots);
    } finally {
      setSlotsLoading(false);
    }
  }

  async function handleBook() {
    if (!result || !selectedSlot) return;
    setBooking(true);
    setError(null);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: result.id, slotIso: selectedSlot }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not book that slot.");
        loadSlots();
      } else {
        const label = slots.find((s) => s.iso === selectedSlot)?.label || selectedSlot;
        setBookedLabel(label);
        setStage("booked");
      }
    } catch {
      setError("Could not reach the booking API.");
    } finally {
      setBooking(false);
    }
  }

  if (stage === "form") {
    return (
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Tell us about your experience (or paste your resume text)
          </label>
          <textarea
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            required
            rows={8}
            placeholder="Years of experience, tech stack, location/timezone, notable projects..."
            className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Reviewing your application..." : "Submit application"}
          </button>
          <button
            type="button"
            onClick={() => setProfile(SAMPLE_PROFILE)}
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Use a sample profile
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}
      </form>
    );
  }

  if (stage === "result" && result) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{result.fitScore}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">/ 100 fit score</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${verdictStyles[result.verdict]}`}>
            {result.verdict}
          </span>
        </div>

        <p className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
          {result.candidateMessage}
        </p>

        {result.canBook && (
          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pick a time with a recruiter</h3>
            {slotsLoading ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading available times...</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((slot) => (
                  <button
                    key={slot.iso}
                    type="button"
                    onClick={() => setSelectedSlot(slot.iso)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      selectedSlot === slot.iso
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleBook}
              disabled={!selectedSlot || booking}
              className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {booking ? "Booking..." : "Confirm booking"}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
      <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">You&apos;re booked!</p>
      <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
        Your call with a recruiter is confirmed for <span className="font-medium">{bookedLabel}</span>. A calendar
        invite would be sent to your email in a production deployment.
      </p>
    </div>
  );
}
