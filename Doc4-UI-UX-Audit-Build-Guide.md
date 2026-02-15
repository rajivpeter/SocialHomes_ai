# SocialHomes.Ai — Frontend UI/UX Audit & Build Guide

> Comprehensive audit for fullstack developers and tester agents.
> Version 1.0 | 2026-02-14

---

## 1. DESIGN SYSTEM OVERVIEW

### Color Palette (CSS Custom Properties)
```css
--bg-primary:      #0D1117   /* Main background */
--bg-secondary:    #161B22   /* Card/panel backgrounds */
--bg-surface:      #1C2128   /* Elevated surfaces */
--surface-hover:   #21262D   /* Hover state */
--border-default:  #30363D   /* Default borders */
--border-subtle:   #21262D   /* Subtle borders */
--text-primary:    #E6EDF3   /* Main text */
--text-secondary:  #ACC0B5   /* Secondary text */
--text-muted:      #5E7082   /* Muted text */
--brand-teal:      #058995   /* Primary accent */
--brand-peach:     #F4A261   /* Warning accent */
--brand-garnet:    #C0392B   /* Danger/urgent */
--accent-purple:   #8B5CF6   /* AI features */
```

### Typography
- Font: `Inter` (all text)
- Body: 15px (--font-base)
- Headings: 18-36px
- Labels: 10-12px uppercase, letter-spacing 0.08em

### Spacing & Layout
- Card padding: 16-24px (p-4 to p-6)
- Grid gaps: 12-24px (gap-3 to gap-6)
- Sidebar: 256px expanded, 64px collapsed
- Header: 56px fixed height
- Max content width: 1400px

---

## 2. LAYOUT ARCHITECTURE

### Shell (Layout.tsx)
```
┌──────────────────────────────────────────────────┐
│  Header (56px, z-30, fixed top)                  │
├─────────┬────────────────────────────────────────┤
│ Sidebar │  Main Content Area                     │
│  (256px │  ├── Breadcrumbs (auto-generated)      │
│   or    │  └── <Outlet /> (page content)         │
│  64px)  │                                        │
│         │                     ┌──────────────────┤
│         │                     │ YantraAssist     │
│         │                     │ (320px, slide-in)│
└─────────┴─────────────────────┴──────────────────┘
```

### Header (Header.tsx)
- Left: Organization name + RP number
- Center: Global search (navigates to /search)
- Right: Persona switcher dropdown → Notifications bell → Yantra Assist button
- Yantra button: `aria-label="Yantra Assist"`, class `yantra-assist-trigger`

### Sidebar (Sidebar.tsx)
- Sections: NAVIGATE, MANAGE, COMMUNICATE, ANALYSE, CONFIGURE
- NavLink with activeClassName (brand-teal highlight)
- Badges on: Repairs (15), Complaints (5), Communications (3)
- Collapsible with ChevronLeft/Right toggle
- localStorage persistence for collapse state

### Breadcrumbs (Breadcrumbs.tsx)
- Auto-generated from URL path
- `<nav aria-label="breadcrumb">` with class `breadcrumb-nav`
- Path segments: Home > Tenancies > Tenant Name

### YantraAssist (YantraAssist.tsx)
- Slide-in panel from right (320px)
- Pin button for sticky mode
- Context-aware content per page
- Sections: Urgent (red), Attention (orange), Insights (blue), Briefing, External Factors
- Chat interface at bottom

---

## 3. ROUTING MAP (App.tsx)

| Route | Page | Auth Required |
|-------|------|:---:|
| `/login` | LoginPage | No |
| `/` | Redirect to /dashboard | Yes |
| `/dashboard` | DashboardPage | Yes |
| `/briefing` | BriefingPage | Yes |
| `/explore` | ExplorePage | Yes |
| `/tenancies` | TenanciesPage | Yes |
| `/tenancies/:id` | TenancyDetailPage | Yes |
| `/properties` | PropertiesPage | Yes |
| `/properties/:id` | PropertyDetailPage | Yes |
| `/repairs` | RepairsPage | Yes |
| `/repairs/:id` | RepairDetailPage | Yes |
| `/rent` | RentPage | Yes |
| `/compliance` | CompliancePage | Yes |
| `/compliance/:type` | ComplianceTypePage | Yes |
| `/compliance/awaabs-law` | AwaabsLawPage | Yes |
| `/complaints` | ComplaintsPage | Yes |
| `/complaints/:id` | ComplaintDetailPage | Yes |
| `/allocations` | AllocationsPage | Yes |
| `/asb` | AsbPage | Yes |
| `/asb/:id` | AsbDetailPage | Yes |
| `/communications` | CommunicationsPage | Yes |
| `/reports` | ReportsPage | Yes |
| `/reports/tsm` | TsmReportPage | Yes |
| `/reports/:id` | DynamicReportPage | Yes |
| `/ai-centre` | AiCentrePage | Yes |
| `/admin` | AdminPage | Yes |
| `/search` | SearchPage | Yes |
| `/tenant-portal` | TenantPortalPage | Yes |

---

## 4. SHARED COMPONENTS

### KpiCard
- **Props**: label, value, subValue, trend (up/down/stable), trendValue, icon, colour, delay, onClick
- **Visual**: Top accent gradient, icon top-right, large value, trend arrow, hover lift
- **Test selectors**: Look for cards with matching label text

### StatusPill
- **Props**: status, label, size (sm/md), pulse
- **Statuses**: active (teal), compliant (green), non-compliant (red), expiring (orange), completed (green), void (gray), emergency (red+pulse)

### CountdownTimer
- **Props**: deadline, label, useWorkingDays, size (sm/lg)
- **States**: Breached (red pulse), Urgent (1-2d red), Approaching (3-5d orange), On-track (green)

### ActionModal
- **Props**: open, onClose, title, description, icon, fields[], submitLabel, onSubmit, variant
- **Field types**: text, textarea, select, date, readonly
- **Variants**: default, success, warning, danger
- **Flow**: Form → Submit → Loading (800ms) → Success animation → Auto-close (1.5s)

### AiActionCard
- **Props**: title, actions[], prediction, warning
- **4-step workflow**: Preview → Send → Follow-up → Done

### ProtectedRoute
- Wraps all authenticated routes
- Redirects to /login if no auth
- Shows loading spinner during auth check

---

## 5. PAGE-BY-PAGE AUDIT

### 5.1 Dashboard
**Components**: KpiCard (9x), Recharts (2x), Big 6 compliance grid, Awaab's Law section, AI Insights, Activity Timeline
**Data**: `usePersonaScope()`, `organisation`, `complianceStats`, `aiInsights`
**KPIs**: Properties, Tenancies, Active Repairs, Rent Collected, Arrears, Compliance, Open Complaints, Void Properties, AI Alerts
**Charts**: Rent Collection Trend (12-month line), Repairs by Priority (stacked bar)
**Animations**: Staggered fade-in-up (50ms delays)

### 5.2 Explore (Geographic Drill-Down)
**Hierarchy**: Country → Region → LA → Estate → Block → Unit → Tenant
**Dual view**: Map (60% Leaflet) + Context Panel (40%)
**3D mode**: Three.js building visualization at block level (colored units by compliance)
**Markers**: Color-coded by entity type, size by hierarchy level
**Context panel**: Dynamic metrics, compliance cards, risk summary, weather data, area intelligence
**Test points**: Map markers have popups, children list uses `<ul>/<li>`, drill-down navigation

### 5.3 Tenancies
**Features**: Search by name/postcode, filter by status, sortable table
**Columns**: Name, Address, Postcode, Tenure, Status (StatusPill), Rent Balance (color-coded), Payment Method, Arrears Risk (bar)
**Search input**: `data-testid="search-name"`
**Subtitle**: Dynamic count "{filtered} of {total} tenancies"

### 5.4 Properties
**Views**: List (default) + Map toggle
**List view**: Mini Leaflet map (200px) + table
**Map view**: Full-screen Leaflet with colored circle markers (green/orange/red by compliance)
**Filters**: Search by address/postcode/UPRN, filter by type, filter by compliance
**Columns**: UPRN, Address, Type, Bedrooms, Tenure, Occupancy (StatusPill), Compliance (StatusPill), Weekly Rent, EPC Rating

### 5.5 Repairs
**Views**: List + Kanban toggle
**Summary stats**: Total, Emergency (red), Urgent (orange), Routine (blue), Planned (green)
**List columns**: Reference, Date, Address, SOR Code, Priority (badge), Status (StatusPill), Operative, Target Date, Days Elapsed
**Kanban**: 4 columns (Open, In Progress, Awaiting Parts, Completed)
**Row styling**: Left border = priority color

### 5.6 Briefing
**Layout**: Full-screen immersive, centered column, background gradient
**Sections** (staggered animation):
1. Greeting + date + persona context
2. Weather alert (damp risk)
3. Urgent items
4. Today's tasks (with View/Review buttons)
5. AI predictions (arrears, complaint, damp)
6. Compliance summary (Big 6)
7. Patch snapshot (4 KPIs)
8. "Start my day" CTA → /dashboard

### 5.7 Login
**Layout**: Left 55% (product showcase carousel) + Right 45% (FirebaseUI)
**Carousel**: 6 slides, auto-advance 5s, manual nav arrows + dots
**Feature grid**: 8 items
**Mobile**: Desktop-required block message
**Post-auth**: Redirect to /dashboard

### 5.8 Compliance
**Types**: Gas, Electrical, Fire, Asbestos, Legionella, Lifts
**Detail pages**: Certificate tables, expiry tracking, StatusPills
**Awaab's Law page**: Emergency + significant hazard cases with CountdownTimers

### 5.9 Complaints
**List**: Reference, tenant, category, stage (1-2), status, response deadline
**Detail**: Timeline view, stage progression, SLA tracking, escalation risk
**Null safety**: BUG-001 fix — null check before rendering

### 5.10 Rent & Income
**Sections**: Arrears overview, collection stats, payment trends
**Charts**: Collection rate trends, arrears breakdown
**Risk indicators**: Color-coded arrears risk per tenant

### 5.11 ASB
**List**: Cases with severity levels, escalation stages
**Navigation**: Row click + Link components (BUG-003 fix)
**Detail**: Evidence log, multi-agency panel status, legal action probability

### 5.12 Allocations
**Features**: Void property management, lettings pipeline
**Fix**: WARN-010 — useMemo dependency fixed for address resolution

### 5.13 Communications
**Inbox**: Message list with sentiment tags, unread indicators
**Templates**: Pre-built letter/email templates
**Draft**: Compose with AI assistance

### 5.14 Reports
**Types**: TSM, Performance, Financial, Operational
**Dynamic reports**: Filter → Generate → Download
**TSM page**: Tenant Satisfaction Measures regulatory report

### 5.15 Tenant Portal
**Features**: Self-service view for tenants
**Quick Message form**: Subject dropdown + message textarea + submit button (WARN-009 fix)

### 5.16 Admin
**Sections**: Organization settings, user management, workflow config, integrations

### 5.17 AI Centre
**Tabs**: Insights, Predictions, Assistant
**Content**: Aggregated AI signals, risk forecasts, chat interface

---

## 6. STATE MANAGEMENT

### AppContext (Global)
```typescript
{
  user: User,
  persona: 'coo' | 'head-of-service' | 'manager' | 'housing-officer' | 'operative',
  sidebarCollapsed: boolean,
  yantraAssistOpen: boolean,
  notifications: Notification[],
  searchQuery: string
}
```

### AuthContext (Firebase)
```typescript
{
  user: AuthUser | null,
  loading: boolean,
  firebaseReady: boolean,
  signOut: () => Promise<void>,
  getToken: () => Promise<string | null>
}
```

### Key Hooks
- `usePersonaScope()` — Filters data by selected persona scope
- `useApi()` — TanStack Query wrapper (5-min stale, 1 retry, no focus refetch)
- `useEntityIntelligence()` — AI-powered entity suggestions

---

## 7. API ROUTES (Server)

| Route | Module | Description |
|-------|--------|-------------|
| `/api/v1/auth` | auth.ts | Firebase auth verification |
| `/api/v1/properties` | properties.ts | CRUD + search + compliance |
| `/api/v1/tenants` | tenants.ts | CRUD + search + risk scoring |
| `/api/v1/cases` | cases.ts | Repairs, complaints, ASB (unified) |
| `/api/v1/explore` | explore.ts | Geographic hierarchy data |
| `/api/v1/briefing` | briefing.ts | Morning briefing data |
| `/api/v1/compliance` | compliance.ts | Big 6 + Awaab's Law |
| `/api/v1/rent` | rent.ts | Arrears, payments, collection |
| `/api/v1/reports` | reports.ts | TSM, performance reports |
| `/api/v1/ai` | ai.ts | AI insights, predictions |
| `/api/v1/admin` | admin.ts | Organization settings |
| `/api/v1/public-data` | public-data.ts | EPC, IMD, weather, crime |
| `/api/v1/export` | export.ts | HACT XML/CSV export |
| `/api/v1/config` | (inline) | Firebase client config |
| `/health` | (inline) | Cloud Run health check |

---

## 8. ANIMATION SYSTEM

### CSS Animations (index.css)
| Name | Effect | Duration |
|------|--------|----------|
| fadeInUp | Scale from below + fade in | 500ms |
| fadeIn | Simple opacity fade | 300ms |
| slideInLeft | Enter from left | 400ms |
| slideInRight | Enter from right | 400ms |
| slideInDown | Enter from top | 400ms |
| pulse-glow | Purple glow pulse (AI) | 2s |
| pulse-critical | Red pulse (urgent) | 1.5s |
| countUp | Scale up + fade in | 600ms |
| spin-slow | Slow rotation | 3s |
| shimmer | Loading shimmer | 1.5s |
| float | Gentle Y bob | 3s |

### Stagger Patterns
- KPI cards: 0, 50, 100, 150ms...
- Table rows: 150 + (index × 50)ms
- Kanban cards: 200 + (col × 100) + (card × 50)ms

---

## 9. ACCESSIBILITY STATUS

### Implemented
- `aria-label="Yantra Assist"` on trigger
- `aria-label="breadcrumb"` on nav
- Semantic `<nav>`, `<button>`, `<table>`, `<label>`
- Visible focus ring (brand-teal)
- Tab order: logical left-to-right, top-to-bottom
- Escape to close modals

### Gaps (To Fix)
1. No focus trap on modals
2. Muted text contrast 3.8:1 (needs 4.5:1 for WCAG AA)
3. No screen reader announcements for dynamic content
4. Color-only status indication in some places
5. No reduce-motion option

---

## 10. KNOWN ISSUES

### UI/UX
1. No loading state indicator for form submissions
2. Missing form validation messages
3. No error recovery UI for failed API calls
4. Map initialization lag on Explore page
5. 3D building navigation unclear without context

### Feature Completeness
1. Search page: template only
2. Admin section: shell only
3. AI chat: simulated responses
4. Dynamic reports: generation stubbed
5. Notifications: no dismiss action

### Responsive
1. No tablet breakpoint for map/list split
2. Mobile login blocks access
3. Tables need card layout for mobile
4. Sidebar collapse less tested on mobile

---

## 11. BUILD & DEPLOYMENT PROCESS

### Prerequisites
```bash
Node.js 20.17+
npm (with --legacy-peer-deps for firebaseui)
```

### Build Commands
```bash
# Install dependencies
cd app && npm install --legacy-peer-deps
cd server && npm install

# TypeScript check
cd app && node node_modules/typescript/bin/tsc --noEmit

# Build frontend
cd app && npm run build

# Build server
cd server && npm run build

# Deploy (triggers Cloud Build)
git push origin main
```

### CI/CD Pipeline (cloudbuild.yaml)
1. npm install (app + server)
2. Build frontend (Vite)
3. Build server (TypeScript)
4. Docker build (multi-stage)
5. Push to Artifact Registry
6. Deploy to Cloud Run (europe-west2)

### Environment Variables (Cloud Run)
```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID / GOOGLE_CLOUD_PROJECT
PORT=8080
```

---

## 12. TEST SELECTORS REFERENCE

| Element | Selector |
|---------|----------|
| Yantra Assist button | `[aria-label*='assist'], .yantra-assist-trigger` |
| Breadcrumbs | `nav[aria-label='breadcrumb'], .breadcrumb-nav` |
| Map markers | `.leaflet-container .leaflet-marker-icon` |
| Map popups | `.leaflet-popup-content` |
| Explore children | `.panel-list li` |
| Briefing tasks | Button text "View" / "Review" |
| Compliance Big 6 | Section with "Compliance" heading |
| Properties map | `.leaflet-container` (available in both list and map views) |
| Tenancy search | `[data-testid="search-name"]` |
| Tenant portal form | `select, textarea` elements |
| Status pills | `.status-pill` or StatusPill component |
| KPI cards | Cards with specific label text |

---

**Document generated by Frontend UI Engineer Agent | SocialHomes.Ai | v1.0 | 2026-02-14**
