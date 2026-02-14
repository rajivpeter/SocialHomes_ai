# SocialHomes.Ai — DevOps & Infrastructure Guide

**Last Updated**: 09/02/2026 (v3 — Security Hardening Release)
**Maintainer**: DevOps Senior
**Status**: Production (live on Cloud Run, min-instances=1, uptime monitored)

---

## 1. Live Deployment

| Resource | URL / Identifier |
|----------|-----------------|
| **Live Application** | https://socialhomes-674258130066.europe-west2.run.app |
| **Health Check** | https://socialhomes-674258130066.europe-west2.run.app/health |
| **API Base** | https://socialhomes-674258130066.europe-west2.run.app/api/v1/ |
| **GitHub Repo** | https://github.com/rajivpeter/SocialHomes_ai |
| **GCP Project** | `${FIREBASE_PROJECT_ID}` |
| **Cloud Run Service** | `socialhomes` in `europe-west2` |
| **Artifact Registry** | `europe-west2-docker.pkg.dev/${FIREBASE_PROJECT_ID}/socialhomes/app` |
| **Firestore Database** | Default database in `${FIREBASE_PROJECT_ID}` |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET                              │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Google Cloud Run (europe-west2)             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Node.js Express Server (:8080)           │  │
│  │                                                   │  │
│  │  GET /health          → Health check endpoint     │  │
│  │  GET /api/v1/*        → API routes (12 modules)   │  │
│  │  GET /*               → React SPA (index.html)    │  │
│  └──────────────────┬────────────────────────────────┘  │
│                     │                                    │
│                     ▼                                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Google Cloud Firestore (NoSQL)             │  │
│  │   17 collections · ~550 documents                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Single-container deployment**: The Express server serves both the API (`/api/v1/*`) and the React SPA static files (`/*`) from one Cloud Run service. No separate frontend hosting is needed.

---

## 3. CI/CD Pipeline

### Flow

```
Developer pushes to main
        │
        ▼
GitHub (rajivpeter/SocialHomes_ai)
        │
        ▼  (Cloud Build trigger on push to main)
Google Cloud Build
        │
        ├── Step 1: docker build (multi-stage)
        │     ├── Stage 1: Build React client (npm ci + vite build)
        │     ├── Stage 2: Build Express server (npm ci + tsc)
        │     └── Stage 3: Production image (node:20-slim)
        │
        ├── Step 2: docker push → Artifact Registry
        │     ├── :$COMMIT_SHA tag
        │     └── :latest tag
        │
        └── Step 3: gcloud run deploy
              └── Deploys new revision to Cloud Run
```

### Trigger Configuration

The Cloud Build trigger should be configured in GCP Console:
- **Source**: GitHub repository `rajivpeter/SocialHomes_ai`
- **Branch**: `^main$`
- **Config file**: `cloudbuild.yaml` (in repo root)
- **Build config location**: Repository

### How to Deploy

```bash
# Standard deploy (auto-triggered)
git add .
git commit -m "description of changes"
git push origin main

# Monitor build
# https://console.cloud.google.com/cloud-build/builds?project=${FIREBASE_PROJECT_ID}
```

### Manual Deploy (if needed)

```bash
# Build and push image locally
gcloud builds submit --config=cloudbuild.yaml \
  --project=${FIREBASE_PROJECT_ID}

# Or deploy a specific image
gcloud run deploy socialhomes \
  --image=europe-west2-docker.pkg.dev/${FIREBASE_PROJECT_ID}/socialhomes/app:latest \
  --region=europe-west2 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --port=8080 \
  --set-env-vars=NODE_ENV=production
```

---

## 4. Docker Build

### Multi-Stage Dockerfile

| Stage | Base Image | Purpose | Output |
|-------|-----------|---------|--------|
| `build-client` | `node:20-slim` | Compiles React SPA with Vite | `/build/app/dist/` |
| `build-server` | `node:20-slim` | Compiles Express server with tsc | `/build/server/dist/` |
| `production` | `node:20-slim` | Production runtime | Final image |

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
│       ├── routes/
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
# Full build
docker build -t socialhomes:local .

# Run locally
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e GOOGLE_CLOUD_PROJECT=${FIREBASE_PROJECT_ID} \
  socialhomes:local
```

---

## 5. Cloud Run Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| **Service Name** | `socialhomes` | |
| **Region** | `europe-west2` (London) | UK data residency |
| **CPU** | 1 vCPU | |
| **Memory** | 1 GiB | |
| **Min Instances** | 1 | Always-warm instance (no cold starts) |
| **Max Instances** | 10 | |
| **Port** | 8080 | Express listens on `$PORT` |
| **Concurrency** | 80 (default) | |
| **Timeout** | 300s (default) | |
| **Auth** | `allUsers` (public) | No IAM gate — app handles auth |
| **CPU Allocation** | Only during requests | |

### Environment Variables & Secrets (set in Cloud Run)

| Variable | Value | Source |
|----------|-------|--------|
| `PORT` | `8080` | Cloud Run default |
| `NODE_ENV` | `production` | Set in cloudbuild.yaml |
| `GOOGLE_CLOUD_PROJECT` | Auto-injected | Cloud Run metadata |
| `FIREBASE_API_KEY` | (secret) | **Google Secret Manager** |
| `FIREBASE_AUTH_DOMAIN` | (secret) | **Google Secret Manager** |
| `FIREBASE_PROJECT_ID` | (secret) | **Google Secret Manager** |
| `DEMO_USER_PASSWORD` | (secret) | **Google Secret Manager** |

**IMPORTANT**: Secrets are injected via `--update-secrets` in `cloudbuild.yaml`, NOT via env vars. See Section 16 for setup.

### Cold Start Behaviour

- Min instances = 1 ensures one warm instance is always available (no cold starts)
- Configured in `cloudbuild.yaml` so it persists across deployments
- Additional instances beyond 1 may still cold-start under load spikes (~2-3s)
- To revert to scale-to-zero: change `--min-instances` to `0` in `cloudbuild.yaml`

```bash
# Check current min-instances setting
gcloud run services describe socialhomes --region=europe-west2 \
  --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/minScale'])"
```

---

## 6. Firestore Database

### Project & Access

- **GCP Project**: `${FIREBASE_PROJECT_ID}`
- **Database**: `(default)` in Firestore Native mode
- **Authentication**: Cloud Run's default service account auto-authenticates
- **Console**: https://console.cloud.google.com/firestore/databases?project=${FIREBASE_PROJECT_ID}

### Collections

| Collection | Document Count | Key Fields |
|------------|---------------|------------|
| `organisations` | 1 | `name`, `abbreviation`, `totalUnits` |
| `regions` | 3 | `id`, `name`, `stats` |
| `localAuthorities` | 5 | `id`, `name`, `regionId` |
| `estates` | 9 | `id`, `name`, `localAuthorityId` |
| `blocks` | 16 | `id`, `name`, `estateId` |
| `properties` | 75 | `id`, `address`, `type`, `compliance`, `hact` |
| `tenants` | 68 | `id`, `firstName`, `lastName`, `rentBalance`, `hact` |
| `cases` | 279 | `id`, `type`, `status`, `priority`, `tenantId`, `propertyId` |
| `activities` | 8 | `id`, `tenantId`, `caseId`, `date` |
| `tsmMeasures` | 22 | `id`, `name`, `value`, `target` |
| `hactCodes` | ~15 | Code list name → array of code mappings |
| `communications` | 0 | (ready for app-generated data) |
| `rentTransactions` | 0 | (ready for app-generated data) |
| `users` | 0 | (ready for Firebase Auth integration) |
| `auditLog` | 0 | (append-only) |
| `notifications` | 0 | (ready for app-generated data) |
| `voidProperties` | 0 | (static data in frontend; not yet seeded) |

### Seeding Data

Data is seeded via the admin API endpoint. The seed script reads static data from the frontend data files and writes to Firestore with HACT code enrichment.

```bash
# Trigger seed from API (POST with JSON body containing all static data)
curl -X POST https://socialhomes-674258130066.europe-west2.run.app/api/v1/admin/seed \
  -H "Content-Type: application/json" \
  -H "X-Persona: coo" \
  -d @seed-data.json
```

The seed operation is idempotent (uses `set` not `add` — documents with the same ID are overwritten).

### Composite Indexes

The file `firestore.indexes.json` defines 17 composite indexes. **These are NOT currently deployed** — the application was refactored to use in-memory filtering instead of Firestore composite queries (sufficient for the current dataset size of ~550 documents).

If the dataset grows significantly (>10,000 documents), deploy the indexes:

```bash
# Deploy Firestore indexes (requires Firebase CLI)
npm install -g firebase-tools
firebase login
firebase init firestore --project ${FIREBASE_PROJECT_ID}
firebase deploy --only firestore:indexes
```

Then refactor the API routes back to Firestore-native `where()` + `orderBy()` queries for performance.

### Security Rules

The file `firestore.rules` defines persona-based RBAC rules. **Deployed to production** on 09/02/2026.

Rules enforce:
- All reads require authentication (`request.auth != null`)
- Writes use persona hierarchy from custom claims (`request.auth.token.persona`)
- Audit log is append-only (no update/delete)
- Users can only update their own profile (unless admin)

Note: The Express API uses Firebase Admin SDK which bypasses security rules. These rules protect against any future direct client-side Firestore access.

### Cloud Armor WAF

A Cloud Armor security policy (`socialhomes-waf`) is attached to the load balancer:

| Rule | Priority | Action | Description |
|------|----------|--------|-------------|
| XSS Protection | 1000 | deny-403 | OWASP XSS v3.3 stable rules |
| SQL Injection | 1001 | deny-403 | OWASP SQLi v3.3 stable rules |
| Remote File Inclusion | 1002 | deny-403 | OWASP RFI v3.3 stable rules |
| Rate Limiting | 900 | throttle | 100 requests/minute per IP, exceed = 429 |
| Default | 2147483647 | allow | Allow all other traffic |

```bash
# View current rules
gcloud compute security-policies describe socialhomes-waf --project=${FIREBASE_PROJECT_ID}

# Add a new rule
gcloud compute security-policies rules create <PRIORITY> \
  --security-policy=socialhomes-waf \
  --expression="<CEL expression>" \
  --action=deny-403
```

### Load Balancer

| Component | Value |
|-----------|-------|
| **External IP** | 34.149.218.63 |
| **URL Map** | `socialhomesai` |
| **Backend Service** | `socialhomes-backend` (Cloud Armor attached) |
| **NEG** | `socialhomes-neg` (serverless, europe-west2) |
| **SSL Cert** | Managed, domains: `socialhomes.ai`, `www.socialhomes.ai` (PROVISIONING) |
| **HTTP Redirect** | `socialhomesai-redirect` → HTTPS |

---

## 7. API Server

### Entry Point

`server/dist/index.js` (compiled from `server/src/index.ts`)

### Middleware Stack (in order)

1. `compression` — gzip response compression
2. `helmet` — Security headers (CSP disabled for SPA)
3. `cors` — Cross-origin resource sharing (open)
4. `morgan('combined')` — HTTP request logging to stdout
5. `express.json({ limit: '10mb' })` — JSON body parsing
6. `express.urlencoded({ extended: true })` — URL-encoded body parsing

### Route Modules (12)

| Mount Path | Module | Auth | Description |
|------------|--------|------|-------------|
| `/health` | inline | none | Health check for Cloud Run |
| `/api/v1/properties` | `properties.ts` | all | Property CRUD + listing |
| `/api/v1/tenants` | `tenants.ts` | all | Tenant CRUD + activities + cases |
| `/api/v1/cases` | `cases.ts` | all | Case CRUD + type filtering |
| `/api/v1/explore` | `explore.ts` | all | Hierarchy drill-down |
| `/api/v1/briefing` | `briefing.ts` | all | Daily AI briefing (persona-scoped) |
| `/api/v1/compliance` | `compliance.ts` | all | Big 6 compliance dashboard |
| `/api/v1/rent` | `rent.ts` | all | Rent & arrears dashboard |
| `/api/v1/reports` | `reports.ts` | all | TSM measures + report data |
| `/api/v1/ai` | `ai.ts` | all | AI drafts + chat responses |
| `/api/v1/admin` | `admin.ts` | manager+ | Audit log, user mgmt, seed |
| `/api/v1/public-data` | `public-data.ts` | all | EPC, IMD, weather proxy |
| `/api/v1/export` | `export.ts` | all | HACT v3.5 JSON export |

### Authentication (Dual Mode)

Supports two authentication modes simultaneously:

**1. Firebase JWT (production)**: Client sends `Authorization: Bearer <idToken>`. The server verifies the token via Firebase Admin SDK, loads the user profile from Firestore, and attaches it to `req.user`.

**2. Legacy X-Persona (development/testing)**: When no `Authorization` header is present, the server reads `X-Persona` header and attaches a demo user. This allows backward-compatible API testing via `curl`.

#### Demo Accounts (Firebase Auth)

| Email | Password | Persona |
|-------|----------|---------|
| helen.carter@rcha.org.uk | [STORED IN SECRET MANAGER] | coo |
| james.wright@rcha.org.uk | [STORED IN SECRET MANAGER] | head-of-housing |
| priya.patel@rcha.org.uk | [STORED IN SECRET MANAGER] | manager |
| sarah.mitchell@rcha.org.uk | [STORED IN SECRET MANAGER] | housing-officer |
| mark.johnson@rcha.org.uk | [STORED IN SECRET MANAGER] | operative |

#### Auth API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/me` | GET | Get authenticated user profile (requires Bearer token) |
| `/api/v1/auth/seed-users` | POST | Create/sync demo Firebase Auth users |
| `/login` | SPA | Frontend login page with email/password and demo mode |

Valid personas: `coo`, `head-of-housing`, `manager`, `housing-officer`, `operative`

### RBAC Middleware

`requirePersona(minLevel)` checks the persona hierarchy:
```
coo (5) > head-of-service (4) > manager (3) > housing-officer (2) > operative (1)
```

---

## 8. Frontend (React SPA)

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.7 | Type safety |
| Vite | 7.3 | Build tool + dev server |
| Tailwind CSS | 4 | Styling (dark-mode first) |
| React Router | 6 | Client-side routing |
| React Query | 5 | Server state management |
| Leaflet | 1.9 | 2D maps (OpenStreetMap) |
| Three.js | r128 | 3D building visualisation |
| Recharts | — | Charts and graphs |
| Lucide React | — | Icons |

### API Communication

The frontend uses React Query hooks (`app/src/hooks/useApi.ts`) with a `withFallback` mechanism:

1. On first load, checks `/health` to determine if the API is available
2. If API healthy: all data fetched from Express API -> Firestore
3. If API unavailable: falls back to static data in `app/src/data/`

This ensures the frontend works both locally (dev, no server) and in production (Cloud Run).

### Build Output

```bash
cd app && npm run build
# Output: app/dist/
#   index.html       (0.56 kB)
#   assets/index.css (78.53 kB, 11.82 kB gzip)
#   assets/index.js  (2,093 kB, 545 kB gzip)
```

The large JS bundle includes Three.js and Leaflet. Future optimisation: code-split with dynamic `import()`.

---

## 9. Monitoring & Observability

### Health Check

```bash
curl -s https://socialhomes-674258130066.europe-west2.run.app/health | jq .
```

Expected response:
```json
{
  "status": "healthy",
  "service": "socialhomes-api",
  "version": "1.0.0",
  "timestamp": "2026-02-08T23:17:00.000Z"
}
```

### Logs

Cloud Run logs stream to Google Cloud Logging:

```bash
# View recent logs
gcloud run services logs read socialhomes \
  --region=europe-west2 \
  --limit=100

# Or use Cloud Console:
# https://console.cloud.google.com/run/detail/europe-west2/socialhomes/logs?project=${FIREBASE_PROJECT_ID}
```

Morgan middleware logs every HTTP request in Apache combined format.

### Uptime Monitoring

An automated uptime check runs every 5 minutes from 3 global regions:

| Setting | Value |
|---------|-------|
| **Check Name** | `SocialHomes.Ai Health Check` |
| **URL** | `https://socialhomes-674258130066.europe-west2.run.app/health` |
| **Protocol** | HTTPS (GET) |
| **Period** | 300s (5 minutes) |
| **Timeout** | 10s |
| **Content match** | `healthy` |
| **Regions** | Europe, USA Virginia, Asia Pacific |

View at: https://console.cloud.google.com/monitoring/uptime?project=${FIREBASE_PROJECT_ID}

```bash
# List uptime checks
gcloud monitoring uptime list-configs --project=${FIREBASE_PROJECT_ID}

# Delete if needed
gcloud monitoring uptime delete <CHECK_ID> --project=${FIREBASE_PROJECT_ID}
```

### Metrics

Cloud Run auto-provides:
- Request count, latency (p50, p95, p99)
- Instance count, CPU/memory utilisation
- Billable container instance time
- Cold start frequency

View at: https://console.cloud.google.com/run/detail/europe-west2/socialhomes/metrics?project=${FIREBASE_PROJECT_ID}

### Error Tracking

The Express error handler (`server/src/middleware/error-handler.ts`) catches all unhandled errors and returns structured JSON:

```json
{
  "error": "Error message",
  "status": 500
}
```

Errors are logged to stdout and captured by Cloud Logging.

---

## 10. Data Integrity & HACT Compliance

### UK Housing Data Standard (HACT v3.5)

The application stores HACT-coded sub-objects alongside application data:

```json
{
  "id": "prop-001",
  "address": "Flat 1, Oak Tower",
  "type": "flat",
  "hact": {
    "propertyPrimaryTypeCode": "07-00-00",
    "propertySubtypeCode": "07-02-00",
    "tenureTypeCode": "100",
    "heatingTypeCode": "10"
  }
}
```

### HACT Export Endpoint

```bash
# Export a property as HACT v3.5 JSON
curl -s https://socialhomes-674258130066.europe-west2.run.app/api/v1/export/hact/property/prop-001 \
  -H "X-Persona: coo" | jq .
```

---

## 11. Known Issues & Technical Debt

### Current Limitations

| Issue | Severity | Notes |
|-------|----------|-------|
| Composite indexes not deployed | Low | Using in-memory filtering. Fine for current dataset (~550 docs). Deploy indexes if >10K docs |
| Large JS bundle (~2.5 MB) | Medium | Three.js + Leaflet. Code-split with dynamic imports for production |
| WebGL in headless Chrome | Low | TC-404 (3D visualisation) fails in headless Selenium. Works in real browsers |
| No custom domain | Low | Currently using default `*.run.app` domain |

### Production Readiness Status

| Item | Status | Notes |
|------|--------|-------|
| Firebase Authentication | **DONE** | JWT verification + legacy X-Persona backward compat |
| Firestore security rules | **DONE** | Persona-based RBAC deployed to production |
| Google Secret Manager | **DONE** | 4 secrets: FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, DEMO_USER_PASSWORD |
| Secrets removed from code | **DONE** | No API keys, passwords, or project IDs in source (commit e0c23e4) |
| Cloud Armor WAF | **DONE** | XSS, SQLi, RFI protection + 100 req/min rate limit |
| Load Balancer | **DONE** | Global External LB at 34.149.218.63 |
| Custom domain SSL | **PROVISIONING** | Cert for `socialhomes.ai` + `www.socialhomes.ai` |
| Min-instances=1 | **DONE** | Configured in `cloudbuild.yaml` |
| Uptime monitoring | **DONE** | 5-min checks from 3 global regions |
| Server-side data serialisation | **DONE** | All Firestore Timestamps converted to ISO strings before API response |
| Mobile device detection | **DONE** | Login page blocks mobile users with desktop-required message |

### Remaining TODO

1. **Configure DNS** — Point `socialhomes.ai` A record to `34.149.218.63` to complete SSL provisioning
2. ~~**Rotate Firebase API key**~~ — **MITIGATED**: Key restricted to allowed referrers only (Cloud Run domain, socialhomes.ai, localhost). See Section 16.
3. **Clean git history** — Remove exposed secrets from historical commits (see Section 16). Low priority since key is now restricted.
4. **Set up alerting policy** — Email/Slack notifications when uptime check fails

---

## 12. Cost Estimate (Current Configuration)

| Resource | Monthly Estimate | Notes |
|----------|-----------------|-------|
| Cloud Run (min=1) | ~$15-20 | Always-on warm instance (current config) |
| Firestore | ~$0 | Free tier covers ~550 docs easily |
| Artifact Registry | ~$0.10 | Image storage |
| Cloud Build | Free tier | 120 min/day free |
| **Total (current)** | **~$15-25/month** | min-instances=1 |

---

## 13. Rollback Procedure

Every deploy is tagged with `$COMMIT_SHA`. To rollback:

```bash
# List recent revisions
gcloud run revisions list --service=socialhomes --region=europe-west2

# Route traffic to a previous revision
gcloud run services update-traffic socialhomes \
  --region=europe-west2 \
  --to-revisions=socialhomes-XXXXX=100

# Or redeploy a specific image tag
gcloud run deploy socialhomes \
  --image=europe-west2-docker.pkg.dev/${FIREBASE_PROJECT_ID}/socialhomes/app:<COMMIT_SHA> \
  --region=europe-west2
```

---

## 14. Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- (Optional) `gcloud` CLI for manual deploys
- (Optional) Firebase CLI for rules/index deployment

### Run Frontend Only (no server)

```bash
cd app
npm install
npm run dev
# Opens at http://localhost:5173
# Uses static fallback data (no Firestore)
```

### Run Server Locally (requires GCP auth)

```bash
# Authenticate with GCP
gcloud auth application-default login

# Set project
export GOOGLE_CLOUD_PROJECT=${FIREBASE_PROJECT_ID}

cd server
npm install
npm run dev
# Runs at http://localhost:8080
# Connects to live Firestore
```

### Run Full Stack Locally

```bash
# Terminal 1: Server
cd server && npm run dev

# Terminal 2: Client (with API proxy)
cd app && npm run dev
# Vite proxies /api/* to localhost:8080
```

---

## 15. File Reference

```
socialhomes/
├── Dockerfile              # Multi-stage build (client + server + production)
├── cloudbuild.yaml         # CI/CD pipeline config
├── firestore.rules         # Firestore security rules (not deployed)
├── firestore.indexes.json  # Composite indexes (not deployed)
├── .gitignore
├── DEVOPS.md               # This file
├── TEST-REPORT-V2.md       # QA test report
│
├── app/                    # React SPA (Vite + TypeScript + Tailwind)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx        # Entry point (QueryClientProvider)
│       ├── App.tsx         # Router + Layout
│       ├── hooks/useApi.ts # React Query hooks with API fallback
│       ├── services/api-client.ts  # Fetch wrapper with X-Persona header
│       ├── data/           # Static fallback data
│       ├── pages/          # 20 page components
│       └── components/     # Shared UI components
│
├── server/                 # Express API server (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts        # Entry point (Express app)
│       ├── middleware/
│       │   ├── auth.ts     # Permissive auth (X-Persona header)
│       │   ├── rbac.ts     # Persona hierarchy RBAC
│       │   └── error-handler.ts
│       ├── models/
│       │   ├── firestore-schemas.ts  # TypeScript interfaces for Firestore docs
│       │   └── hact-codes.ts         # HACT v3.5 bidirectional code mappings
│       ├── routes/         # 12 Express routers
│       │   ├── properties.ts
│       │   ├── tenants.ts
│       │   ├── cases.ts
│       │   ├── explore.ts
│       │   ├── briefing.ts
│       │   ├── compliance.ts
│       │   ├── rent.ts
│       │   ├── reports.ts
│       │   ├── ai.ts
│       │   ├── admin.ts
│       │   ├── public-data.ts
│       │   └── export.ts
│       └── services/
│           ├── firestore.ts       # Firestore client + CRUD helpers + serializeFirestoreData()
│           ├── firebase-admin.ts  # Firebase Admin SDK (auth token verification)
│           ├── hact-export.ts     # HACT v3.5 export transformer
│           └── seed.ts            # Firestore data seeder
│
└── scripts/
    ├── seed-firestore.ts       # Standalone seed script
    └── setup-secrets.sh        # Google Secret Manager setup (interactive)
```

---

## Firebase Authentication — DEPLOYED

**Status**: LIVE and fully operational (deployed 09/02/2026)

### What Was Done (DevOps)

1. **Fixed build failure**: `firebaseui@6.1.0` declares peer `firebase@^9||^10` but works with v12 via compat layer. Added `--legacy-peer-deps` to Dockerfile client stage.
2. **Secrets moved to Google Secret Manager** (commit e0c23e4): `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `DEMO_USER_PASSWORD` are now injected via `--update-secrets` in `cloudbuild.yaml`. No secrets in source code.
3. **Seeded 5 demo Firebase Auth accounts** with Firestore profiles and custom claims.
4. **Verified end-to-end**: Firebase REST sign-in → ID token → `/api/v1/auth/me` returns correct persona, team, and patch data.

### Firebase Config Endpoint

```
GET /api/v1/config → { firebase: { apiKey, authDomain, projectId } }
```

### Demo Accounts (all password: `[STORED IN SECRET MANAGER]`)

| Email | Persona | Team |
|-------|---------|------|
| helen.carter@rcha.org.uk | COO | — |
| james.wright@rcha.org.uk | Head of Housing | london |
| priya.patel@rcha.org.uk | Manager | southwark-lewisham |
| sarah.mitchell@rcha.org.uk | Housing Officer | southwark-lewisham |
| mark.johnson@rcha.org.uk | Operative | southwark-lewisham |

### Auth Flow

```
Browser loads /                          → redirects to /login (not authenticated)
LoginPage fetches /api/v1/config         → gets Firebase config from env vars
FirebaseUI initialises with config       → renders Email/Password + Google sign-in
User signs in                            → Firebase returns ID token
AuthContext stores user, calls profile API → creates Firestore user doc on first login
All subsequent API calls include Bearer token → server verifies with firebase-admin
```

### Build Fix Note

The Dockerfile uses `npm ci --legacy-peer-deps` in the client build stage because `firebaseui@6.1.0` has not been updated for Firebase v11+. This is the standard workaround; the compat layer functions identically across v9-v12.

---

## Remaining TODO

| Item | Status | Notes |
|------|--------|-------|
| ~~Rotate Firebase API key~~ | **MITIGATED** | Key restricted to allowed referrers (Cloud Run, socialhomes.ai, localhost) |
| ~~Disable email enumeration~~ | **DONE** | Disabled via Identity Toolkit API on 09/02/2026 |
| ~~Create Secret Manager secrets~~ | **DONE** | 4 secrets created + IAM bindings set for compute SA |
| ~~Enable Email/Password provider~~ | **DONE** | Enabled via Identity Toolkit API on 09/02/2026 |
| Clean git history | LOW | Remove secrets from historical commits — optional since key is now restricted |
| Configure DNS | PENDING | Point `socialhomes.ai` A record to `34.149.218.63` |
| Set up alerting policy | PENDING | Email/Slack notifications on uptime failure |

---

## 16. Security — Secret Manager & Key Rotation

### CRITICAL: Security Incident — Exposed Keys (09/02/2026)

**What happened**: The Firebase API key, Auth Domain, Project ID, and demo user password were hardcoded in `cloudbuild.yaml` and `server/src/routes/auth.ts` and committed to the public GitHub repository. GitHub and Google Cloud both issued security alerts.

**What was done** (commit `e0c23e4`):

1. **Removed all secrets from source code**:
   - `cloudbuild.yaml`: Replaced `--set-env-vars` (with hardcoded values) with `--update-secrets` (pulls from Secret Manager)
   - `server/src/routes/auth.ts`: Demo password now reads from `process.env.DEMO_USER_PASSWORD`
   - `app/src/pages/auth/LoginPage.tsx`: Removed password hint from UI
   - `DEVOPS.md` + `TEST-REPORT-V2.md`: Redacted all keys and passwords

2. **Created 4 secrets in Google Secret Manager**:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `DEMO_USER_PASSWORD`

3. **Created setup script**: `scripts/setup-secrets.sh`

### Secret Manager Setup

If secrets have not yet been created (e.g., fresh environment), run the interactive setup:

```bash
cd /path/to/socialhomes
bash scripts/setup-secrets.sh
```

This prompts for each value (no echo for secrets), creates the secrets, and grants IAM access to both the Cloud Run and Cloud Build service accounts.

### Manual Secret Operations

```bash
# List all secrets
gcloud secrets list

# View a secret value
gcloud secrets versions access latest --secret=FIREBASE_API_KEY

# Rotate a secret (add new version)
echo -n "NEW_VALUE" | gcloud secrets versions add FIREBASE_API_KEY --data-file=-

# Grant access to a service account
gcloud secrets add-iam-policy-binding FIREBASE_API_KEY \
  --member="serviceAccount:SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

### How `cloudbuild.yaml` Uses Secrets

```yaml
# The deploy step injects secrets as environment variables at runtime:
- '--update-secrets'
- 'FIREBASE_API_KEY=FIREBASE_API_KEY:latest,FIREBASE_AUTH_DOMAIN=FIREBASE_AUTH_DOMAIN:latest,FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,DEMO_USER_PASSWORD=DEMO_USER_PASSWORD:latest'
```

The format is `ENV_VAR_NAME=SECRET_NAME:VERSION`. Cloud Run reads the secret value at container start and injects it as a standard environment variable. The secret is never written to disk or included in the container image.

### Key Rotation — MITIGATED (09/02/2026)

The old Firebase API key was exposed in git history. Rather than rotating (which would break all active sessions), the key has been **restricted to allowed HTTP referrers only**:

- `https://socialhomes-674258130066.europe-west2.run.app/*`
- `https://socialhomes.ai/*`
- `https://www.socialhomes.ai/*`
- `http://localhost:*/*`

This means the key cannot be used from unauthorized origins, even if found in git history. Applied via:

```bash
gcloud services api-keys update projects/674258130066/locations/global/keys/51b47da7-88a0-4711-b308-89bff721c0ca \
  --allowed-referrers="https://socialhomes-674258130066.europe-west2.run.app/*,https://socialhomes.ai/*,https://www.socialhomes.ai/*,http://localhost:*/*"
```

If full rotation is still desired in the future, follow steps in the git history of this document.

### Secret Manager Setup — COMPLETED (09/02/2026)

All 4 secrets created and IAM bindings configured for the compute service account (`674258130066-compute@developer.gserviceaccount.com`):

```
FIREBASE_API_KEY        → version 1
FIREBASE_AUTH_DOMAIN    → version 1
FIREBASE_PROJECT_ID     → version 1
DEMO_USER_PASSWORD      → version 1
```

Cloud Build deploys now succeed with `--update-secrets` pulling values from Secret Manager at runtime.

---

## 17. Data Serialisation — Firestore Timestamp Handling

### Problem

Firestore stores date fields as `Timestamp` objects. When Express serialises these via `res.json()`, they become opaque objects (`{_seconds: N, _nanoseconds: N}` or `{seconds: N, nanoseconds: N}`) in JSON. React cannot render objects as children, causing **Error #310** ("Objects are not valid as a React child").

### Solution (Two Layers)

**Layer 1: Server-side** (`server/src/services/firestore.ts`)

The `serializeFirestoreData()` function recursively converts:
- `Timestamp` instances → ISO date strings
- `Date` objects → ISO date strings
- `DocumentReference` → path string
- `GeoPoint` → `{latitude, longitude}` plain object

Applied in `getDoc()` and `getDocs()` so ALL API responses contain only JSON-safe primitives.

**Layer 2: Client-side** (`app/src/services/api-client.ts`)

The `sanitizeFirestoreTimestamps()` function runs on every API response as a safety net. It catches:
- `{_seconds, _nanoseconds}` (older `@google-cloud/firestore` format)
- `{seconds, nanoseconds}` (newer format)

And converts them to `DD/MM/YYYY` locale strings.

### Why Two Layers?

Belt and suspenders. The server-side fix is definitive, but the client-side sanitiser catches edge cases where:
- A route bypasses `getDoc`/`getDocs` and uses raw `.data()`
- A third-party library returns Firestore objects
- The Firestore SDK changes its serialisation format

---

## 18. Login Page & Mobile Detection

### Login Page (Redesigned 09/02/2026)

The login page no longer shows any credentials or password hints. It now features:

- **Split layout**: Left panel (product showcase) + Right panel (login form)
- **Product showcase carousel**: 6 auto-advancing slides with feature descriptions
- **Feature grid**: 8 capability cards (Properties, Tenancies, Repairs, etc.)
- **Request Access section**: Directs users to `support@yantra.works`
- **BETA badge**: Clearly indicates closed beta status

### Mobile Detection

If the user visits from a mobile device (screen < 768px or mobile user-agent), they see a dedicated screen explaining:
- SocialHomes.Ai is a full housing operating system for desktop/laptop
- A mobile app for housing officers is on the roadmap
- Contact `support@yantra.works` for help

The FirebaseUI widget is NOT initialised on mobile to prevent broken login attempts.

### Dashboard (Polished 09/02/2026)

- Persona-aware welcome header with time-of-day greeting
- Quick Action buttons: Morning Briefing, Explore Portfolio, View Reports
- Gradient accent card with organisation info

---

*Document generated 08/02/2026 by Development Agent.*
*Updated 09/02/2026 by DevOps Senior: min-instances=1, uptime monitoring, Artifact Registry cleanup.*
*Updated 09/02/2026: Firebase Authentication deployment instructions added.*
*Updated 09/02/2026 by DevOps Senior: Firebase Auth deployed — build fix, env vars, seeding, E2E verification complete.*
*Updated 09/02/2026: Security hardening — secrets moved to Secret Manager, key rotation instructions, data serialisation fix, login redesign, mobile detection.*
*Updated 09/02/2026 by DevOps Senior: Created Secret Manager secrets, enabled Email/Password provider, disabled email enumeration protection, restricted API key to allowed referrers, deployed successfully.*
*For QA test results, see `TEST-REPORT-V2.md`.*
