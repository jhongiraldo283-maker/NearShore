"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteVacancyButton({ vacancyId }: { vacancyId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/vacancies/${vacancyId}/delete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not delete the role.");
        setBusy(false);
        return;
      }
      router.push("/recruiter");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  }

  if (confirming) {
    return (
      <div className="animate-fade-in-up flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">Delete this role and all its candidates? This can&apos;t be undone.</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="rounded-lg bg-action px-3 py-1.5 text-xs font-semibold text-white transition hover:scale-[1.03] hover:bg-action-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Deleting..." : "Yes, delete"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:scale-[1.03] hover:border-action active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-slate-300 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:scale-[1.03] hover:border-slate-500 hover:text-slate-700 active:scale-[0.97]"
    >
      Delete role
    </button>
  );
}
