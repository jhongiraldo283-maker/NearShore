# Nearshore Recruiting Automation

Take-home exercise deliverable for the AI & Business Automation Specialist role: a working
recruiting pipeline for the open **Senior Full Stack Engineer** req.

- `/` — candidate-facing application form. Submitting scores the candidate live against the
  role via the Gemini API, shows a personalized AI-drafted response, and — if qualified — lets
  the candidate book a call directly from a set of generated recruiter time slots.
- `/recruiter` — passcode-protected dashboard listing every applicant with their fit score,
  strengths/gaps, EST overlap risk, English fluency signal, recruiter briefing, and booked time.

See [WORKFLOW.md](./WORKFLOW.md) for the full write-up of the six-step process, tool stack,
where AI adds value, and assumptions/edge cases (the take-home's deliverable #1).

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the candidate flow, or
[http://localhost:3000/recruiter](http://localhost:3000/recruiter) for the recruiter dashboard.

## Environment variables

| Variable | Description |
| --- | --- |
| `GEMINI_API_KEY` | Server-side only. Get one at [Google AI Studio](https://aistudio.google.com/apikey). |
| `GEMINI_MODEL` | Optional, defaults to `gemini-flash-latest`. |
| `DATABASE_URL` | Postgres connection string. Create via Vercel → Storage → Create Database → Postgres (Neon), which auto-populates this in your Vercel project. |
| `RECRUITER_PASSCODE` | Shared passcode gating `/recruiter`. Pick any string. |

None of these are committed — set them in `.env.local` locally and in Vercel's project
Environment Variables for production.

## Deploy

Connect this repository to Vercel, add the four environment variables above under
Project Settings → Environment Variables, and every push to `main` deploys automatically.
Adding/changing an environment variable requires a new deployment (redeploy or push) to take effect.
