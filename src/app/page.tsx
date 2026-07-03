import { WorkflowDiagram } from "@/components/WorkflowDiagram";
import { ScoringWidget } from "@/components/ScoringWidget";
import { ROLE, toolStack, assumptions } from "@/lib/workflow";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <header className="mb-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Nearshore Business Solutions
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-100">
          Recruiting automation: from open req to recruiter call
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
          A workflow designed to minimize recruiter administrative work and get qualified candidates
          speaking with a recruiter as fast as possible — built around this open role:
        </p>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{ROLE.title}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ROLE.requirements.map((r) => (
              <span
                key={r}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="mb-16">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">The workflow</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Six steps, each with the tools behind it and where AI specifically adds value.
        </p>
        <div className="mt-8">
          <WorkflowDiagram />
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Try Step 3, live</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          A real call to Gemini, scoring against the rubric above — not a mockup.
        </p>
        <div className="mt-6">
          <ScoringWidget />
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Tool stack</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {toolStack.map((t) => (
            <div
              key={t.name}
              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Assumptions &amp; edge cases</h2>
        <div className="mt-6 space-y-3">
          {assumptions.map((a) => (
            <div
              key={a.title}
              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 pt-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-500">
        Take-home exercise deliverable — AI &amp; Business Automation Specialist role.
      </footer>
    </div>
  );
}
