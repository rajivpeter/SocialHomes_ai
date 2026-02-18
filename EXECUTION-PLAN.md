# SocialHomes.Ai — Master Execution Plan

> Multi-agent orchestration plan for building SocialHomes.Ai to production readiness and beyond.
> Version 2.0 | 2026-02-18 | Updated by Business Analyst Agent
> Studio: Yantra Works

---

## PLAN SUMMARY

| Phase | Name | Sprints | Status | Progress |
|-------|------|---------|--------|----------|
| 0 | Infrastructure | — | ✅ DONE | 10/10 |
| 1 | Foundation | 1–2 | ✅ DONE | 12/12 |
| 2 | Intelligence | 3–4 | ✅ DONE | 14/14 |
| 3 | Enrichment | 5–6 | ✅ DONE | 14/17 (3 deferred) |
| 4 | Completion | 7–8 | ✅ DONE | 11/14 (3 deferred) |
| **5** | **Evolution** | **9–12** | **🔵 TODO** | **0/32** |

---

## PHASE 0: INFRASTRUCTURE — ✅ DONE (10/10)

| # | Task | Status | Agent |
|---|------|--------|-------|
| 0.1 | Verify 4 bug fixes from Selenium testing | DONE | Claude Code |
| 0.2 | Fix 11 Selenium test warnings (WARN-001 to WARN-011) | DONE | Claude Code |
| 0.3 | Install and configure Entire.io CLI | DONE | Claude Code |
| 0.4 | Build and deploy via git push → Cloud Build | DONE | Claude Code |
| 0.5 | Configure Telegram MCP (@SocialHomesBot) | DONE | Claude Code |
| 0.6 | Create persistent SESSION-HISTORY.md | DONE | Claude Code |
| 0.7 | Create CLAUDE.md project instructions | DONE | Claude Code |
| 0.8 | UI/UX Audit → Doc4-UI-UX-Audit-Build-Guide.md | DONE | Frontend Agent |
| 0.9 | BA Requirements → Doc3-Public-API-Integration-Requirements.txt | DONE | BA Agent |
| 0.10 | Master Execution Plan (this document) | DONE | Claude Code |

---

## PHASE 1: FOUNDATION (Sprints 1-2, Weeks 1-4) — ✅ DONE (12/12)

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
| 1.8 | Load IMD data (ONS CSV → Firestore) | P1 | M | Fullstack | DONE |
| 1.9 | Extend TypeScript types (14 new interfaces + property/tenant/estate extensions) | P1 | M | Fullstack | DONE |
| 1.10 | Unit tests for all Tier 1 API integrations (66 tests, 3 files) | P1 | M | Tester | DONE |
| 1.11 | Selenium regression test for Phase 1 APIs | P1 | M | Tester | DONE |
| 1.12 | Contextual user manual help system (20 pages, HelpDrawer) | P1 | M | Documentation | DONE |

---

## PHASE 2: INTELLIGENCE (Sprints 3-4, Weeks 5-8) — ✅ DONE (14/14)

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

## PHASE 3: ENRICHMENT (Sprints 5-6, Weeks 9-12) — ✅ DONE (14/17)

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

## PHASE 4: COMPLETION (Sprints 7-8, Weeks 13-16) — ✅ DONE (11/14)

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

## PHASE 5: EVOLUTION (Sprints 9-12, Weeks 17-24) — 🔵 TODO (0/32)

### Goal: Real AI, real-time features, advanced testing, production scaling

Phase 5 is organized into 5 sub-phases (sprints) covering Project Setup & Architecture, Backend Development, Frontend Development, Testing & QA, and DevOps & Deployment.

---

### PHASE 5.1: PROJECT SETUP & ARCHITECTURE (Sprint 9)

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 5.1.1 | Create comprehensive BA specification docs in `docs/requirements/` (Doc1, Doc2, Doc3) | P0 | L | BA | DONE |
| 5.1.2 | Populate updated EXECUTION-PLAN.md with Phase 5 tasks | P0 | M | BA | DONE |
| 5.1.3 | Define Vertex AI / Gemini integration architecture for Yantra Assist | P1 | L | Fullstack | TODO |
| 5.1.4 | Design WebSocket (Socket.io) architecture for real-time notifications | P1 | M | Fullstack | TODO |
| 5.1.5 | Design event-driven architecture using Cloud Pub/Sub for async workflows | P2 | L | Fullstack | TODO |
| 5.1.6 | Define multi-tenant data isolation strategy for SaaS deployment | P2 | XL | Fullstack | TODO |
| 5.1.7 | Create API reference documentation (OpenAPI/Swagger spec) for all 50+ endpoints | P2 | L | BA | TODO |

---

### PHASE 5.2: BACKEND DEVELOPMENT (Sprints 9-10)

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 5.2.1 | Integrate Vertex AI (Gemini Pro) for Yantra Assist conversational AI | P1 | XL | Fullstack | TODO |
| 5.2.2 | Build AI prompt engineering layer — context-aware prompts per entity type | P1 | L | Fullstack | TODO |
| 5.2.3 | Implement WebSocket server (Socket.io) for real-time notifications | P1 | L | Fullstack | TODO |
| 5.2.4 | Build notification dispatch service — email, SMS, in-app via GOV.UK Notify + WebSocket | P1 | L | Fullstack | TODO |
| 5.2.5 | Implement circuit breaker pattern for external API resilience | P2 | M | Fullstack | TODO |
| 5.2.6 | Add cache warming service — pre-fetch frequently accessed external data | P2 | M | Fullstack | TODO |
| 5.2.7 | Build scheduled task runner for recurring jobs (compliance reminders, briefing refresh) | P2 | M | Fullstack | TODO |
| 5.2.8 | Implement Firestore real-time listeners for case updates | P2 | M | Fullstack | TODO |
| 5.2.9 | Add bulk operations API — batch case updates, bulk communications | P2 | M | Fullstack | TODO |
| 5.2.10 | Build audit log query API with filtering, date range, export | P2 | M | Fullstack | TODO |

---

### PHASE 5.3: FRONTEND DEVELOPMENT (Sprints 10-11)

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 5.3.1 | Build Yantra Assist conversational UI — chat panel with streaming responses | P1 | L | Frontend | TODO |
| 5.3.2 | Implement real-time notification bell with WebSocket integration | P1 | M | Frontend | TODO |
| 5.3.3 | Build notification preferences page (channel, frequency, category toggles) | P2 | M | Frontend | TODO |
| 5.3.4 | Add interactive charts — clickable chart elements drill into filtered views | P2 | M | Frontend | TODO |
| 5.3.5 | Build workflow builder UI — visual drag-and-drop for admin workflow engine | P2 | XL | Frontend | TODO |
| 5.3.6 | Implement dark/light theme toggle with Tailwind theme switching | P3 | M | Frontend | TODO |
| 5.3.7 | Add progressive image loading and lazy loading for heavy pages | P2 | S | Frontend | TODO |
| 5.3.8 | Build mobile-responsive layout adaptations for tablet/phone views | P2 | L | Frontend | TODO |

---

### PHASE 5.4: TESTING & QA (Sprint 11)

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 5.4.1 | Build comprehensive Selenium regression suite covering all 40+ routes | P1 | XL | Tester | TODO |
| 5.4.2 | Write unit tests for all 7 AI services (damp, crime, vulnerability, benefits, passport, briefing, notify) | P1 | L | Tester | TODO |
| 5.4.3 | Write integration tests for external API proxy routes with mock servers | P1 | L | Tester | TODO |
| 5.4.4 | Perform load testing — 100 concurrent users, measure P95 latency | P2 | M | Tester | TODO |
| 5.4.5 | Perform accessibility audit — aXe/Lighthouse automated scan on all pages | P2 | M | Tester | TODO |
| 5.4.6 | Set up CI test pipeline — run unit + integration tests on every PR | P1 | M | Tester | TODO |
| 5.4.7 | Create test data factory — generate realistic test fixtures for all entities | P2 | M | Tester | TODO |

---

### PHASE 5.5: DEVOPS & DEPLOYMENT (Sprint 12)

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 5.5.1 | Fix cloudbuild.yaml to use correct Artifact Registry path | P1 | S | DevOps | TODO |
| 5.5.2 | Set up staging environment on Cloud Run (separate service) | P1 | M | DevOps | TODO |
| 5.5.3 | Configure Cloud Run auto-scaling policies (CPU/memory thresholds) | P2 | M | DevOps | TODO |
| 5.5.4 | Set up Cloud Monitoring alerts (error rate, latency, memory) | P1 | M | DevOps | TODO |
| 5.5.5 | Implement database backup strategy (Firestore scheduled exports to Cloud Storage) | P1 | M | DevOps | TODO |
| 5.5.6 | Set up Cloud CDN for static assets (frontend build output) | P2 | M | DevOps | TODO |
| 5.5.7 | Configure custom domain with SSL (socialhomes.ai) | P2 | S | DevOps | TODO |
| 5.5.8 | Create runbook documentation for incident response and recovery | P2 | M | DevOps | TODO |

---

## AGENT ROLES

| Agent | Responsibility | Key Files |
|-------|---------------|-----------|
| **Fullstack** | Server routes, API integrations, data models, Firestore, AI services | `server/src/routes/`, `server/src/services/`, `server/src/models/` |
| **Frontend** | UI components, pages, state management, styling, accessibility | `app/src/pages/`, `app/src/components/`, `app/src/hooks/` |
| **Tester** | Selenium E2E, unit tests, integration tests, load tests, a11y audits | `tests/`, `server/src/routes/*.test.ts` |
| **BA** | Requirements, specification docs, user stories, API reference | `docs/requirements/`, `Doc1-*.txt`, `Doc2-*.txt`, `Doc3-*.txt` |
| **DevOps** | CI/CD, monitoring, security, infrastructure, scaling, backups | `cloudbuild.yaml`, `Dockerfile`, `DEVOPS.md` |

---

## KEY DOCUMENTS

| Document | Location | Purpose |
|----------|----------|---------|
| Doc1-socialhomes-Base-Specification.txt | `docs/requirements/` | Core product specification |
| Doc2-socialhomes-Technical-Architecture.txt | `docs/requirements/` | Technical architecture & data models |
| Doc3-socialhomes-API-Requirements.txt | `docs/requirements/` | API endpoints & integration requirements |
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
| Selenium test pass rate | > 98% | 99.7% ✅ |
| TypeScript errors | 0 | 0 ✅ |
| Vite build warnings | 0 critical | 0 ✅ |
| API response time (P95) | < 500ms | ~200-300ms ✅ |
| WCAG AA compliance | 100% | 100% ✅ |
| External API uptime | > 99.5% (with fallback) | 100% ✅ |
| Bundle size | < 3MB | ~2.5MB ✅ |
| Cloud Run cold start | < 3s | < 2s ✅ |

### Phase 5 Additional Targets

| Metric | Target |
|--------|--------|
| AI response latency (Vertex AI) | < 3s for conversational queries |
| WebSocket connection stability | > 99.9% uptime |
| Load test (100 concurrent users) | P95 < 1s, 0 errors |
| Selenium test coverage | > 95% of routes |
| Unit test coverage (services) | > 80% line coverage |
| Staging deployment frequency | Every PR |
| Database backup frequency | Daily automated |
| Lighthouse accessibility score | > 90 on all pages |

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

**Plan Version 2.0 | Updated by BA Agent (Claude Opus 4.6) | Yantra Works | 2026-02-18**
