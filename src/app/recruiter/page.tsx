import Link from "next/link";
import { listVacancies } from "@/lib/db";

export const dynamic = "force-dynamic";

const statusStyles: Record<"open" | "closed", string> = {
  open: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-200 text-slate-700",
};

export default async function RecruiterHome() {
  const vacancies = await listVacancies();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vacantes</h1>
          <p className="mt-1 text-sm text-slate-600">
            {vacancies.length} vacante{vacancies.length === 1 ? "" : "s"} publicada{vacancies.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href="/recruiter/vacancies/new"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98]"
        >
          + Publicar vacante
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {vacancies.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
            Todavía no hay vacantes publicadas.
          </p>
        )}
        {vacancies.map((v, i) => (
          <Link
            key={v.id}
            href={`/recruiter/vacancies/${v.id}`}
            style={{ animationDelay: `${i * 40}ms` }}
            className="stagger-item block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{v.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {v.seniority} · {v.yearsExperience}+ años · {v.skills.join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">
                  {v.activeCandidateCount} candidato{v.activeCandidateCount === 1 ? "" : "s"}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[v.status]}`}>
                  {v.status === "open" ? "Abierta" : "Cerrada"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
