import { VacancyForm } from "@/components/VacancyForm";
import { hasRecruiterSession } from "@/lib/recruiterAuth";
import { RecruiterPasscodeForm } from "@/components/RecruiterPasscodeForm";

export const dynamic = "force-dynamic";

export default async function NewVacancyPage() {
  if (!(await hasRecruiterSession())) {
    return <RecruiterPasscodeForm />;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Publicar vacante</h1>
      <p className="mt-1 text-sm text-slate-600">
        Al guardar, se genera automáticamente el texto del post para LinkedIn y un link único de
        aplicación.
      </p>
      <div className="mt-8">
        <VacancyForm />
      </div>
    </div>
  );
}
