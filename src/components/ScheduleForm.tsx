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
        setError(data.error || "Could not book that time.");
        return;
      }
      const label = slots.find((s) => s.iso === selectedSlot)?.label || selectedSlot;
      setBookedLabel(label);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBooking(false);
    }
  }

  if (bookedLabel) {
    return (
      <div className="animate-fade-in-up rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-900">You&apos;re booked!</p>
        <p className="mt-2 text-sm text-emerald-800">
          Your call with a recruiter is confirmed for <span className="font-medium">{bookedLabel}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up rounded-xl border border-slate-200 bg-surface p-6 shadow-sm">
      {loading ? (
        <p className="text-sm text-slate-500">Loading available times...</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-slate-500">
          No times are available right now. Contact the recruiter directly.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((slot) => (
            <button
              key={slot.iso}
              type="button"
              onClick={() => setSelectedSlot(slot.iso)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition hover:scale-[1.03] active:scale-[0.97] ${
                selectedSlot === slot.iso
                  ? "border-action bg-action text-white"
                  : "border-slate-300 bg-surface text-slate-700 hover:border-action"
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
        className="mt-4 rounded-lg bg-action px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-action-hover hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {booking ? "Booking..." : "Confirm time"}
      </button>

      {error && <p className="animate-fade-in-up mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
