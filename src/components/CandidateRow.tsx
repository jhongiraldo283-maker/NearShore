"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Candidate } from "@/lib/db";

const verdictStyles: Record<Candidate["verdict"], string> = {
  strong: "bg-emerald-100 text-emerald-800",
  borderline: "bg-amber-100 text-amber-800",
  weak: "bg-rose-100 text-rose-800",
};

const statusLabels: Record<Candidate["status"], string> = {
  new: "Nuevo",
  invited: "Invitado a agendar",
  scheduled: "Agendado",
  no_show: "No-show",
  discarded: "Descartado",
};

const statusStyles: Record<Candidate["status"], string> = {
  new: "bg-slate-100 text-slate-700",
  invited: "bg-sky-100 text-sky-800",
  scheduled: "bg-primary-soft text-primary-hover",
  no_show: "bg-orange-100 text-orange-800",
  discarded: "bg-slate-200 text-slate-600",
};

export function CandidateRow({ candidate }: { candidate: Candidate }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: string) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/recruiter/candidates/${candidate.id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ocurrió un error.");
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{candidate.name}</p>
          <p className="text-sm text-slate-500">{candidate.email}</p>
          {candidate.previouslyDiscarded && (
            <span className="mt-1 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
              Previamente descartado
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 transition hover:border-primary hover:scale-[1.03] active:scale-[0.97]"
        >
          <span className="text-xl font-bold text-slate-900">{candidate.fitScore}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${verdictStyles[candidate.verdict]}`}>
            {candidate.verdict}
          </span>
          <span className={`text-xs text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[candidate.status]}`}>
          {statusLabels[candidate.status]}
        </span>
        {candidate.bookedSlot && (
          <span className="text-xs text-slate-600">
            {new Date(candidate.bookedSlot).toLocaleString("en-US", {
              timeZone: "America/New_York",
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            EST
          </span>
        )}
      </div>

      <div className={`expand-rows ${expanded ? "expanded" : ""}`}>
        <div>
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          <p className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary-hover">
            <span className="font-semibold">Resumen ejecutivo: </span>
            {candidate.summary}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">A favor</h4>
              <ul className="mt-1.5 list-inside list-disc text-sm text-slate-700">
                {candidate.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">En contra / inciertas</h4>
              {candidate.gaps.length ? (
                <ul className="mt-1.5 list-inside list-disc text-sm text-slate-700">
                  {candidate.gaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-sm text-slate-500">Ninguna señalada.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span>
              Riesgo de overlap EST: <span className="font-medium text-slate-900">{candidate.estOverlapRisk}</span>
            </span>
            <span>
              Señal de inglés (IA): <span className="font-medium text-slate-900">{candidate.englishFluencySignal}</span>
            </span>
          </div>

          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <span>
              Años de experiencia (autoreportado): <span className="font-medium text-slate-900">{candidate.yearsExperience}</span>
            </span>
            <span>
              Disponibilidad EST (autoreportado):{" "}
              <span className="font-medium text-slate-900">{candidate.estAvailable ? "Sí" : "No"}</span>
            </span>
            <span>
              Inglés autopercibido: <span className="font-medium text-slate-900">{candidate.englishSelfLevel}</span>
            </span>
            <a
              href={`/api/recruiter/candidates/${candidate.id}/cv`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Ver CV ({candidate.cvFilename})
            </a>
          </div>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="font-semibold">Briefing para el reclutador: </span>
            {candidate.recruiterBriefing}
          </p>
        </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {candidate.status === "discarded" ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => runAction("reinstate")}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "reinstate" ? "Reincorporando..." : "Reincorporar"}
          </button>
        ) : (
          <>
            {(candidate.status === "new" || candidate.status === "invited" || candidate.status === "no_show") && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => runAction("invite")}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "invite" ? "Enviando..." : candidate.status === "invited" ? "Reenviar correo" : "Enviar correo de agendamiento"}
              </button>
            )}
            {candidate.status === "scheduled" && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => runAction("no-show")}
                className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-50 hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "no-show" ? "Marcando..." : "Marcar no-show"}
              </button>
            )}
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => runAction("discard")}
              className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "discard" ? "Descartando..." : "Descartar"}
            </button>
          </>
        )}
      </div>

      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
