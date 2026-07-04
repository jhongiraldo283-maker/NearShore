import { notFound } from "next/navigation";
import { getVacancyById, listCandidatesForVacancy } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { CandidateRow } from "@/components/CandidateRow";
import { CopyButton } from "@/components/CopyButton";
import { VacancyToggleButton } from "@/components/VacancyToggleButton";

export const dynamic = "force-dynamic";

export default async function VacancyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vacancyId = Number(id);
  if (!Number.isInteger(vacancyId)) notFound();

  const vacancy = await getVacancyById(vacancyId);
  if (!vacancy) notFound();

  const candidates = await listCandidatesForVacancy(vacancyId);
  const active = candidates.filter((c) => c.status !== "discarded");
  const discarded = candidates.filter((c) => c.status === "discarded");

  const applyUrl = `${appUrl()}/apply/${vacancy.slug}`;
  const postText = vacancy.postText.replaceAll("{{APPLY_LINK}}", applyUrl);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 animate-fade-in-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{vacancy.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {vacancy.seniority} · {vacancy.yearsExperience}+ años · {vacancy.language} · {vacancy.timezoneOverlap} ·{" "}
            {vacancy.salaryRange}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {vacancy.skills.map((s) => (
              <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
              vacancy.status === "open" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
            }`}
          >
            {vacancy.status === "open" ? "Abierta" : "Cerrada"}
          </span>
          <VacancyToggleButton vacancyId={vacancy.id} status={vacancy.status} />
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Link de aplicación</h2>
          <CopyButton text={applyUrl} label="Copiar link" />
        </div>
        <p className="mt-1 break-all text-sm text-primary">{applyUrl}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Post generado para LinkedIn</h2>
          <CopyButton text={postText} label="Copiar post" />
        </div>
        <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{postText}</p>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Candidatos ({active.length})
        </h2>
        <p className="mt-1 text-sm text-slate-600">Ordenados de mayor a menor % de match.</p>

        <div className="mt-4 space-y-4">
          {active.length === 0 && <p className="text-sm text-slate-500">Todavía no hay candidatos activos.</p>}
          {active.map((c, i) => (
            <div key={c.id} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
              <CandidateRow candidate={c} />
            </div>
          ))}
        </div>
      </div>

      {discarded.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700 transition hover:text-primary">
            Ver descartados ({discarded.length})
          </summary>
          <div className="mt-4 space-y-4">
            {discarded.map((c) => (
              <CandidateRow key={c.id} candidate={c} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
