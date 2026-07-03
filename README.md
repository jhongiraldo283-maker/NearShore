# Nearshore Recruiting Automation Workflow

Take-home exercise deliverable for the AI & Business Automation Specialist role: a workflow
for the open **Senior Full Stack Engineer** req, showing how a new opening triggers sourcing,
AI-based qualification/scoring, automatic engagement, recruiter booking, and a pre-call briefing.

The landing page documents all six steps of the workflow, the tool stack, where AI adds value,
and the assumptions/edge cases considered. It also includes a live interactive demo of the
scoring step (Step 3), backed by the Gemini API.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in GEMINI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
| --- | --- |
| `GEMINI_API_KEY` | Server-side only. Get one at [Google AI Studio](https://aistudio.google.com/apikey). Never committed — set locally in `.env.local` and in Vercel's project environment variables. |
| `GEMINI_MODEL` | Optional, defaults to `gemini-flash-latest`. |

## Deploy

Connect this repository to Vercel, add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) under
Project Settings → Environment Variables, and every push to `main` deploys automatically.
