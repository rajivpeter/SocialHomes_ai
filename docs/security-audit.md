# SocialHomes.Ai — Comprehensive Security Audit Report

**Audit Date:** 2026-02-27
**Auditor:** Cyber Security Analyst Agent (Yantra Works)
**Audit Standard:** OWASP Top 10:2021
**Project:** SocialHomes.Ai — AI-native social housing management platform
**Stack:** React 19 + Express 4 + Firestore on Google Cloud Run (europe-west2)

---

## Executive Summary

| Overall Risk Rating | **MEDIUM** |
|---------------------|------------|
| Critical Findings   | 3          |
| High Findings       | 6          |
| Medium Findings     | 5          |
| Low Findings        | 4          |
| Informational       | 3          |

The SocialHomes.Ai platform demonstrates **good security fundamentals** including Firebase JWT authentication, RBAC middleware, Helmet security headers, rate limiting, and structured error handling. However, the audit identified **three critical vulnerabilities** related to authentication bypass, secrets in git history, and an open CORS policy, along with several high and medium severity findings that should be remediated before production deployment.

### Top 3 Urgent Findings

1. **CRITICAL: Authentication bypass via X-Persona header** — Any unauthenticated request can gain full access by sending an `X-Persona: coo` header, bypassing Firebase auth entirely.
2. **CRITICAL: Secrets exposed in git history** — Firebase API key, demo password, and GCP project IDs exist in git commit history.
3. **CRITICAL: CORS allows all origins** — The CORS callback always returns `true`, making the origin allowlist ineffective.

---

## Table of Contents

1. [A01: Broken Access Control](#a01-broken-access-control)
2. [A02: Cryptographic Failures](#a02-cryptographic-failures)
3. [A03: Injection](#a03-injection)
4. [A04: Insecure Design](#a04-insecure-design)
5. [A05: Security Misconfiguration](#a05-security-misconfiguration)
6. [A06: Vulnerable and Outdated Components](#a06-vulnerable-and-outdated-components)
7. [A07: Identification and Authentication Failures](#a07-identification-and-authentication-failures)
8. [A08: Software and Data Integrity Failures](#a08-software-and-data-integrity-failures)
9. [A09: Security Logging and Monitoring Failures](#a09-security-logging-and-monitoring-failures)
10. [A10: Server-Side Request Forgery (SSRF)](#a10-server-side-request-forgery-ssrf)
11. [Secrets Scan Results](#secrets-scan-results)
12. [npm Audit Results](#npm-audit-results)
13. [Compliance Checklist](#compliance-checklist)
14. [Recommended Remediation Roadmap](#recommended-remediation-roadmap)

---

## A01: Broken Access Control

### Finding 1.1 — X-Persona Header Allows Full Authentication Bypass (CRITICAL)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | CRITICAL |
| **Impact**      | Complete authentication bypass — any anonymous request gets authenticated access |
| **Likelihood**  | HIGH — trivial to exploit with `curl -H "X-Persona: coo"` |
| **CVSS 3.1**    | 9.8 |
| **File**        | `server/src/middleware/auth.ts:98-103` |

**Description:**
When no `Authorization` header is present, the auth middleware silently falls back to the `X-Persona` header and injects a demo user identity. This means any unauthenticated request can impersonate any role — including the highest-privileged COO — by simply adding `X-Persona: coo` to the request.

```typescript
// server/src/middleware/auth.ts:98-103
} else {
  // Legacy X-Persona mode (backward compatible)
  const persona = (req.headers['x-persona'] as string) || 'housing-officer';
  req.user = DEMO_PERSONAS[persona] || DEMO_PERSONAS['housing-officer'];
  next();  // ← No authentication! Anyone gets in.
}
```

**Exploit:**
```bash
# Full admin access with zero credentials
curl -H "X-Persona: coo" https://socialhomes.example.com/api/v1/admin/users
curl -H "X-Persona: coo" https://socialhomes.example.com/api/v1/gdpr/export/tenant-1
```

**Recommended Fix:**
```typescript
} else {
  // In production, reject requests without a Bearer token
  if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // Development only: X-Persona fallback
  const persona = (req.headers['x-persona'] as string) || 'housing-officer';
  req.user = DEMO_PERSONAS[persona] || DEMO_PERSONAS['housing-officer'];
  next();
}
```

---

### Finding 1.2 — Convenience Route Aliases Missing Authentication (HIGH)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | HIGH |
| **Impact**      | Unauthenticated access to case data (repairs, complaints, allocations) |
| **Likelihood**  | MEDIUM |
| **File**        | `server/src/index.ts:160-183` |

**Description:**
Three convenience route aliases are defined directly in `index.ts` without the `authMiddleware`:

```typescript
// server/src/index.ts:160-183
app.get('/api/v1/repairs', apiLimiter, async (_req, res, next) => { ... });
app.get('/api/v1/complaints', apiLimiter, async (_req, res, next) => { ... });
app.get('/api/v1/allocations', apiLimiter, async (_req, res, next) => { ... });
```

While these currently benefit from the X-Persona fallback (which auto-authenticates), if the X-Persona bypass is fixed, these routes would become truly unauthenticated.

**Recommended Fix:**
```typescript
import { authMiddleware } from './middleware/auth.js';

app.get('/api/v1/repairs', apiLimiter, authMiddleware, async (req, res, next) => { ... });
app.get('/api/v1/complaints', apiLimiter, authMiddleware, async (req, res, next) => { ... });
app.get('/api/v1/allocations', apiLimiter, authMiddleware, async (req, res, next) => { ... });
```

---

### Finding 1.3 — Seed Users Endpoint Has No Authorization (HIGH)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | HIGH |
| **Impact**      | Anyone can create admin-level demo accounts in Firebase Auth |
| **Likelihood**  | MEDIUM — requires knowledge of the endpoint |
| **File**        | `server/src/routes/auth.ts:63` |

**Description:**
The `POST /api/v1/auth/seed-users` endpoint creates Firebase Auth users with admin-level personas (COO, Head of Housing, Manager) and sets their custom claims. This endpoint has no authentication or authorization check — only rate limiting (10 req/min).

```typescript
// server/src/routes/auth.ts:63
authRouter.post('/seed-users', async (_req, res, next) => {
  // Creates 5 demo users with full persona roles — no auth required!
```

**Recommended Fix:**
- In production: disable or protect behind admin authentication
- Add `requirePersona('coo')` or an environment-based guard:
```typescript
authRouter.post('/seed-users', authMiddleware, requirePersona('coo'), async (req, res, next) => {
```

---

### Finding 1.4 — Admin Seed Route Missing RBAC (MEDIUM)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | MEDIUM |
| **Impact**      | Any authenticated user can seed the entire database |
| **Likelihood**  | LOW |
| **File**        | `server/src/routes/admin.ts:59` |

**Description:**
The `POST /api/v1/admin/seed` route accepts arbitrary data and seeds Firestore. It has `authMiddleware` but no `requirePersona()` guard, meaning any authenticated user (including operatives) can overwrite production data.

**Recommended Fix:**
```typescript
adminRouter.post('/seed', requirePersona('coo'), async (req, res, next) => {
```

---

### Finding 1.5 — No Row-Level Access Control on Tenant Data (MEDIUM)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | MEDIUM |
| **Impact**      | Officers can view tenants outside their assigned patch/team |
| **Likelihood**  | HIGH — no enforcement exists |
| **File**        | `server/src/routes/tenants.ts`, `server/src/routes/properties.ts` |

**Description:**
The `AuthUser` type includes `teamId` and `patchIds`, but no route enforces data scoping based on these values. A housing officer with `teamId: 'southwark-lewisham'` can query any tenant in any team. The RBAC middleware only checks persona level, not data boundaries.

**Recommended Fix:**
Implement data-scoping middleware that filters queries based on `req.user.teamId` and `req.user.patchIds` for non-admin personas.

---

### Finding 1.6 — PATCH Endpoints Accept Arbitrary Fields (MEDIUM)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | MEDIUM |
| **Impact**      | Users can modify protected fields (e.g., persona, createdAt) |
| **Likelihood**  | MEDIUM |
| **Files**       | `server/src/routes/properties.ts:62`, `server/src/routes/tenants.ts:74` |

**Description:**
The PATCH handlers pass `req.body` directly to Firestore `updateDoc()` without field allowlisting:

```typescript
// server/src/routes/properties.ts:62
await updateDoc(collections.properties, req.params.id, req.body);
```

An attacker could include arbitrary fields like `isVoid`, `dampRisk`, or any other field to manipulate data.

**Recommended Fix:**
```typescript
const allowedFields = ['address', 'notes', 'status'];
const filtered = Object.fromEntries(
  Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
);
await updateDoc(collections.properties, req.params.id, filtered);
```

---

## A02: Cryptographic Failures

### Finding 2.1 — Secrets Exposed in Git History (CRITICAL)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | CRITICAL |
| **Impact**      | Compromised Firebase API key, demo password, GCP project IDs |
| **Likelihood**  | HIGH — git history is permanent and may be cloned by many |
| **File**        | `SESSION-HISTORY.md:327`, git commit `e0c23e4` |

**Description:**
The following secrets were found in committed files and/or git history:

| Secret | Location | Status |
|--------|----------|--------|
| Firebase API Key `AIzaSyB1nf...` | SESSION-HISTORY.md:327 | Exposed in plaintext |
| Demo Password `SocialHomes2026!` | Git history commit `e0c23e4` | In git history |
| GCP Project ID `gen-lang-client-0146156913` | TEST-REPORT-V2.md:26-27 | Committed |
| Partial Firebase API key | tests/test_results_firebase_auth.json:15 | Committed |

**Recommended Fix:**
1. Rotate all exposed credentials immediately
2. Use BFG Repo Cleaner to scrub git history:
   ```bash
   java -jar bfg.jar --replace-text secrets.txt socialhomes.git
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   ```
3. Remove secrets from SESSION-HISTORY.md and TEST-REPORT-V2.md
4. Verify Firebase API key restrictions in GCP Console

---

### Finding 2.2 — GCP Service Account Key on Disk (HIGH)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | HIGH |
| **Impact**      | Full admin access to Google Cloud if file is leaked |
| **Likelihood**  | LOW — correctly excluded from git |
| **File**        | `server/google-credentials.json` |

**Description:**
A full GCP service account private key (`firebase-adminsdk`) exists on disk. While correctly excluded from git via `.gitignore`, if the developer's machine is compromised, this key grants full Firestore, Firebase Auth, and Cloud resource access.

**Recommended Fix:**
- Use Workload Identity Federation instead of key files
- Rotate the service account key
- Set key expiration policy in GCP IAM

---

### Finding 2.3 — Firebase Config Served Without Rate Limiting on Config Endpoint (LOW)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | LOW |
| **Impact**      | Firebase public config is retrievable (by design — these are public values) |
| **Likelihood**  | N/A |
| **File**        | `server/src/index.ts:117-125` |

**Description:**
The `/api/v1/config` endpoint serves Firebase config (apiKey, authDomain, projectId) without authentication. These values are intentionally public (Firebase Web SDK requires them in-browser), but the endpoint has no rate limiting, unlike other API routes.

**Recommended Fix:**
Add rate limiting to prevent enumeration:
```typescript
app.get('/api/v1/config', apiLimiter, (_req, res) => { ... });
```

---

## A03: Injection

### Finding 3.1 — Potential NoSQL Query Manipulation via ArcGIS URL (MEDIUM)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | MEDIUM |
| **Impact**      | Potential data leakage from ArcGIS service |
| **Likelihood**  | LOW — attack surface is limited |
| **File**        | `server/src/routes/public-data.ts:470-471` |

**Description:**
The IMD endpoint constructs an ArcGIS URL by interpolating user input into a SQL `WHERE` clause:

```typescript
const url = `...?where=lsoa11cd='${encodeURIComponent(lsoaCode)}'&outFields=*&f=json`;
```

While `encodeURIComponent()` provides some protection, a crafted LSOA code could potentially manipulate the ArcGIS REST SQL filter. ArcGIS REST uses a simplified SQL dialect where URL-encoded quotes may be decoded.

**Recommended Fix:**
Add strict input validation:
```typescript
if (!/^E\d{8}$/.test(lsoaCode)) {
  return res.status(400).json({ error: 'Invalid LSOA code format' });
}
```

---

### Finding 3.2 — No Input Validation on Route Parameters (LOW)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | LOW |
| **Impact**      | Malformed data sent to Firestore (Firestore is injection-resistant) |
| **Likelihood**  | LOW — Firestore SDK uses parameterized queries |
| **File**        | Multiple route files |

**Description:**
Route parameters like `:id`, `:tenantId`, `:propertyId` are passed directly to Firestore `doc()` calls without format validation. While Firestore is inherently resistant to injection (it uses structured queries, not string concatenation), lack of validation can cause unexpected behavior.

Example:
```typescript
const property = await getDoc<PropertyDoc>(collections.properties, req.params.id);
```

**Recommended Fix:**
Add a shared validation utility:
```typescript
function validateDocId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}
```

---

### Finding 3.3 — XSS Risk in AI Draft Communication Output (LOW)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | LOW |
| **Impact**      | Stored XSS if AI-generated content contains malicious HTML |
| **Likelihood**  | LOW — AI output is generated server-side, not from direct user input |
| **File**        | `server/src/routes/ai.ts:45-65` |

**Description:**
The `generateDraft()` function interpolates tenant data (names, addresses) into letter templates. If tenant data contains HTML/script tags, the draft output could execute in the browser.

**Recommended Fix:**
Sanitize tenant data before interpolation and ensure the frontend renders AI output as plain text (not `dangerouslySetInnerHTML`).

---

## A04: Insecure Design

### Finding 4.1 — No Principle of Least Privilege for Data Access (MEDIUM)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | MEDIUM |
| **Impact**      | Users can access more data than their role requires |
| **Likelihood**  | HIGH |
| **Files**       | All route files |

**Description:**
The RBAC system enforces a persona hierarchy (COO > Head of Service > Manager > Housing Officer > Operative) but only applies it to admin routes. All other routes (properties, tenants, cases, AI, compliance, rent) simply check for _any_ authenticated user.

The system has `teamId` and `patchIds` on user objects, suggesting intent for data scoping, but this is never enforced:

- A housing officer sees all tenants, not just those in their patch
- An operative sees all properties, not just those in their team
- No multi-tenancy enforcement exists

**Recommended Fix:**
Implement data-scoping middleware per persona level:
```typescript
function scopeToTeam(req: Request): Filters {
  if (['coo', 'head-of-service'].includes(req.user?.persona)) return [];
  if (req.user?.teamId) return [{ field: 'teamId', op: '==', value: req.user.teamId }];
  return [];
}
```

---

### Finding 4.2 — No Account Lockout or Suspicious Activity Detection (LOW)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | LOW |
| **Impact**      | Brute force attacks not blocked after threshold |
| **Likelihood**  | LOW — Firebase Auth has built-in brute force protection |

**Description:**
While rate limiting exists on auth endpoints (10 req/min), there is no account-level lockout or suspicious activity alerting. Firebase Auth provides some built-in protections (captcha challenges after repeated failures), but the application does not layer additional controls.

**Recommended Fix:**
- Enable Firebase App Check for additional protection
- Monitor failed authentication attempts in Cloud Logging
- Consider implementing progressive delays after failed attempts

---

## A05: Security Misconfiguration

### Finding 5.1 — CORS Policy Is Effectively Permissive (CRITICAL)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | CRITICAL |
| **Impact**      | Cross-origin attacks possible from any website |
| **Likelihood**  | HIGH — trivially exploitable |
| **File**        | `server/src/index.ts:85-99` |

**Description:**
Despite defining an `allowedOrigins` array, the CORS callback **always returns true**:

```typescript
cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // "In production, Cloud Run serves both API and SPA from same origin"
      callback(null, true);  // ← ALWAYS allows all origins!
    }
  },
  credentials: true,
```

This renders the allowlist completely ineffective. Combined with `credentials: true`, this enables CSRF and credential-stealing attacks from any origin.

**Recommended Fix:**
```typescript
cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'production') {
      // In production, reject unknown origins
      callback(new Error('Not allowed by CORS'), false);
    } else {
      callback(null, true); // Allow any in development
    }
  },
  credentials: true,
```

---

### Finding 5.2 — CSP Allows unsafe-inline and unsafe-eval (HIGH)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | HIGH |
| **Impact**      | Significantly weakens XSS protection provided by CSP |
| **Likelihood**  | MEDIUM — reduces defense-in-depth |
| **File**        | `server/src/index.ts:51` |

**Description:**
The Content Security Policy includes `'unsafe-inline'` and `'unsafe-eval'` in the `scriptSrc` directive:

```typescript
scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", ...]
```

This effectively negates the XSS protection that CSP provides, as any injected inline script would be allowed to execute.

**Recommended Fix:**
- Use nonce-based CSP for inline scripts
- Remove `'unsafe-eval'` if not strictly required by a dependency
- Use `'strict-dynamic'` with nonces for modern CSP

---

### Finding 5.3 — Stack Traces Exposed in Non-Production Environments (LOW)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | LOW |
| **Impact**      | Information leakage in development/staging environments |
| **Likelihood**  | LOW — controlled to non-production only |
| **File**        | `server/src/middleware/error-handler.ts:37-55` |

**Description:**
Error stack traces are included in API responses when `NODE_ENV !== 'production'`. This is intentional for development, but if a staging environment is accidentally exposed, it could leak internal paths and code structure.

```typescript
if (!isProduction && err.stack) {
  responseBody.stack = err.stack;
}
```

**Status:** Acceptable for development. Ensure staging environments set `NODE_ENV=production`.

---

### Finding 5.4 — Missing Security Headers (INFORMATIONAL)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | INFORMATIONAL |
| **File**        | `server/src/index.ts:46-70` |

**Present headers (good):**
- `Content-Security-Policy` — Present
- `X-Content-Type-Options: nosniff` — Present
- `Referrer-Policy: strict-origin-when-cross-origin` — Present
- `Permissions-Policy` — Present
- `X-Frame-Options` — Present (via Helmet default)
- `Strict-Transport-Security` — Present (via Helmet default)

**Missing headers:**
- `Cross-Origin-Opener-Policy: same-origin` — prevents cross-origin window manipulation
- `Cross-Origin-Resource-Policy: same-origin` — prevents cross-origin resource loading

---

## A06: Vulnerable and Outdated Components

### npm Audit Results — Server (`server/`)

| Package | Severity | Vulnerability | Fix |
|---------|----------|--------------|-----|
| `fast-xml-parser` <=5.3.7 | HIGH | Stack overflow in XMLBuilder (GHSA-fj3w-jwp8-x2g3), DoS via entity expansion (GHSA-jmr7-xgp7-cmfj) | `npm audit fix` |
| `qs` 6.7.0-6.14.1 | LOW | arrayLimit bypass in comma parsing (GHSA-w7fw-mjwx-w883) | `npm audit fix` |
| `rollup` 4.0.0-4.58.0 | HIGH | Arbitrary File Write via Path Traversal (GHSA-mw96-cpmx-2vgc) | `npm audit fix` |

**Summary:** 3 vulnerabilities (1 low, 2 high) — all fixable via `npm audit fix`

### npm Audit Results — Frontend (`app/`)

| Package | Severity | Vulnerability | Fix |
|---------|----------|--------------|-----|
| `ajv` <6.14.0 | MODERATE | ReDoS when using `$data` option (GHSA-2g4f-4pwh-qvx6) | `npm audit fix` |
| `minimatch` <=3.1.3 | HIGH | Multiple ReDoS patterns (GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, GHSA-23c5-xmqv-rm74) | `npm audit fix` |
| `rollup` 4.0.0-4.58.0 | HIGH | Arbitrary File Write via Path Traversal (GHSA-mw96-cpmx-2vgc) | `npm audit fix` |

**Summary:** 3 vulnerabilities (1 moderate, 2 high) — all fixable via `npm audit fix`

### Finding 6.1 — Legacy firebaseui Dependency (INFORMATIONAL)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | INFORMATIONAL |
| **File**        | `app/package.json` |

The `firebaseui@6.1.0` package requires `--legacy-peer-deps` due to incompatible peer dependencies. This package has not been updated since 2023 and may contain unpatched vulnerabilities. Consider migrating to a custom Firebase auth UI or a maintained wrapper.

---

## A07: Identification and Authentication Failures

### Finding 7.1 — Default Persona Escalation (HIGH)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | HIGH |
| **Impact**      | New users automatically get housing-officer access without admin approval |
| **Likelihood**  | HIGH |
| **File**        | `server/src/routes/auth.ts:139` |

**Description:**
When a new user registers via Firebase Auth and creates their profile, they are automatically assigned the `housing-officer` persona:

```typescript
persona: 'housing-officer', // Default persona for new users
```

This means any person who can access the Firebase Auth sign-in (which is a public web page) gets immediate housing officer access — including access to tenant PII, case data, and property information.

**Recommended Fix:**
- Default to a read-only or no-access persona (e.g., `'pending-approval'`)
- Require admin approval workflow before granting role access
- Add the pending persona to the hierarchy at level 0

---

### Finding 7.2 — No Multi-Factor Authentication (MEDIUM)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | MEDIUM |
| **Impact**      | Single-factor authentication for system handling sensitive PII |
| **Likelihood**  | MEDIUM |

**Description:**
The application handles sensitive personal data (tenant PII, vulnerability assessments, rent arrears, benefits data) but only requires single-factor authentication (email/password). For a social housing platform handling vulnerable person data, MFA should be mandatory — especially for admin roles.

**Recommended Fix:**
Enable Firebase Auth MFA and enforce it for manager+ personas:
```typescript
// In AuthContext, check MFA enrollment
if (user.multiFactor?.enrolledFactors?.length === 0 && persona === 'manager') {
  redirectToMfaEnrollment();
}
```

---

### Finding 7.3 — In-Memory Rate Limiter Does Not Persist Across Instances (LOW)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | LOW |
| **Impact**      | Rate limits reset on container restart; not shared across Cloud Run instances |
| **Likelihood**  | MEDIUM |
| **File**        | `server/src/middleware/rate-limiter.ts` |

**Description:**
The rate limiter uses an in-memory `Map`. On Cloud Run with autoscaling, each container instance has its own independent store. An attacker can bypass rate limits by triggering new container instances or by distributing requests.

**Recommended Fix:**
For production, use a distributed rate limiter backed by Redis or Cloud Memorystore. For Cloud Run, consider using the `rate-limiter-flexible` package with a Firestore backend.

---

## A08: Software and Data Integrity Failures

### Finding 8.1 — No CSRF Protection Beyond CORS (HIGH)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | HIGH |
| **Impact**      | Cross-site request forgery possible given the broken CORS policy |
| **Likelihood**  | HIGH — CORS is currently permissive (see Finding 5.1) |

**Description:**
The application relies entirely on CORS for CSRF protection. There are no CSRF tokens, no `SameSite` cookie attributes (Firebase Auth uses localStorage tokens, not cookies), and the `Origin` header check is bypassed (Finding 5.1).

While Firebase JWT tokens in `Authorization` headers provide some CSRF protection (they can't be auto-sent by browsers like cookies), the X-Persona fallback (Finding 1.1) makes this moot.

**Recommended Fix:**
1. Fix the CORS policy (Finding 5.1)
2. Remove the X-Persona fallback in production (Finding 1.1)
3. The combination of these two fixes, plus Firebase JWT in `Authorization` headers, provides adequate CSRF protection

---

### Finding 8.2 — No Request Body Size Validation Per Endpoint (LOW)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | LOW |
| **Impact**      | Resource exhaustion via large payloads |
| **Likelihood**  | LOW |
| **File**        | `server/src/index.ts:103` |

**Description:**
A global body size limit of 1MB is set (`express.json({ limit: '1mb' })`), which is appropriate. However, endpoints like bulk operations accept arrays without maximum size enforcement beyond the 1MB limit.

**Recommended Fix:**
Add per-endpoint array length validation (already partially done in bulk routes — extend to all endpoints):
```typescript
if (caseIds.length > 500) {
  return res.status(400).json({ error: 'Maximum 500 items per bulk operation' });
}
```

---

## A09: Security Logging and Monitoring Failures

### Finding 9.1 — No Dedicated Security Event Logging (MEDIUM)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | MEDIUM |
| **Impact**      | Security incidents may go undetected |
| **Likelihood**  | MEDIUM |

**Description:**
The application has:
- Request logging via Morgan (`combined` format) — GOOD
- Error logging with structured JSON — GOOD
- Request ID correlation — GOOD
- Audit trail for external API calls (via `fetchWithCache`) — GOOD
- Metrics recording (request count, response time, status codes) — GOOD

However, it lacks:
- Authentication failure logging (failed JWT verifications)
- Authorization failure logging (RBAC denials)
- Suspicious activity detection (rapid persona switching, bulk data access)
- Rate limit violation logging
- GDPR access logging (who accessed what tenant data, when)

**Recommended Fix:**
Create a `security-logger.ts` service:
```typescript
export function logSecurityEvent(event: {
  type: 'auth_failure' | 'rbac_denied' | 'rate_limited' | 'suspicious_activity';
  userId?: string;
  ip: string;
  path: string;
  details: string;
}) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'security',
    ...event,
  }));
}
```

---

### Finding 9.2 — Auth Failure Not Logged for X-Persona Fallback (INFORMATIONAL)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | INFORMATIONAL |
| **File**        | `server/src/middleware/auth.ts:98-103` |

**Description:**
When the X-Persona fallback is used, there is no log entry indicating that a request was authenticated via the insecure demo path. This makes it impossible to distinguish legitimate Firebase-authenticated requests from demo/unauthenticated requests in logs.

---

## A10: Server-Side Request Forgery (SSRF)

### Finding 10.1 — User-Controlled URLs in External API Proxy (HIGH)

| Attribute    | Value |
|-------------|-------|
| **Severity**    | HIGH |
| **Impact**      | Potential access to internal services via server-side requests |
| **Likelihood**  | LOW — URLs are constructed server-side with controlled base URLs |
| **File**        | `server/src/routes/public-data.ts` |

**Description:**
The public-data routes make server-side HTTP requests to external APIs using user-supplied parameters (lat/lng, postcodes, LSOA codes). While the base URLs are hardcoded, user input is interpolated into URL paths and query parameters:

```typescript
// User-controlled lat/lng in URL path
`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${dateStr}`

// User-controlled LSOA code in SQL-like WHERE clause
`...where=lsoa11cd='${encodeURIComponent(lsoaCode)}'&outFields=*&f=json`
```

The risk is mitigated by:
- Base URLs are hardcoded (no open redirect)
- `encodeURIComponent()` prevents URL manipulation
- Firestore caching layer validates response structure

**Recommended Fix:**
Add strict input validation for all parameters:
```typescript
// Validate lat/lng are numeric and in UK bounds
const lat = parseFloat(req.params.lat);
const lng = parseFloat(req.params.lng);
if (isNaN(lat) || isNaN(lng) || lat < 49 || lat > 61 || lng < -8 || lng > 2) {
  return res.status(400).json({ error: 'Invalid UK coordinates' });
}
```

---

## Secrets Scan Results

### Scan Summary

| Category | Count | Status |
|----------|-------|--------|
| Hardcoded API keys in source | 0 | CLEAN |
| Hardcoded passwords in source | 0 | CLEAN (uses env vars) |
| Secrets in git history | 3 | CRITICAL |
| Secrets in documentation | 2 | CRITICAL |
| Service account keys on disk | 1 | HIGH (gitignored) |
| .env files committed | 0 | CLEAN |
| Telegram bot tokens | 0 | CLEAN (in .mcp.json, gitignored) |

### Detailed Findings

| Secret | File | Risk |
|--------|------|------|
| Firebase API Key (full) | SESSION-HISTORY.md:327 | CRITICAL — rotate immediately |
| Demo Password `SocialHomes2026!` | Git history (commit e0c23e4) | CRITICAL — verify rotated |
| GCP Project ID | TEST-REPORT-V2.md:26-27 | HIGH — aids reconnaissance |
| Partial Firebase API key | tests/test_results_firebase_auth.json:15 | HIGH — remove from repo |
| GCP service account private key | server/google-credentials.json | HIGH — on disk, not in git |

### Positive Findings
- All active source files use `process.env` for secrets
- Firebase client config served from server env vars (never bundled)
- `.gitignore` properly excludes `.env`, `google-credentials*.json`, `.mcp.json`
- Docker build (cloudbuild.yaml) uses Google Secret Manager
- No secrets in Dockerfile or build configs

---

## npm Audit Results

### Server (`server/`) — 3 vulnerabilities

```
fast-xml-parser  <=5.3.7     HIGH    Stack overflow & DoS via entity expansion
qs               6.7.0-6.14.1 LOW    arrayLimit bypass denial of service
rollup           4.0.0-4.58.0 HIGH   Arbitrary File Write via Path Traversal
```

### Frontend (`app/`) — 3 vulnerabilities

```
ajv              <6.14.0      MODERATE  ReDoS with $data option
minimatch        <=3.1.3      HIGH      Multiple ReDoS vulnerabilities
rollup           4.0.0-4.58.0 HIGH      Arbitrary File Write via Path Traversal
```

**Resolution:** All 6 vulnerabilities can be resolved with `npm audit fix` in both directories.

---

## Compliance Checklist

| # | Control | Status | Notes |
|---|---------|--------|-------|
| 1 | Firebase JWT authentication | PASS | Properly implemented for Bearer tokens |
| 2 | RBAC middleware | PASS | 5-level persona hierarchy enforced |
| 3 | Auth bypass disabled in production | FAIL | X-Persona fallback active in all environments |
| 4 | Data-scoping per role | FAIL | teamId/patchIds not enforced on queries |
| 5 | CORS restricted to known origins | FAIL | CORS callback always allows all origins |
| 6 | Helmet security headers | PASS | CSP, HSTS, X-Frame-Options etc. |
| 7 | CSP without unsafe-inline/eval | FAIL | Both present in scriptSrc |
| 8 | Rate limiting | PASS | Per-category rate limits implemented |
| 9 | Distributed rate limiting | FAIL | In-memory only, not shared across instances |
| 10 | Input validation on all routes | PARTIAL | Some validation, not comprehensive |
| 11 | Request body size limit | PASS | 1MB limit via express.json() |
| 12 | Error handling hides internals | PASS | Stack traces hidden in production |
| 13 | Request correlation (X-Request-ID) | PASS | UUID attached to every request |
| 14 | No hardcoded secrets in source | PASS | All use process.env |
| 15 | Secrets excluded from git | PARTIAL | Current .gitignore good; historical exposure |
| 16 | npm audit clean | FAIL | 6 vulnerabilities across both directories |
| 17 | MFA for admin roles | FAIL | Not implemented |
| 18 | Audit logging for data access | PARTIAL | External API auditing only |
| 19 | GDPR data access logging | FAIL | No logging of who accesses tenant PII |
| 20 | Secure cookie flags | N/A | Uses localStorage + Bearer tokens, not cookies |
| 21 | SSRF input validation | PARTIAL | Base URLs hardcoded, but parameter validation weak |
| 22 | Seed/admin endpoints protected | FAIL | seed-users has no auth; admin/seed has no RBAC |
| 23 | New user default to least privilege | FAIL | New users get housing-officer (level 2) access |
| 24 | Compression enabled | PASS | compression middleware active |
| 25 | HTTPS enforced | PASS | Cloud Run enforces HTTPS |

**Pass Rate: 11/25 (44%) PASS | 9/25 (36%) FAIL | 5/25 (20%) PARTIAL**

---

## Recommended Remediation Roadmap

### Phase 1: Critical (Fix Immediately — Week 1)

| # | Finding | Action | Effort |
|---|---------|--------|--------|
| 1 | Auth bypass (1.1) | Guard X-Persona behind `NODE_ENV !== 'production'` | 30 min |
| 2 | CORS permissive (5.1) | Fix CORS callback to reject unknown origins in production | 30 min |
| 3 | Secrets in git (2.1) | Rotate all exposed credentials; scrub git history | 2 hrs |
| 4 | Seed endpoint open (1.3) | Add auth + RBAC guard to seed-users | 30 min |

### Phase 2: High (Fix Within 2 Weeks)

| # | Finding | Action | Effort |
|---|---------|--------|--------|
| 5 | Route alias auth (1.2) | Add authMiddleware to convenience routes | 30 min |
| 6 | Default persona (7.1) | Change default to `pending-approval` | 1 hr |
| 7 | Admin seed RBAC (1.4) | Add requirePersona('coo') | 15 min |
| 8 | CSP unsafe-inline (5.2) | Implement nonce-based CSP | 4 hrs |
| 9 | CSRF fix (8.1) | Follows from CORS + auth bypass fixes | 0 hrs |
| 10 | npm audit fix | Run `npm audit fix` in both directories | 30 min |
| 11 | SSRF validation (10.1) | Add input validation for lat/lng/postcodes | 2 hrs |

### Phase 3: Medium (Fix Within 1 Month)

| # | Finding | Action | Effort |
|---|---------|--------|--------|
| 12 | Data scoping (1.5, 4.1) | Implement team/patch-level data filtering | 8 hrs |
| 13 | PATCH field allow-listing (1.6) | Add allowed fields for each PATCH endpoint | 4 hrs |
| 14 | MFA enforcement (7.2) | Enable Firebase MFA for admin roles | 4 hrs |
| 15 | Security event logging (9.1) | Create security logger service | 4 hrs |
| 16 | GDPR access logging | Log all tenant data access | 4 hrs |

### Phase 4: Low / Ongoing

| # | Finding | Action | Effort |
|---|---------|--------|--------|
| 17 | Distributed rate limiter (7.3) | Migrate to Redis/Firestore-backed limiter | 8 hrs |
| 18 | Input validation (3.2) | Add doc ID validation across all routes | 4 hrs |
| 19 | AI output sanitization (3.3) | Sanitize AI draft content | 2 hrs |
| 20 | GCP key rotation (2.2) | Set up Workload Identity Federation | 4 hrs |
| 21 | firebaseui migration (6.1) | Replace with maintained auth UI | 8 hrs |

---

## Appendix A: Files Reviewed

### Server
- `server/src/index.ts` — Main application entry, middleware chain, route mounting
- `server/src/middleware/auth.ts` — Authentication middleware
- `server/src/middleware/rbac.ts` — Role-based access control
- `server/src/middleware/rate-limiter.ts` — Rate limiting
- `server/src/middleware/error-handler.ts` — Error handling
- `server/src/middleware/metrics.ts` — Request metrics
- `server/src/routes/auth.ts` — Authentication routes
- `server/src/routes/admin.ts` — Admin routes
- `server/src/routes/properties.ts` — Property CRUD
- `server/src/routes/tenants.ts` — Tenant CRUD
- `server/src/routes/cases.ts` — Case management
- `server/src/routes/ai.ts` — AI/ML endpoints
- `server/src/routes/public-data.ts` — External API proxy
- `server/src/routes/gdpr.ts` — GDPR compliance
- `server/src/routes/files.ts` — File management
- `server/src/routes/bulk-operations.ts` — Bulk operations
- `server/src/routes/scheduled-tasks.ts` — Scheduled tasks
- `server/src/services/firebase-admin.ts` — Firebase Admin SDK
- `server/src/services/firestore.ts` — Firestore client
- `server/package.json` — Server dependencies

### Frontend
- `app/src/contexts/AuthContext.tsx` — Auth state management
- `app/src/services/firebase.ts` — Firebase SDK initialization
- `app/src/services/api-client.ts` — API communication layer
- `app/package.json` — Frontend dependencies

### Configuration
- `.gitignore` — Git exclusion rules
- `cloudbuild.yaml` — Cloud Build pipeline
- `Dockerfile` — Container build

---

*Report generated by Yantra Works Cyber Security Analyst Agent*
*© 2026 Yantra Works. All rights reserved.*
