# Talent Fluency Design System (Performance Appraisal & Mentee Management)

A. CORE RESTRICTIONS & DESIGN PHILOSOPHY
- Primary Rule: 90/10 Color Rule
  - 90% neutral surfaces for forms/tables; 10% brand accents for actions/data highlights.
- Gradient Restriction: 20% viewport max; never on dense forms or body text areas.
- NEVER
  - Use low-contrast text (<AA) or brand colors on text below 14px.
  - Place gradients behind long-form inputs, tables, or PDFs.
  - Use more than 2 brand hues in the same component.
  - Animate layout on input focus (avoid jumpy forms).
  - Hide focus-visible outlines.
  - Ship interactive elements without data-testid.
- ENFORCEMENT
  - If contrast < 4.5:1 (or <3:1 for 24px/700), switch to darker text or lighter bg token.
  - If gradient intersects inputs or tables, replace with solid section bg.
  - If perceived density > 70% (lots of fields), split into tabs/accordions.
- ONLY ALLOWED gradient usage
  - Hero strip on marketing/landing and minimal CTA bands.
  - Dashboard pre-header metrics band (non-scroll, non-form overlay).
  - Decorative background blobs with opacity ≤ 8% and z-index below content.
- Design Personality: Clean Professional; Data-Driven Modern
- Target Application: HR performance appraisal + mentee analytics dashboard

B. DESIGN TOKENS & CSS VARIABLES
```css
:root {
  /* Background hierarchy */
  --bg-page: #F8FAFC;      /* slate-50 */
  --bg-section: #F1F5F9;   /* slate-100 */
  --bg-card: #FFFFFF;
  --bg-elevated: #FFFFFF;
  /* Text hierarchy */
  --text-primary: #0F172A;   /* slate-900 */
  --text-secondary: #334155; /* slate-700 */
  --text-muted: #64748B;     /* slate-500 */
  --text-inverse: #FFFFFF;
  /* Border system */
  --border-light: #E2E8F0;  /* slate-200 */
  --border-medium: #CBD5E1; /* slate-300 */
  --border-strong: #94A3B8; /* slate-400 */
  /* Brand */
  --brand: #2563EB;          /* blue-600 */
  --brand-hover: #1D4ED8;    /* blue-700 */
  --brand-active: #1E40AF;   /* blue-800 */
  --brand-50: #EFF6FF; --brand-100: #DBEAFE;
  /* Accent semantic */
  --accent-info: #0891B2;    /* cyan-700 */
  --accent-success: #16A34A; /* emerald-600 */
  --accent-warning: #CA8A04; /* amber-600 */
  --accent-danger: #DC2626;  /* red-600 */
  /* Focus */
  --ring: #2563EB;
  --ring-offset: #FFFFFF;
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(2,6,23,0.06);
  --shadow-md: 0 6px 20px rgba(2,6,23,0.08);
  --shadow-lg: 0 12px 32px rgba(2,6,23,0.12);
  /* Spacing (8pt scale) */
  --space-2: 8px;  /* xs */
  --space-3: 12px; /* sm */
  --space-4: 16px; /* md */
  --space-6: 24px; /* lg */
  --space-8: 32px; /* xl */
  --space-10: 40px; /* 2xl */
  --space-12: 48px; /* 3xl */
  /* Radius */
  --radius-sm: 6px;    /* inputs, tags */
  --radius-md: 10px;   /* cards */
  --radius-lg: 14px;   /* hero/large panels */
  --radius-pill: 9999px; /* pills/buttons */
  /* Button sizing (derive from tokens) */
  --btn-font: 600 0.95rem/1.2 "Karla", sans-serif;
  --btn-sm-y: 10px; --btn-sm-x: 14px; --btn-sm-h: 36px;
  --btn-md-y: 12px; --btn-md-x: 18px; --btn-md-h: 44px;
  --btn-lg-y: 14px; --btn-lg-x: 22px; --btn-lg-h: 52px;
  /* Motion */
  --easing: cubic-bezier(0.2,0.8,0.2,1);
  --duration-fast: 150ms; --duration-base: 200ms; --duration-slow: 280ms;
  /* Gradients */
  --gradient-hero: radial-gradient(1200px 600px at 80% -10%, rgba(37,99,235,0.10) 0%, rgba(124,58,237,0.08) 40%, rgba(8,145,178,0.06) 80%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
  --gradient-cta: linear-gradient(135deg, #2563EB 0%, #7C3AED 60%, #0891B2 100%);
}
.dark {
  --bg-page: #0B1220;      /* deep navy */
  --bg-section: #0F172A;
  --bg-card: #0B1220;
  --bg-elevated: #0F172A;
  --text-primary: #E5E7EB;
  --text-secondary: #C7D2FE;
  --text-muted: #94A3B8;
  --border-light: #1F2A44;
  --border-medium: #2A3552;
  --border-strong: #3B4662;
  --ring: #60A5FA;
  --ring-offset: #0B1220;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.35);
  --shadow-md: 0 8px 24px rgba(0,0,0,0.45);
  --shadow-lg: 0 16px 40px rgba(0,0,0,0.6);
}
```

C. TYPOGRAPHY SYSTEM
```css
/* Imports (self-host or use Google) */
@import url('https://fonts.googleapis.com/css2?family=Chivo:wght@400;600;700&family=Karla:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root {
  --font-sans-head: 'Chivo', sans-serif;
  --font-sans-body: 'Karla', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

body { font-family: var(--font-sans-body); color: var(--text-primary); background: var(--bg-page); }
.h1 { font: 700 clamp(28px, 5.5vw, 44px)/1.15 var(--font-sans-head); letter-spacing: -0.012em; }
.h2 { font: 700 clamp(22px, 4.4vw, 34px)/1.2 var(--font-sans-head); letter-spacing: -0.01em; }
.h3 { font: 600 clamp(18px, 3.6vw, 24px)/1.25 var(--font-sans-head); }
.h4 { font: 600 clamp(16px, 3vw, 20px)/1.3 var(--font-sans-head); }
.body-lg { font: 400 clamp(16px, 2.6vw, 18px)/1.6 var(--font-sans-body); }
.body-md { font: 400 clamp(14px, 2.2vw, 16px)/1.55 var(--font-sans-body); }
.body-sm { font: 400 13px/1.45 var(--font-sans-body); color: var(--text-secondary); }
.caption { font: 400 12px/1.35 var(--font-sans-body); color: var(--text-muted); }
.metric { font: 600 clamp(20px, 4.8vw, 28px)/1.2 var(--font-mono); letter-spacing: -0.01em; }
.link { color: var(--brand); font-weight: 600; text-underline-offset: 3px; }
```

D. ESSENTIAL COMPONENTS
- Global Interaction (Tailwind utilities to apply)
  - focus: focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)]
  - states: hover:opacity-90 active:scale-[.99] disabled:opacity-50 disabled:pointer-events-none
  - testing: every interactive or key informational element must include data-testid with descriptive kebab-case

1) Buttons (Professional/Corporate)
```css
.btn { border-radius: var(--radius-md); min-height: var(--btn-md-h); padding: var(--btn-md-y) var(--btn-md-x); font: var(--btn-font); transition: all var(--duration-base) var(--easing); display: inline-flex; align-items: center; gap: 10px; }
.btn--primary { background: var(--brand); color: var(--text-inverse); box-shadow: var(--shadow-sm); border: 1px solid transparent; }
.btn--primary:hover { background: var(--brand-hover); }
.btn--primary:active { background: var(--brand-active); }
.btn--secondary { background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-medium); box-shadow: none; }
.btn--secondary:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }
.btn--ghost { background: transparent; color: var(--brand); border: 1px dashed var(--border-medium); }
.btn--ghost:hover { border-color: var(--brand); background: color-mix(in srgb, var(--brand) 6%, transparent); }
/* sizes */
.btn--sm { min-height: var(--btn-sm-h); padding: var(--btn-sm-y) var(--btn-sm-x); font-size: 0.9rem; }
.btn--lg { min-height: var(--btn-lg-h); padding: var(--btn-lg-y) var(--btn-lg-x); font-size: 1.05rem; border-radius: var(--radius-lg); }
/* CTA gradient variant (marketing only) */
.btn--cta { background: var(--gradient-cta); color: #fff; box-shadow: var(--shadow-md); }
```

Example (React + Tailwind + shadcn/ui Button):
```jsx
import { Button } from "@/components/ui/button";

export function PrimaryCTA() {
  return (
    <Button
      data-testid="primary-cta-button"
      className="rounded-[var(--radius-md)] min-h-[var(--btn-md-h)] px-[var(--btn-md-x)] py-[var(--btn-md-y)] font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)] transition-all duration-200 ease-[var(--easing)]"
    >Start Evaluation</Button>
  );
}
```

2) Cards/Containers
```css
.card { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.card--hover:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); transition: box-shadow var(--duration-base) var(--easing), transform var(--duration-base) var(--easing); }
.card__header { padding: 16px 20px; border-bottom: 1px solid var(--border-light); }
.card__body { padding: 20px; }
.card__footer { padding: 16px 20px; border-top: 1px solid var(--border-light); }
```

3) Navigation (sticky header)
```jsx
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function AppHeader() {
  return (
    <header data-testid="app-header" className="sticky top-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--bg-card)/.8] border-b border-[var(--border-light)]">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
        <a data-testid="brand-home-link" href="/" className="h4 text-[color:var(--text-primary)]">Talent Fluency</a>
        <nav data-testid="main-nav" className="ml-auto hidden md:flex items-center gap-2">
          <a data-testid="nav-dashboard-link" className="px-3 py-2 rounded-md hover:bg-[color:var(--brand-50)]" href="/dashboard">Dashboard</a>
          <a data-testid="nav-reports-link" className="px-3 py-2 rounded-md hover:bg-[color:var(--brand-50)]" href="/reports">Reports</a>
          <Button data-testid="nav-new-eval-button" className="btn btn--primary">New Evaluation</Button>
        </nav>
      </div>
      <Separator />
    </header>
  );
}
```

4) Inputs & Forms
```css
.input { background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 10px 12px; min-height: 40px; color: var(--text-primary); }
.input:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--ring), 0 0 0 4px var(--ring-offset); }
.label { font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
.help { color: var(--text-muted); font-size: 12px; }
.error { color: var(--accent-danger); font-size: 12px; }
fieldset.grid-2 { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 768px) { fieldset.grid-2 { grid-template-columns: 1fr 1fr; } }
```
- Use shadcn/ui: Input, Textarea, Select, Slider, Checkbox, RadioGroup, Tabs, Accordion, Tooltip, Dialog, Sheet.
- Real-time AI feedback panel: surface as an inline card pinned right on md+, stacked below on mobile.

5) Hero Section (landing)
```jsx
export function Hero() {
  return (
    <section data-testid="hero-section" className="relative isolate min-h-[72vh] overflow-hidden bg-[var(--gradient-hero)]">
      <div className="mx-auto max-w-[1100px] px-6 py-20 grid md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-7">
          <h1 className="h1">Performance appraisals that drive growth, not paperwork.</h1>
          <p className="body-lg mt-4 text-[color:var(--text-secondary)]">Evaluate competencies across cycles, get AI guidance in real time, and export Board-ready reports.</p>
          <div className="mt-6 flex gap-3">
            <a data-testid="hero-start-button" href="/dashboard" className="btn btn--primary">Open Dashboard</a>
            <a data-testid="hero-demo-button" href="#features" className="btn btn--secondary">See Features</a>
          </div>
        </div>
        <div className="md:col-span-5">
          <div data-testid="hero-visual" className="card p-4">/* Insert chart preview image or animated mock (Lottie) */</div>
        </div>
      </div>
    </section>
  );}
```

6) Tables (Mentee list)
```jsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function MenteeTable({ rows }) {
  return (
    <div className="card" data-testid="mentee-table-card">
      <div className="card__header flex items-center justify-between">
        <h3 className="h3">Mentees</h3>
      </div>
      <div className="card__body overflow-x-auto">
        <Table data-testid="mentee-table">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Avg Score</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} data-testid={`mentee-row-${r.id}`}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell>{r.cycle}</TableCell>
                <TableCell className="font-mono">{r.avg}</TableCell>
                <TableCell><a data-testid={`view-mentee-${r.id}-link`} className="link" href={`/mentee/${r.id}`}>Open</a></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

7) Charts (Recharts)
- Use Recharts: RadarChart for competencies, BarChart for period comparison, LineChart for progress, PieChart for certification status.
- Accessibility: provide aria-labels and data-testid on container; ensure focusable legend toggles.
```jsx
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';

export function CompetencyRadar({ data }) {
  return (
    <div data-testid="competency-radar" className="card p-4">
      <h4 className="h4 mb-2">Competency Profile</h4>
      <div style={{height: 300}}>
        <ResponsiveContainer>
          <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="var(--border-medium)" />
            <PolarAngleAxis dataKey="competency" tick={{ fill: 'var(--text-secondary)', fontFamily: 'Karla' }} />
            <PolarRadiusAxis angle={30} domain={[0,5]} tick={{ fill: 'var(--text-muted)' }} />
            <Radar name="Current" dataKey="score" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.25} />
            <Legend />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid var(--border-light)` }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

8) Real-time AI Feedback Panel
- Location: right column (lg ≥ 1024px), collapsible on mobile via Sheet.
- Content: rubric alignment, suggested comments, risk flags, missing fields.
```jsx
export function AIFeedback({ items }) {
  return (
    <aside data-testid="ai-feedback-panel" className="card p-4 space-y-3">
      <h4 className="h4">AI Analysis</h4>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} data-testid={`ai-feedback-item-${i}`} className="flex items-start gap-2">
            <span className={`w-2 h-2 rounded-full mt-2 ${it.type==='risk'?'bg-[var(--accent-danger)]':it.type==='suggestion'?'bg-[var(--accent-info)]':'bg-[var(--accent-success)]'}`}></span>
            <p className="body-sm">{it.text}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

9) Export-Ready Report Layout
- Use a fixed content width of 816px for A4 export. Avoid gradients; use solid backgrounds and visible borders.
```css
.report { width: 816px; margin: 0 auto; background: #fff; color: #000; }
.report__section { padding: 16px 20px; border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 12px; }
@media print {
  .no-print { display: none !important; }
  .report { box-shadow: none; width: auto; }
}
```

E. LAYOUT & RESPONSIVE SYSTEM
- Container
```css
.container { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
.section { padding: 48px 0; }
.grid-auto { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
```
- Dashboard Layout
```css
.layout { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 1024px) { .layout { grid-template-columns: 2fr 1fr; } }
```
- Breakpoints
  - sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
- Mobile Adaptations
  - Touch targets ≥ 44px; buttons and table rows min-height 48px.
  - Use accordions or tabs to chunk long forms.
  - Persistent bottom CTA bar for form submit on mobile.

F. COMPONENT LIBRARIES & IMPLEMENTATION
- Use shadcn/ui: Button, Card, Input, Textarea, Select, Tabs, Accordion, Tooltip, Dialog, DropdownMenu, Badge, Separator, Table, Sheet, Toast.
- Icons: lucide-react (e.g., Download, FileText, User, Brain). Size 18–20px.
- Charts: Recharts as specified.
- Motion: Framer Motion for reveals and hover micro-interactions; respect reduced-motion.
- Background FX: optional subtle noise PNG at 2–4% opacity; no canvas/WebGL on forms.
- Tailwind usage examples
  - max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8
  - grid grid-cols-1 md:grid-cols-2 gap-6
  - border border-[var(--border-light)] rounded-[var(--radius-md)] shadow-sm

Framer Motion patterns (JS):
```jsx
import { motion, useReducedMotion } from "framer-motion";
export function FadeUp({ children, delay=0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      data-testid="fade-up"
      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.28, ease: [0.2,0.8,0.2,1], delay }}
    >{children}</motion.div>
  );
}
```

G. LANDING PAGE SECTIONS (STRUCTURE & STYLES)
- Features
  - 3–6 feature cards in grid; each card: icon circle, h3, body, link.
```jsx
export function Features() {
  const items = [
    { title:'Competency Rubrics', desc:'10-dimension evaluations with calibrated scales.' },
    { title:'AI Assistance', desc:'Real-time hints, summaries, and bias detection.' },
    { title:'Cycle Management', desc:'Track multiple periods and compare progress.' },
  ];
  return (
    <section id="features" data-testid="features-section" className="section bg-[var(--bg-section)]">
      <div className="container grid-auto">
        {items.map((f,i)=> (
          <div key={i} className="card p-6" data-testid={`feature-card-${i}`}>
            <h3 className="h3">{f.title}</h3>
            <p className="body-md mt-2 text-[color:var(--text-secondary)]">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```
- Social Proof
```jsx
export function SocialProof() {
  return (
    <section data-testid="social-proof-section" className="section">
      <div className="container grid md:grid-cols-3 gap-6">
        {["+32% faster cycles","96% manager adoption","AA compliant"].map((m,i)=> (
          <div key={i} className="card p-6 text-center">
            <div className="metric" data-testid={`metric-${i}`}>{m}</div>
            <p className="caption mt-2">Last 4 quarters</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```
- CTA Band
```jsx
export function CTA() {
  return (
    <section data-testid="cta-band" className="py-12 bg-[var(--brand)]">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <h3 className="h2 text-white">Start your next appraisal cycle today</h3>
        <a data-testid="cta-start-button" href="/dashboard" className="btn btn--cta">Start Now</a>
      </div>
    </section>
  );
}
```
- FAQ (Accordion)
```jsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
export function FAQ() {
  const q = [{q:'Can I export PDFs?',a:'Yes, reports export to A4-ready PDFs with your logo.'},{q:'Do you support multiple cycles?',a:'Track any number of periods per mentee and compare.'}];
  return (
    <section data-testid="faq-section" className="section bg-[var(--bg-section)]">
      <div className="container">
        <Accordion type="single" collapsible>
          {q.map((x,i)=> (
            <AccordionItem key={i} value={`item-${i}`} data-testid={`faq-item-${i}`}>
              <AccordionTrigger className="h4">{x.q}</AccordionTrigger>
              <AccordionContent className="body-md text-[color:var(--text-secondary)]">{x.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
```
- Footer
```jsx
export function Footer() {
  return (
    <footer data-testid="app-footer" className="pt-8 border-t border-[var(--border-light)]">
      <div className="container grid md:grid-cols-4 gap-6 pb-8">
        <div>
          <div className="h4">Talent Fluency</div>
          <p className="body-sm mt-2">Professional appraisals for modern teams.</p>
        </div>
        <nav className="grid gap-2">
          <a data-testid="footer-link-docs" className="link" href="/docs">Docs</a>
          <a data-testid="footer-link-privacy" className="link" href="/privacy">Privacy</a>
          <a data-testid="footer-link-terms" className="link" href="/terms">Terms</a>
        </nav>
        <form className="grid gap-2">
          <label className="label">Subscribe</label>
          <div className="flex gap-2">
            <input data-testid="newsletter-input" className="input flex-1" placeholder="Work email" />
            <button data-testid="newsletter-submit-button" className="btn btn--secondary">Join</button>
          </div>
        </form>
        <div className="text-right md:text-left">
          <p className="caption">© {new Date().getFullYear()} Talent Fluency</p>
        </div>
      </div>
    </footer>
  );
}
```

H. DATA VIZ & EMPTY STATES
- Chart palette: use brand as primary; success for achieved targets; warning/danger for risks.
- Empty states: card with illustrative icon, title, and action.
```jsx
export function EmptyState({ title, actionText, href }){
  return (
    <div data-testid="empty-state" className="card p-8 text-center">
      <div className="h3">{title}</div>
      <p className="body-sm mt-2">You can add this from the top-right action.</p>
      <a data-testid="empty-action-link" href={href} className="btn btn--primary mt-4">{actionText}</a>
    </div>
  );
}
```

I. ACCESSIBILITY & QA INSTRUMENTATION
- WCAG 2.2 AA contrast enforced by tokens; verify charts with high-contrast strokes.
- Keyboard: tab order follows visual; ensure focus-visible on all controls.
- Screen readers: aria-labels for charts, form groups, and export buttons.
- Hit areas: ≥ 44px; spacing between controls ≥ 8px.
- Testing: data-testid on all interactive and key informational nodes (labels, errors, totals, confirmation texts).
- Errors: inline below field; icon + aria-live="polite" for async validation.

J. THEMING & TAILWIND MAPPING
- Tailwind config: use CSS variables via arbitrary values.
- Example mapping in classes: bg-[var(--bg-card)] text-[color:var(--text-primary)] border-[var(--border-light)]
- Dark mode: class strategy `.dark` on html; respect tokens above.

K. MOTION & PERFORMANCE
- Durations: 150–220ms; easing var(--easing).
- On hover: scale 1.01–1.03 max; on press: scale 0.99.
- Scroll reveal on marketing only; avoid on long forms.
- Prefer CSS transforms/opacity; avoid expensive box-shadow animations.
- Images: next-gen (AVIF/WebP), sizes attribute, lazy loading; hero art ≤ 180KB; LCP target < 2.5s mobile.
- Respect prefers-reduced-motion; disable non-essential animations.

L. FORM PATTERN FOR EVALUATION
- Structure: Tabs [Overview | Competencies | IDP | Certifications | Role Fit | Summary].
- Competencies: 10 rows; each row has slider (0–5), evidence textarea, rubric tooltip.
- Real-time AI summary sticky card shows bias flags and suggested phrasing.
```jsx
// Competency row snippet
export function CompetencyRow({ name, value, onChange }){
  return (
    <div data-testid={`competency-${name}-row`} className="grid gap-2 md:grid-cols-12 items-start py-3 border-b border-[var(--border-light)]">
      <div className="md:col-span-3 h4">{name}</div>
      <div className="md:col-span-4">
        <input data-testid={`competency-${name}-slider`} type="range" min="0" max="5" step="1" value={value} onChange={onChange} className="w-full" />
        <div className="metric mt-1">{value}</div>
      </div>
      <div className="md:col-span-5">
        <textarea data-testid={`competency-${name}-evidence`} className="input w-full min-h-[84px]" placeholder="Evidence & examples" />
      </div>
    </div>
  );
}
```

M. QUICK REFERENCE
- DO
  - Use neutral surfaces; highlight decisions/actions with brand.
  - Chunk forms with tabs/accordions; keep sections 6–10 fields max.
  - Use mono font for metrics to align numbers in tables/reports.
  - Add data-testid to all interactive and key informational elements.
- DON’T
  - Place gradients behind inputs/tables.
  - Use more than one chart per viewport on mobile.
  - Depend on color alone for meaning; add icons/labels.
  - Export PDFs with dark backgrounds.
- ALWAYS
  - Keep contrast ≥ AA; ensure focus-visible rings.
  - Use ResponsiveContainer for Recharts.
  - Keep touch targets ≥44px.
- NEVER
  - Hardcode backend URLs; read REACT_APP_BACKEND_URL from env when needed.
```