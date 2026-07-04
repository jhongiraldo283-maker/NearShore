# Nearshore Recruiting Automation

A working, multi-vacancy recruiting pipeline with human-in-the-loop scheduling (a recruiter
always reviews and decides before a candidate can book a call — never fully automatic).

- `/` — landing page linking to the recruiter dashboard.
- `/recruiter` — internal dashboard (no login — meant to stay unlisted, not linked publicly):
  publish vacancies, get an AI-drafted LinkedIn post plus a unique application link per
  vacancy, and review each vacancy's candidate
  pipeline (fit score, strengths/gaps, EST overlap risk, English fluency signal, recruiter
  briefing, CV download). From there the recruiter sends a real scheduling email, discards a
  candidate (checked against a global discard list on future applications), or marks a
  no-show.
- `/apply/[slug]` — the public, per-vacancy application form candidates reach via their
  unique link. Scores the candidate live against that vacancy via the Gemini API from their
  uploaded CV (PDF) and form answers; the candidate only sees a generic confirmation — the
  score is for the recruiter, not revealed to the candidate.
- `/schedule/[token]` — the link a candidate gets by email once a recruiter invites them;
  lets them pick one of the generated recruiter time slots.

See [WORKFLOW.md](./WORKFLOW.md) for the full write-up of the process, tool stack, where AI
adds value, and assumptions/edge cases.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then go to
[http://localhost:3000/recruiter](http://localhost:3000/recruiter) to publish a vacancy and
get its application link.

## Environment variables

| Variable | Description |
| --- | --- |
| `GEMINI_API_KEY` | Server-side only. Get one at [Google AI Studio](https://aistudio.google.com/apikey). |
| `GEMINI_MODEL` | Optional, defaults to `gemini-flash-latest`. |
| `DATABASE_URL` | Postgres connection string. Create via Vercel → Storage → Create Database → Postgres (Neon), which auto-populates this in your Vercel project. |
| `RESEND_API_KEY` | Server-side only. Get one at [resend.com](https://resend.com) (free tier). Without a verified sending domain, Resend's sandbox mode only delivers to the email address you signed up with — that's expected for this demo. |
| `RESEND_FROM` | Optional, defaults to `onboarding@resend.dev` (Resend's shared sandbox sender — only usable for testing, see below). |
| `APP_URL` | Base URL used to build links inside scheduling emails, e.g. `http://localhost:3000` locally. Falls back to `https://$VERCEL_URL` in production if unset. |

None of these are committed — set them in `.env.local` locally and in Vercel's project
Environment Variables for production.

### Sending real scheduling emails (Resend)

Resend's free plan (no credit card) covers this comfortably: 3,000 emails/month, 100/day, one
verified domain. Sign up at [resend.com](https://resend.com) and grab an API key from the
dashboard — that's all you need to test.

Without verifying a domain, Resend restricts you to its shared sandbox sender
(`onboarding@resend.dev`) and only delivers to the email address your Resend account was
created with — every other recipient gets silently rejected. That's actually convenient here:
apply as a candidate using your own email, hit "Enviar correo de agendamiento" in `/recruiter`,
and the invite lands in your real inbox so you can click through and book a slot yourself.

To send to real candidates in production, verify a domain you own in the Resend dashboard
(Domains → Add Domain → add the SPF/DKIM/DMARC DNS records it gives you), then set
`RESEND_FROM` to an address on that domain (e.g. `recruiting@yourcompany.com`).

## Deploy

Connect this repository to Vercel, add the environment variables above under
Project Settings → Environment Variables, and every push to `main` deploys automatically.
Adding/changing an environment variable requires a new deployment (redeploy or push) to take effect.
