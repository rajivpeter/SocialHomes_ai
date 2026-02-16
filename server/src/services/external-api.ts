// ============================================================
// SocialHomes.Ai — External API Infrastructure
// Shared caching, rate limiting, and audit logging for all
// external public-service API integrations.
// ============================================================

import { db, collections, FieldValue, Timestamp } from './firestore.js';

// ── Types ──

export interface CacheEntry {
  source: string;
  lookupKey: string;
  data: Record<string, unknown>;
  fetchedAt: FirebaseFirestore.Timestamp;
  ttlSeconds: number;
  expiresAt: FirebaseFirestore.Timestamp;
  httpStatus: number;
  latencyMs: number;
}

export interface ExternalApiResult<T = Record<string, unknown>> {
  source: string;      // e.g. "postcodes.io", "cached", "simulated"
  data: T;
  cached: boolean;
  latencyMs?: number;
}

// ── Cache Collection ──

const cacheCollection = db.collection('externalDataCache');

// ── Rate Limiter (in-memory token bucket) ──

interface TokenBucket {
  tokens: number;
  maxTokens: number;
  refillRate: number; // tokens per second
  lastRefill: number; // timestamp ms
}

const buckets = new Map<string, TokenBucket>();

function getRateLimiter(source: string, maxPerMinute: number): TokenBucket {
  let bucket = buckets.get(source);
  if (!bucket) {
    bucket = {
      tokens: maxPerMinute,
      maxTokens: maxPerMinute,
      refillRate: maxPerMinute / 60,
      lastRefill: Date.now(),
    };
    buckets.set(source, bucket);
  }
  return bucket;
}

function consumeToken(source: string, maxPerMinute: number): boolean {
  const bucket = getRateLimiter(source, maxPerMinute);
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + elapsed * bucket.refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }
  return false;
}

// ── Audit Logging ──

export async function logApiCall(
  source: string,
  endpoint: string,
  status: number,
  latencyMs: number,
  error?: string,
): Promise<void> {
  try {
    await collections.auditLog.add({
      timestamp: FieldValue.serverTimestamp(),
      user: 'system',
      action: 'external-api-call',
      entity: 'externalDataCache',
      entityId: source,
      field: endpoint,
      oldValue: '',
      newValue: `status=${status} latency=${latencyMs}ms${error ? ` error=${error}` : ''}`,
      ip: 'server',
    });
  } catch {
    // Non-critical — don't let audit logging break the flow
    console.warn(`[external-api] Failed to log audit entry for ${source}`);
  }
}

// ── Cache-Through Fetch ──

/**
 * Fetch data with Firestore cache-through.
 * 1. Check cache — if valid, return cached data
 * 2. If expired/missing, call fetchFn
 * 3. Cache result in Firestore
 * 4. On failure, return simulated fallback
 */
export async function fetchWithCache<T extends Record<string, unknown>>(
  source: string,
  lookupKey: string,
  ttlSeconds: number,
  fetchFn: () => Promise<{ data: T; httpStatus: number }>,
  simulatedData?: T,
  maxPerMinute = 60,
): Promise<ExternalApiResult<T>> {
  const cacheDocId = `${source}:${lookupKey}`.replace(/[/\\#\[\]*]/g, '_');

  // 1. Check cache
  try {
    const cacheDoc = await cacheCollection.doc(cacheDocId).get();
    if (cacheDoc.exists) {
      const entry = cacheDoc.data() as CacheEntry;
      const expiresAt = entry.expiresAt?.toDate?.() ?? new Date(0);
      if (expiresAt > new Date()) {
        return {
          source: 'cached',
          data: entry.data as T,
          cached: true,
        };
      }
    }
  } catch {
    // Cache read failed — continue to fetch
  }

  // 2. Rate limit check
  if (!consumeToken(source, maxPerMinute)) {
    console.warn(`[external-api] Rate limit exceeded for ${source}`);
    if (simulatedData) {
      return { source: 'simulated', data: simulatedData, cached: false };
    }
    throw new Error(`Rate limit exceeded for ${source}`);
  }

  // 3. Fetch from external API
  const start = Date.now();
  try {
    const result = await fetchFn();
    const latencyMs = Date.now() - start;

    // Write to cache
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    try {
      await cacheCollection.doc(cacheDocId).set({
        source,
        lookupKey,
        data: result.data,
        fetchedAt: Timestamp.fromDate(now),
        ttlSeconds,
        expiresAt: Timestamp.fromDate(expiresAt),
        httpStatus: result.httpStatus,
        latencyMs,
      });
    } catch {
      // Cache write failed — non-critical
    }

    // Audit log (fire-and-forget)
    logApiCall(source, lookupKey, result.httpStatus, latencyMs);

    return {
      source,
      data: result.data,
      cached: false,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    logApiCall(source, lookupKey, 0, latencyMs, err.message);

    // 4. Simulated fallback
    if (simulatedData) {
      return { source: 'simulated', data: simulatedData, cached: false };
    }
    throw err;
  }
}
