import { VacancyForm } from "@/components/VacancyForm";
import { BackLink } from "@/components/BackLink";

export default function NewVacancyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 animate-fade-in-up">
      <BackLink href="/recruiter" label="Back to roles" />
      <h1 className="text-2xl font-bold text-slate-900">Post a role</h1>
      <p className="mt-1 text-sm text-slate-600">
        Saving generates a unique application link you can share anywhere.
      </p>
      <div className="mt-8">
        <VacancyForm />
      </div>
    </div>
  );
}
