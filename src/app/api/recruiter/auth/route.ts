import { NextResponse } from "next/server";
import { RECRUITER_COOKIE, expectedSessionToken, isValidPasscode } from "@/lib/recruiterAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { passcode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!process.env.RECRUITER_PASSCODE) {
    return NextResponse.json({ error: "RECRUITER_PASSCODE is not configured on the server." }, { status: 500 });
  }

  const passcode = body.passcode?.trim();
  if (!passcode || !isValidPasscode(passcode)) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(RECRUITER_COOKIE, expectedSessionToken()!, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
