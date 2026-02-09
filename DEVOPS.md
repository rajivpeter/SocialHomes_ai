# SocialHomes.Ai — DevOps & Infrastructure Guide

**Last Updated**: 09/02/2026
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
| **GCP Project** | `gen-lang-client-0146156913` |
| **Cloud Run Service** | `socialhomes` in `europe-west2` |
| **Artifact Registry** | `europe-west2-docker.pkg.dev/gen-lang-client-0146156913/socialhomes/app` |
| **Firestore Database** | Default database in `gen-lang-client-0146156913` |

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
# https://console.cloud.google.com/cloud-build/builds?project=gen-lang-client-0146156913
```

### Manual Deploy (if needed)

```bash
# Build and push image locally
gcloud builds submit --config=cloudbuild.yaml \
  --project=gen-lang-client-0146156913

# Or deploy a specific image
gcloud run deploy socialhomes \
  --image=europe-west2-docker.pkg.dev/gen-lang-client-0146156913/socialhomes/app:latest \
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
  -e GOOGLE_CLOUD_PROJECT=gen-lang-client-0146156913 \
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

### Environment Variables (set in Cloud Run)

| Variable | Value | Source |
|----------|-------|--------|
| `PORT` | `8080` | Cloud Run default |
| `NODE_ENV` | `production` | Set in cloudbuild.yaml |
| `GOOGLE_CLOUD_PROJECT` | Auto-injected | Cloud Run metadata |

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

- **GCP Project**: `gen-lang-client-0146156913`
- **Database**: `(default)` in Firestore Native mode
- **Authentication**: Cloud Run's default service account auto-authenticates
- **Console**: https://console.cloud.google.com/firestore/databases?project=gen-lang-client-0146156913

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
firebase init firestore --project gen-lang-client-0146156913
firebase deploy --only firestore:indexes
```

Then refactor the API routes back to Firestore-native `where()` + `orderBy()` queries for performance.

### Security Rules

The file `firestore.rules` defines persona-based RBAC rules. These are **not yet deployed** because:
1. Firebase Authentication is not yet integrated
2. The server-side Express API handles all Firestore access (admin SDK bypasses rules)
3. Direct client-side Firestore access is not used

Deploy when Firebase Auth is integrated:

```bash
firebase deploy --only firestore:rules
```

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

### Authentication (v1 — Permissive)

Currently uses a header-based persona system (`X-Persona` header). The `authMiddleware` attaches a user object to `req.user` based on the header value. This is **not production-grade security** — it's a demo/development mode.

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
# https://console.cloud.google.com/run/detail/europe-west2/socialhomes/logs?project=gen-lang-client-0146156913
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

View at: https://console.cloud.google.com/monitoring/uptime?project=gen-lang-client-0146156913

```bash
# List uptime checks
gcloud monitoring uptime list-configs --project=gen-lang-client-0146156913

# Delete if needed
gcloud monitoring uptime delete <CHECK_ID> --project=gen-lang-client-0146156913
```

### Metrics

Cloud Run auto-provides:
- Request count, latency (p50, p95, p99)
- Instance count, CPU/memory utilisation
- Billable container instance time
- Cold start frequency

View at: https://console.cloud.google.com/run/detail/europe-west2/socialhomes/metrics?project=gen-lang-client-0146156913

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
| No Firebase Auth | High | Using permissive header-based personas. Must integrate Firebase Auth before production use |
| Composite indexes not deployed | Low | Using in-memory filtering. Fine for current dataset (~550 docs). Deploy indexes if >10K docs |
| Firestore security rules not deployed | Low | Server-side admin SDK bypasses rules. Deploy when adding client-side Firestore access |
| Large JS bundle (2 MB) | Medium | Three.js + Leaflet. Code-split with dynamic imports for production |
| WebGL in headless Chrome | Low | TC-404 (3D visualisation) fails in headless Selenium. Works in real browsers |
| No HTTPS certificate management | None | Cloud Run provides automatic TLS |
| No custom domain | Low | Currently using default `*.run.app` domain |

### Immediate TODOs for Production Readiness

1. **Integrate Firebase Authentication** — Replace `X-Persona` header with JWT tokens
2. **Deploy Firestore security rules** — After Firebase Auth is set up
3. **Set up custom domain** — Map `app.socialhomes.ai` or similar to Cloud Run
4. **Add Google Secret Manager** — For any future API keys (OpenAI, etc.)
5. **Enable Cloud Armor** — WAF/DDoS protection for the Cloud Run service
6. ~~**Set min-instances=1**~~ — DONE (configured in `cloudbuild.yaml`)
7. ~~**Add uptime monitoring**~~ — DONE (5-min checks from 3 global regions)

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
  --image=europe-west2-docker.pkg.dev/gen-lang-client-0146156913/socialhomes/app:<COMMIT_SHA> \
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
export GOOGLE_CLOUD_PROJECT=gen-lang-client-0146156913

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
│           ├── firestore.ts    # Firestore client + CRUD helpers
│           ├── hact-export.ts  # HACT v3.5 export transformer
│           └── seed.ts         # Firestore data seeder
│
└── scripts/
    └── seed-firestore.ts   # Standalone seed script
```

---

*Document generated 08/02/2026 by Development Agent.*
*Updated 09/02/2026 by DevOps Senior: min-instances=1, uptime monitoring, Artifact Registry cleanup.*
*For QA test results, see `TEST-REPORT-V2.md`.*
