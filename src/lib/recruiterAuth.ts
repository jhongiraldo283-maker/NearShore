import { createHash, timingSafeEqual } from "crypto";

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
