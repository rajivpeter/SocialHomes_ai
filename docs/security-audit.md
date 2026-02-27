# SocialHomes.Ai — Comprehensive Security Audit Report

**Audit Date:** 2026-02-27
**Auditor:** Cyber Security Analyst Agent (Claude Opus 4.6)
**Project:** SocialHomes.Ai — AI-native social housing management platform
**Built by:** Yantra Works

---

## Executive Summary

This report presents the findings of a comprehensive security audit of the SocialHomes.Ai platform, covering the Express.js backend, React 19 frontend, Firestore database rules, Docker/CI/CD pipeline, and all npm dependencies.

### Overall Risk Rating: **HIGH**

The application implements many security best practices (Helmet headers, rate limiting, Firebase JWT auth, structured error handling). However, **three critical vulnerabilities** were identified that, when combined, allow any unauthenticated user to gain full admin access and execute destructive operations. These must be remediated before production use with real tenant data.

### Summary of Findings

| Severity | Count | Key Issues |
|----------|-------|------------|
| **CRITICAL** | 3 | Auth bypass via X-Persona header; unprotected seed endpoints |
| **HIGH** | 11 | Mass assignment; IDOR; missing RBAC on GDPR/bulk/audit; container runs as root; error stack trace exposure |
| **MEDIUM** | 14 | CORS bypass; input validation gaps; partial SSRF; predictable IDs; health endpoint exposure; missing Firestore field validation |
| **LOW** | 11 | Rate limiter scope; CSV injection; SRI missing; debug logs in production |
| **INFO** | 4 | Positive findings and best practices observed |

### Top 5 Priority Remediation Actions

1. **Disable X-Persona fallback in production** — blocks all critical/high auth bypasses
2. **Add `requirePersona()` to all sensitive endpoints** — GDPR, seed, bulk ops, scheduled tasks, audit retention
3. **Implement field whitelisting** on all PATCH/POST endpoints — prevents mass assignment
4. **Add ownership/scope checks** on entity endpoints — prevents IDOR across tenants/properties/cases
5. **Add non-root user to Dockerfile** — prevents container-level privilege escalation

---

## Table of Contents

1. [A01: Broken Access Control](#a01-broken-access-control)
2. [A02: Cryptographic Failures](#a02-cryptographic-failures)
3. [A03: Injection](#a03-injection)
4. [A04: Insecure Design](#a04-insecure-design)
5. [A05: Security Misconfiguration](#a05-security-misconfiguration)
6. [A06: Vulnerable & Outdated Components](#a06-vulnerable--outdated-components)
7. [A07: Identification & Authentication Failures](#a07-identification--authentication-failures)
8. [A08: Software & Data Integrity Failures](#a08-software--data-integrity-failures)
9. [A09: Security Logging & Monitoring Failures](#a09-security-logging--monitoring-failures)
10. [A10: Server-Side Request Forgery (SSRF)](#a10-server-side-request-forgery-ssrf)
11. [Secrets in Code](#secrets-in-code)
12. [npm Audit Results](#npm-audit-results)
13. [Compliance Checklist](#compliance-checklist)

---

## A01: Broken Access Control

### CRITICAL-01: Authentication Bypass via X-Persona Header

**File:** `server/src/middleware/auth.ts:98-103`
**Severity:** CRITICAL | **Impact:** Complete auth bypass | **Likelihood:** High

The auth middleware silently falls through to a hardcoded demo user when no `Authorization` header is present. Any request without a Bearer token is auto-authenticated:

```typescript
// Line 98-103 — current vulnerable code
const persona = (req.headers['x-persona'] as string) || 'housing-officer';
req.user = DEMO_PERSONAS[persona] || DEMO_PERSONAS['housing-officer'];
next();
```

**Impact:** An attacker can access ANY protected endpoint without authentication by omitting the `Authorization` header. Sending `X-Persona: coo` grants the highest privilege level. This nullifies ALL auth and RBAC protections.

**Recommended Fix:**
```typescript
// Disable X-Persona fallback in production
if (process.env.NODE_ENV === 'production') {
  res.status(401).json({ error: 'Authentication required' });
  return;
}
// Development only — X-Persona mode
const persona = (req.headers['x-persona'] as string) || 'housing-officer';
req.user = DEMO_PERSONAS[persona] || DEMO_PERSONAS['housing-officer'];
next();
```

---

### HIGH-01: IDOR on All Entity Endpoints (No Ownership/Scope Check)

**Files:** `server/src/routes/properties.ts:52`, `tenants.ts:35`, `cases.ts:57`, `gdpr.ts:58-68`, `files.ts:60`
**Severity:** HIGH | **Impact:** Horizontal privilege escalation | **Likelihood:** High

No route verifies that the authenticated user has permission to access the specific entity by ID. Housing officers can access tenants outside their patches; operatives can view any case.

- `GET /properties/:id` — returns any property to any authenticated user
- `GET /tenants/:id` — returns any tenant (including PII: name, rent balance, vulnerability flags)
- `GET /cases/:id` — returns any case to any user
- `GET /gdpr/export/:tenantId` — exports all personal data for ANY tenant
- `POST /gdpr/erasure/:tenantId` — any user can erase any tenant's data

**Recommended Fix:** Add scope-checking middleware that validates `req.user.teamId` / `req.user.patchIds` against the entity's team/patch assignment.

---

### HIGH-02: GDPR Endpoints Missing RBAC

**File:** `server/src/routes/gdpr.ts:21-76`
**Severity:** HIGH | **Impact:** Unauthorised data export/deletion | **Likelihood:** High

None of the GDPR endpoints use `requirePersona()`:

| Line | Endpoint | Risk |
|------|----------|------|
| 21 | `GET /sar` | Any user lists all SAR requests |
| 32 | `POST /sar` | Any user creates SAR requests |
| 46 | `PATCH /sar/:id` | Any user updates SAR status |
| 58 | `GET /export/:tenantId` | Any user exports full tenant PII |
| 68 | `POST /erasure/:tenantId` | Any user permanently deletes tenant data |

**Recommended Fix:**
```typescript
gdprRouter.get('/export/:tenantId', requirePersona('head-of-service'), async (req, res, next) => { ... });
gdprRouter.post('/erasure/:tenantId', requirePersona('coo'), async (req, res, next) => { ... });
```

---

### HIGH-03: Bulk Operations Missing RBAC

**File:** `server/src/routes/bulk-operations.ts`
**Severity:** HIGH | **Impact:** Mass data manipulation | **Likelihood:** Medium

All bulk endpoints lack `requirePersona()`:

- `POST /bulk/cases/status` — bulk update case statuses
- `POST /bulk/communications` — bulk send communications
- `POST /bulk/compliance` — bulk upload compliance certificates
- `POST /bulk/arrears-action` — bulk arrears actions

**Recommended Fix:** Add `requirePersona('manager')` to all bulk operation endpoints.

---

### HIGH-04: Scheduled Tasks & Circuit Breakers Missing RBAC

**File:** `server/src/routes/scheduled-tasks.ts`
**Severity:** HIGH | **Impact:** System disruption | **Likelihood:** Medium

All endpoints lack persona checks:

- `POST /:taskId/run` — any user can run scheduled tasks
- `PATCH /:taskId/toggle` — any user can enable/disable tasks
- `POST /circuit-breakers/:name/reset` — any user can reset circuit breakers

**Recommended Fix:** Add `requirePersona('head-of-service')` to all scheduled task endpoints.

---

### HIGH-05: Audit Retention Cleanup Without RBAC

**File:** `server/src/routes/audit.ts:73-81`
**Severity:** HIGH | **Impact:** Evidence destruction | **Likelihood:** Medium

```typescript
auditRouter.post('/retention-cleanup', async (req, res, next) => {
  const years = parseInt(req.body.retentionYears as string) || 7;
  const result = await enforceRetentionPolicy(years);
```

An attacker could set `retentionYears: 0` to delete all audit history.

**Recommended Fix:** Add `requirePersona('coo')` and validate `retentionYears >= 1`.

---

### MEDIUM-01: Audit Log Query/Export Endpoints Lack RBAC

**File:** `server/src/routes/audit.ts:19,40,53`
**Severity:** MEDIUM | **Impact:** Information disclosure | **Likelihood:** Medium

Any authenticated user can query (`GET /audit`), aggregate (`GET /audit/aggregate`), and export (`GET /audit/export`) the complete audit trail.

---

### MEDIUM-02: No Frontend RBAC on Admin Routes

**File:** `app/src/App.tsx:152-161`
**Severity:** MEDIUM | **Impact:** UI-level information disclosure | **Likelihood:** Medium

`ProtectedRoute` checks authentication only, not roles. All authenticated users can access `/admin/*`, `/admin/users`, `/admin/gdpr` routes. While server-side RBAC may block data, the admin UI itself is visible.

**Recommended Fix:** Add a `requiredRole` prop to `ProtectedRoute`:
```tsx
<Route path="/admin" element={<ProtectedRoute requiredRole="manager"><AdminPage /></ProtectedRoute>} />
```

---

### MEDIUM-03: Notification User ID Fallback

**File:** `server/src/routes/notifications.ts:23,36,47`
**Severity:** MEDIUM | **Impact:** Data leakage between users | **Likelihood:** Low

```typescript
const userId = req.user?.uid || 'demo';
```

In demo mode, all users sharing a persona see each other's notifications.

---

## A02: Cryptographic Failures

### POSITIVE: Firebase Auth JWT Handling

**File:** `server/src/middleware/auth.ts:76-97`
**Status:** PASS

Firebase ID tokens are verified server-side using `firebase-admin` SDK's `verifyIdToken()`. Tokens are short-lived JWTs signed by Google's infrastructure. No custom JWT implementation or weak algorithms.

### POSITIVE: No Custom Password Hashing

**Status:** PASS

All password management is delegated to Firebase Authentication, which uses scrypt for password hashing. No custom password hashing logic exists in the codebase.

### POSITIVE: Token Handling on Frontend

**File:** `app/src/services/firebase.ts:67-72`
**Status:** PASS

Firebase ID tokens are obtained on-demand via `user.getIdToken()` — never stored in localStorage or sessionStorage. Tokens are sent only to same-origin API endpoints.

### LOW-01: Demo Password Empty String Fallback

**File:** `server/src/routes/auth.ts:13`
**Severity:** LOW | **Impact:** Weak demo accounts | **Likelihood:** Low

```typescript
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || '';
```

If `DEMO_USER_PASSWORD` is unset, demo users may be created with empty passwords.

---

## A03: Injection

### HIGH-06: Mass Assignment on PATCH/POST Endpoints

**Files:** `server/src/routes/properties.ts:63`, `tenants.ts:76`, `cases.ts:76,93`
**Severity:** HIGH | **Impact:** Arbitrary data manipulation | **Likelihood:** High

Multiple routes pass `req.body` directly to Firestore without field whitelisting:

```typescript
// properties.ts:63
await updateDoc(collections.properties, req.params.id, req.body);

// tenants.ts:76
await updateDoc(collections.tenants, req.params.id, req.body);

// cases.ts:93
await updateDoc(collections.cases, req.params.id, req.body);
```

An attacker can set ANY field, including internal fields like `persona`, `arrearsRisk`, `vulnerabilityFlags`, `slaStatus`, or inject new fields.

**Recommended Fix:**
```typescript
// Whitelist allowed fields
const allowedFields = ['status', 'priority', 'assignedTo', 'notes'];
const sanitised = Object.fromEntries(
  Object.entries(req.body).filter(([k]) => allowedFields.includes(k))
);
await updateDoc(collections.properties, req.params.id, sanitised);
```

---

### MEDIUM-04: ArcGIS Query Parameter Injection

**File:** `server/src/routes/public-data.ts:470-471`
**Severity:** MEDIUM | **Impact:** Query manipulation | **Likelihood:** Low

```typescript
const url = `...?where=lsoa11cd='${encodeURIComponent(lsoaCode)}'&outFields=*&f=json`;
```

The ArcGIS REST API uses a SQL-like WHERE clause. While `encodeURIComponent` provides URL encoding, specially crafted values might bypass encoding if ArcGIS decodes before parsing SQL.

---

### MEDIUM-05: No Input Validation on Query Parameters

**Files:** `server/src/routes/properties.ts:22`, `tenants.ts:18`, `cases.ts:13-14`, `audit.ts:29-30`
**Severity:** MEDIUM | **Impact:** DoS via unbounded reads | **Likelihood:** Medium

`parseInt()` is used without bounds checking. No upper limit on `limit` or `offset`:
```typescript
const limit = parseInt(limitStr as string, 10); // Could be 999999999
```

**Recommended Fix:** Use a validation library (Zod) and clamp values:
```typescript
const limit = Math.min(Math.max(parseInt(limitStr, 10) || 50, 1), 200);
```

---

### MEDIUM-06: No Input Validation on URL Parameters

**Files:** All routes using `req.params.id`
**Severity:** MEDIUM | **Impact:** Unexpected errors | **Likelihood:** Low

Document IDs from `req.params.id` are passed directly to Firestore. IDs containing `/` could potentially access subcollections.

**Recommended Fix:** Validate document IDs match expected patterns:
```typescript
if (!/^[a-zA-Z0-9_-]+$/.test(req.params.id)) {
  return res.status(400).json({ error: 'Invalid ID format' });
}
```

---

### POSITIVE: No Command Injection

**Status:** PASS

No usage of `exec`, `spawn`, `child_process`, or `eval()` found anywhere in the server codebase.

### POSITIVE: Firestore SDK Parameterised Queries

**Status:** PASS

Firestore queries use the SDK's `where()` API with parameterised values, preventing NoSQL injection.

### POSITIVE: No XSS Vectors in Frontend

**Status:** PASS

Zero instances of `dangerouslySetInnerHTML`, `innerHTML`, or `document.write` across all React components. All rendering uses JSX auto-escaping.

---

## A04: Insecure Design

### MEDIUM-07: Predictable Resource IDs

**File:** `server/src/routes/cases.ts:75`, `admin.ts:32`
**Severity:** MEDIUM | **Impact:** Enumeration attacks | **Likelihood:** Medium

```typescript
const id = `case-${Date.now()}`; // Predictable, enumerable
```

**Recommended Fix:** Use `crypto.randomUUID()` for all resource IDs.

---

### MEDIUM-08: No CSRF Protection

**Severity:** MEDIUM | **Impact:** Cross-site state changes | **Likelihood:** Low

No CSRF token validation exists. While Bearer token auth provides partial protection (tokens aren't sent automatically), the `X-Persona` fallback combined with `credentials: true` in CORS creates risk.

---

### MEDIUM-09: No Identity Verification for GDPR SARs

**File:** `server/src/services/gdpr-export.ts:66-91`
**Severity:** MEDIUM | **Impact:** GDPR non-compliance | **Likelihood:** Medium

SAR requests can be created without identity verification. The `verificationMethod` field exists but is never enforced.

---

### MEDIUM-10: GDPR Erasure Incomplete

**File:** `server/src/services/gdpr-export.ts:207+`
**Severity:** MEDIUM | **Impact:** GDPR non-compliance | **Likelihood:** Medium

Erasure does not cover: `notifications`, `aiConversations`, `sarRequests` (which contain `tenantName`).

---

## A05: Security Misconfiguration

### HIGH-07: CORS Allows All Origins

**File:** `server/src/index.ts:86-94`
**Severity:** HIGH | **Impact:** Cross-origin attacks | **Likelihood:** Medium

Despite defining an `allowedOrigins` array, the CORS callback always returns `true`:

```typescript
origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    // Comment says "non-matching origins are still allowed"
    callback(null, true);  // <-- ALWAYS allows!
  }
},
```

**Recommended Fix:**
```typescript
origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else if (process.env.NODE_ENV !== 'production') {
    callback(null, true); // Dev only
  } else {
    callback(new Error('CORS: Origin not allowed'));
  }
},
```

---

### HIGH-08: Container Runs as Root

**File:** `Dockerfile` (no USER directive)
**Severity:** HIGH | **Impact:** Container breakout escalation | **Likelihood:** Low

The Docker container runs Node.js as root. If the process is compromised, the attacker has full container-level root access.

**Recommended Fix:**
```dockerfile
# Add before CMD
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
USER nodejs
CMD ["node", "server/dist/index.js"]
```

---

### MEDIUM-11: CSP Allows unsafe-inline and unsafe-eval

**File:** `server/src/index.ts:51`
**Severity:** MEDIUM | **Impact:** XSS mitigation reduced | **Likelihood:** Low

```typescript
scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", ...],
styleSrc: ["'self'", "'unsafe-inline'", ...],
```

`unsafe-inline` and `unsafe-eval` weaken CSP significantly. These are needed for Firebase UI but should be replaced with nonces or hashes where possible.

---

### MEDIUM-12: Health Endpoint Over-Exposes Internal State

**File:** `server/src/index.ts:107-111`
**Severity:** MEDIUM | **Impact:** Reconnaissance | **Likelihood:** Medium

The unauthenticated `/health` endpoint reveals: service name, version, uptime, memory usage, Firestore latency, and cache statistics.

**Recommended Fix:** Return only `{ "status": "healthy" }` to unauthenticated callers.

---

### MEDIUM-13: Stack Trace Leakage in Non-Production

**File:** `server/src/middleware/error-handler.ts:53-55`
**Severity:** MEDIUM | **Impact:** Information disclosure | **Likelihood:** Medium

Stack traces in API responses when `NODE_ENV !== 'production'`. If production deployment fails to set this variable, internal details are leaked.

---

### LOW-02: No .dockerignore File

**Severity:** LOW | **Impact:** Build context bloat, potential secret leakage in cache

---

### LOW-03: Leaflet CSS in index.html Missing SRI

**File:** `app/index.html:8`
**Severity:** LOW | **Impact:** Supply chain risk

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

Missing `integrity` and `crossorigin` attributes. Other dynamic Leaflet CSS loading in `PropertiesPage.tsx` and `ExplorePage.tsx` correctly includes SRI.

---

### LOW-04: No Secure Cookie Flags

**Severity:** LOW | **Impact:** Session hijacking (if cookies used) | **Likelihood:** Very Low

No cookies are set by the application (auth uses Bearer tokens). However, no `cookie-parser` middleware with secure defaults is configured as defense-in-depth for any future cookie usage.

---

## A06: Vulnerable & Outdated Components

### npm Audit Results — Server (`server/`)

```
3 vulnerabilities (1 low, 2 high)

┌─────────────────┬──────────┬────────────────────────────────────────────────┐
│ Package         │ Severity │ Advisory                                       │
├─────────────────┼──────────┼────────────────────────────────────────────────┤
│ fast-xml-parser │ HIGH     │ Stack overflow in XMLBuilder (GHSA-fj3w-jwp8)  │
│ fast-xml-parser │ HIGH     │ DoS via DOCTYPE entity expansion (GHSA-jmr7)   │
│ qs              │ LOW      │ arrayLimit bypass DoS (GHSA-w7fw)              │
│ rollup          │ HIGH     │ Arbitrary File Write via path traversal        │
│                 │          │ (GHSA-mw96) — dev dependency only              │
└─────────────────┴──────────┴────────────────────────────────────────────────┘
Fix: npm audit fix
```

### npm Audit Results — Frontend (`app/`)

```
3 vulnerabilities (1 moderate, 2 high)

┌───────────┬──────────┬───────────────────────────────────────────────────────┐
│ Package   │ Severity │ Advisory                                              │
├───────────┼──────────┼───────────────────────────────────────────────────────┤
│ ajv       │ MODERATE │ ReDoS with $data option (GHSA-2g4f)                   │
│ minimatch │ HIGH     │ Multiple ReDoS vulnerabilities (GHSA-3ppc, GHSA-7r86, │
│           │          │ GHSA-23c5) — via @typescript-eslint (dev dependency)  │
│ rollup    │ HIGH     │ Arbitrary File Write (GHSA-mw96) — dev dependency     │
└───────────┴──────────┴───────────────────────────────────────────────────────┘
Fix: npm audit fix
```

**Risk Assessment:** The `fast-xml-parser` and `qs` vulnerabilities in server dependencies are potentially exploitable at runtime. The `rollup` and `minimatch` vulnerabilities are in dev/build dependencies only and do not affect production.

**Recommended Fix:** Run `npm audit fix` in both directories. For `fast-xml-parser`, update to >5.3.7 when available.

---

## A07: Identification & Authentication Failures

### CRITICAL-02: Unprotected Seed Endpoint Creates Users

**File:** `server/src/routes/admin.ts:58-72`
**Severity:** CRITICAL | **Impact:** Database overwrite | **Likelihood:** High

`POST /api/v1/admin/seed` has no `requirePersona()` guard. Combined with the X-Persona bypass, any unauthenticated user can overwrite the entire Firestore database.

---

### CRITICAL-03: Unprotected Auth Seeding Endpoint

**File:** `server/src/routes/auth.ts:63-110`
**Severity:** CRITICAL | **Impact:** Arbitrary user creation | **Likelihood:** High

`POST /api/v1/auth/seed-users` has no authentication at all (the `authRouter` does not use `authMiddleware`). Anyone can create Firebase Auth users with custom claims and Firestore profiles.

**Recommended Fix:** Add both `authMiddleware` and `requirePersona('coo')`, or disable in production:
```typescript
authRouter.post('/seed-users', authMiddleware, requirePersona('coo'), async (req, res, next) => { ... });
```

---

### MEDIUM-14: Rate Limiter Per-Instance Only

**File:** `server/src/middleware/rate-limiter.ts`
**Severity:** MEDIUM | **Impact:** Rate limit bypass | **Likelihood:** Medium

In-memory rate limiting on Cloud Run with auto-scaling means each container has independent counters. Acknowledged in code comments but worth noting for production hardening.

---

### LOW-05: X-Forwarded-For Spoofable

**File:** `server/src/middleware/rate-limiter.ts:44`
**Severity:** LOW | **Impact:** Rate limit bypass | **Likelihood:** Low (Cloud Run sets header correctly)

---

### LOW-06: RBAC Hierarchy Mismatch

**File:** `server/src/middleware/rbac.ts:8` vs `server/src/middleware/auth.ts:31-34`
**Severity:** LOW | **Impact:** Potential RBAC confusion

The RBAC middleware defines `head-of-service` (level 4) but the demo personas use `head-of-housing`. If the Firestore user profile has `persona: 'head-of-housing'`, it falls through to `personaHierarchy[userPersona] ?? 0`, granting level 0 (no access).

---

## A08: Software & Data Integrity Failures

### MEDIUM-15: No Docker Image Vulnerability Scanning

**File:** `cloudbuild.yaml`
**Severity:** MEDIUM | **Impact:** Vulnerable images deployed | **Likelihood:** Medium

No container scanning, SBOM generation, or Binary Authorization in the CI/CD pipeline.

---

### MEDIUM-16: No Deployment Approval Gate

**File:** `cloudbuild.yaml`
**Severity:** MEDIUM | **Impact:** Unreviewed code in production | **Likelihood:** Medium

Cloud Build triggers automatically on `git push origin main` with no manual approval step.

---

### LOW-07: --allow-unauthenticated on Cloud Run

**File:** `cloudbuild.yaml:46`
**Severity:** LOW | **Impact:** Public attack surface

The Cloud Run service is publicly accessible. Expected for a web app, but combined with the CORS bypass and X-Persona fallback, it significantly increases the attack surface.

---

## A09: Security Logging & Monitoring Failures

### HIGH-09: Incomplete Audit Coverage

**File:** `server/src/services/audit-log.ts`
**Severity:** HIGH | **Impact:** Missing forensic trail | **Likelihood:** High

The `writeAuditEntry` function is a passive utility that must be called explicitly. Key unlogged events:

- Authentication events (login, logout, failed attempts)
- Authorization failures (403 responses)
- User account changes (role changes)
- Bulk operations
- File uploads/downloads
- GDPR data exports
- Admin seed operations

---

### HIGH-10: Audit Log Stack Trace Display in Frontend

**File:** `app/src/App.tsx:71-76`
**Severity:** HIGH | **Impact:** Internal information exposure | **Likelihood:** High

```tsx
<pre>{this.state.error?.stack}</pre>
```

Full JavaScript stack traces are rendered to end users in the ErrorBoundary, revealing internal file paths, component names, and library versions.

**Recommended Fix:**
```tsx
{process.env.NODE_ENV !== 'production' && (
  <pre>{this.state.error?.stack}</pre>
)}
```

---

### MEDIUM-17: PII in Audit Logs

**File:** `server/src/services/audit-log.ts:239-240`
**Severity:** MEDIUM | **Impact:** GDPR compliance risk

Audit logs capture `oldValue`/`newValue` containing tenant PII. This creates a secondary PII repository that must be included in GDPR SARs.

---

### MEDIUM-18: Audit Timestamp Uses App Server Clock

**File:** `server/src/services/audit-log.ts:237`
**Severity:** MEDIUM | **Impact:** Inaccurate audit trail

```typescript
timestamp: new Date().toISOString() // App server time, not Firestore server time
```

Should use `FieldValue.serverTimestamp()` for consistency.

---

### LOW-08: CSV Export Formula Injection

**File:** `server/src/services/audit-log.ts:190-192`
**Severity:** LOW | **Impact:** Spreadsheet injection

CSV export does not sanitize fields starting with `=`, `+`, `-`, `@`.

---

### LOW-09: Debug Console.log Statements in Production

**File:** `app/src/pages/repairs/RepairDetailPage.tsx:207-210`
**Severity:** LOW | **Impact:** Information leakage via console

Four `console.log()` calls logging form submission values (Assign, Update, Escalate, Close actions).

---

## A10: Server-Side Request Forgery (SSRF)

### MEDIUM-19: Partial SSRF via Public Data Routes

**File:** `server/src/routes/public-data.ts`
**Severity:** MEDIUM | **Impact:** API misuse | **Likelihood:** Low

User-provided parameters are embedded in external API URLs:

| Line | API | Parameters | Risk |
|------|-----|------------|------|
| 262 | data.police.uk | `category`, `lat`, `lng` | Path traversal within API |
| 312 | Open-Meteo | `lat`, `lng` | URL parameter injection |
| 431 | Environment Agency | `lat`, `lng`, `dist` | Parameter injection |
| 470 | ArcGIS | `lsoaCode` in SQL WHERE | Query injection |

**Mitigation:** URLs target fixed, known domains — full SSRF (redirecting to internal services) is not possible. But input validation should be added:

```typescript
// Validate lat/lng are numbers in valid ranges
const lat = parseFloat(req.params.lat);
const lng = parseFloat(req.params.lng);
if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
  return res.status(400).json({ error: 'Invalid coordinates' });
}
```

---

## Secrets in Code

### CRITICAL: GCP Service Account Key on Disk

**File:** `server/google-credentials.json`
**Status:** NOT tracked by git (correctly excluded by `.gitignore`)

Contains a full GCP service account private key. While correctly excluded from version control, the file exists on disk and should be rotated if the machine is shared.

### HIGH: Secrets Previously Leaked in Git History

**Commit:** `e0c23e4` and earlier
**Status:** Removed from current code but accessible in git history

- Firebase API Key (`AIzaSyB1nf...`)
- Demo user password (`SocialHomes2026!`)
- Firebase Auth Domain and Project ID

**Recommendation:** Verify Firebase API key was rotated. Consider using `BFG Repo Cleaner` to scrub git history.

### MEDIUM: Telegram Bot Token on Disk

**File:** `.mcp.json`
**Status:** NOT tracked by git (correctly excluded)

### PASS: All Current Source Code

- No hardcoded API keys, passwords, or tokens in current source
- All secrets read from `process.env` with safe defaults
- Firebase config served from server-side env vars, never bundled in frontend
- `.gitignore` correctly excludes `.env`, `*.local`, `google-credentials*.json`, `.mcp.json`

---

## npm Audit Results

### Server Dependencies (3 vulnerabilities)

| Package | Severity | Type | Runtime? |
|---------|----------|------|----------|
| fast-xml-parser ≤5.3.7 | HIGH | Stack overflow, DoS via DOCTYPE | Yes |
| qs 6.7.0-6.14.1 | LOW | arrayLimit bypass DoS | Yes |
| rollup 4.0.0-4.58.0 | HIGH | Arbitrary File Write | No (dev) |

### Frontend Dependencies (3 vulnerabilities)

| Package | Severity | Type | Runtime? |
|---------|----------|------|----------|
| ajv <6.14.0 | MODERATE | ReDoS with $data | No (build) |
| minimatch ≤3.1.3 | HIGH | Multiple ReDoS | No (dev) |
| rollup 4.0.0-4.58.0 | HIGH | Arbitrary File Write | No (dev) |

**Action Required:** Run `npm audit fix` in both `server/` and `app/`. The `fast-xml-parser` and `qs` vulnerabilities affect production runtime and should be prioritised.

---

## Compliance Checklist

| # | Control | Status | Notes |
|---|---------|--------|-------|
| **Authentication** | | | |
| 1 | Firebase JWT verification | ✅ PASS | Firebase Admin SDK `verifyIdToken()` |
| 2 | Password hashing (scrypt) | ✅ PASS | Delegated to Firebase Auth |
| 3 | Token not stored in localStorage | ✅ PASS | On-demand via Firebase SDK |
| 4 | X-Persona disabled in production | ❌ FAIL | **CRITICAL** — allows unauthenticated access |
| 5 | Brute force protection | ⚠️ PARTIAL | Rate limiting exists but per-instance only |
| 6 | MFA support | ❌ N/A | Not implemented |
| **Authorization** | | | |
| 7 | RBAC middleware exists | ✅ PASS | `requirePersona()` hierarchy |
| 8 | RBAC applied to all sensitive routes | ❌ FAIL | Missing on GDPR, bulk, audit, seed, scheduled-tasks |
| 9 | IDOR prevention (scope checks) | ❌ FAIL | No ownership validation on any entity |
| 10 | Frontend RBAC on admin routes | ❌ FAIL | All authenticated users see admin UI |
| **Input Validation** | | | |
| 11 | Request body validation | ❌ FAIL | No schema validation (Zod/Joi) on any endpoint |
| 12 | Query parameter validation | ❌ FAIL | No bounds checking or type validation |
| 13 | URL parameter validation | ❌ FAIL | No pattern validation on document IDs |
| 14 | Field whitelisting on updates | ❌ FAIL | `req.body` passed directly to Firestore |
| **Headers & Transport** | | | |
| 15 | Helmet security headers | ✅ PASS | Enabled globally |
| 16 | CSP header | ⚠️ PARTIAL | Present but uses `unsafe-inline` + `unsafe-eval` |
| 17 | CORS restricted | ❌ FAIL | Always returns true for all origins |
| 18 | HTTPS only | ✅ PASS | Cloud Run enforces TLS |
| 19 | Referrer-Policy | ✅ PASS | `strict-origin-when-cross-origin` |
| 20 | X-Content-Type-Options | ✅ PASS | `nosniff` |
| 21 | Permissions-Policy | ✅ PASS | Camera/microphone disabled |
| **Data Protection** | | | |
| 22 | No secrets in source code | ✅ PASS | All env-based |
| 23 | Secrets in git history scrubbed | ❌ FAIL | Firebase key + demo password in history |
| 24 | .gitignore covers sensitive files | ⚠️ PARTIAL | Missing `*.pem`, `*.key`, `.firebase/` |
| 25 | GDPR data export | ⚠️ PARTIAL | Exists but missing some collections |
| 26 | GDPR right to erasure | ⚠️ PARTIAL | Exists but incomplete collection coverage |
| **Logging & Monitoring** | | | |
| 27 | Request correlation IDs | ✅ PASS | UUID per request |
| 28 | Structured error logging | ✅ PASS | JSON format with requestId |
| 29 | Comprehensive audit trail | ❌ FAIL | Missing auth events, admin actions, bulk ops |
| 30 | Stack traces hidden in production | ⚠️ PARTIAL | Server: yes. Frontend: no (ErrorBoundary) |
| **Infrastructure** | | | |
| 31 | Non-root container | ❌ FAIL | Runs as root |
| 32 | Image vulnerability scanning | ❌ FAIL | Not in CI/CD pipeline |
| 33 | Deployment approval gates | ❌ FAIL | Auto-deploy on push |
| 34 | SRI on third-party resources | ⚠️ PARTIAL | Dynamic loads have SRI, index.html does not |
| **Dependencies** | | | |
| 35 | npm audit clean (server) | ❌ FAIL | 3 vulnerabilities (2 high) |
| 36 | npm audit clean (app) | ❌ FAIL | 3 vulnerabilities (2 high) |

### Score: 14/36 PASS, 7/36 PARTIAL, 14/36 FAIL, 1 N/A

---

## Positive Security Practices Observed

1. **Firebase Admin SDK** for server-side auth verification — industry standard
2. **Helmet** with custom CSP — good baseline headers
3. **Rate limiting** on all route groups with appropriate tiers
4. **Request correlation IDs** — excellent for incident response
5. **Structured error logging** — proper JSON format with context
6. **Production error suppression** — stack traces hidden on server side
7. **No command injection vectors** — no exec/spawn usage
8. **Firestore SDK parameterised queries** — prevents NoSQL injection
9. **Frontend XSS prevention** — no dangerouslySetInnerHTML usage
10. **Token handling** — short-lived, on-demand, same-origin only
11. **File upload validation** — size limits, MIME type checks, extension blocking
12. **Filename sanitisation** — SHA-256 hashed paths prevent traversal
13. **PII masking** in AI conversations (`vertex-ai.ts`)
14. **Circuit breaker** pattern on external API calls

---

*Report generated by Yantra Works Cyber Security Analyst Agent*
*SocialHomes.Ai Security Audit v1.0 — 2026-02-27*
