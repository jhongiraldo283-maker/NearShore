export type WorkflowStep = {
  id: string;
  number: number;
  title: string;
  summary: string;
  details: string[];
  tools: string[];
  aiValue: string;
};

export const ROLE = {
  title: "Senior Full Stack Engineer",
  requirements: ["React", "Node.js", "AWS", "5+ years experience", "Fluent English", "EST overlap required"],
};

export const workflowSteps: WorkflowStep[] = [
  {
    id: "trigger",
    number: 1,
    title: "New opening triggers the pipeline",
    summary:
      "A hiring manager opens the req in the ATS/CRM. That status change is the single event that kicks off everything downstream — no recruiter has to manually start anything.",
    details: [
      "Hiring manager creates/approves the req in HubSpot (or Greenhouse/Lever) and sets status to \"Open\".",
      "A webhook fires into n8n the moment that happens.",
      "n8n reads the JD and stores it as the source of truth for this req.",
    ],
    tools: ["HubSpot (or ATS)", "n8n (webhook trigger)"],
    aiValue:
      "Gemini parses the free-text JD into a structured scoring rubric (must-have skills, seniority, language/timezone constraints) automatically — so scoring criteria never has to be hand-configured per role.",
  },
  {
    id: "sourcing",
    number: 2,
    title: "Candidates are sourced from multiple channels",
    summary:
      "Inbound and outbound sourcing run in parallel and land in the same place, so nothing depends on a recruiter manually copying candidates between tools.",
    details: [
      "Inbound: careers page and HubSpot forms feed applicants directly into the CRM.",
      "Outbound: LinkedIn Recruiter searches, job board postings (Indeed, LinkedIn Jobs, Wellfound) and a referral link, all routed through n8n.",
      "Past-candidate database is re-queried for anyone previously scored well for a similar role.",
      "n8n dedupes by email/phone before a candidate is scored twice from two sources.",
    ],
    tools: ["n8n (orchestration)", "HubSpot CRM", "LinkedIn Recruiter / Jobs API", "Indeed API", "Apify or PhantomBuster (where no official API exists)"],
    aiValue:
      "Gemini normalizes messy, differently-formatted profiles (PDF resumes, LinkedIn exports, plain-text applications) into one consistent candidate schema, and fuzzy-matches likely duplicates across sources.",
  },
  {
    id: "scoring",
    number: 3,
    title: "Candidates are qualified and scored",
    summary:
      "This is the core of the system: every candidate gets a consistent, explainable fit score against the req's rubric instead of a recruiter manually reading every resume.",
    details: [
      "n8n sends the candidate profile + the structured rubric from Step 1 to Gemini.",
      "Gemini returns a structured score: skills match, years of experience, English fluency signal, EST overlap, and any red flags — with a short rationale for each.",
      "The score and rationale are written back to the candidate's HubSpot record as custom properties.",
    ],
    tools: ["Gemini API", "n8n", "HubSpot custom properties"],
    aiValue:
      "Consistent, explainable scoring at scale — every candidate is judged against the same rubric, and the recruiter sees why a score was given, not just a number.",
  },
  {
    id: "engagement",
    number: 4,
    title: "Qualified candidates are engaged automatically",
    summary:
      "Above a score threshold, outreach happens without waiting on a recruiter — personalized, not templated.",
    details: [
      "High score → Gemini drafts a 1:1 personalized outreach message referencing the candidate's actual stack/projects; sent via HubSpot sequences or n8n + SendGrid/Twilio/WhatsApp.",
      "Borderline score → routed to a lighter nurture sequence instead of being dropped.",
      "Low score → a polite automated response with an invitation to apply to other roles later.",
    ],
    tools: ["HubSpot sequences", "n8n + SendGrid / Twilio / WhatsApp Business API", "Gemini API (message drafting)"],
    aiValue:
      "Personalization at scale is what actually moves response rates — a generic template gets ignored, a message that mentions the candidate's specific AWS project gets replies.",
  },
  {
    id: "booking",
    number: 5,
    title: "Interested candidates book time with a recruiter",
    summary:
      "Before a slot ever hits the recruiter's calendar, a short AI pre-screen confirms the basics so the call is worth having.",
    details: [
      "Candidate replies \"interested\" → a short Gemini-powered chat asks 3-4 quick questions (availability, EST overlap confirmation, comp expectations, work authorization).",
      "If those check out, the candidate is handed a live scheduling link (Calendly or HubSpot Meetings) and books directly.",
      "If something doesn't check out, the recruiter is notified instead of a slot being auto-booked.",
    ],
    tools: ["Gemini-powered chat widget", "Calendly / HubSpot Meetings API"],
    aiValue:
      "The conversational pre-screen catches obvious mismatches (no EST overlap, comp mismatch) before they ever consume a recruiter's calendar slot.",
  },
  {
    id: "briefing",
    number: 6,
    title: "The recruiter gets a briefing before the call",
    summary:
      "By the time the recruiter joins the call, prep time is already zero — the system has assembled everything.",
    details: [
      "n8n assembles a one-pager the moment a call is booked: candidate summary, fit score + rationale, resume/LinkedIn link, key strengths and gaps vs. the JD, EST overlap confirmation, and suggested interview questions tailored to the gaps.",
      "Pushed to Slack and/or the HubSpot record timeline, timed to arrive before the call, not buried in an inbox.",
    ],
    tools: ["n8n", "Gemini API (summarization)", "Slack API / HubSpot timeline"],
    aiValue:
      "The recruiter walks into every call already knowing exactly what to probe on, instead of speed-reading a resume in the two minutes before the call starts.",
  },
];

export const toolStack = [
  { name: "n8n", role: "Orchestration backbone connecting every step end-to-end" },
  { name: "HubSpot", role: "System of record: CRM/ATS, sequences, meeting scheduling" },
  { name: "Gemini API", role: "JD parsing, candidate scoring, personalization, conversational pre-screen, call briefings" },
  { name: "Calendly / HubSpot Meetings", role: "Self-serve booking once a candidate is pre-screened" },
  { name: "Slack", role: "Real-time recruiter notifications and call briefings" },
  { name: "Twilio / WhatsApp Business API / SendGrid", role: "Multi-channel candidate engagement" },
  { name: "Apify / PhantomBuster", role: "Sourcing fallback where no official API access exists" },
];

export const assumptions = [
  {
    title: "HubSpot (or an existing ATS) stays the system of record",
    detail: "This design plugs into it rather than replacing it — recruiters keep one place to look, automation happens around it.",
  },
  {
    title: "Scoring never silently auto-rejects",
    detail: "Any candidate below a score threshold is still visible to the recruiter with the AI's rationale attached before anything is auto-declined — a human can always override.",
  },
  {
    title: "EST overlap failures are flagged, not dropped",
    detail: "A strong candidate who fails timezone overlap is surfaced as a \"schedule risk\" in case the requirement has flexibility for the right person, instead of being filtered out silently.",
  },
  {
    title: "English fluency from text alone is a soft signal",
    detail: "Written English quality is used as a directional signal, not a hard filter — fluency is properly confirmed live on the recruiter call.",
  },
  {
    title: "No-shows get a reschedule, not a dead end",
    detail: "Automated reminders fire 24h and 1h before the call; a missed call auto-offers a reschedule link instead of requiring manual recruiter follow-up.",
  },
  {
    title: "Non-responders go to nurture, not deletion",
    detail: "Candidates who don't respond within a few days move to a passive nurture list so they can be re-engaged for future roles.",
  },
  {
    title: "Consent and data compliance are built in",
    detail: "Nearshore sourcing crosses borders — automated outreach includes opt-out, and candidate data handling follows GDPR/CCPA depending on candidate region.",
  },
  {
    title: "Duplicate candidates are merged before scoring",
    detail: "The same person applying via two channels (e.g. LinkedIn + referral) is deduped by email/phone so they're scored once, not twice with possibly conflicting results.",
  },
];
