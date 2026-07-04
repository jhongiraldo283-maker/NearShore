import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const RECRUITER_COOKIE = "recruiter_session";

export function expectedSessionToken(): string | null {
  const passcode = process.env.RECRUITER_PASSCODE;
  if (!passcode) return null;
  return createHash("sha256").update(passcode).digest("hex");
}

export function isValidPasscode(candidate: string): boolean {
  const passcode = process.env.RECRUITER_PASSCODE;
  if (!passcode) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(passcode);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isValidSessionToken(token: string | undefined): boolean {
  const expected = expectedSessionToken();
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Must be called and checked *before* any sensitive data fetching in a page component.
// A layout that conditionally renders `{children}` does NOT stop the nested page's
// Server Component from still executing its data fetching and being serialized into the
// RSC payload — so the auth check has to gate the data fetch inline, in the same
// component function, not in a wrapping layout.
export async function hasRecruiterSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(RECRUITER_COOKIE)?.value;
  return isValidSessionToken(token);
}

export function isRecruiterRequest(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${RECRUITER_COOKIE}=`));
  const token = match ? decodeURIComponent(match.slice(RECRUITER_COOKIE.length + 1)) : undefined;
  return isValidSessionToken(token);
}
