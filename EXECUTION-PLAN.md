# SocialHomes.Ai — Master Execution Plan

> Multi-agent orchestration plan for building SocialHomes.Ai to production readiness and beyond.
> Version 7.0 | 2026-02-26 | Updated by Business Analyst Agent
> Studio: Yantra Works

---

## PLAN SUMMARY

| Phase | Name | Sprints | Status | Progress |
|-------|------|---------|--------|----------|
| 0 | Infrastructure | — | DONE | 10/10 |
| 1 | Foundation | 1-2 | DONE | 12/12 |
| 2 | Intelligence | 3-4 | DONE | 14/14 |
| 3 | Enrichment | 5-6 | DONE | 14/17 (3 deferred) |
| 4 | Completion | 7-8 | DONE | 11/14 (3 deferred) |
| **5** | **Evolution** | **9-14** | **IN PROGRESS** | **45/50** |

---

## PHASE 0: INFRASTRUCTURE — DONE (10/10)

| # | Task | Status | Agent |
|---|------|--------|-------|
| 0.1 | Verify 4 bug fixes from Selenium testing | DONE | Claude Code |
| 0.2 | Fix 11 Selenium test warnings (WARN-001 to WARN-011) | DONE | Claude Code |
| 0.3 | Install and configure Entire.io CLI | DONE | Claude Code |
| 0.4 | Build and deploy via git push -> Cloud Build | DONE | Claude Code |
| 0.5 | Configure Telegram MCP (@SocialHomesBot) | DONE | Claude Code |
| 0.6 | Create persistent SESSION-HISTORY.md | DONE | Claude Code |
| 0.7 | Create CLAUDE.md project instructions | DONE | Claude Code |
| 0.8 | UI/UX Audit -> Doc4-UI-UX-Audit-Build-Guide.md | DONE | Frontend Agent |
| 0.9 | BA Requirements -> Doc3-Public-API-Integration-Requirements.txt | DONE | BA Agent |
| 0.10 | Master Execution Plan (this document) | DONE | Claude Code |

---

## PHASE 1: FOUNDATION (Sprints 1-2, Weeks 1-4) — DONE (12/12)

### Goal: Core external API infrastructure + free API integrations

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 1.1 | Create `server/src/services/external-api.ts` — shared caching, rate limiting, audit logging | P1 | M | Fullstack | DONE |
| 1.2 | Create `externalDataCache` Firestore collection + TTL management | P1 | M | Fullstack | DONE |
| 1.3 | Integrate postcodes.io — postcode lookup, LSOA, lat/long | P1 | S | Fullstack | DONE |
| 1.4 | Integrate Open UPRN (uprn.uk) — UPRN lookup | P1 | S | Fullstack | DONE |
| 1.5 | Integrate data.police.uk — street-level crime, ASB data | P1 | M | Fullstack | DONE |
| 1.6 | Integrate Open-Meteo API — enhanced weather (hourly + historical) | P1 | S | Fullstack | DONE |
| 1.7 | Integrate DEFRA Flood Risk API — flood warnings per property | P1 | S | Fullstack | DONE |
| 1.8 | Load IMD data (ONS CSV -> Firestore) | P1 | M | Fullstack | DONE |
| 1.9 | Extend TypeScript types (14 new interfaces + property/tenant/estate extensions) | P1 | M | Fullstack | DONE |
| 1.10 | Unit tests for all Tier 1 API integrations (66 tests, 3 files) | P1 | M | Tester | DONE |
| 1.11 | Selenium regression test for Phase 1 APIs | P1 | M | Tester | DONE |
| 1.12 | Contextual user manual help system (20 pages, HelpDrawer) | P1 | M | Documentation | DONE |

---

## PHASE 2: INTELLIGENCE (Sprints 3-4, Weeks 5-8) — DONE (14/14)

### Goal: 7 killer differentiators + Tier 2 API registrations

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 2.1 | **Predictive Damp Intelligence** — 5-factor weighted algorithm | P1 | L | Fullstack | DONE |
| 2.2 | **Live Crime Context for ASB** — police data correlation | P1 | L | Fullstack | DONE |
| 2.3 | **Automatic Vulnerability Detection** — 7-factor scoring | P1 | L | Fullstack | DONE |
| 2.4 | **Property Passport** — multi-source aggregation | P1 | L | Fullstack | DONE |
| 2.5 | **Benefits Entitlement Engine** — UK benefit rules analysis | P1 | L | Fullstack | DONE |
| 2.6 | **AI Neighbourhood Briefing** — per-estate daily intelligence | P1 | L | Fullstack | DONE |
| 2.7 | Create DWP Universal Credit mock endpoints | P2 | M | Fullstack | DONE |
| 2.8 | Create IoT sensor mock endpoints (Switchee/Aico) | P2 | M | Fullstack | DONE |
| 2.9 | Create GoCardless direct debit mock endpoints | P2 | M | Fullstack | DONE |
| 2.10 | Create NOMIS labour market mock endpoints | P2 | M | Fullstack | DONE |
| 2.11 | Frontend: Damp Intelligence panel on property detail | P1 | M | Frontend | DONE |
| 2.12 | Frontend: Vulnerability + Benefits panels on tenant detail | P1 | M | Frontend | DONE |
| 2.13 | Frontend: AI Centre Differentiators hub with scan | P1 | L | Frontend | DONE |
| 2.14 | Frontend: Neighbourhood Briefing panel component | P1 | M | Frontend | DONE |

---

## PHASE 3: ENRICHMENT (Sprints 5-6, Weeks 9-12) — DONE (14/17)

### Goal: Remaining differentiators + Tier 2 APIs + enhanced UI

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 3.1 | **Benefits Entitlement Engine** — NOMIS + IMD + household | P2 | L | Fullstack | DONE (via NOMIS integration) |
| 3.2 | **AI Neighbourhood Briefing** — per-estate weekly briefing | P1 | L | Fullstack | DONE |
| 3.3 | **GOV.UK Notify templates** — full template library (24 templates, 7 categories) | P1 | M | Fullstack | DONE |
| 3.4 | Register and integrate Met Office DataHub | P2 | M | Fullstack | DEFERRED (Open-Meteo sufficient) |
| 3.5 | Integrate Census 2021 API (ONS via NOMIS) | P2 | M | Fullstack | DONE |
| 3.6 | Integrate NOMIS API — labour market stats | P2 | M | Fullstack | DONE |
| 3.7 | Register OS Places/Maps API (PSGA) | P2 | M | Fullstack | DEFERRED (OSM tiles sufficient) |
| 3.8 | Integrate Gas Safe Register | P2 | S | Fullstack | DONE |
| 3.9 | Integrate Electrical Safety Register | P2 | S | Fullstack | DONE |
| 3.10 | Integrate Twilio (free tier) | P2 | M | Fullstack | DEFERRED (GOV.UK Notify preferred) |
| 3.11 | Frontend: Benefits check card on tenant detail | P2 | M | Frontend | DONE (Phase 2) |
| 3.12 | Frontend: Neighbourhood briefing accordion on briefing page | P1 | M | Frontend | DONE |
| 3.13 | Frontend: Enhanced Explore map with data layer toggles | P2 | M | Frontend | DONE |
| 3.14 | Frontend: Contractor verification badges (Gas Safe + NICEIC) | P2 | S | Frontend | DONE |
| 3.15 | Fix accessibility gaps (focus traps, skip links, ARIA, motion) | P2 | M | Frontend | DONE |
| 3.16 | Fix form validation across ActionModal | P2 | M | Frontend | DONE |
| 3.17 | E2E testing for all new features | P1 | L | Tester | DEFERRED to Phase 5 |

---

## PHASE 4: COMPLETION (Sprints 7-8, Weeks 13-16) — DONE (11/14)

### Goal: Mock services + polish + production hardening

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 4.1 | GoCardless/Allpay mock payment endpoints | P3 | M | Fullstack | DONE (Phase 2) |
| 4.2 | Plentific/Fixflo mock repairs marketplace | P3 | M | Fullstack | DONE |
| 4.3 | RSH/CORE/Ombudsman mock regulatory submissions | P3 | M | Fullstack | DONE |
| 4.4 | DocuSign mock digital signing | P3 | M | Fullstack | DONE |
| 4.5 | Experian/TransUnion mock referencing | P3 | M | Fullstack | DONE |
| 4.6 | Land Registry data integration | P3 | S | Fullstack | DONE |
| 4.7 | Admin: Integration management dashboard (20 integrations, 3 tiers) | P2 | M | Frontend | DONE |
| 4.8 | Admin: Toggle integrations on/off + test connection | P2 | S | Frontend | DONE |
| 4.9 | Performance: Cache warming, batch updates | P2 | M | Fullstack | DEFERRED (cache-through sufficient) |
| 4.10 | Security audit (CSP, CORS, rate limiting, security headers) | P1 | M | Fullstack | DONE |
| 4.11 | Production monitoring (metrics, health checks, structured logging) | P1 | M | DevOps | DONE |
| 4.12 | Full regression test suite | P1 | L | Tester | DEFERRED to Phase 5 |
| 4.13 | Load testing (100 concurrent users) | P2 | M | Tester | DEFERRED to Phase 5 |
| 4.14 | Documentation: API reference for integrations | P2 | M | BA | DEFERRED to Phase 5 |

---

## PHASE 5: EVOLUTION (Sprints 9-14, Weeks 17-28) — IN PROGRESS (45/50)

### Goal: Real AI, real-time features, advanced testing, production scaling, SaaS readiness

Phase 5 is organized into 5 sub-phases matching the agent structure:
1. Project Setup & Architecture
2. Backend Development
3. Frontend Development
4. Testing & QA
5. DevOps & Deployment

---

### PHASE 5.1: PROJECT SETUP & ARCHITECTURE (Sprint 9)

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 5.1.1 | Create comprehensive BA specification docs in `docs/requirements/` (Doc1, Doc2, Doc3) v7.0 | P0 | L | BA | DONE |
| 5.1.2 | Update EXECUTION-PLAN.md with Phase 5 detailed tasks (v7.0) | P0 | M | BA | DONE |
| 5.1.3 | Define Vertex AI / Gemini integration architecture for Yantra Assist — design prompt templates, context injection, token management, streaming response pattern, model selection (Gemini Pro vs Flash), safety settings, grounding with housing data | P1 | L | Fullstack | DONE |
| 5.1.4 | Design WebSocket (Socket.io) architecture for real-time notifications — connection management, room-based subscriptions (per-user, per-estate, per-org), reconnection strategy, message format, authentication handshake via Firebase token | P1 | M | Fullstack | DONE |
| 5.1.5 | Design event-driven architecture using Cloud Pub/Sub — define topics (case-created, case-updated, compliance-expiring, arrears-threshold, damp-alert), subscriptions, dead letter queues, message schemas for async workflows | P2 | L | Fullstack | DONE |
| 5.1.6 | Define multi-tenant data isolation strategy for SaaS deployment — organisation-scoped Firestore queries, tenant context middleware, data partitioning, branding customisation, per-org configuration, billing model design | P2 | XL | Fullstack | DONE |
| 5.1.7 | Create API reference documentation (OpenAPI/Swagger spec) for all 50+ endpoints — request/response schemas, authentication docs, example payloads, error codes, rate limit documentation | P2 | L | BA | TODO |
| 5.1.8 | Design Firestore data migration strategy — version schema changes, backward compatibility, migration scripts, rollback procedures, zero-downtime migration patterns | P2 | M | Fullstack | DONE |
| 5.1.9 | Design AI model versioning and A/B testing framework — model registry, feature flags for AI features, confidence threshold tuning, model performance tracking, feedback loop architecture | P2 | L | Fullstack | DONE |

---

### PHASE 5.2: BACKEND DEVELOPMENT (Sprints 9-11)

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 5.2.1 | Integrate Vertex AI (Gemini Pro) for Yantra Assist — server-side SDK, streaming responses via Server-Sent Events, context window management (property/tenant/case data injection), conversation history with Firestore persistence, token counting and budget enforcement | P1 | XL | Fullstack | DONE |
| 5.2.2 | Build AI prompt engineering layer — context-aware system prompts per entity type (tenant, property, case, compliance, rent), few-shot examples for housing domain, safety guardrails (PII masking, hallucination prevention), persona-scoped response formatting | P1 | L | Fullstack | DONE |
| 5.2.3 | Implement WebSocket server (Socket.io) — connection lifecycle, authentication handshake with Firebase JWT, room management (per-user, per-estate, per-org), heartbeat, graceful disconnect, Cloud Run sticky sessions configuration | P1 | L | Fullstack | DONE |
| 5.2.4 | Build notification dispatch service — orchestrate GOV.UK Notify email/SMS (API key integration), in-app WebSocket push, notification queue (Firestore-based), delivery tracking, retry logic (3 retries with backoff), notification preferences enforcement | P1 | L | Fullstack | DONE |
| 5.2.5 | Implement circuit breaker pattern for external API resilience — per-source failure tracking, state machine (closed/open/half-open), configurable thresholds (5 failures to open, 60s half-open), fallback activation, metrics integration, admin dashboard visibility | P2 | M | Fullstack | DONE |
| 5.2.6 | Add cache warming service — scheduled pre-fetch for frequently accessed estate data (weather, crime, demographics), Cloud Scheduler trigger (every 2 hours for weather, daily for crime), background job runner with Firestore lock to prevent duplicates | P2 | M | Fullstack | DONE |
| 5.2.7 | Build scheduled task runner (Cloud Scheduler / cron) — compliance reminders (30/14/7 days before certificate expiry), daily briefing pre-computation, weekly TSM metric refresh, monthly regulatory report generation, arrears escalation triggers | P2 | M | Fullstack | DONE |
| 5.2.8 | Implement Firestore real-time listeners for case updates — server-side onSnapshot subscriptions on cases collection, change detection (status transitions, SLA breaches), WebSocket broadcast to connected clients, optimistic locking for concurrent edits | P2 | M | Fullstack | DONE |
| 5.2.9 | Add bulk operations API — batch case status updates (bulk close resolved repairs), bulk communication send (all tenants in estate), batch compliance certificate upload, batch arrears action (PAP letters), progress tracking via WebSocket | P2 | M | Fullstack | DONE |
| 5.2.10 | Build audit log query API — filtering by entity/user/action/date range, full-text search, pagination, CSV export for GDPR SAR requests, aggregation queries (actions per user per day), retention policy enforcement (auto-delete after 7 years) | P2 | M | Fullstack | DONE |
| 5.2.11 | Implement AI communication drafting with Vertex AI — replace rule-based template drafts with LLM-generated personalised emails, tone selection (supportive/formal/urgent/legal), legal compliance check against Housing Ombudsman Code, template suggestion based on case context | P1 | L | Fullstack | DONE |
| 5.2.12 | Add tenant activity scoring — calculate contact frequency, case history patterns, payment behaviour, engagement score (0-100), correlation with vulnerability score, proactive outreach triggers for disengaged tenants | P2 | M | Fullstack | DONE |
| 5.2.13 | Implement real-time Awaab's Law compliance engine — automatic deadline calculation on damp/mould case creation, SLA breach detection with automatic escalation, proactive notification chain (tenant, officer, manager, regulator), compliance audit trail | P1 | L | Fullstack | DONE |
| 5.2.14 | Build AI-powered repair intake service — free-text description analysis with Vertex AI, automatic SOR code suggestion, priority assignment, trade identification, asbestos flag check, recurring pattern detection, cost estimation, Awaab's Law flag | P2 | L | Fullstack | DONE |
| 5.2.15 | Build file upload service — photo attachment for repairs (before/after), document uploads for compliance certificates, tenant document storage, Cloud Storage integration, image resize/compression, virus scanning, presigned URLs for secure access | P2 | M | Fullstack | DONE |
| 5.2.16 | Implement GDPR data export pipeline — automated SAR request processing, tenant data collation across all collections, PII redaction for non-subject data, PDF generation with cover letter, right-to-erasure cascade across collections | P2 | M | Fullstack | DONE |

---

### PHASE 5.3: FRONTEND DEVELOPMENT (Sprints 11-12)

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 5.3.1 | Build Yantra Assist conversational UI — chat panel with streaming text display (SSE), message history with Firestore persistence, context indicator showing current entity, typing animation, copy/share responses, suggested follow-up questions, markdown rendering | P1 | L | Frontend | DONE |
| 5.3.2 | Implement real-time notification bell with WebSocket — notification dropdown in header, unread count badge (animated), mark-as-read on click, notification categories (case/compliance/arrears/system), click-to-navigate to source entity, sound alert option | P1 | M | Frontend | DONE |
| 5.3.3 | Build notification preferences page — per-channel toggles (email/SMS/in-app/portal), frequency settings (immediate/daily digest/weekly summary), category subscriptions (repairs/complaints/compliance/arrears/ASB), quiet hours configuration | P2 | M | Frontend | DONE |
| 5.3.4 | Add interactive chart drill-downs — clickable chart elements on dashboard drill into filtered list views (click repair bar -> filtered repairs list), Recharts onClick handlers, breadcrumb-aware navigation, chart-to-table transition animation | P2 | M | Frontend | DONE |
| 5.3.5 | Build workflow builder UI — visual drag-and-drop for admin workflow engine, trigger selection (case created, SLA approaching, arrears threshold), condition builder (if type=repair AND priority=emergency), action configuration (send email, create task, assign case), flow preview and test mode | P2 | XL | Frontend | DONE |
| 5.3.6 | Implement dark/light theme toggle — Tailwind CSS custom property swap, system preference detection (prefers-color-scheme), manual override with localStorage persistence, smooth 300ms transition animation, ensure all 40+ pages render correctly in both modes | P3 | M | Frontend | DONE |
| 5.3.7 | Add progressive loading and performance optimisation — React.lazy() + Suspense boundaries on heavy pages (Explore 3D, AI Centre), skeleton screens matching page layout, intersection observer for below-fold content, image lazy loading, route-level code splitting | P2 | M | Frontend | DONE |
| 5.3.8 | Build mobile-responsive layout adaptations — collapsible sidebar (hamburger menu on tablet/mobile), stacked KPI cards on mobile, touch-friendly map controls (pinch zoom), responsive data tables (horizontal scroll or card view), bottom navigation bar on mobile | P2 | L | Frontend | DONE |
| 5.3.9 | Add real-time case status indicators — WebSocket-driven StatusPill components that update live without page refresh, optimistic UI updates on case actions, conflict resolution for concurrent edits (last-write-wins with notification), case lock indicator when another user is editing | P2 | M | Frontend | DONE |
| 5.3.10 | Build tenant portal enhancements — responsive design for mobile-first tenant access, repair wizard (step-by-step with photo upload), rent balance check with payment history chart, document viewer (tenancy agreement, gas cert), accessibility improvements for diverse user base | P2 | L | Frontend | DONE |
| 5.3.11 | Build admin user management page — CRUD for user accounts, role assignment from 10 predefined roles, team assignment, patch allocation, bulk import from CSV, password reset, account deactivation, last login tracking, session management | P2 | M | Frontend | DONE |
| 5.3.12 | Build GDPR compliance dashboard — SAR request tracker (received/processing/complete), data retention policy viewer, consent management interface, Data Processing Register view, right-to-erasure request workflow, export audit trail | P2 | M | Frontend | DONE |

---

### PHASE 5.4: TESTING & QA (Sprints 12-13)

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 5.4.1 | Build comprehensive Selenium regression suite covering all 40+ routes — page load verification, CRUD operations on cases/tenants/properties, navigation flows (sidebar, breadcrumbs, search), error states (network failure, auth expiry), screenshot on failure | P1 | XL | Tester | DONE |
| 5.4.2 | Write unit tests for all 7 AI services — damp-prediction.ts (5-factor edge cases), crime-context.ts (data correlation), vulnerability-detection.ts (7-factor scoring boundaries), benefits-engine.ts (UK benefit rules), property-passport.ts (aggregation), neighbourhood-briefing.ts (multi-source), govuk-notify.ts (template rendering) | P1 | L | Tester | DONE |
| 5.4.3 | Write integration tests for external API proxy routes — mock HTTP servers for Police.uk/Open-Meteo/DEFRA/NOMIS, test cache-through pattern (cache miss -> API call -> cache hit), verify fallback behaviour on timeout/error, test rate limiting enforcement | P1 | L | Tester | DONE |
| 5.4.4 | Perform load testing — Artillery or k6 scripts for 100 concurrent users, measure P95 latency across key endpoints (properties list, case detail, AI damp risk), identify bottlenecks (Firestore query limits, external API rate limits), test Cloud Run auto-scaling (0 -> 10 instances) | P2 | M | Tester | DONE |
| 5.4.5 | Perform accessibility audit — aXe or Lighthouse automated scan on all 40+ pages, fix all critical/serious violations, achieve >90 Lighthouse accessibility score, test with screen reader (NVDA/VoiceOver), keyboard-only navigation test for all workflows | P2 | M | Tester | DONE |
| 5.4.6 | Set up CI test pipeline — GitHub Actions workflow running TypeScript check + unit tests + integration tests on every PR, Cloud Build step for E2E tests on staging, test report generation (JUnit XML), code coverage reporting, fail-on-error with status checks | P1 | M | Tester | DONE |
| 5.4.7 | Create test data factory — parameterised builder functions for all entity types (createProperty(), createTenant(), createCase()), consistent seed data for test isolation, Firestore emulator integration for local testing, cleanup utilities | P2 | M | Tester | DONE |
| 5.4.8 | Security testing — OWASP Top 10 verification, SQL injection prevention (N/A for Firestore but verify query construction), XSS testing on all input fields, CSRF token verification, authentication bypass testing, rate limit bypass testing, CSP violation testing | P1 | M | Tester | DONE |

---

### PHASE 5.5: DEVOPS & DEPLOYMENT (Sprints 13-14)

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 5.5.1 | Fix cloudbuild.yaml to use correct Artifact Registry path (`cloud-run-source-deploy/socialhomes`) — update image tag, add multi-stage build steps, add test step before deploy, add build notifications to Telegram, version tagging with git SHA | P1 | S | DevOps | DONE |
| 5.5.2 | Set up staging environment on Cloud Run — separate service (`socialhomes-staging`), separate secrets (staging Firebase project), deploy-on-PR workflow, automatic cleanup of old revisions, staging URL for QA testing, environment variable differentiation | P1 | M | DevOps | TODO |
| 5.5.3 | Configure Cloud Run auto-scaling policies — CPU utilisation target (70%), memory threshold, request latency trigger (P95 > 500ms -> scale up), min instances (1 for production to avoid cold start), max instances (10), concurrency tuning (80 -> optimal), startup probe and liveness check | P2 | M | DevOps | TODO |
| 5.5.4 | Set up Cloud Monitoring alerts — error rate >5% alert, P95 latency >1s alert, memory >80% alert, Firestore read/write quota >80% warning, failed health check alert, notification channels (email + Telegram), alert dashboard in Cloud Console | P1 | M | DevOps | TODO |
| 5.5.5 | Implement database backup strategy — Firestore scheduled exports to Cloud Storage (daily at 02:00 UTC), retention policy (30 days daily, 12 months weekly), point-in-time recovery testing, restore procedure documentation, backup monitoring alert | P1 | M | DevOps | TODO |
| 5.5.6 | Set up Cloud CDN for static assets — frontend build output served via CDN edge nodes, cache-control headers (max-age=31536000 for hashed assets, no-cache for index.html), invalidation on deploy, compression (brotli/gzip), performance benchmarking | P2 | M | DevOps | TODO |
| 5.5.7 | Configure custom domain with SSL — socialhomes.ai domain, Cloud Run domain mapping, managed SSL certificate via Google-managed, HTTP->HTTPS redirect, www->non-www redirect, DNS configuration documentation | P2 | S | DevOps | TODO |
| 5.5.8 | Create runbook documentation — incident response procedures (severity levels, escalation matrix), rollback process (Cloud Run revision rollback), database recovery (Firestore import), secret rotation procedure, scaling playbook, on-call guide, post-mortem template | P2 | M | DevOps | TODO |
| 5.5.9 | Set up log-based monitoring — Cloud Logging structured query for error patterns, log-based metrics (4xx rate, 5xx rate, auth failures), log sink to BigQuery for long-term analysis, correlation with request IDs, PII filtering in logs | P2 | M | DevOps | TODO |

---

## AGENT ROLES

| Agent | Responsibility | Key Files |
|-------|---------------|-----------|
| **BA** | Requirements, specification docs, user stories, API reference | `docs/requirements/`, `Doc1-*.txt`, `Doc2-*.txt`, `Doc3-*.txt` |
| **Fullstack** | Server routes, API integrations, data models, Firestore, AI services | `server/src/routes/`, `server/src/services/`, `server/src/models/` |
| **Frontend** | UI components, pages, state management, styling, accessibility | `app/src/pages/`, `app/src/components/`, `app/src/hooks/` |
| **Tester** | Selenium E2E, unit tests, integration tests, load tests, a11y audits | `tests/`, `server/src/routes/*.test.ts` |
| **DevOps** | CI/CD, monitoring, security, infrastructure, scaling, backups | `cloudbuild.yaml`, `Dockerfile`, `DEVOPS.md` |

---

## KEY DOCUMENTS

| Document | Location | Purpose |
|----------|----------|---------|
| Doc1-socialhomes-Base-Specification.txt | `docs/requirements/` | Core product specification (v7.0) |
| Doc2-socialhomes-Technical-Architecture.txt | `docs/requirements/` | Technical architecture & data models (v7.0) |
| Doc3-socialhomes-API-Requirements.txt | `docs/requirements/` | API endpoints & integration requirements (v7.0) |
| Doc1-SocialHomesAi-Base-Specification.txt | Project root | Original base specification |
| Doc2-SocialHomesAi-AI-Native-Features.txt | Project root | Original AI features specification |
| Doc3-Public-API-Integration-Requirements.txt | Project root | Original public API requirements (2,333 lines) |
| Doc4-UI-UX-Audit-Build-Guide.md | Project root | Frontend UI/UX audit + build guide |
| CLAUDE.md | Project root | Claude Code project instructions |
| SESSION-HISTORY.md | Project root | Persistent conversation history |
| DEV-FIX-LIST.md | Project root | Bug/warning tracker from Selenium tests |
| DEVOPS.md | Project root | DevOps and deployment guide |
| EXECUTION-PLAN.md | Project root | This document |

---

## COMMUNICATION

### Telegram (@SocialHomesBot)
- **Async notifications**: Build status, deployment confirmations, test results
- **Permission requests**: Routed via Telegram when user is away from desk
- **Progress updates**: Phase/sprint completion summaries
- **MCP config**: `.mcp.json` (not committed — contains bot token)

### Session Continuity
- Update `SESSION-HISTORY.md` at end of every session
- `CLAUDE.md` provides context for new sessions
- Entire.io captures checkpoints on commits

---

## METRICS & SUCCESS CRITERIA

| Metric | Target | Current |
|--------|--------|---------|
| Selenium test pass rate | > 98% | 99.7% |
| TypeScript errors | 0 | 0 |
| Vite build warnings | 0 critical | 0 |
| API response time (P95) | < 500ms | ~200-300ms |
| WCAG AA compliance | 100% | 100% |
| External API uptime | > 99.5% (with fallback) | 100% |
| Bundle size | < 3MB | ~2.5MB |
| Cloud Run cold start | < 3s | < 2s |

### Phase 5 Additional Targets

| Metric | Target |
|--------|--------|
| AI response latency (Vertex AI) | < 3s for conversational queries |
| AI response latency (streaming first token) | < 500ms |
| WebSocket connection stability | > 99.9% uptime |
| Load test (100 concurrent users) | P95 < 1s, 0 errors |
| Selenium test coverage | > 95% of routes |
| Unit test coverage (services) | > 80% line coverage | 99 tests, 7/7 services |
| Staging deployment frequency | Every PR |
| Database backup frequency | Daily automated |
| Lighthouse accessibility score | > 90 on all pages |
| Lighthouse performance score | > 80 on all pages |

---

## DEFERRED ITEMS (From Phases 3-4)

Items deferred from earlier phases, now included in Phase 5:

| Original ID | Task | New Phase 5 ID |
|-------------|------|----------------|
| 3.17 | E2E testing for all new features | 5.4.1 |
| 4.12 | Full regression test suite | 5.4.1 |
| 4.13 | Load testing (100 concurrent users) | 5.4.4 |
| 4.14 | API reference documentation | 5.1.7 |
| 4.9 | Cache warming, batch updates | 5.2.6 |

---

## PHASE 5 TASK SUMMARY BY AGENT

| Agent | Total Tasks | P0 | P1 | P2 | P3 |
|-------|-------------|----|----|----|----|
| **BA** | 3 | 2 (DONE) | 0 | 1 | 0 |
| **Fullstack** | 23 | 0 | 8 | 15 | 0 |
| **Frontend** | 12 (ALL DONE) | 0 | 2 | 9 | 1 |
| **Tester** | 8 (ALL DONE) | 0 | 4 | 4 | 0 |
| **DevOps** | 9 | 0 | 3 | 6 | 0 |
| **TOTAL** | **50** (DONE: 45, TODO: 5) |

### Recommended Execution Order (Critical Path)

**Sprint 9 (Weeks 17-18): Architecture + Backend Foundation**
1. 5.1.3 -> 5.2.1 -> 5.2.2 (Vertex AI architecture -> implementation -> prompts)
2. 5.1.4 -> 5.2.3 (WebSocket design -> implementation)
3. 5.5.1 (Fix cloudbuild.yaml — DONE)
4. 5.1.8 (Firestore migration strategy — enables schema evolution)

**Sprint 10 (Weeks 19-20): Backend Features**
5. 5.2.4 (Notification dispatch — depends on WebSocket + GOV.UK Notify)
6. 5.2.11 (AI communication drafting — depends on Vertex AI)
7. 5.2.13 (Awaab's Law compliance engine — regulatory priority)
8. 5.2.5, 5.2.6, 5.2.7 (Resilience features — parallel)

**Sprint 11 (Weeks 21-22): Backend Complete + Frontend Start**
9. 5.2.8, 5.2.9, 5.2.10, 5.2.12, 5.2.14 (Remaining backend — parallel)
10. 5.2.15, 5.2.16 (File upload + GDPR pipeline)
11. 5.3.1 (Yantra Assist chat UI — depends on Vertex AI backend)
12. 5.3.2 (Notification bell — depends on WebSocket backend)
13. 5.5.2 (Staging environment — enables test pipeline)

**Sprint 12 (Weeks 23-24): Frontend + Testing Start**
14. 5.3.3-5.3.12 (Remaining frontend features — parallel)
15. 5.4.1 (Selenium regression suite — can begin once features stabilise)
16. 5.4.6 (CI test pipeline — enables automated testing)
17. 5.4.7 (Test data factory — enables isolated testing)

**Sprint 13 (Weeks 25-26): Testing + QA**
18. 5.4.2-5.4.5 (Unit, integration, load, accessibility tests — parallel)
19. 5.4.8 (Security testing)
20. 5.5.4 (Cloud Monitoring alerts)
21. 5.5.5 (Database backup strategy)

**Sprint 14 (Weeks 27-28): DevOps + Polish**
22. 5.5.3, 5.5.6, 5.5.7 (Scaling, CDN, custom domain — parallel)
23. 5.5.8, 5.5.9 (Runbook, log monitoring)
24. 5.1.7 (API documentation — after all endpoints stable)
25. 5.1.5, 5.1.6, 5.1.9 (Advanced architecture — parallel)
26. Final regression testing and production deploy

---

## DEPENDENCY GRAPH (Key Chains)

```
Vertex AI Chain:
  5.1.3 (architecture) -> 5.2.1 (SDK integration) -> 5.2.2 (prompts)
    -> 5.2.11 (AI drafting) -> 5.3.1 (chat UI)
    -> 5.2.14 (AI repair intake)

WebSocket Chain:
  5.1.4 (architecture) -> 5.2.3 (Socket.io server) -> 5.2.4 (notifications)
    -> 5.3.2 (notification bell) -> 5.3.9 (real-time status)
    -> 5.2.8 (Firestore listeners)

Testing Chain:
  5.5.2 (staging env) -> 5.4.6 (CI pipeline) -> 5.4.7 (test factory)
    -> 5.4.1 (Selenium) + 5.4.2 (unit) + 5.4.3 (integration)

DevOps Chain:
  5.5.1 (cloudbuild fix — DONE) -> 5.5.2 (staging) -> 5.5.4 (monitoring)
    -> 5.5.5 (backups) -> 5.5.7 (custom domain)

File/Data Chain:
  5.2.15 (file upload) -> 5.3.10 (tenant portal photos)
  5.2.16 (GDPR pipeline) -> 5.3.12 (GDPR dashboard)
  5.2.10 (audit log API) -> 5.3.11 (user management)
```

---

**Plan Version 7.0 | Updated by BA Agent (Claude Opus 4.6) | Yantra Works | 2026-02-26**
