import { NextResponse } from "next/server";
import { createVacancy } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Partial<{
    title: string;
    skills: string;
    yearsExperience: number | string;
    seniority: string;
    language: string;
    timezoneOverlap: string;
    salaryRange: string;
  }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = body.title?.trim();
  const seniority = body.seniority?.trim();
  const language = body.language?.trim();
  const timezoneOverlap = body.timezoneOverlap?.trim();
  const salaryRange = body.salaryRange?.trim();
  const yearsExperience = Number(body.yearsExperience);
  const skills = (body.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!title) return NextResponse.json({ error: "Job title is required." }, { status: 400 });
  if (skills.length === 0) return NextResponse.json({ error: "At least one required skill is needed." }, { status: 400 });
  if (!Number.isFinite(yearsExperience) || yearsExperience < 0) {
    return NextResponse.json({ error: "Invalid years of experience." }, { status: 400 });
  }
  if (!seniority) return NextResponse.json({ error: "Seniority is required." }, { status: 400 });
  if (!language) return NextResponse.json({ error: "Language requirement is required." }, { status: 400 });
  if (!timezoneOverlap) return NextResponse.json({ error: "Timezone overlap is required." }, { status: 400 });
  if (!salaryRange) return NextResponse.json({ error: "Salary range is required." }, { status: 400 });

  try {
    const vacancy = await createVacancy({
      title,
      skills,
      yearsExperience,
      seniority,
      language,
      timezoneOverlap,
      salaryRange,
      postText: "",
    });
    return NextResponse.json({ vacancy });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error creating role.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
