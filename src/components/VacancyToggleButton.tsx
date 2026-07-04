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
        setError(data.error || "No se pudo actualizar la vacante.");
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
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
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Actualizando..." : status === "open" ? "Cerrar vacante" : "Reabrir vacante"}
      </button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
