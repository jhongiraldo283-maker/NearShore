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
      setError("Sube tu CV en PDF.");
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
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo enviar tu aplicación.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="animate-fade-in-up rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-900">¡Gracias por aplicar!</p>
        <p className="mt-2 text-sm text-emerald-800">
          Recibimos tu aplicación. Si tu perfil es un buen match para la vacante, un reclutador te
          contactará por correo para agendar una llamada.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Nombre completo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Años de experiencia</label>
          <input
            type="number"
            min={0}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">¿Disponible en horario EST?</label>
          <select
            value={estAvailable}
            onChange={(e) => setEstAvailable(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Nivel de inglés</label>
          <select
            value={englishSelfLevel}
            onChange={(e) => setEnglishSelfLevel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {ENGLISH_LEVEL_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">CV (PDF, máximo 5MB)</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Enviando aplicación..." : "Enviar aplicación"}
      </button>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </form>
  );
}
