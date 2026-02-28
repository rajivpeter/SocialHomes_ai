# SocialHomes.Ai — DevOps & Infrastructure Guide

**Last Updated**: 27/02/2026 (v5 — Phase 5.5 Complete: Staging, Monitoring, Backups, CDN, Domain, Runbook)
**Maintainer**: DevOps Engineer Agent (Yantra Works)
**Status**: Production (live on Cloud Run, monitored, backed up, CDN-enabled)

---

## Table of Contents

1. [Live Deployment](#1-live-deployment)
2. [Architecture Overview](#2-architecture-overview)
3. [CI/CD Pipeline](#3-cicd-pipeline)
4. [Docker Build](#4-docker-build)
5. [Cloud Run Configuration](#5-cloud-run-configuration)
6. [Staging Environment](#6-staging-environment)
7. [Auto-Scaling Configuration](#7-auto-scaling-configuration)
8. [Firestore Database](#8-firestore-database)
9. [Monitoring & Alerting](#9-monitoring--alerting)
10. [Log-Based Monitoring](#10-log-based-monitoring)
11. [Database Backup Strategy](#11-database-backup-strategy)
12. [CDN & Caching Strategy](#12-cdn--caching-strategy)
13. [Custom Domain & SSL](#13-custom-domain--ssl)
14. [Security Configuration](#14-security-configuration)
15. [API Server](#15-api-server)
16. [Frontend (React SPA)](#16-frontend-react-spa)
17. [Environment Variables & Secrets](#17-environment-variables--secrets)
18. [Incident Response Runbook](#18-incident-response-runbook)
19. [Rollback Procedures](#19-rollback-procedures)
20. [Database Recovery](#20-database-recovery)
21. [Secret Rotation](#21-secret-rotation)
22. [Scaling Playbook](#22-scaling-playbook)
23. [On-Call Guide](#23-on-call-guide)
24. [Post-Mortem Template](#24-post-mortem-template)
25. [Local Development](#25-local-development)
26. [Cost Estimate](#26-cost-estimate)
27. [Known Issues & Technical Debt](#27-known-issues--technical-debt)
28. [File Reference](#28-file-reference)
29. [Setup Scripts Reference](#29-setup-scripts-reference)

---

## 1. Live Deployment

| Resource | URL / Identifier |
|----------|-----------------|
| **Live Application** | https://socialhomes-587984201316.europe-west2.run.app |
| **Health Check** | https://socialhomes-587984201316.europe-west2.run.app/health |
| **API Base** | https://socialhomes-587984201316.europe-west2.run.app/api/v1/ |
| **Staging** | https://socialhomes-staging-587984201316.europe-west2.run.app |
| **GitHub Repo** | https://github.com/rajivpeter/SocialHomes_ai |
| **GCP Project** | `${FIREBASE_PROJECT_ID}` |
| **Cloud Run Service** | `socialhomes` in `europe-west2` |
| **Staging Service** | `socialhomes-staging` in `europe-west2` |
| **Artifact Registry** | `europe-west2-docker.pkg.dev/${PROJECT_ID}/socialhomes/app` |
| **Firestore Database** | Default database in `${FIREBASE_PROJECT_ID}` |
| **Load Balancer IP** | `34.149.218.63` |
| **Custom Domain** | `socialhomes.ai` (SSL: Google-managed) |

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                      │
│                            │                                          │
│                    ┌───────┴───────┐                                  │
│                    │  Cloud DNS     │  socialhomes.ai                 │
│                    └───────┬───────┘                                  │
│                            │                                          │
│                    ┌───────┴───────────────────┐                      │
│                    │  Global External LB        │  34.149.218.63     │
│                    │  ├── Cloud Armor (WAF)     │  XSS/SQLi/RFI     │
│                    │  ├── Cloud CDN             │  Edge caching      │
│                    │  └── SSL Termination       │  Google-managed    │
│                    └───────┬───────────────────┘                      │
│                            │                                          │
│              ┌─────────────┴─────────────┐                            │
│              │                           │                            │
│     ┌────────┴────────┐        ┌────────┴────────┐                   │
│     │  Production      │        │  Staging         │                  │
│     │  Cloud Run       │        │  Cloud Run       │                  │
│     │  socialhomes     │        │  socialhomes-stg │                  │
│     │  min:1  max:10   │        │  min:0  max:3    │                  │
│     │  1Gi / 1CPU      │        │  512Mi / 1CPU    │                  │
│     └────────┬────────┘        └────────┬────────┘                   │
│              │                           │                            │
│     ┌────────┴────────────────────────────┴─────────┐                │
│     │                                               │                │
│     │     Node.js Express Server (:8080)            │                │
│     │     ├── /health          Health probe         │                │
│     │     ├── /api/v1/*        REST API (21 routes) │                │
│     │     └── /*               React SPA            │                │
│     │                                               │                │
│     └───────────┬───────────────┬──────────┬────────┘                │
│                 │               │          │                          │
│      ┌──────────┴──┐  ┌────────┴──┐  ┌────┴─────────┐              │
│      │  Firestore   │  │  Vertex AI │  │  External    │              │
│      │  17 colls    │  │  Gemini    │  │  APIs        │              │
│      │  ~550 docs   │  │  Pro/Flash │  │  Police.uk   │              │
│      │              │  │            │  │  DEFRA Flood  │              │
│      │              │  │            │  │  Open-Meteo   │              │
│      │              │  │            │  │  Postcodes.io │              │
│      └──────────────┘  └───────────┘  └──────────────┘              │
│                                                                       │
│     ┌──────────────────────────────────────────────┐                 │
│     │  Supporting Services                          │                │
│     │  ├── Secret Manager (4 secrets)               │                │
│     │  ├── Cloud Storage (backups bucket)           │                │
│     │  ├── Cloud Scheduler (backup jobs)            │                │
│     │  ├── Cloud Monitoring (alerts + dashboard)    │                │
│     │  ├── Cloud Logging → BigQuery sink            │                │
│     │  └── Artifact Registry (Docker images)        │                │
│     └──────────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────────────┘
```

**Single-container deployment**: Express serves both the API (`/api/v1/*`) and React SPA static files (`/*`) from one Cloud Run service. No separate frontend hosting needed.

---

## 3. CI/CD Pipeline

### Production Pipeline (main branch)

```
Developer pushes to main
        │
        ▼  (Cloud Build trigger: cloudbuild.yaml)
┌──────────────────────────────────────────┐
│ Step 1: Docker Build (multi-stage)       │
│   ├── Stage 1: Build React client        │
│   ├── Stage 2: Build Express server      │
│   └── Stage 3: Production image          │
│                                          │
│ Step 2: Smoke Test (health check)        │
│   └── Start server, verify /health       │
│                                          │
│ Step 3: Push to Artifact Registry        │
│   ├── :$COMMIT_SHA tag                   │
│   └── :latest tag                        │
│                                          │
│ Step 4: Deploy to Cloud Run              │
│   └── Zero-downtime revision deployment  │
│                                          │
│ Step 5: Post-deploy verification         │
│   └── Health check with 5 retries        │
└──────────────────────────────────────────┘
```

### Staging Pipeline (PR branches)

```
Developer opens PR / pushes to branch
        │
        ▼  (Cloud Build trigger: cloudbuild-staging.yaml)
┌──────────────────────────────────────────┐
│ Build → Test → Push → Deploy to staging  │
│ socialhomes-staging (scale-to-zero)      │
└──────────────────────────────────────────┘
```

### GitHub Actions CI (all branches)

```
Push/PR to main
        │
        ▼  (.github/workflows/ci.yml)
┌──────────────────────────────────────────┐
│ Job 1: TypeScript check + Lint           │
│ Job 2: Vitest unit tests (226 tests)     │
│ Job 3: Build frontend + server           │
│ Job 4: Selenium E2E tests (main only)    │
└──────────────────────────────────────────┘
```

### Deploy Commands

```bash
# Standard deploy (auto-triggered)
git add .
git commit -m "description of changes"
git push origin main

# Monitor build
gcloud builds list --limit=5 --project=${PROJECT_ID}
gcloud builds log <BUILD_ID> --project=${PROJECT_ID}

# Manual deploy
gcloud builds submit --config=cloudbuild.yaml --project=${PROJECT_ID}
```

---

## 4. Docker Build

### Multi-Stage Dockerfile

| Stage | Base Image | Purpose | Output |
|-------|-----------|---------|--------|
| `build-client` | `node:20-slim` | Compiles React SPA with Vite | `/build/app/dist/` |
| `build-server` | `node:20-slim` | Compiles Express server with tsc | `/build/server/dist/` |
| `production` | `node:20-slim` | Production runtime (non-root) | Final image |

### Security Features

- **Non-root user**: Runs as `appuser` (UID 1001)
- **dumb-init**: Proper PID 1 signal handling for graceful shutdown
- **Minimal image**: Only production dependencies installed
- **Health check**: Built-in Docker HEALTHCHECK for local development

### Production Image Layout

```
/srv/app/
├── server/
│   ├── package.json
│   ├── node_modules/        (production deps only)
│   └── dist/                (compiled TypeScript → JS)
│       ├── index.js         (entry point)
│       ├── middleware/
│       ├── models/
│       ├── routes/          (21 route modules)
│       └── services/
└── app/
    └── dist/                (Vite build output)
        ├── index.html
        └── assets/
            ├── index-*.css
            └── index-*.js
```

### Build Locally

```bash
# Build
docker build -t socialhomes:local .

# Run
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e GOOGLE_CLOUD_PROJECT=${FIREBASE_PROJECT_ID} \
  socialhomes:local

# Access
open http://localhost:8080
```

---

## 5. Cloud Run Configuration

| Setting | Production | Staging |
|---------|-----------|---------|
| **Service Name** | `socialhomes` | `socialhomes-staging` |
| **Region** | `europe-west2` (London) | `europe-west2` (London) |
| **CPU** | 1 vCPU | 1 vCPU |
| **Memory** | 1 GiB | 512 MiB |
| **Min Instances** | 1 (always warm) | 0 (scale to zero) |
| **Max Instances** | 10 | 3 |
| **Concurrency** | 80 | 80 |
| **Timeout** | 300s | 300s |
| **Auth** | `allUsers` (public) | `allUsers` (public) |
| **CPU Allocation** | Only during requests | Only during requests |
| **Startup Boost** | Enabled | Disabled |

---

## 6. Staging Environment

### Purpose

- Pre-production testing of PRs before merging to main
- QA verification of new features
- Separate from production (uses same Firebase project but tagged as staging)

### Setup

```bash
# First-time setup (run once)
bash scripts/setup-staging.sh
```

### How It Works

1. Developer opens PR against `main`
2. Cloud Build trigger (`cloudbuild-staging.yaml`) fires
3. Image built, tested, pushed to `app-staging` registry
4. Deployed to `socialhomes-staging` Cloud Run service
5. Tagged with `pr-<SHORT_SHA>` for traceability
6. Scales to zero when idle (cost-effective)
7. Old revisions cleaned up weekly via Cloud Scheduler

### Staging URL

```
https://socialhomes-staging-587984201316.europe-west2.run.app
```

### Environment Differentiation

| Variable | Production | Staging |
|----------|-----------|---------|
| `NODE_ENV` | `production` | `staging` |
| Min instances | 1 | 0 |
| Max instances | 10 | 3 |
| Memory | 1Gi | 512Mi |

---

## 7. Auto-Scaling Configuration

### Production Scaling Policy

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Min instances** | 1 | Eliminates cold starts for first request |
| **Max instances** | 10 | Handles ~800 concurrent requests (80 x 10) |
| **Concurrency** | 80 | Optimal for Node.js single-thread + async I/O |
| **CPU throttling** | Enabled | CPU only allocated during requests (cost saving) |
| **Startup CPU boost** | Enabled | Extra CPU during cold start for faster init |

### Scaling Triggers

Cloud Run auto-scales based on:
1. **CPU utilisation** — Target ~70% (managed by Cloud Run)
2. **Concurrent requests** — Scales when approaching concurrency limit
3. **Request latency** — New instances added if queue depth increases

### Cold Start Behaviour

- **Production**: Min instances = 1 ensures one warm instance always available
- **Additional instances**: May cold-start under load spikes (~2-3s)
- **Startup boost**: Extra CPU during init reduces cold start to ~1.5s

### Tuning Commands

```bash
# View current scaling config
gcloud run services describe socialhomes --region=europe-west2 \
  --format="table(spec.template.metadata.annotations)"

# Update min instances
gcloud run services update socialhomes --region=europe-west2 \
  --min-instances=0

# Update max instances
gcloud run services update socialhomes --region=europe-west2 \
  --max-instances=20

# Update concurrency
gcloud run services update socialhomes --region=europe-west2 \
  --concurrency=100
```

---

## 8. Firestore Database

### Project & Access

- **GCP Project**: `${FIREBASE_PROJECT_ID}`
- **Database**: `(default)` in Firestore Native mode
- **Authentication**: Cloud Run default SA auto-authenticates
- **Console**: https://console.cloud.google.com/firestore/databases

### Collections (17)

| Collection | Documents | Key Fields |
|------------|----------|------------|
| `organisations` | 1 | `name`, `abbreviation`, `totalUnits` |
| `regions` | 3 | `id`, `name`, `stats` |
| `localAuthorities` | 5 | `id`, `name`, `regionId` |
| `estates` | 9 | `id`, `name`, `localAuthorityId` |
| `blocks` | 16 | `id`, `name`, `estateId` |
| `properties` | 75 | `id`, `address`, `type`, `compliance`, `hact` |
| `tenants` | 68 | `id`, `firstName`, `lastName`, `rentBalance` |
| `cases` | 279 | `id`, `type`, `status`, `priority` |
| `activities` | 8 | `id`, `tenantId`, `caseId`, `date` |
| `tsmMeasures` | 22 | `id`, `name`, `value`, `target` |
| `hactCodes` | ~15 | Code list name → array of code mappings |
| `communications` | 0 | App-generated data |
| `rentTransactions` | 0 | App-generated data |
| `users` | 5 | Firebase Auth profiles |
| `auditLog` | 0 | Append-only audit trail |
| `notifications` | 0 | App-generated notifications |
| `voidProperties` | 0 | Void property tracking |

### Security Rules

Firestore security rules (`firestore.rules`) enforce:
- All reads require authentication (`request.auth != null`)
- Writes use persona hierarchy from custom claims
- Audit log is append-only (no update/delete)
- Users can only update their own profile (unless admin)

---

## 9. Monitoring & Alerting

### Setup

```bash
# Run the monitoring setup script (one-time)
bash scripts/setup-monitoring.sh
```

### Alert Policies

| Alert | Condition | Severity | Notification |
|-------|-----------|----------|-------------|
| **Error Rate > 5%** | 5xx response rate exceeds 5% for 5 min | CRITICAL | Email |
| **P95 Latency > 1s** | Request P95 latency exceeds 1000ms for 5 min | WARNING | Email |
| **Memory > 80%** | Container memory utilisation > 80% for 5 min | WARNING | Email |
| **Health Check Failed** | Uptime check returns non-healthy for 5 min | CRITICAL | Email |
| **Backup Job Failed** | Firestore backup scheduler job fails | WARNING | Email |

### Uptime Check

| Setting | Value |
|---------|-------|
| **URL** | `https://socialhomes-587984201316.europe-west2.run.app/health` |
| **Protocol** | HTTPS (GET) |
| **Period** | 300s (5 minutes) |
| **Timeout** | 10s |
| **Content match** | `healthy` |
| **Regions** | Europe, USA Virginia, Asia Pacific |

### Health Endpoint Response

```json
{
  "status": "healthy",
  "service": "socialhomes-api",
  "version": "1.0.0",
  "timestamp": "2026-02-27T12:00:00.000Z",
  "uptime": 86400,
  "memory": {
    "rss": 120,
    "heapUsed": 80,
    "heapTotal": 150
  },
  "firestore": {
    "connected": true,
    "latencyMs": 45
  },
  "cacheStatus": {
    "hits": 1200,
    "misses": 300,
    "hitRate": 80
  }
}
```

### Monitoring Dashboard

A custom Cloud Monitoring dashboard (`SocialHomes.Ai — Production Dashboard`) provides:
- Request count by status code class (2xx/4xx/5xx)
- P95 latency trend
- Instance count (auto-scaling visualisation)
- Memory utilisation per instance

**Console**: https://console.cloud.google.com/monitoring/dashboards

---

## 10. Log-Based Monitoring

### Log-Based Metrics

| Metric Name | Filter | Purpose |
|-------------|--------|---------|
| `socialhomes_5xx_errors` | `httpRequest.status>=500` | Track server errors |
| `socialhomes_4xx_errors` | `httpRequest.status>=400 AND <500` | Track client errors |
| `socialhomes_auth_failures` | `httpRequest.status=401` | Track auth failures |
| `socialhomes_slow_requests` | `httpRequest.latency>"1s"` | Track slow requests |

### Log Sink to BigQuery

All Cloud Run logs are exported to BigQuery for long-term analysis:
- **Dataset**: `socialhomes_logs`
- **Location**: `europe-west2`
- **Retention**: Indefinite (BigQuery default)
- **PII filtering**: Application logs are structured; no PII in request logs

### Viewing Logs

```bash
# Recent Cloud Run logs
gcloud run services logs read socialhomes \
  --region=europe-west2 --limit=100

# Filter by severity
gcloud logging read 'resource.type="cloud_run_revision"
  AND resource.labels.service_name="socialhomes"
  AND severity>=ERROR' \
  --limit=50 --project=${PROJECT_ID}

# Filter by request ID
gcloud logging read 'resource.type="cloud_run_revision"
  AND jsonPayload.requestId="<REQUEST_ID>"' \
  --project=${PROJECT_ID}

# BigQuery analysis (after log sink is active)
bq query --use_legacy_sql=false '
  SELECT
    httpRequest.requestUrl,
    httpRequest.status,
    httpRequest.latency,
    timestamp
  FROM `PROJECT_ID.socialhomes_logs.run_googleapis_com_requests_*`
  WHERE httpRequest.status >= 500
  ORDER BY timestamp DESC
  LIMIT 100'
```

---

## 11. Database Backup Strategy

### Setup

```bash
# Run the backup setup script (one-time)
bash scripts/setup-backups.sh
```

### Schedule

| Backup Type | Schedule | Destination | Retention |
|-------------|----------|-------------|-----------|
| **Daily** | 02:00 UTC every day | `gs://${PROJECT_ID}-firestore-backups/daily/` | 30 days |
| **Weekly** | Sunday 03:00 UTC | `gs://${PROJECT_ID}-firestore-backups/weekly/` | 365 days |

### Lifecycle Rules

- Daily backups older than 30 days are automatically deleted
- Weekly backups older than 365 days are automatically deleted
- Lifecycle rules managed via Cloud Storage bucket policy

### Manual Backup

```bash
# Trigger immediate backup
gcloud firestore export \
  gs://${PROJECT_ID}-firestore-backups/manual/$(date +%Y%m%d-%H%M%S)/ \
  --project=${PROJECT_ID}

# List available backups
gsutil ls gs://${PROJECT_ID}-firestore-backups/daily/
gsutil ls gs://${PROJECT_ID}-firestore-backups/weekly/
```

### Restore from Backup

```bash
# Restore (CAUTION: overwrites existing data for matched documents)
gcloud firestore import \
  gs://${PROJECT_ID}-firestore-backups/daily/<TIMESTAMP>/ \
  --project=${PROJECT_ID}
```

See [Section 20: Database Recovery](#20-database-recovery) for full procedures.

---

## 12. CDN & Caching Strategy

### Setup

```bash
# Enable CDN on the Load Balancer backend
bash scripts/setup-cdn.sh
```

### Cache Headers

The Express server sets appropriate `Cache-Control` headers:

| Asset Type | Header | TTL | Notes |
|-----------|--------|-----|-------|
| Hashed JS/CSS (`*.hash.js/css`) | `public, max-age=31536000, immutable` | 1 year | Content-hash ensures cache bust on change |
| `index.html` | `no-cache` | 0 | Always fetches fresh (checks for new deploys) |
| API responses | `no-store` | 0 | Dynamic data, never cached at CDN |
| Static images/fonts | `public, max-age=86400` | 1 day | |

### CDN Invalidation

After deployment, invalidate CDN cache for `index.html`:

```bash
# Invalidate specific path
gcloud compute url-maps invalidate-cdn-cache socialhomesai \
  --path="/index.html" --global --project=${PROJECT_ID}

# Invalidate everything (nuclear option)
gcloud compute url-maps invalidate-cdn-cache socialhomesai \
  --path="/*" --global --project=${PROJECT_ID}
```

### Compression

- **Brotli**: Supported by Cloud CDN automatically
- **Gzip**: Express `compression` middleware for direct requests
- Frontend bundle: ~2.5MB uncompressed, ~545KB gzipped

---

## 13. Custom Domain & SSL

### Setup

```bash
# Run domain setup script for guidance
bash scripts/setup-domain.sh
```

### Current Configuration

| Component | Value |
|-----------|-------|
| **Domain** | `socialhomes.ai` |
| **External IP** | `34.149.218.63` |
| **SSL Certificate** | Google-managed (auto-renewing) |
| **HTTP -> HTTPS** | Redirect via URL map |
| **www -> non-www** | Redirect via URL map |

### DNS Records Required

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 34.149.218.63 | 300 |
| A | www | 34.149.218.63 | 300 |

### SSL Certificate Status

```bash
# Check certificate provisioning status
gcloud compute ssl-certificates describe socialhomes-cert \
  --global --project=${PROJECT_ID} \
  --format="table(managed.status, managed.domainStatus)"
```

**Note**: SSL provisioning requires DNS records to be correctly pointed. Status changes from `PROVISIONING` to `ACTIVE` after DNS propagation (typically 15-60 minutes).

---

## 14. Security Configuration

### Cloud Armor WAF

| Rule | Priority | Action | Description |
|------|----------|--------|-------------|
| XSS Protection | 1000 | deny-403 | OWASP XSS v3.3 stable |
| SQL Injection | 1001 | deny-403 | OWASP SQLi v3.3 stable |
| Remote File Inclusion | 1002 | deny-403 | OWASP RFI v3.3 stable |
| Rate Limiting | 900 | throttle | 100 req/min per IP |
| Default | MAX_INT | allow | Allow all other traffic |

### Application Security Layers

1. **Cloud Armor** — WAF at Load Balancer level
2. **Helmet** — Security headers (CSP, HSTS, X-Frame-Options)
3. **CORS** — Origin allowlist
4. **Rate Limiting** — Per-category Express middleware
5. **Firebase JWT** — Authentication via Bearer tokens
6. **RBAC** — 5-level persona hierarchy
7. **Request correlation** — X-Request-ID for tracing

### Security Audit

See `docs/security-audit.md` for the comprehensive OWASP Top 10 audit report. Key findings:
- 3 CRITICAL, 6 HIGH, 5 MEDIUM findings identified
- Remediation roadmap provided in the audit document
- Top priority: Fix auth bypass, CORS policy, and secrets in git history

---

## 15. API Server

### Entry Point

`server/dist/index.js` (compiled from `server/src/index.ts`)

### Middleware Stack (in order)

1. `compression` — Gzip response compression
2. `helmet` — Security headers (CSP, HSTS, X-Frame-Options)
3. `x-request-id` — Request correlation UUID
4. `cors` — Cross-origin resource sharing
5. `morgan('combined')` — HTTP request logging
6. `metricsMiddleware` — Request/response metrics collection
7. `express.json({ limit: '1mb' })` — JSON body parsing
8. `express.urlencoded({ extended: true })` — URL-encoded parsing

### Route Modules (21+)

| Mount Path | Module | Rate Limiter | Description |
|------------|--------|-------------|-------------|
| `/health` | inline | none | Health check for Cloud Run |
| `/api/v1/config` | inline | none | Firebase client config |
| `/api/v1/auth` | `auth.ts` | authLimiter | Authentication |
| `/api/v1/ai` | `ai.ts` | aiLimiter | AI/ML endpoints |
| `/api/v1/admin` | `admin.ts` | adminLimiter | Admin operations |
| `/api/v1/properties` | `properties.ts` | apiLimiter | Property CRUD |
| `/api/v1/tenants` | `tenants.ts` | apiLimiter | Tenant CRUD |
| `/api/v1/cases` | `cases.ts` | apiLimiter | Case management |
| `/api/v1/explore` | `explore.ts` | apiLimiter | Hierarchy drill-down |
| `/api/v1/briefing` | `briefing.ts` | apiLimiter | Daily AI briefing |
| `/api/v1/compliance` | `compliance.ts` | apiLimiter | Big 6 compliance |
| `/api/v1/rent` | `rent.ts` | apiLimiter | Rent & arrears |
| `/api/v1/reports` | `reports.ts` | apiLimiter | TSM + reports |
| `/api/v1/public-data` | `public-data.ts` | apiLimiter | External API proxy |
| `/api/v1/export` | `export.ts` | apiLimiter | HACT export |
| `/api/v1/lettings` | `lettings.ts` | apiLimiter | Lettings |
| `/api/v1/booking` | `booking.ts` | apiLimiter | Booking |
| `/api/v1/notifications` | `notifications.ts` | apiLimiter | Notifications |
| `/api/v1/scheduled-tasks` | `scheduled-tasks.ts` | adminLimiter | Scheduled tasks |
| `/api/v1/bulk` | `bulk-operations.ts` | adminLimiter | Bulk operations |
| `/api/v1/audit` | `audit.ts` | apiLimiter | Audit log |
| `/api/v1/gdpr` | `gdpr.ts` | adminLimiter | GDPR compliance |
| `/api/v1/files` | `files.ts` | apiLimiter | File management |

### RBAC Hierarchy

```
coo (5) > head-of-service (4) > manager (3) > housing-officer (2) > operative (1)
```

---

## 16. Frontend (React SPA)

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7.2 | Build tool |
| Tailwind CSS | 4 | Styling (dark-mode first) |
| React Router | 6 | Client-side routing |
| React Query | 5 | Server state management |
| Leaflet | 1.9 | 2D maps |
| Three.js | 0.182 | 3D building visualisation |
| Recharts | 3 | Charts and graphs |

### Build Output

```bash
cd app && npm run build
# Output: app/dist/
#   index.html       (~0.56 kB)
#   assets/index.css (~78 kB, ~12 kB gzip)
#   assets/index.js  (~2.5 MB, ~545 kB gzip)
```

---

## 17. Environment Variables & Secrets

### Environment Variables (set in cloudbuild.yaml)

| Variable | Value | Source |
|----------|-------|--------|
| `PORT` | `8080` | Cloud Run default |
| `NODE_ENV` | `production` | Set in deploy step |
| `GOOGLE_CLOUD_PROJECT` | Auto-injected | Cloud Run metadata |

### Secrets (Google Secret Manager)

| Secret Name | Purpose | Rotated |
|-------------|---------|---------|
| `FIREBASE_API_KEY` | Firebase Web SDK config | Restricted to referrers |
| `FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | N/A |
| `FIREBASE_PROJECT_ID` | GCP project identifier | N/A |
| `DEMO_USER_PASSWORD` | Demo account password | On schedule |

### Secret Management

```bash
# List all secrets
gcloud secrets list --project=${PROJECT_ID}

# View a secret
gcloud secrets versions access latest --secret=FIREBASE_API_KEY

# Rotate a secret
echo -n "NEW_VALUE" | gcloud secrets versions add FIREBASE_API_KEY --data-file=-

# First-time setup
bash scripts/setup-secrets.sh
```

---

## 18. Incident Response Runbook

### Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **SEV1** | Service down, no users can access | 15 minutes | Immediately to all engineers |
| **SEV2** | Degraded performance, some features broken | 30 minutes | To on-call + team lead |
| **SEV3** | Minor issue, workaround available | 4 hours | To on-call engineer |
| **SEV4** | Cosmetic issue, no impact on functionality | Next business day | To backlog |

### SEV1: Service Down

```
1. CHECK: Is Cloud Run responding?
   gcloud run services describe socialhomes --region=europe-west2 \
     --format="value(status.conditions)"

2. CHECK: Health endpoint
   curl -sf https://socialhomes-587984201316.europe-west2.run.app/health

3. CHECK: Recent deploys
   gcloud run revisions list --service=socialhomes --region=europe-west2 --limit=5

4. IF recent deploy caused the issue:
   → ROLLBACK (see Section 19)

5. CHECK: Firestore connectivity
   → GCP Console: Firestore > Overview

6. CHECK: Cloud Run logs for errors
   gcloud run services logs read socialhomes --region=europe-west2 --limit=50

7. IF out of memory:
   gcloud run services update socialhomes --region=europe-west2 --memory=2Gi

8. IF scaling issue:
   gcloud run services update socialhomes --region=europe-west2 --max-instances=20
```

### SEV2: Degraded Performance

```
1. CHECK: P95 latency in monitoring dashboard
   → Cloud Console: Monitoring > Dashboard

2. CHECK: Instance count
   gcloud run services describe socialhomes --region=europe-west2 \
     --format="value(status.traffic)"

3. CHECK: External API failures
   → Health endpoint cacheStatus shows hit rate

4. CHECK: Firestore latency
   → Health endpoint shows firestore.latencyMs

5. IF cache cold:
   → Wait for cache warming (external API data caches for 2h/24h)

6. IF external API rate limited:
   → Circuit breaker will activate automatically
```

---

## 19. Rollback Procedures

### Cloud Run Revision Rollback

```bash
# List recent revisions
gcloud run revisions list --service=socialhomes --region=europe-west2 --limit=10

# Route 100% traffic to a previous revision
gcloud run services update-traffic socialhomes \
  --region=europe-west2 \
  --to-revisions=socialhomes-XXXXX=100

# Or redeploy a specific image tag (by commit SHA)
gcloud run deploy socialhomes \
  --image=europe-west2-docker.pkg.dev/${PROJECT_ID}/socialhomes/app:<COMMIT_SHA> \
  --region=europe-west2
```

### Canary Rollback

```bash
# Split traffic: 90% to stable, 10% to new
gcloud run services update-traffic socialhomes \
  --region=europe-west2 \
  --to-revisions=socialhomes-stable=90,socialhomes-new=10

# If new revision is bad, route 100% back to stable
gcloud run services update-traffic socialhomes \
  --region=europe-west2 \
  --to-revisions=socialhomes-stable=100
```

### Git Rollback

```bash
# Revert a commit and auto-deploy
git revert <COMMIT_SHA>
git push origin main
```

---

## 20. Database Recovery

### Point-in-Time Recovery

Firestore doesn't natively support PITR, but our backup strategy provides:
- **Daily snapshots** at 02:00 UTC (30-day retention)
- **Weekly snapshots** on Sundays at 03:00 UTC (365-day retention)

### Full Recovery Procedure

```bash
# 1. Identify the backup to restore
gsutil ls gs://${PROJECT_ID}-firestore-backups/daily/

# 2. Take backup of current state first
gcloud firestore export gs://${PROJECT_ID}-firestore-backups/pre-restore/$(date +%Y%m%d-%H%M%S)/

# 3. Import the backup (additive — won't delete existing documents)
gcloud firestore import gs://${PROJECT_ID}-firestore-backups/daily/<TIMESTAMP>/

# 4. Verify data integrity
curl -sf https://socialhomes-587984201316.europe-west2.run.app/health | jq .
```

### Partial Recovery (specific collections)

```bash
# Import specific collections from backup
gcloud firestore import gs://${PROJECT_ID}-firestore-backups/daily/<TIMESTAMP>/ \
  --collection-ids=properties
```

### Recovery Time Estimates

| Scenario | Data Size | Estimated Time |
|----------|-----------|---------------|
| Full database (~550 docs) | ~5 MB | < 1 minute |
| Properties only (75 docs) | ~500 KB | < 30 seconds |
| Full database (10K docs) | ~50 MB | ~5 minutes |

---

## 21. Secret Rotation

### Rotation Procedure

```bash
# 1. Generate new secret value
NEW_PASSWORD=$(openssl rand -base64 24)

# 2. Add new version to Secret Manager
echo -n "$NEW_PASSWORD" | gcloud secrets versions add DEMO_USER_PASSWORD --data-file=-

# 3. Deploy new revision (picks up latest secret version)
gcloud run services update socialhomes --region=europe-west2

# 4. Verify the new revision is healthy
curl -sf https://socialhomes-587984201316.europe-west2.run.app/health

# 5. Disable old secret version
gcloud secrets versions disable <OLD_VERSION> --secret=DEMO_USER_PASSWORD
```

### Firebase API Key

The Firebase API key is restricted to allowed referrers. To rotate:

```bash
# 1. Create new API key in Firebase Console
# 2. Apply same referrer restrictions
# 3. Update Secret Manager
echo -n "NEW_API_KEY" | gcloud secrets versions add FIREBASE_API_KEY --data-file=-
# 4. Redeploy
gcloud run services update socialhomes --region=europe-west2
# 5. Delete old key in Firebase Console
```

---

## 22. Scaling Playbook

### Scenario: Expected Traffic Spike

```bash
# Pre-scale to handle load
gcloud run services update socialhomes --region=europe-west2 \
  --min-instances=5 --max-instances=20

# After traffic normalises
gcloud run services update socialhomes --region=europe-west2 \
  --min-instances=1 --max-instances=10
```

### Scenario: Cost Reduction

```bash
# Scale to zero when not needed
gcloud run services update socialhomes --region=europe-west2 \
  --min-instances=0

# Reduce max instances
gcloud run services update socialhomes --region=europe-west2 \
  --max-instances=5
```

### Capacity Planning

| Load Level | Concurrent Users | Instances | Cost/Month |
|-----------|-----------------|-----------|------------|
| **Minimal** | 1-10 | 1 | ~$15-20 |
| **Normal** | 10-80 | 1-2 | ~$20-40 |
| **High** | 80-500 | 2-7 | ~$40-100 |
| **Peak** | 500-800 | 7-10 | ~$100-150 |
| **Surge** | 800+ | 10-20 | ~$150-300 |

---

## 23. On-Call Guide

### Daily Checks

1. **Health endpoint**: Should return `"status": "healthy"`
2. **Uptime monitoring**: Check Cloud Monitoring for alerts
3. **Error rate**: Should be < 1% (Cloud Run metrics)
4. **Backup status**: Verify daily backup completed

### Weekly Checks

1. **Review Cloud Run metrics**: Latency trends, instance count
2. **Review Firestore usage**: Read/write counts, storage
3. **Review alerting**: Any suppressed or auto-resolved alerts
4. **Review security**: `npm audit` results, dependency updates
5. **Verify staging**: Ensure staging is still operational

### Monthly Checks

1. **Cost review**: GCP billing report
2. **Backup restoration test**: Restore a backup to verify integrity
3. **Secret rotation**: Rotate DEMO_USER_PASSWORD
4. **Dependency updates**: `npm audit` in both `app/` and `server/`
5. **Review security audit**: Check `docs/security-audit.md` for outstanding items

### Contact

| Role | Contact |
|------|---------|
| **DevOps Lead** | admin@yantra.works |
| **Telegram Bot** | @SocialHomesBot |
| **GCP Support** | Via Cloud Console |

---

## 24. Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

## Date: YYYY-MM-DD
## Duration: HH:MM
## Severity: SEV1/SEV2/SEV3

## Summary
[1-2 sentence summary]

## Timeline (UTC)
- HH:MM — [First detection]
- HH:MM — [Actions taken]
- HH:MM — [Resolution]

## Root Cause
[Technical explanation]

## Impact
- Users affected: [count or percentage]
- Duration: [how long]
- Data loss: [yes/no]

## Resolution
[What was done to fix]

## Action Items
| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 1 | [action] | [who] | [when] | TODO |

## Lessons Learned
- What went well
- What could be improved
```

---

## 25. Local Development

### Prerequisites

- Node.js 20+ / npm 10+
- (Optional) `gcloud` CLI, Docker, Firebase CLI

### Run Frontend Only

```bash
cd app && npm install --legacy-peer-deps && npm run dev
# http://localhost:5173 (uses static fallback data)
```

### Run Server Locally

```bash
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=${FIREBASE_PROJECT_ID}
cd server && npm install && npm run dev
# http://localhost:8080 (connects to live Firestore)
```

### Run Full Stack

```bash
# Terminal 1: Server
cd server && npm run dev

# Terminal 2: Client
cd app && npm run dev
```

### Run in Docker

```bash
docker build -t socialhomes:local .
docker run -p 8080:8080 -e PORT=8080 -e NODE_ENV=production socialhomes:local
```

---

## 26. Cost Estimate

| Resource | Monthly Estimate | Notes |
|----------|-----------------|-------|
| Cloud Run (min=1) | ~$15-20 | Always-on warm instance |
| Firestore | ~$0 | Free tier covers ~550 docs |
| Artifact Registry | ~$0.10 | Image storage |
| Cloud Build | Free tier | 120 min/day free |
| Cloud Storage (backups) | ~$0.05 | < 100 MB |
| Cloud Scheduler | Free tier | 3 jobs |
| Cloud Monitoring | Free tier | Basic alerting |
| Cloud Armor | ~$5-10 | WAF policy |
| Load Balancer | ~$18 | Forwarding rule |
| **Total** | **~$40-55/month** | |

---

## 27. Known Issues & Technical Debt

| Issue | Severity | Notes |
|-------|----------|-------|
| Composite Firestore indexes not deployed | Low | In-memory filtering OK for ~550 docs |
| Large JS bundle (~2.5 MB) | Medium | Three.js + Leaflet; code splitting in progress |
| In-memory rate limiter | Low | Not shared across instances |
| X-Persona auth bypass in production | HIGH | See docs/security-audit.md Finding 1.1 |
| CORS allows all origins | HIGH | See docs/security-audit.md Finding 5.1 |
| SSL cert provisioning | PENDING | DNS not yet pointed to 34.149.218.63 |

---

## 28. File Reference

```
socialhomes/
├── Dockerfile                   # Multi-stage build (non-root, dumb-init)
├── cloudbuild.yaml              # Production CI/CD pipeline
├── cloudbuild-staging.yaml      # Staging CI/CD pipeline
├── .github/workflows/ci.yml    # GitHub Actions CI pipeline
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Composite indexes
├── DEVOPS.md                    # This file
├── DEV-FIX-LIST.md              # Bug/warning tracker
├── EXECUTION-PLAN.md            # Master execution plan
│
├── scripts/
│   ├── setup-secrets.sh         # Google Secret Manager setup
│   ├── setup-staging.sh         # Staging environment setup
│   ├── setup-monitoring.sh      # Monitoring & alerting setup
│   ├── setup-backups.sh         # Firestore backup setup
│   ├── setup-cdn.sh             # Cloud CDN setup
│   ├── setup-domain.sh          # Custom domain & SSL setup
│   └── seed-firestore.ts        # Firestore data seeder
│
├── docs/
│   └── security-audit.md        # OWASP Top 10 security audit
│
├── app/                         # React SPA
│   └── src/
│       ├── pages/               # 40+ page components
│       └── components/
│
└── server/                      # Express API server
    └── src/
        ├── index.ts
        ├── middleware/
        ├── routes/              # 21+ route modules
        └── services/
```

---

## 29. Setup Scripts Reference

All setup scripts are idempotent — safe to run multiple times.

| Script | Purpose | Run When |
|--------|---------|----------|
| `scripts/setup-secrets.sh` | Create Google Secret Manager secrets | First deploy |
| `scripts/setup-staging.sh` | Create staging Cloud Run service + trigger | First deploy |
| `scripts/setup-monitoring.sh` | Create alerts, metrics, dashboard, log sink | First deploy |
| `scripts/setup-backups.sh` | Create backup bucket, scheduler jobs | First deploy |
| `scripts/setup-cdn.sh` | Enable Cloud CDN on Load Balancer | After LB setup |
| `scripts/setup-domain.sh` | Domain & SSL configuration guide | When domain ready |

### Quick Start (New Environment)

```bash
# 1. Set GCP project
gcloud config set project YOUR_PROJECT_ID

# 2. Run all setup scripts
bash scripts/setup-secrets.sh
bash scripts/setup-staging.sh
bash scripts/setup-monitoring.sh
bash scripts/setup-backups.sh
bash scripts/setup-cdn.sh
bash scripts/setup-domain.sh

# 3. Push to main to trigger first deployment
git push origin main
```

---

*Document generated 27/02/2026 by DevOps Engineer Agent.*
*Studio: Yantra Works | https://yantra.works*
*Copyright 2026 Yantra Works. All rights reserved.*
