"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VacancyToggleButton({ vacancyId, status }: { vacancyId: number; status: "open" | "closed" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/vacancies/${vacancyId}/toggle`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update the role.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        className="rounded-lg border border-slate-300 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:scale-[1.03] hover:border-action active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Updating..." : status === "open" ? "Close role" : "Reopen role"}
      </button>
      {error && <p className="animate-fade-in-up text-xs text-rose-600">{error}</p>}
    </div>
  );
}
