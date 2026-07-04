import { getVacancyBySlug } from "@/lib/db";
import { ApplyForm } from "@/components/ApplyForm";

export const dynamic = "force-dynamic";

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vacancy = await getVacancyBySlug(slug);

  if (!vacancy) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center animate-fade-in-up">
        <h1 className="text-xl font-bold text-slate-900">Vacante no encontrada</h1>
        <p className="mt-2 text-sm text-slate-600">Este link de aplicación no es válido.</p>
      </div>
    );
  }

  if (vacancy.status === "closed") {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center animate-fade-in-up">
        <h1 className="text-xl font-bold text-slate-900">Vacante cerrada</h1>
        <p className="mt-2 text-sm text-slate-600">
          Esta vacante ya no está disponible. ¡Gracias por tu interés en Nearshore Business Solutions!
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 animate-fade-in-up">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Nearshore Business Solutions is hiring
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{vacancy.title}</h1>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {vacancy.skills.map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {s}
            </span>
          ))}
        </div>
        <p className="mt-4 text-slate-600">
          {vacancy.seniority} · {vacancy.yearsExperience}+ años de experiencia · {vacancy.language} ·{" "}
          {vacancy.timezoneOverlap} · {vacancy.salaryRange}
        </p>
        <p className="mt-4 text-slate-600">
          Aplica abajo. Revisamos cada aplicación con ayuda de IA y, si tu perfil es un buen match, un
          reclutador te contactará por correo para agendar una llamada.
        </p>
      </header>

      <ApplyForm slug={slug} />
    </div>
  );
}
