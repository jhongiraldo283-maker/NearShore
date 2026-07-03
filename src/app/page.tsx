import { ApplyFlow } from "@/components/ApplyFlow";
import { ROLE } from "@/lib/workflow";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Nearshore Business Solutions is hiring
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-100">
          {ROLE.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {ROLE.requirements.map((r) => (
            <span
              key={r}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {r}
            </span>
          ))}
        </div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          Apply below. We review every application right away — if it&apos;s a strong fit, you&apos;ll be able to
          book a call with a recruiter immediately.
        </p>
      </header>

      <ApplyFlow />
    </div>
  );
}
