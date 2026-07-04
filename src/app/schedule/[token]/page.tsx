import { getCandidateByScheduleToken, getVacancyById } from "@/lib/db";
import { ScheduleForm } from "@/components/ScheduleForm";

export const dynamic = "force-dynamic";

export default async function SchedulePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const candidate = await getCandidateByScheduleToken(token);

  if (!candidate) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center animate-fade-in-up">
        <h1 className="text-xl font-bold text-slate-900">Link no válido</h1>
        <p className="mt-2 text-sm text-slate-600">Este link de agendamiento no existe o ya expiró.</p>
      </div>
    );
  }

  if (candidate.status === "scheduled") {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center animate-fade-in-up">
        <h1 className="text-xl font-bold text-slate-900">Ya tienes una llamada agendada</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tu llamada está confirmada para{" "}
          {candidate.bookedSlot &&
            new Date(candidate.bookedSlot).toLocaleString("en-US", {
              timeZone: "America/New_York",
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
          EST.
        </p>
      </div>
    );
  }

  if (candidate.status !== "invited") {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center animate-fade-in-up">
        <h1 className="text-xl font-bold text-slate-900">Este link ya no está disponible</h1>
        <p className="mt-2 text-sm text-slate-600">Contacta al reclutador directamente si necesitas reagendar.</p>
      </div>
    );
  }

  const vacancy = await getVacancyById(candidate.vacancyId);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 animate-fade-in-up">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Agenda tu llamada</h1>
        <p className="mt-2 text-slate-600">
          Hola {candidate.name.split(" ")[0]}, elige un horario para tu llamada con un reclutador sobre la
          posición de {vacancy?.title ?? "esta vacante"}.
        </p>
      </header>

      <ScheduleForm token={token} />
    </div>
  );
}
