"use client";

import { useEffect, useState } from "react";

type Slot = { iso: string; label: string };

export function ScheduleForm({ token }: { token: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedLabel, setBookedLabel] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/slots");
        const data = await res.json();
        if (res.ok) setSlots(data.slots);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleBook() {
    if (!selectedSlot) return;
    setBooking(true);
    setError(null);

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, slotIso: selectedSlot }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo agendar ese horario.");
        return;
      }
      const label = slots.find((s) => s.iso === selectedSlot)?.label || selectedSlot;
      setBookedLabel(label);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setBooking(false);
    }
  }

  if (bookedLabel) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-900">¡Listo, quedaste agendado!</p>
        <p className="mt-2 text-sm text-emerald-800">
          Tu llamada con un reclutador quedó confirmada para <span className="font-medium">{bookedLabel}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {loading ? (
        <p className="text-sm text-slate-500">Cargando horarios disponibles...</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-slate-500">
          No hay horarios disponibles en este momento. Contacta al reclutador directamente.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((slot) => (
            <button
              key={slot.iso}
              type="button"
              onClick={() => setSelectedSlot(slot.iso)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                selectedSlot === slot.iso
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400"
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleBook}
        disabled={!selectedSlot || booking}
        className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {booking ? "Agendando..." : "Confirmar horario"}
      </button>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
