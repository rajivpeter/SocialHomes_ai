# SocialHomes.Ai — Master Execution Plan

> Multi-agent orchestration plan for building SocialHomes.Ai to production readiness.
> Version 1.0 | 2026-02-14

---

## PHASE 0: INFRASTRUCTURE (Current Session — Complete)

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

## PHASE 1: FOUNDATION (Sprints 1-2, Weeks 1-4)

### Goal: Core external API infrastructure + free API integrations

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 1.1 | Create `server/src/services/external-api.ts` — shared caching, rate limiting, audit logging | P1 | Medium | Fullstack | DONE |
| 1.2 | Create `externalDataCache` Firestore collection + TTL management | P1 | Medium | Fullstack | DONE |
| 1.3 | Integrate postcodes.io — postcode lookup, LSOA, lat/long | P1 | Low | Fullstack | DONE |
| 1.4 | Integrate Open UPRN (uprn.uk) — UPRN lookup | P1 | Low | Fullstack | DONE |
| 1.5 | Integrate data.police.uk — street-level crime, ASB data | P1 | Medium | Fullstack | DONE |
| 1.6 | Integrate Open-Meteo API — enhanced weather (hourly + historical) | P1 | Low | Fullstack | DONE |
| 1.7 | Integrate DEFRA Flood Risk API — flood warnings per property | P1 | Low | Fullstack | DONE |
| 1.8 | Load IMD data (ONS CSV → Firestore) | P1 | Medium | Fullstack | DONE |
| 1.9 | Extend TypeScript types (14 new interfaces + property/tenant/estate extensions) | P1 | Medium | Fullstack | DONE |
| 1.10 | Unit tests for all Tier 1 API integrations (66 tests, 3 files) | P1 | Medium | Tester | DONE |
| 1.11 | Selenium regression test for Phase 1 APIs | P1 | Medium | Tester | DONE |
| 1.12 | Contextual user manual help system (20 pages, HelpDrawer) | P1 | Medium | Documentation | DONE |

### Deliverables:
- All Tier 1 (free, no-key) APIs live with real data
- Firestore cache layer operational
- Data model extended for external sources
- Crime heatmap visible on Explore page

---

## PHASE 2: INTELLIGENCE (Sprints 3-4, Weeks 5-8) — DONE

### Goal: 7 killer differentiators + Tier 2 API registrations

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 2.1 | **Predictive Damp Intelligence** — 5-factor weighted algorithm | P1 | High | Fullstack | DONE |
| 2.2 | **Live Crime Context for ASB** — police data correlation | P1 | High | Fullstack | DONE |
| 2.3 | **Automatic Vulnerability Detection** — 7-factor scoring | P1 | High | Fullstack | DONE |
| 2.4 | **Property Passport** — multi-source aggregation | P1 | High | Fullstack | DONE |
| 2.5 | **Benefits Entitlement Engine** — UK benefit rules analysis | P1 | High | Fullstack | DONE |
| 2.6 | **AI Neighbourhood Briefing** — per-estate daily intelligence | P1 | High | Fullstack | DONE |
| 2.7 | Create DWP Universal Credit mock endpoints | P2 | Medium | Fullstack | DONE |
| 2.8 | Create IoT sensor mock endpoints (Switchee/Aico) | P2 | Medium | Fullstack | DONE |
| 2.9 | Create GoCardless direct debit mock endpoints | P2 | Medium | Fullstack | DONE |
| 2.10 | Create NOMIS labour market mock endpoints | P2 | Medium | Fullstack | DONE |
| 2.11 | Frontend: Damp Intelligence panel on property detail | P1 | Medium | Frontend | DONE |
| 2.12 | Frontend: Vulnerability + Benefits panels on tenant detail | P1 | Medium | Frontend | DONE |
| 2.13 | Frontend: AI Centre Differentiators hub with scan | P1 | High | Frontend | DONE |
| 2.14 | Frontend: Neighbourhood Briefing panel component | P1 | Medium | Frontend | DONE |

### Deliverables:
- All 6 differentiators live with API routes and frontend panels
- Mock endpoints ready for DWP UC, IoT, GoCardless, NOMIS
- AI Centre Differentiators tab shows all 6 features + vulnerability scan
- TypeScript compiles clean, both builds pass

---

## PHASE 3: ENRICHMENT (Sprints 5-6, Weeks 9-12) — DONE

### Goal: Remaining differentiators + Tier 2 APIs + enhanced UI

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 3.1 | **Benefits Entitlement Engine** — NOMIS + IMD + household | P2 | High | Fullstack | DONE (via NOMIS integration) |
| 3.2 | **AI Neighbourhood Briefing** — per-estate weekly briefing | P1 | High | Fullstack | DONE |
| 3.3 | **GOV.UK Notify templates** — full template library (24 templates, 7 categories) | P1 | Medium | Fullstack | DONE |
| 3.4 | Register and integrate Met Office DataHub | P2 | Medium | Fullstack | DEFERRED (Open-Meteo sufficient) |
| 3.5 | Integrate Census 2021 API (ONS via NOMIS) | P2 | Medium | Fullstack | DONE |
| 3.6 | Integrate NOMIS API — labour market stats | P2 | Medium | Fullstack | DONE |
| 3.7 | Register OS Places/Maps API (PSGA) | P2 | Medium | Fullstack | DEFERRED (OSM tiles sufficient) |
| 3.8 | Integrate Gas Safe Register | P2 | Low | Fullstack | DONE |
| 3.9 | Integrate Electrical Safety Register | P2 | Low | Fullstack | DONE |
| 3.10 | Integrate Twilio (free tier) | P2 | Medium | Fullstack | DEFERRED (GOV.UK Notify preferred) |
| 3.11 | Frontend: Benefits check card on tenant detail | P2 | Medium | Frontend | DONE (Phase 2) |
| 3.12 | Frontend: Neighbourhood briefing accordion on briefing page | P1 | Medium | Frontend | DONE |
| 3.13 | Frontend: Enhanced Explore map with data layer toggles | P2 | Medium | Frontend | DONE |
| 3.14 | Frontend: Contractor verification badges (Gas Safe + NICEIC) | P2 | Low | Frontend | DONE |
| 3.15 | Fix accessibility gaps (focus traps, skip links, ARIA, motion) | P2 | Medium | Frontend | DONE |
| 3.16 | Fix form validation across ActionModal | P2 | Medium | Frontend | DONE |
| 3.17 | E2E testing for all new features | P1 | High | Tester | DEFERRED to Phase 4 |

### Deliverables:
- All 7 differentiators live
- Tier 2 APIs integrated (Census, NOMIS, Gas Safe, Electrical Safety)
- Full GOV.UK Notify template library (24 templates, 7 categories)
- WCAG AA accessibility fixes (focus traps, skip links, reduced motion, ARIA)
- Form validation with inline errors on ActionModal
- Contractor verification badges on repair detail
- Data layer toggles (Crime/Damp/Compliance) on Explore map

---

## PHASE 4: COMPLETION (Sprints 7-8, Weeks 13-16) — DONE

### Goal: Mock services + polish + production hardening

| # | Task | Priority | Complexity | Agent | Status |
|---|------|----------|------------|-------|--------|
| 4.1 | GoCardless/Allpay mock payment endpoints | P3 | Medium | Fullstack | DONE (Phase 2) |
| 4.2 | Plentific/Fixflo mock repairs marketplace | P3 | Medium | Fullstack | DONE |
| 4.3 | RSH/CORE/Ombudsman mock regulatory submissions | P3 | Medium | Fullstack | DONE |
| 4.4 | DocuSign mock digital signing | P3 | Medium | Fullstack | DONE |
| 4.5 | Experian/TransUnion mock referencing | P3 | Medium | Fullstack | DONE |
| 4.6 | Land Registry data integration | P3 | Low | Fullstack | DONE |
| 4.7 | Admin: Integration management dashboard (20 integrations, 3 tiers) | P2 | Medium | Frontend | DONE |
| 4.8 | Admin: Toggle integrations on/off + test connection | P2 | Low | Frontend | DONE |
| 4.9 | Performance: Cache warming, batch updates | P2 | Medium | Fullstack | DEFERRED (cache-through sufficient) |
| 4.10 | Security audit (CSP, CORS, rate limiting, security headers) | P1 | Medium | Fullstack | DONE |
| 4.11 | Production monitoring (metrics, health checks, structured logging) | P1 | Medium | DevOps | DONE |
| 4.12 | Full regression test suite | P1 | High | Tester | DEFERRED |
| 4.13 | Load testing (100 concurrent users) | P2 | Medium | Tester | DEFERRED |
| 4.14 | Documentation: API reference for integrations | P2 | Medium | BA | DEFERRED |

### Deliverables:
- 5 new mock service endpoints (Plentific, RSH/CORE, DocuSign, Experian, Land Registry)
- Admin Integration Dashboard with 20 integrations across 3 tiers, toggle + test
- Security hardened: CSP, CORS whitelist, rate limiting (4 tiers), security headers, structured error logging
- Production monitoring: metrics middleware, health checks with Firestore ping, admin monitoring endpoint
- All TypeScript clean, both builds pass

---

## AGENT ROLES

| Agent | Responsibility | Key Files |
|-------|---------------|-----------|
| **Fullstack** | Server routes, API integrations, data models, Firestore | `server/src/routes/`, `server/src/services/`, `server/src/models/` |
| **Frontend** | UI components, pages, state management, styling | `app/src/pages/`, `app/src/components/`, `app/src/hooks/` |
| **Tester** | Selenium tests, unit tests, integration tests, load tests | `tests/`, `app/src/__tests__/` |
| **BA** | Requirements, user stories, acceptance criteria | `Doc1-*.txt`, `Doc2-*.txt`, `Doc3-*.txt` |
| **DevOps** | CI/CD, monitoring, security, infrastructure | `cloudbuild.yaml`, `Dockerfile`, `.github/` |

---

## KEY DOCUMENTS

| Document | Purpose |
|----------|---------|
| `Doc1-SocialHomesAi-Base-Specification.txt` | Base product specification |
| `Doc2-SocialHomesAi-AI-Native-Features.txt` | AI features specification |
| `Doc3-Public-API-Integration-Requirements.txt` | Public API integration requirements (2,333 lines) |
| `Doc4-UI-UX-Audit-Build-Guide.md` | Frontend UI/UX audit + build guide (441 lines) |
| `CLAUDE.md` | Claude Code project instructions |
| `SESSION-HISTORY.md` | Persistent conversation history |
| `DEV-FIX-LIST.md` | Bug/warning tracker |
| `DEVOPS.md` | DevOps guide |
| `EXECUTION-PLAN.md` | This document |

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

| Metric | Target |
|--------|--------|
| Selenium test pass rate | > 98% |
| TypeScript errors | 0 |
| Vite build warnings | 0 critical |
| API response time (P95) | < 500ms |
| WCAG AA compliance | 100% (text contrast, focus, keyboard) |
| External API uptime | > 99.5% (with fallback to simulated) |
| Bundle size | < 3MB (gzipped < 800KB) |
| Cloud Run cold start | < 3s |

---

**Plan authored by Claude Opus 4.6 | SocialHomes.Ai | 2026-02-14**
