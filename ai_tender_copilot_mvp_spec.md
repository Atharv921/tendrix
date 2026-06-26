# AI Tender Copilot — MVP Technical Specification
**Month 2–4 Build Plan | Version 1.0**

---

## 1. Overview

### 1.1 What We Are Building

A web-based SaaS platform that allows Indian businesses and tender consultants to upload government procurement documents and receive AI-powered analysis: structured summaries, eligibility verdicts, document checklists, and a Q&A interface with page-level citations.

This spec covers the **MVP scope only** — the minimum product needed to onboard 10–20 beta users and validate willingness to pay. Nothing in this document is permanent architecture; all decisions prioritise speed to user feedback over scalability.

### 1.2 MVP Success Criteria

| Metric | Target by end of Month 4 |
|--------|--------------------------|
| Beta users onboarded | 10–20 |
| Tenders processed | 50+ |
| Average analysis time | < 90 seconds per document |
| User-reported time saved | ≥ 60% vs. manual |
| Paying conversions from beta | ≥ 3 |

### 1.3 Out of Scope for MVP

The following are explicitly deferred to post-MVP:

- Corrigendum comparison (Month 5+)
- Team collaboration workspace (Month 5+)
- Multi-user accounts / RBAC (Month 5+)
- Mobile app (Month 9+)
- Regional language support (Month 7+)
- Direct portal integrations / scraping (Month 6+)
- API access for enterprise (Month 9+)
- Automated deadline notifications (Month 6+)

---

## 2. User Personas (MVP Focus)

### Persona A — The Tender Consultant

**Name:** Ramesh, 38, Pune

Works independently or in a small firm. Handles 15–30 tenders per month for MSME clients. Currently reads every PDF manually, maintains checklists in Excel, and tracks deadlines in a diary or WhatsApp reminders. Pain: spending 3–6 hours per tender on initial analysis before he even decides whether to bid.

**MVP job-to-be-done:** Upload a tender, get a structured summary and eligibility check in minutes, export a checklist to share with his client.

### Persona B — The In-House Bid Manager

**Name:** Priya, 31, Bengaluru

Works at a mid-size IT services company. Manages 5–10 active government bids at any time. Primary pain: missing eligibility clauses buried on page 147, and tracking which documents are still outstanding across multiple bids.

**MVP job-to-be-done:** Get an accurate eligibility verdict with highlighted clauses and a document gap analysis without reading the full RFP herself.

---

## 3. Core Feature Set (MVP)

The MVP delivers four features in this priority order:

```
Priority 1: Tender Upload + AI Summary
Priority 2: Eligibility Check
Priority 3: Required Document Checklist
Priority 4: Q&A with Page References
```

### 3.1 Feature 1 — Tender Upload & AI Summary

**What it does:**

User uploads a PDF tender document (up to 200 pages for MVP). The system processes it and returns a structured summary within 90 seconds.

**Summary output structure:**

```
Tender Summary
├── Basic Info
│   ├── Tender title
│   ├── Issuing authority
│   ├── Tender number / reference ID
│   ├── Date of publication
│   ├── Submission deadline (date + time + timezone)
│   ├── EMD (Earnest Money Deposit) amount
│   └── Tender fee (if any)
│
├── Work / Scope
│   ├── Nature of work / services required
│   ├── Location of work
│   ├── Contract duration
│   └── Estimated contract value (if disclosed)
│
├── Key Dates
│   ├── Pre-bid meeting date (if any)
│   ├── Last date for queries
│   ├── Bid submission deadline
│   └── Bid opening date
│
└── Quick Verdict
    ├── Complexity rating (Low / Medium / High)
    └── Recommended action (Bid / Review / Skip)
```

**Acceptance criteria:**

- Upload accepts PDF files up to 50 MB
- Processing begins within 3 seconds of upload completion
- Summary is displayed within 90 seconds for documents up to 200 pages
- Each summary field includes the source page number (e.g., "Page 12")
- If a field cannot be found, display "Not specified in document" — never hallucinate a value
- User can copy the full summary as plain text or download as PDF

---

### 3.2 Feature 2 — Eligibility Check

**What it does:**

Extracts all eligibility criteria from the tender and evaluates them against a company profile the user configures in onboarding. Returns a colour-coded verdict for each criterion.

**Eligibility criteria categories to extract:**

```
Financial Criteria
├── Minimum annual turnover (e.g., ₹5 Cr in last 3 years)
├── Net worth requirement
└── Profit/loss criteria (if any)

Technical Criteria
├── Prior experience (e.g., "2 similar projects in last 5 years")
├── Project value thresholds (e.g., "1 project of ≥ ₹2 Cr")
├── Technical staff requirements
└── Equipment / machinery requirements

Registration & Compliance
├── GST registration
├── PAN / incorporation certificate
├── MSME / Udyam registration
├── ISO certifications
├── Class of contractor registration (for civil tenders)
└── Sector-specific licenses (e.g., drug license for pharma)

Blacklisting / Litigation
└── Declaration of not being blacklisted by any govt. authority
```

**Company profile (set during onboarding):**

```yaml
company_profile:
  name: "Acme Infra Pvt. Ltd."
  type: "Private Limited"
  year_established: 2015
  annual_turnover:
    fy2023: 8.2  # in Crores
    fy2022: 6.1
    fy2021: 5.4
  net_worth: 3.8  # in Crores
  registrations:
    - GST
    - PAN
    - Udyam (MSME)
    - ISO 9001:2015
  experience:
    - description: "Road construction, NHAI, ₹3.2 Cr"
      year: 2022
    - description: "Building construction, PWD Maharashtra, ₹1.8 Cr"
      year: 2021
  sector: ["construction", "civil", "infrastructure"]
  states_registered: ["Maharashtra", "Karnataka", "Goa"]
```

**Output: Eligibility verdict card**

For each criterion extracted, display:

| Status | Colour | Meaning |
|--------|--------|---------|
| ✅ Met | Green | Company profile clearly satisfies this criterion |
| ⚠️ Needs review | Amber | Criterion found but cannot be automatically verified (user must confirm) |
| ❌ Not met | Red | Profile data clearly does not satisfy this criterion |
| ❓ Not found | Grey | Criterion not detected in document |

**Overall verdict:**

- All green → "Likely eligible — review amber items before proceeding"
- Any red → "Ineligible — one or more criteria not met"
- Multiple amber → "Manual review required — key criteria unclear"

**Acceptance criteria:**

- Every criterion must link back to its source (page number + quoted text snippet ≤ 2 sentences)
- Verdict must never be overconfident — always recommend human review for amber
- User can manually override any verdict and add notes
- If the company profile is incomplete, flag which fields are missing before running the check

---

### 3.3 Feature 3 — Required Document Checklist

**What it does:**

Extracts every document required for bid submission and presents them as an interactive checklist the user can mark off and export.

**Document categories:**

```
Technical Bid Documents
├── Company registration certificates
├── GST / PAN copies
├── Audited financial statements (specify years)
├── Experience certificates / work orders
├── Performance certificates
├── Technical staff credentials / CVs
└── ISO / quality certificates

Financial Bid Documents
├── Bill of Quantities (BOQ) filled
├── Price bid / rate schedule
└── Bank guarantee / DD for EMD

Declarations & Undertakings
├── Non-blacklisting declaration
├── Integrity pact (if applicable)
└── MSME declaration (if claiming preference)

Portal-Specific Requirements
├── Digital signature certificate (DSC) class
├── Portal-specific forms (e.g., Form A, B, C)
└── Physical submission requirements (if any)
```

**Checklist UI behaviour:**

- Each item shows: document name, description, whether it's mandatory or optional, and source page reference
- User can check off each item as "Ready", "In Progress", or "Missing"
- Progress bar shows overall completion percentage
- Export to PDF generates a clean checklist with company name, tender reference, and date
- Export to Excel generates a sheet suitable for sharing with the accounts team

**Acceptance criteria:**

- Must distinguish between mandatory and optional documents
- Must specify quantities where relevant (e.g., "3 copies of experience certificate")
- Source page citation required for every item
- Checklist state persists between sessions (stored per tender in database)

---

### 3.4 Feature 4 — Q&A with Page References

**What it does:**

A chat interface where users can ask natural language questions about the tender document. Every answer must cite the specific page(s) it was derived from.

**Example queries the system must handle well:**

```
"What is the minimum turnover required?"
→ "₹5 Crore average over the last 3 financial years. [Page 14, Clause 4.2]"

"Are joint ventures allowed?"
→ "Yes, joint ventures are permitted with a maximum of 3 partners. The lead partner must hold at least 51% stake. [Page 18, Clause 5.1]"

"What is the EMD amount and in what form?"
→ "₹2.5 Lakh, payable as a Demand Draft or Bank Guarantee in favour of the Executive Engineer, PWD Nagpur. [Page 7, Clause 2.4]"

"Is there a pre-bid meeting?"
→ "Yes, on 15th March 2025 at 11:00 AM at the office of the Chief Engineer, Nashik Division. Attendance is not mandatory. [Page 5, Clause 1.9]"

"What happens if we submit late?"
→ "Late bids will be summarily rejected without being opened. [Page 9, Clause 3.1]"
```

**Guardrails (critical for trust):**

- If the answer is not in the document, respond: "This is not addressed in the tender document. Please contact the issuing authority."
- Never synthesise information not present in the document
- Confidence score displayed alongside each answer (High / Medium / Low)
- Low confidence answers trigger a warning: "This answer may need manual verification — please check the cited pages directly."
- Maximum 5 questions per tender in the free tier; unlimited in paid plans

**Acceptance criteria:**

- Page citation is mandatory on every non-null answer
- Response time under 10 seconds
- User can click page reference to jump to (or see highlighted) the relevant section
- Conversation history preserved per tender session

---

## 4. Technical Architecture

### 4.1 Stack Decisions

All decisions optimise for **speed of development over scalability**. A two-person team should be able to ship this in 10–12 weeks.

```
Frontend        Next.js 14 (App Router)
Styling         Tailwind CSS
Auth            Clerk (handles email/password, Google OAuth, sessions)
Database        Supabase (PostgreSQL + file storage)
File Storage    Supabase Storage (PDF uploads)
AI / LLM        Anthropic Claude API (claude-sonnet-4-6)
PDF Parsing     pdf-parse (Node.js) + PyMuPDF for fallback OCR
Background Jobs Supabase Edge Functions (Deno) for async processing
Hosting         Vercel (frontend) + Supabase (backend + DB + storage)
Payments        Razorpay (subscription + one-time)
Email           Resend (transactional emails)
Analytics       PostHog (self-hosted or cloud)
Error tracking  Sentry
```

**Why this stack:**

- Supabase replaces three services: database, file storage, and auth fallback
- Clerk removes all auth complexity from the MVP
- Vercel + Supabase = zero DevOps for a solo/small team
- Razorpay is mandatory for India (UPI, net banking, cards — all supported)

### 4.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   USER BROWSER                       │
│              Next.js Frontend (Vercel)               │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────────────┐
│              Next.js API Routes                      │
│   /api/tender/upload                                 │
│   /api/tender/[id]/summary                          │
│   /api/tender/[id]/eligibility                      │
│   /api/tender/[id]/checklist                        │
│   /api/tender/[id]/chat                             │
└────────┬──────────────────────┬─────────────────────┘
         │                      │
         ▼                      ▼
┌────────────────┐    ┌──────────────────────────────┐
│  Anthropic     │    │       Supabase                │
│  Claude API    │    │  ┌──────────────────────────┐ │
│                │    │  │  PostgreSQL Database      │ │
│  - Summary     │    │  │  - users                 │ │
│  - Eligibility │    │  │  - companies             │ │
│  - Checklist   │    │  │  - tenders               │ │
│  - Q&A         │    │  │  - analyses              │ │
└────────────────┘    │  │  - checklist_items       │ │
                      │  │  - chat_messages         │ │
                      │  └──────────────────────────┘ │
                      │  ┌──────────────────────────┐ │
                      │  │  Supabase Storage        │ │
                      │  │  - Raw PDF uploads       │ │
                      │  │  - Extracted text cache  │ │
                      │  └──────────────────────────┘ │
                      └──────────────────────────────┘
```

### 4.3 Database Schema

```sql
-- Users (managed by Clerk, mirrored here)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  tenders_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company profiles (one per user in MVP)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- "Proprietorship", "Partnership", "Pvt Ltd", etc.
  year_established INTEGER,
  gstin TEXT,
  pan TEXT,
  msme_udyam_number TEXT,
  profile_data JSONB, -- full profile blob (turnover, experience, registrations)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tender documents
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  file_size_bytes BIGINT,
  page_count INTEGER,
  extracted_text TEXT, -- full text extracted from PDF
  status TEXT DEFAULT 'uploading'
    CHECK (status IN ('uploading', 'processing', 'ready', 'failed')),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Analysis results
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('summary', 'eligibility', 'checklist')),
  result JSONB NOT NULL, -- structured output from Claude
  model_version TEXT, -- claude model used
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist items (materialised from analysis for interactivity)
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  document_name TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT TRUE,
  source_page INTEGER,
  source_text TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'ready', 'missing')),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Q&A chat messages per tender
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  citations JSONB, -- [{page: 14, clause: "4.2", snippet: "..."}]
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 PDF Processing Pipeline

```
Upload (client)
    │
    ▼
Supabase Storage (raw PDF saved)
    │
    ▼
Text Extraction (server)
    ├─ Attempt 1: pdf-parse (fast, works for digital PDFs)
    ├─ Attempt 2: PyMuPDF via Python sidecar (better table handling)
    └─ Fallback: Flag as "scanned PDF — OCR required" (MVP: manual for now)
    │
    ▼
Text Chunking
    ├─ Split into page-level chunks
    ├─ Store page boundaries for citation
    └─ Save extracted text to Supabase Storage
    │
    ▼
Parallel AI Analysis (3 Claude calls, run concurrently)
    ├─ Call 1: Generate summary JSON
    ├─ Call 2: Extract eligibility criteria JSON
    └─ Call 3: Extract document checklist JSON
    │
    ▼
Store results in analyses table
    │
    ▼
Materialise checklist_items rows
    │
    ▼
Mark tender status = 'ready'
    │
    ▼
Notify user (in-app + email via Resend)
```

**Processing time budget:**

| Step | Target time |
|------|-------------|
| PDF upload (50MB) | < 10 seconds |
| Text extraction | < 15 seconds |
| 3 parallel Claude calls | < 60 seconds |
| DB writes + materialisation | < 5 seconds |
| **Total** | **< 90 seconds** |

### 4.5 Claude Prompt Design

**Principle: structured JSON output only.** All prompts instruct Claude to return a specific JSON schema. Never parse free-form prose. All page citations must be sourced from the actual extracted text — Claude must be instructed to cite page numbers from the document, not guess.

#### Summary Prompt (abridged)

```
System: You are an expert analyst of Indian government procurement documents.
Extract the following fields from the provided tender document text.
Return ONLY valid JSON matching the schema below.
If a field is not found in the document, set it to null — never fabricate values.
Always include page_number for each field you extract.

Schema:
{
  "tender_title": {"value": string | null, "page_number": int | null},
  "issuing_authority": {"value": string | null, "page_number": int | null},
  "tender_reference": {"value": string | null, "page_number": int | null},
  "submission_deadline": {"value": string | null, "page_number": int | null},
  "emd_amount": {"value": string | null, "page_number": int | null},
  "scope_of_work": {"value": string | null, "page_number": int | null},
  "contract_duration": {"value": string | null, "page_number": int | null},
  "estimated_value": {"value": string | null, "page_number": int | null},
  "key_dates": [{"event": string, "date": string, "page_number": int}],
  "complexity": {"rating": "low" | "medium" | "high", "reason": string}
}

Document text:
[FULL EXTRACTED TEXT — up to 80,000 tokens]
```

#### Eligibility Prompt (abridged)

```
System: You are an expert in Indian government procurement eligibility assessment.
Extract ALL eligibility criteria from this tender document.
Then evaluate each criterion against the company profile provided.
Return ONLY valid JSON.

For each criterion:
- state the requirement exactly as written in the document
- provide the page number
- provide the exact quoted text (2 sentences max)
- give a verdict: "met" | "not_met" | "needs_review" | "not_applicable"
- give a reason for your verdict

Company profile:
[COMPANY_PROFILE_JSON]

Document text:
[EXTRACTED TEXT]
```

#### Q&A Prompt (per question)

```
System: You are an assistant that answers questions about a specific Indian government
tender document. You MUST only use information present in the document.
If the answer is not in the document, say exactly:
"This is not addressed in the tender document."
Always cite the page number(s) your answer is based on.
Rate your confidence: "high" (directly stated), "medium" (inferred),
or "low" (ambiguous).

Document text:
[EXTRACTED TEXT]

Previous conversation:
[CHAT HISTORY]

User question: [QUESTION]

Return JSON: {"answer": string, "citations": [{"page": int, "snippet": string}],
"confidence": "high"|"medium"|"low"}
```

---

## 5. Application Screens

### 5.1 Screen Map

```
/                          Landing page (marketing)
/auth/sign-in              Clerk sign-in
/auth/sign-up              Clerk sign-up
/onboarding                Company profile setup (required first visit)
/dashboard                 Tender list + upload button
/tenders/[id]              Tender detail (tabbed)
  /tenders/[id]/summary    Summary tab (default)
  /tenders/[id]/eligibility Eligibility tab
  /tenders/[id]/checklist  Checklist tab
  /tenders/[id]/chat       Q&A tab
/settings/company          Edit company profile
/settings/billing          Razorpay subscription management
/settings/account          User preferences
```

### 5.2 Key Screen Designs

#### Dashboard (`/dashboard`)

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  AI Tender Copilot          [Plan: Free] [User▾]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  My Tenders                          [+ Upload Tender]  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔍 Search tenders...                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ PWD Road Construction, Nashik Division          │   │
│  │ Deadline: 15 Mar 2025 · ✅ Eligible             │   │
│  │ Uploaded 2 days ago                   [Open →]  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ NMMC Sanitation Services RFP                    │   │
│  │ Deadline: 28 Mar 2025 · ⚠️ Review needed        │   │
│  │ Uploaded 5 days ago                   [Open →]  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ MES Electrical Works Tender                     │   │
│  │ Processing... ████████░░ 80%                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Free plan: 3 of 5 tenders used this month             │
│  [Upgrade to Pro — unlimited tenders]                   │
└─────────────────────────────────────────────────────────┘
```

#### Tender Detail — Summary Tab

```
┌─────────────────────────────────────────────────────────┐
│ ← Dashboard                                             │
│ PWD Road Construction, Nashik Division                  │
├─────────────────────────────────────────────────────────┤
│ [Summary] [Eligibility] [Checklist] [Q&A]               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ BASIC INFORMATION                                       │
│ Tender Reference   PWD/NH/2025/031            [p.1]    │
│ Issuing Authority  Executive Engineer, PWD Nashik [p.1]│
│ Estimated Value    ₹3.85 Crore                [p.3]    │
│ EMD Amount         ₹3,85,000 (DD/BG)          [p.7]   │
│                                                         │
│ SUBMISSION DEADLINE                                     │
│ ┌─────────────────────────────────────────────────┐   │
│ │  15 March 2025 · 5:00 PM IST        [p.4]      │   │
│ │  📅 18 days remaining                           │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ SCOPE OF WORK                          [p.9]           │
│ Construction and maintenance of 4.2km stretch of        │
│ NH-60 bypass road including base course, bituminous     │
│ macadam, wearing course, and associated drainage work.  │
│                                                         │
│ COMPLEXITY RATING                                       │
│ ●●●○○  Medium — Technical criteria moderate,           │
│         financials achievable for mid-size contractors  │
│                                                         │
│ [Copy Summary]  [Download PDF]  [Ask a Question →]     │
└─────────────────────────────────────────────────────────┘
```

#### Eligibility Tab

```
┌─────────────────────────────────────────────────────────┐
│ [Summary] [Eligibility ⚠️] [Checklist] [Q&A]            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ OVERALL VERDICT                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ⚠️  REVIEW REQUIRED                             │   │
│ │ 6 criteria met · 2 need review · 0 not met      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ FINANCIAL CRITERIA                                      │
│ ✅ Minimum turnover ₹3 Cr avg (last 3 yrs)   [p.14]  │
│    Your profile: ₹8.2Cr / ₹6.1Cr / ₹5.4Cr — Met      │
│                                                         │
│ ✅ Net worth ≥ ₹1.5 Cr                        [p.14]  │
│    Your profile: ₹3.8 Cr — Met                        │
│                                                         │
│ TECHNICAL CRITERIA                                      │
│ ✅ 1 similar project ≥ ₹1.5 Cr in last 7 yrs  [p.15] │
│    Matched: NHAI road project ₹3.2 Cr (2022)          │
│                                                         │
│ ⚠️ Class I Contractor registration required   [p.16]  │
│    Not in your profile — verify if applicable          │
│    [Mark as confirmed] [Add to profile]                │
│                                                         │
│ ⚠️ Experience in NH work preferred             [p.16]  │
│    Cannot verify from profile — manual check needed    │
│    [Mark as confirmed] [Mark as N/A]                   │
│                                                         │
│ REGISTRATION & COMPLIANCE                               │
│ ✅ GST registration required                  [p.18]  │
│ ✅ PAN required                               [p.18]  │
│ ✅ Udyam (MSME) registration                  [p.19]  │
│                                                         │
│ [Export Eligibility Report]                            │
└─────────────────────────────────────────────────────────┘
```

#### Q&A Tab

```
┌─────────────────────────────────────────────────────────┐
│ [Summary] [Eligibility] [Checklist] [Q&A]               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Ask anything about this tender document                 │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 👤 Are joint ventures allowed?                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🤖 Yes, joint ventures are permitted with up to  │  │
│  │    3 members. The lead partner must hold ≥ 51%   │  │
│  │    equity and meet technical criteria alone.     │  │
│  │                                                  │  │
│  │    📄 Page 18, Clause 5.1  · ● High confidence  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 👤 What is the validity period for bids?         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🤖 Bid validity is 90 days from the last date    │  │
│  │    of submission.                                │  │
│  │                                                  │  │
│  │    📄 Page 9, Clause 3.4  · ● High confidence   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Ask a question...                    [Send →]    │  │
│  └──────────────────────────────────────────────────┘  │
│  Free plan: 3 of 5 questions used on this tender       │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Authentication & Onboarding Flow

```
New user signs up (Clerk)
        │
        ▼
Onboarding wizard (mandatory, 3 steps)
        │
   Step 1: Company basics
   ├── Company name
   ├── Type (Pvt Ltd / Partnership / Proprietorship / LLP)
   ├── State(s) of registration
   └── Year established
        │
   Step 2: Financial profile
   ├── Annual turnover — FY2023, FY2022, FY2021 (in ₹ Cr)
   ├── Net worth (current, in ₹ Cr)
   └── GST, PAN, Udyam numbers (optional but recommended)
        │
   Step 3: Experience & registrations
   ├── Add past projects (name, client, value, year) — up to 10
   ├── Select registrations held (ISO, BIS, class of contractor, etc.)
   └── Primary sector tags (construction / IT / healthcare / manufacturing)
        │
        ▼
Dashboard — ready to upload first tender
```

**Onboarding guardrails:**

- Steps 1 and 2 are mandatory; Step 3 is strongly encouraged but skippable
- Profile completeness percentage shown on dashboard — nudges completion
- User can update profile at any time from Settings → Company
- Incomplete profile triggers a warning banner before running eligibility check

---

## 7. Subscription & Billing

### 7.1 Plan Limits (MVP)

| Feature | Free | Starter (₹999/mo) | Professional (₹3,499/mo) |
|---------|------|-------------------|--------------------------|
| Tenders / month | 3 | 10 | Unlimited |
| Q&A questions / tender | 5 | 20 | Unlimited |
| File size limit | 20 MB | 50 MB | 100 MB |
| Export (PDF/Excel) | ✅ | ✅ | ✅ |
| Priority processing | ❌ | ❌ | ✅ |
| Email support | ❌ | ✅ | ✅ |
| Data retention | 7 days | 30 days | 1 year |

### 7.2 Razorpay Integration

- Monthly and annual subscription plans created in Razorpay dashboard
- Annual plans offered at 20% discount (e.g., Starter: ₹9,590/year vs ₹11,988 monthly)
- Webhook: `subscription.charged` → update `users.plan` in database
- Webhook: `subscription.cancelled` → downgrade to free at period end
- Failed payment → email via Resend → 3-day grace period → downgrade

---

## 8. Build Plan — Week by Week

### Month 2 (Weeks 1–4): Foundation

| Week | Goals |
|------|-------|
| Week 1 | Project setup: Next.js + Supabase + Clerk + Tailwind. DB schema applied. Auth working. |
| Week 2 | PDF upload to Supabase Storage. Text extraction pipeline (pdf-parse). Status tracking. |
| Week 3 | Claude summary prompt — working end-to-end. Dashboard + summary tab rendering. |
| Week 4 | Onboarding flow. Company profile storage. QA + bug fixes on upload → summary path. |

**Month 2 milestone: Users can upload a tender PDF and see a structured summary with page citations.**

---

### Month 3 (Weeks 5–8): Core AI Features

| Week | Goals |
|------|-------|
| Week 5 | Eligibility extraction prompt. Eligibility check tab rendering. |
| Week 6 | Manual override for eligibility items. Company profile ↔ criteria matching logic. |
| Week 7 | Document checklist extraction + materialisation into DB. Checklist tab with status tracking. |
| Week 8 | Excel + PDF export for checklist and eligibility report. QA across all three tabs. |

**Month 3 milestone: Full analysis pipeline working — upload → summary → eligibility → checklist. Onboard first 5 beta users.**

---

### Month 4 (Weeks 9–12): Q&A + Monetisation + Polish

| Week | Goals |
|------|-------|
| Week 9 | Q&A chat interface. Claude Q&A prompt. Citation rendering. |
| Week 10 | Razorpay subscription integration. Plan limits enforced. Upgrade prompts. |
| Week 11 | Usage analytics (PostHog). Email notifications (Resend) for processing complete + usage limits. |
| Week 12 | Bug bash, performance tuning, onboard remaining 15 beta users. Feedback collection. |

**Month 4 milestone: Full MVP live. 20 beta users. At least 3 converting to paid. Clear data on what to build next.**

---

## 9. Non-Functional Requirements

### 9.1 Security

- All PDF files stored in Supabase Storage with private access (no public URLs)
- Files served via short-lived signed URLs (expiry: 1 hour)
- Row Level Security (RLS) enforced on all Supabase tables — users can only see their own data
- API routes validate Clerk JWT on every request
- No tender data sent to third-party services other than Anthropic Claude API
- Claude API: do not enable training on customer data (opt out in API settings)
- Add privacy policy clearly stating: "Your documents are never used to train AI models"

### 9.2 Performance

| Metric | Target |
|--------|--------|
| PDF upload completion | < 10s for 50MB |
| Full analysis (90s budget) | < 90 seconds |
| Dashboard page load | < 1.5 seconds |
| Q&A response time | < 10 seconds |
| Uptime | > 99% (Vercel + Supabase SLA) |

### 9.3 Error Handling

- Scanned / image-only PDFs: detect and show clear message — "This appears to be a scanned document. Text extraction may be limited. Please check the analysis carefully."
- Claude API timeout (> 120s): retry once, then mark as failed with option to retry
- Partial extraction: if < 30% of text extracted, warn user before showing analysis
- Rate limits: queue requests, show position in queue for free users

### 9.4 Observability

- Sentry: capture all server-side errors with tender ID and user ID (redact PII)
- PostHog: track `tender_uploaded`, `analysis_completed`, `eligibility_viewed`, `chat_message_sent`, `export_downloaded`, `upgrade_clicked`
- Log Claude API token usage per request for cost tracking
- Supabase logs: monitor slow queries

---

## 10. Cost Estimate (Monthly, at 50 beta users)

| Service | Cost (approx.) |
|---------|----------------|
| Vercel (Pro) | $20/month |
| Supabase (Pro) | $25/month |
| Clerk (Pro, up to 1000 MAU) | $25/month |
| Anthropic Claude API | ~$80–150/month (50 users × 10 tenders × ~3 calls) |
| Razorpay | 2% per transaction (negligible at beta scale) |
| Resend (email) | Free tier (3,000 emails/month) |
| Sentry | Free tier |
| PostHog | Free tier (1M events/month) |
| **Total** | **~$150–220/month (~₹13,000–19,000)** |

Break-even at beta stage: just 5 paying Starter subscribers covers infrastructure costs.

---

## 11. What Not to Build in MVP (and Why)

| Feature | Why deferred |
|---------|-------------|
| Corrigendum comparison | Requires diff engine + versioning logic. High value, medium complexity. Month 5. |
| Multi-user / team workspace | Auth complexity multiplies. Validate solo use first. |
| Direct portal integration (GeM, CPPP) | Rate limits, CAPTCHAs, legal ambiguity. Manual upload is fine for MVP. |
| Automated tender discovery | Scraping is fragile. Focus on analysis, not sourcing. |
| Mobile app | Web is sufficient for tender consultants who work on desktops. |
| Regional language (Hindi, Marathi) | Claude handles these reasonably well already, but UI localisation is deferred. |
| Bid response drafting | Separate product surface. Out of MVP scope. |
| OCR for scanned PDFs | Add as Month 5 feature using Google Document AI or Mistral OCR. |

---

## 12. Beta User Onboarding Plan

### Recruit (parallel to Month 2 build)

- 30 LinkedIn conversations from validation phase → convert 15–20 to beta waitlist
- Offer: 3 months free Professional access in exchange for weekly feedback calls
- Target mix: 8 tender consultants, 6 bid managers, 4 MSME owners, 2 IT founders

### Onboard (Month 3, Week 8)

- Personal Zoom call (30 min) with first 5 users — watch them use the product
- WhatsApp group for beta users — fastest feedback channel in India
- Weekly check-in: "Which tender did you analyse this week? What did the tool get wrong?"

### Measure (Month 4)

- Track time-to-analysis for each upload
- Survey: "How many hours did this save you compared to manual analysis?"
- Ask directly: "Would you pay ₹3,499/month for this?" — if yes, send Razorpay link immediately

---

*Document version 1.0 — AI Tender Copilot MVP Specification*
*Scope: Month 2–4 | Target: 10–20 beta users | Stack: Next.js + Supabase + Claude API*
