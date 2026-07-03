import { workflowSteps } from "@/lib/workflow";

export function WorkflowDiagram() {
  return (
    <ol className="relative border-l border-slate-300 dark:border-slate-700 ml-4">
      {workflowSteps.map((step) => (
        <li key={step.id} className="mb-10 ml-8 last:mb-0">
          <span className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white ring-4 ring-white dark:ring-slate-950">
            {step.number}
          </span>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              {step.summary}
            </p>

            <ul className="mt-4 space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
              {step.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {step.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {tool}
                </span>
              ))}
            </div>

            <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
              <span className="font-semibold">Where AI adds value: </span>
              {step.aiValue}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
