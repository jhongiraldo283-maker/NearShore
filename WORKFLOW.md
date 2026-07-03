# Recruiting Automation Workflow

Take-home exercise deliverable — AI & Business Automation Specialist role.

**Scenario:** Nearshore Business Solutions has a new open role, **Senior Full Stack Engineer**
(React, Node.js, AWS, 5+ years, fluent English, EST overlap required). This document explains
the process designed to minimize recruiter administrative work and get qualified candidates
speaking with a recruiter as quickly as possible.

The live app in this repo implements a working version of steps 3-6 (scoring, engagement,
booking, recruiter briefing) end-to-end — see the README for the demo link.

## 1. A new opening triggers the pipeline

A hiring manager opens the req in the ATS/CRM. That status change is the single event that
kicks off everything downstream — no recruiter has to manually start anything.

- Hiring manager creates/approves the req in HubSpot (or Greenhouse/Lever) and sets status to "Open".
- A webhook fires into n8n the moment that happens.
- n8n reads the JD and stores it as the source of truth for this req.

**Tools:** HubSpot (or ATS), n8n (webhook trigger)

**Where AI adds value:** Gemini parses the free-text JD into a structured scoring rubric
(must-have skills, seniority, language/timezone constraints) automatically — so scoring
criteria never has to be hand-configured per role.

## 2. Candidates are sourced from multiple channels

Inbound and outbound sourcing run in parallel and land in the same place, so nothing depends
on a recruiter manually copying candidates between tools.

- Inbound: careers page and HubSpot forms feed applicants directly into the CRM.
- Outbound: LinkedIn Recruiter searches, job board postings (Indeed, LinkedIn Jobs, Wellfound)
  and a referral link, all routed through n8n.
- Past-candidate database is re-queried for anyone previously scored well for a similar role.
- n8n dedupes by email/phone before a candidate is scored twice from two sources.

**Tools:** n8n (orchestration), HubSpot CRM, LinkedIn Recruiter / Jobs API, Indeed API,
Apify or PhantomBuster (where no official API exists)

**Where AI adds value:** Gemini normalizes messy, differently-formatted profiles (PDF resumes,
LinkedIn exports, plain-text applications) into one consistent candidate schema, and
fuzzy-matches likely duplicates across sources.

## 3. Candidates are qualified and scored

This is the core of the system: every candidate gets a consistent, explainable fit score
against the req's rubric instead of a recruiter manually reading every resume.

- n8n sends the candidate profile + the structured rubric from Step 1 to Gemini.
- Gemini returns a structured score: skills match, years of experience, English fluency
  signal, EST overlap, and any red flags — with a short rationale for each.
- The score and rationale are written back to the candidate's HubSpot record as custom properties.

**Tools:** Gemini API, n8n, HubSpot custom properties

**Where AI adds value:** consistent, explainable scoring at scale — every candidate is judged
against the same rubric, and the recruiter sees why a score was given, not just a number.

*This is the step implemented live in the demo app — see `/api/apply`.*

## 4. Qualified candidates are engaged automatically

Above a score threshold, outreach happens without waiting on a recruiter — personalized, not templated.

- High score → Gemini drafts a 1:1 personalized outreach message referencing the candidate's
  actual stack/projects; sent via HubSpot sequences or n8n + SendGrid/Twilio/WhatsApp.
- Borderline score → routed to a lighter nurture sequence instead of being dropped.
- Low score → a polite automated response with an invitation to apply to other roles later.

**Tools:** HubSpot sequences, n8n + SendGrid / Twilio / WhatsApp Business API, Gemini API
(message drafting)

**Where AI adds value:** personalization at scale is what actually moves response rates — a
generic template gets ignored, a message that mentions the candidate's specific AWS project
gets replies.

*The demo app generates this personalized message live and displays it to the candidate
immediately after scoring, in place of an actual outbound email/SMS send.*

## 5. Interested candidates book time with a recruiter

Before a slot ever hits the recruiter's calendar, the candidate is only shown a booking option
if they qualified — protecting recruiter time.

- Candidate replies "interested" → in a full production build, a short Gemini-powered chat
  would ask 3-4 quick questions (availability, EST overlap confirmation, comp expectations,
  work authorization) before offering a slot.
- If those check out, the candidate is handed a live scheduling link (Calendly or HubSpot
  Meetings in production) and books directly.

**Tools:** Gemini-powered chat widget (pre-screen), Calendly / HubSpot Meetings API

**Where AI adds value:** the conversational pre-screen catches obvious mismatches (no EST
overlap, comp mismatch) before they ever consume a recruiter's calendar slot.

*The demo app implements a simplified version: qualified candidates pick directly from a set
of generated EST business-hour slots, stored in Postgres. A production build would replace
this with a real Calendly/HubSpot Meetings integration and the conversational pre-screen.*

## 6. The recruiter gets a briefing before the call

By the time the recruiter joins the call, prep time is already zero — the system has
assembled everything.

- n8n assembles a one-pager the moment a call is booked: candidate summary, fit score +
  rationale, resume/LinkedIn link, key strengths and gaps vs. the JD, EST overlap
  confirmation, and suggested interview questions tailored to the gaps.
- Pushed to Slack and/or the HubSpot record timeline, timed to arrive before the call, not
  buried in an inbox.

**Tools:** n8n, Gemini API (summarization), Slack API / HubSpot timeline

**Where AI adds value:** the recruiter walks into every call already knowing exactly what to
probe on, instead of speed-reading a resume in the two minutes before the call starts.

*The demo app's `/recruiter` dashboard shows this briefing for every candidate who applied,
sorted so booked/high-scoring candidates surface first.*

## Tool stack summary

| Tool | Role |
| --- | --- |
| n8n | Orchestration backbone connecting every step end-to-end |
| HubSpot | System of record: CRM/ATS, sequences, meeting scheduling |
| Gemini API | JD parsing, candidate scoring, personalization, conversational pre-screen, call briefings |
| Calendly / HubSpot Meetings | Self-serve booking once a candidate is pre-screened |
| Slack | Real-time recruiter notifications and call briefings |
| Twilio / WhatsApp Business API / SendGrid | Multi-channel candidate engagement |
| Apify / PhantomBuster | Sourcing fallback where no official API access exists |

## Assumptions & edge cases

- **HubSpot (or an existing ATS) stays the system of record.** This design plugs into it
  rather than replacing it — recruiters keep one place to look, automation happens around it.
- **Scoring never silently auto-rejects.** Any candidate below a score threshold is still
  visible to the recruiter with the AI's rationale attached before anything is auto-declined
  — a human can always override.
- **EST overlap failures are flagged, not dropped.** A strong candidate who fails timezone
  overlap is surfaced as a "schedule risk" in case the requirement has flexibility for the
  right person, instead of being filtered out silently.
- **English fluency from text alone is a soft signal.** Written English quality is used as a
  directional signal, not a hard filter — fluency is properly confirmed live on the recruiter call.
- **No-shows get a reschedule, not a dead end.** Automated reminders fire 24h and 1h before the
  call; a missed call auto-offers a reschedule link instead of requiring manual recruiter follow-up.
- **Non-responders go to nurture, not deletion.** Candidates who don't respond within a few
  days move to a passive nurture list so they can be re-engaged for future roles.
- **Consent and data compliance are built in.** Nearshore sourcing crosses borders —
  automated outreach includes opt-out, and candidate data handling follows GDPR/CCPA
  depending on candidate region.
- **Duplicate candidates are merged before scoring.** The same person applying via two
  channels (e.g. LinkedIn + referral) is deduped by email/phone so they're scored once, not
  twice with possibly conflicting results.
- **Demo-specific simplification:** the working demo covers a single hardcoded role and uses
  a lightweight self-serve slot picker instead of a real calendar integration, and skips the
  conversational pre-screen chat — both called out inline above where the production design differs.
