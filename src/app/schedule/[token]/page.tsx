import { getCandidateByScheduleToken, getVacancyById } from "@/lib/db";
import { ScheduleForm } from "@/components/ScheduleForm";

export const dynamic = "force-dynamic";

export default async function SchedulePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const candidate = await getCandidateByScheduleToken(token);

  if (!candidate) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center animate-fade-in-up">
        <h1 className="text-xl font-bold text-slate-900">Invalid link</h1>
        <p className="mt-2 text-sm text-slate-600">This scheduling link doesn&apos;t exist or has expired.</p>
      </div>
    );
  }

  if (candidate.status === "scheduled") {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center animate-fade-in-up">
        <h1 className="text-xl font-bold text-slate-900">You already have a call scheduled</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your call is confirmed for{" "}
          {candidate.bookedSlot &&
            new Date(candidate.bookedSlot).toLocaleString("en-US", {
              timeZone: "America/New_York",
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
          EST.
        </p>
      </div>
    );
  }

  if (candidate.status !== "invited") {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center animate-fade-in-up">
        <h1 className="text-xl font-bold text-slate-900">This link is no longer available</h1>
        <p className="mt-2 text-sm text-slate-600">Contact the recruiter directly if you need to reschedule.</p>
      </div>
    );
  }

  const vacancy = await getVacancyById(candidate.vacancyId);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 animate-fade-in-up">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Schedule your call</h1>
        <p className="mt-2 text-slate-600">
          Hi {candidate.name.split(" ")[0]}, pick a time for your call with a recruiter about the{" "}
          {vacancy?.title ?? "role"} position.
        </p>
      </header>

      <ScheduleForm token={token} />
    </div>
  );
}
