const SLOT_HOURS_LOCAL = [10, 13, 15]; // 10:00 AM, 1:00 PM, 3:00 PM, New York time
const BUSINESS_DAYS_AHEAD = 5;

export type Slot = { iso: string; label: string };

function nextBusinessDays(count: number): Date[] {
  const days: Date[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 1);
  while (days.length < count) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) days.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

// Returns the America/New_York UTC offset in hours (-5 for EST, -4 for EDT) for the given instant.
function newYorkUtcOffsetHours(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const offsetLabel = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const match = offsetLabel.match(/GMT([+-]\d+)/);
  return match ? parseInt(match[1], 10) : -5;
}

const labelFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

export function generateSlots(): Slot[] {
  const days = nextBusinessDays(BUSINESS_DAYS_AHEAD);
  const slots: Slot[] = [];

  for (const day of days) {
    // Sample the offset near midday New York time to stay clear of the DST transition instant.
    const middayUtc = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 17));
    const offsetHours = newYorkUtcOffsetHours(middayUtc);
    const zoneAbbreviation = offsetHours === -4 ? "EDT" : "EST";

    for (const hourLocal of SLOT_HOURS_LOCAL) {
      const utcHour = hourLocal - offsetHours;
      const slotDate = new Date(
        Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), utcHour, 0)
      );
      slots.push({ iso: slotDate.toISOString(), label: `${labelFormatter.format(slotDate)} ${zoneAbbreviation}` });
    }
  }

  return slots;
}
