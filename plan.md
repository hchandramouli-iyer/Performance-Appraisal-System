# Performance Appraisal System – Comprehensive Plan

## 1) Executive Summary
Build a modern, data-driven Performance Appraisal System enabling a single manager to evaluate multiple mentees across multiple periods/cycles with real-time AI analysis and exportable reports. The MVP will deliver:
- All evaluation input forms built together: 10 competencies, IDP, rubric alignment, certifications, role fit, PM feedback, and talent assessment.
- Real-time AI analysis as data is entered (debounced updates), plus on-demand report generation and PDF export.
- Clean, professional UI built with React + Shadcn/UI, backed by FastAPI + MongoDB using UUIDs and Pydantic.

## 2) Objectives
- End-to-end evaluation workflow for multiple mentees and cycles.
- Real-time guidance: AI suggestions, flags, and rubric alignment surfaced inline while filling forms.
- Persist all evaluations in Mongo and support report regeneration at any time.
- Generate a web-based report and provide PDF export.
- Deliver a polished, accessible, WCAG AA-compliant interface aligned to the design guidelines.

## 3) UI/UX Design Guidelines (Applied)
Per design_guidelines.md (Axis Performance Design System):
- Color & Theme
  - Primary brand: #2563EB for primary actions; hover #1D4ED8; active #1E40AF; neutrals (slate scale) for surfaces, ensuring AA contrast.
  - Gradient usage strictly limited (<20% viewport); never behind forms/tables/reports.
- Typography
  - Headings: Chivo; Body: Karla; Metrics/mono: IBM Plex Mono.
  - Clear type scale with purposeful hierarchy (h1–h4, body-lg/md/sm, caption, metric).
- Components
  - Use Shadcn/UI primitives: Button, Card, Input, Textarea, Select, Tabs, Accordion, Table, Sheet, Sonner toasts, Tooltip, Dialog.
  - Icons exclusively from lucide-react.
  - Every interactive or key informational element must include data-testid.
- Layout & Navigation
  - Sticky header; container max-width ~1200px; generous spacing; grid/flex layout.
  - Long forms chunked via Tabs: Overview | Competencies | IDP | Certifications | Role Fit | PM Feedback | Talent Assessment | Summary.
  - Real-time AI panel pinned to right column on desktop; collapsible on mobile.
- Data Viz
  - Recharts: Radar for competencies, Bar/Line for cycle comparisons; Accessible labels and test IDs.
- Accessibility & States
  - focus-visible rings, hover/active/disabled states; touch target ≥44px; dark mode compatible tokens.

## 4) Implementation Steps (Phased)
- Phase 0: System verification & setup
  - Verify supervisor services and logs; ensure backend binds 0.0.0.0:8001; confirm env usage (MONGO_URL, REACT_APP_BACKEND_URL).
  - Add global design tokens and typography in frontend index.css; confirm Shadcn components available.

- Phase 1: Backend domain models and persistence (Mongo + UUID)
  - Collections and schemas (see Technical Details): managers, mentees, cycles, evaluations, rubrics, reports.
  - Pydantic models for requests/responses; UTC timestamps; indexes on manager_id/mentee_id/cycle_id.
  - CRUD APIs (all under /api):
    - /api/mentees [GET/POST], /api/mentees/{id} [GET/PATCH/DELETE]
    - /api/mentees/{mentee_id}/cycles [GET/POST]
    - /api/cycles/{cycle_id} [GET/PATCH/DELETE]
    - /api/evaluations/{cycle_id} [GET/PATCH] (upsert sections: competencies, idp, certifications, role_fit, pm_feedback, talent_assessment)
    - /api/rubrics [GET] (predefined rubric data)
    - /api/reports/generate [POST], /api/reports/{id} [GET]
    - /api/ai/analyze [POST] (real-time, debounced client calls)

- Phase 2: Frontend app shell and navigation
  - App header, routes, and base screens: Dashboard (mentees list), Mentee detail with cycle switcher, Evaluation form with tabs, Reports view.
  - Implement global providers (toasts), error boundaries, and loading skeletons.

- Phase 3: Mentee management
  - Mentee table with create/edit dialog; attach manager context (single-manager scope for MVP).
  - Cycle creation and switching UI per mentee; default active cycle.

- Phase 4: Evaluation forms (build all at once)
  - Tabs: Overview | Competencies (10 sliders + evidence) | IDP | Certifications | Role Fit | PM Feedback | Talent Assessment | Summary.
  - Save-as-you-type (debounced PATCH to /api/evaluations/{cycle_id}).
  - Real-time AI panel placeholder, fed by /api/ai/analyze (Phase 5).

- Phase 5: AI integration (Emergent LLM)
  - Call integration agent to get playbook; fetch EMERGENT_LLM_KEY via emergent_integrations_manager.
  - Backend /api/ai/analyze: Accept partial evaluation payload; return suggestions, rubric alignment notes, risks, missing fields.
  - Frontend debounced (600–1000ms) calls as fields change; display in AIFeedback panel.

- Phase 6: Reporting & PDF export
  - Web report view using report layout (816px width sectioned, print styles).
  - PDF export Phase 1: client-side print-to-PDF (window.print with print CSS).
  - PDF export Phase 2 (optional): server-side PDF (WeasyPrint) with caching (requires dependency update cycle).

- Phase 7: Analytics and comparisons
  - Charts: Radar for current cycle competency profile; Bar/Line to compare across cycles.
  - Certification status visualization; trend lines for improvement.

- Phase 8: Testing, QA, and polish
  - Use testing agent to validate backend endpoints and core UI flows.
  - Instrument all interactive elements with data-testid; add empty/error/loading states; toasts for save/error.
  - Review accessibility and performance; address logs and linting.

## 5) Technical Details
- Data Model (UUID ids; UTC timestamps)
  - managers: { id, name, email, created_at }
  - mentees: { id, manager_id, name, email, role, created_at, updated_at }
  - cycles: { id, mentee_id, period_label, start_date, end_date, status: 'active'|'closed'|'draft', created_at, updated_at }
  - evaluations: {
      id, cycle_id,
      competencies: [{ key, name, score: 0–5, evidence }],
      idp: { goals: [{ title, description, target_date }], progress_notes },
      certifications: [{ name, status: 'completed'|'committed', completed_on? }],
      role_fit: { current_role, next_role, fit_current: 0–5, fit_next: 0–5, gaps: [string] },
      pm_feedback: { comments, strengths, areas_to_improve },
      talent_assessment: { potential: 'high'|'medium'|'low', risk: 'low'|'medium'|'high', overall: 'excellent'|'good'|'developing'|'concerning' },
      created_at, updated_at
    }
  - rubrics: { id, name, competencies: [{ key, name, description, criteria: { excellent, strong, solid, developing, concerning } }] }
  - reports: { id, cycle_id, summary_text, highlights: [string], risks: [string], html_snapshot?, generated_at }

- Backend
  - FastAPI with Pydantic models; CORS enabled; bind 0.0.0.0:8001.
  - Mongo via MONGO_URL env; indexes on foreign keys; store ISO 8601 with timezone.utc.
  - Routes order: specific before generic (e.g., /api/users/me before /api/users/{id}).
  - Error handling: 4xx for validation; 5xx with safe messages; log exceptions.

- Frontend
  - React + Shadcn/UI components and Tailwind-like utility classes using CSS variables from design tokens.
  - Fetch layer: simple fetch wrappers; debounce for autosave and AI calls.
  - Data states: loading skeletons, empty states, error states; Sonner toasts styled to theme.
  - Accessibility: semantic markup, aria labels, focus-visible styles.

- Real-time AI Analysis
  - Debounced POST /api/ai/analyze with partial evaluation diff.
  - Response: { items: [{ type: 'suggestion'|'risk'|'success', text }], rubric_alignment: [...], missing_fields: [...] }.
  - Token/cost safety: compact prompt construction; send only changed slice plus context.

- PDF Export
  - Phase 1: client-side print to PDF with print styles on the report page.
  - Optional Phase 2: server-side PDF (WeasyPrint) with HTML template; store report metadata and cache.

- Non-Functional
  - Logs via supervisor; tail backend/frontend logs after major changes.
  - Linting: ruff for Python; esbuild check for frontend syntax.
  - No auth in MVP (single-manager scope); plan for JWT later if needed.

## 6) Next Actions
1) Initialize backend models and endpoints (mentees, cycles, evaluations, rubrics, ai/analyze stub).
2) Scaffold frontend shell: header, routes, dashboard, mentee detail + cycle switcher.
3) Build evaluation forms (all tabs) with save-as-you-type; wire to API.
4) Implement AI analyze endpoint and frontend debounced feedback panel.
5) Create report view and print-to-PDF flow.
6) Add charts for competency profile and cycle comparisons.
7) Run testing agent; fix any reported issues; polish UI per design tokens.

## 7) Success Criteria (MVP Acceptance)
- A manager can:
  - Create mentees; create multiple cycles per mentee; switch active cycle.
  - Fill all evaluation sections with autosave and receive real-time AI guidance.
  - View competency radar and compare across cycles.
  - Generate a detailed web report and export it to PDF.
- Technical:
  - All APIs under /api; backend bound to 0.0.0.0:8001; data persisted with UUIDs and UTC datetimes.
  - UI adheres to design tokens, typography, and component patterns; no console errors; accessible focus states.
  - Basic automated tests pass; logs clean of repeated errors.
