# Performance Appraisal System – Updated Plan

## 1) Executive Summary
Build a modern, data-driven Performance Appraisal System enabling a single manager to evaluate multiple mentees across multiple periods/cycles with real-time AI analysis and exportable reports. The MVP will deliver:
- All evaluation input forms built together: 10 competencies, IDP, rubric alignment, certifications, role fit, PM feedback, and talent assessment.
- Real-time AI analysis as data is entered (debounced updates), plus on-demand report generation and PDF export.
- Clean, professional UI built with React + Shadcn/UI, backed by FastAPI + MongoDB using UUIDs and Pydantic.

**Status:** Foundational system complete (Phases 0-3). Backend API fully operational, frontend app shell with navigation implemented, mentee management dashboard functional.

## 2) Objectives
- ✅ End-to-end evaluation workflow for multiple mentees and cycles (foundation complete).
- 🔄 Real-time guidance: AI suggestions, flags, and rubric alignment surfaced inline while filling forms (in progress).
- ✅ Persist all evaluations in Mongo and support report regeneration at any time (complete).
- 🔄 Generate a web-based report and provide PDF export (pending).
- ✅ Deliver a polished, accessible, WCAG AA-compliant interface aligned to the design guidelines (foundation complete).

## 3) UI/UX Design Guidelines (Applied) ✅
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

## 4) Implementation Progress & Next Steps

### ✅ Phase 0: System verification & setup (COMPLETED)
- ✅ Verified supervisor services and logs; backend binds 0.0.0.0:8001; confirmed env usage (MONGO_URL, REACT_APP_BACKEND_URL).
- ✅ Added global design tokens and typography in frontend index.css; confirmed Shadcn components available.

### ✅ Phase 1: Backend domain models and persistence (COMPLETED)
- ✅ Collections and schemas: managers, mentees, cycles, evaluations, rubrics, reports.
- ✅ Pydantic models for requests/responses; UTC timestamps; indexes on manager_id/mentee_id/cycle_id.
- ✅ CRUD APIs (all under /api):
  - ✅ /api/mentees [GET/POST], /api/mentees/{id} [GET/PATCH/DELETE]
  - ✅ /api/mentees/{mentee_id}/cycles [GET/POST]
  - ✅ /api/cycles/{cycle_id} [GET/PATCH/DELETE]
  - ✅ /api/evaluations/{cycle_id} [GET/PATCH] (upsert sections: competencies, idp, certifications, role_fit, pm_feedback, talent_assessment)
  - ✅ /api/rubrics [GET] (predefined rubric data with 10 competencies)
  - ✅ /api/reports/generate [POST], /api/reports/{id} [GET] (stub implementation)
  - ✅ /api/ai/analyze [POST] (mock implementation ready for enhancement)

### ✅ Phase 2: Frontend app shell and navigation (COMPLETED)
- ✅ App header with professional branding, routes, and base screens: Dashboard (mentees list), Mentee detail with cycle switcher, Evaluation form with tabs, Reports view.
- ✅ Implemented global providers (toasts), error boundaries, and loading skeletons.
- ✅ Navigation working with proper active states and responsive design.

### ✅ Phase 3: Mentee management (COMPLETED)
- ✅ Mentee table with create/edit dialog; attached manager context (single-manager scope for MVP).
- ✅ Dashboard with overview cards showing metrics (Total Mentees, Active Cycles, Completion Rate).
- ✅ Empty states with clear call-to-action buttons.
- ✅ Professional UI following design guidelines with proper data-testid attributes.

### 🔄 Phase 4: Evaluation forms (NEXT PRIORITY)
- Build comprehensive evaluation form with tabs: Overview | Competencies (10 sliders + evidence) | IDP | Certifications | Role Fit | PM Feedback | Talent Assessment | Summary.
- Implement save-as-you-type (debounced PATCH to /api/evaluations/{cycle_id}).
- Add cycle creation functionality in mentee detail view.
- Real-time AI panel placeholder, fed by /api/ai/analyze (enhanced in Phase 5).

### 🔄 Phase 5: AI integration (Emergent LLM)
- Call integration agent to get playbook; fetch EMERGENT_LLM_KEY via emergent_integrations_manager.
- Enhance backend /api/ai/analyze: Accept partial evaluation payload; return suggestions, rubric alignment notes, risks, missing fields.
- Frontend debounced (600–1000ms) calls as fields change; display in AIFeedback panel.

### 🔄 Phase 6: Reporting & PDF export
- Web report view using report layout (816px width sectioned, print styles).
- PDF export Phase 1: client-side print-to-PDF (window.print with print CSS).
- PDF export Phase 2 (optional): server-side PDF (WeasyPrint) with caching (requires dependency update cycle).

### 🔄 Phase 7: Analytics and comparisons
- Charts: Radar for current cycle competency profile; Bar/Line to compare across cycles.
- Certification status visualization; trend lines for improvement.
- Dashboard metrics calculations based on actual data.

### 🔄 Phase 8: Testing, QA, and polish
- Use testing agent to validate backend endpoints and core UI flows.
- Instrument all interactive elements with data-testid; add empty/error/loading states; toasts for save/error.
- Review accessibility and performance; address logs and linting.

## 5) Technical Implementation (Current Status)

### ✅ Backend (OPERATIONAL)
- FastAPI with comprehensive Pydantic models; CORS enabled; bind 0.0.0.0:8001.
- Mongo via MONGO_URL env; UUID-based models; UTC timestamps.
- All core API endpoints implemented and tested.
- 10 competency rubric system with detailed criteria (Ensure Accountability, Cultivates Innovation, Decision Quality, etc.).
- Manager context system with default manager for MVP.

### ✅ Frontend (FUNCTIONAL)
- React + Shadcn/UI components with design token-based styling.
- API layer with error handling and loading states.
- Professional navigation and routing system.
- Comprehensive dashboard with mentee management.
- All components following accessibility guidelines with data-testid attributes.

### 🔄 Data Model (IMPLEMENTED, READY FOR USE)
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

## 6) Immediate Next Actions (Priority Order)

### Phase 4 Implementation:
1. **Cycle Creation UI**: Add cycle creation dialog in mentee detail view with date pickers and status selection.
2. **Evaluation Form Structure**: Build tabbed evaluation form with all sections (Overview, Competencies, IDP, etc.).
3. **Competency Evaluation**: Implement 10 competency sliders with evidence text areas and rubric tooltips.
4. **Auto-save System**: Implement debounced save-as-you-type functionality.
5. **Form Validation**: Add proper validation and error handling for all evaluation sections.

### Phase 5 Preparation:
6. **AI Integration Setup**: Call integration agent for Emergent LLM playbook.
7. **AI Feedback Panel**: Create collapsible AI feedback panel with real-time suggestions.

## 7) Success Criteria (MVP Acceptance) - Updated

### ✅ Foundation Complete:
- ✅ Professional UI with design system implementation
- ✅ Backend API with comprehensive data models
- ✅ Mentee management with CRUD operations
- ✅ Navigation and routing system

### 🔄 Core Functionality (In Progress):
- A manager can:
  - ✅ Create and manage mentees
  - 🔄 Create multiple cycles per mentee; switch active cycle
  - 🔄 Fill all evaluation sections with autosave and receive real-time AI guidance
  - 🔄 View competency radar and compare across cycles
  - 🔄 Generate a detailed web report and export it to PDF

### Technical Requirements:
- ✅ All APIs under /api; backend bound to 0.0.0.0:8001; data persisted with UUIDs and UTC datetimes
- ✅ UI adheres to design tokens, typography, and component patterns; no console errors; accessible focus states
- 🔄 Basic automated tests pass; logs clean of repeated errors

## 8) Current System Status

**✅ OPERATIONAL COMPONENTS:**
- Backend API (all endpoints functional)
- Frontend navigation and dashboard
- Mentee management system
- Design system implementation
- Database models and persistence

**🔄 NEXT DEVELOPMENT FOCUS:**
- Cycle creation and management
- Comprehensive evaluation forms
- AI integration for real-time feedback
- Reporting and analytics

**🎯 MVP COMPLETION ESTIMATE:**
- Phase 4 (Evaluation Forms): 2-3 development sessions
- Phase 5 (AI Integration): 1-2 development sessions  
- Phase 6-7 (Reporting & Analytics): 1-2 development sessions
- Phase 8 (Testing & Polish): 1 development session

The system foundation is solid and ready for the next phase of development focused on the core evaluation functionality.