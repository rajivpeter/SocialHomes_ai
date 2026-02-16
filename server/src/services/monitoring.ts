// ============================================================
// SocialHomes.Ai — Production Monitoring Service
// In-memory metrics tracking (resets on instance restart — fine for Cloud Run)
// ============================================================

import { collections } from './firestore.js';

interface Metrics {
  requestCount: number;
  errorCount: number;
  responseTimeSum: number;
  responseTimeCount: number;
  statusCodes: Record<number, number>;
  endpointHits: Record<string, number>;
  startedAt: string;
  cacheHits: number;
  cacheMisses: number;
}

const metrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  responseTimeSum: 0,
  responseTimeCount: 0,
  statusCodes: {},
  endpointHits: {},
  startedAt: new Date().toISOString(),
  cacheHits: 0,
  cacheMisses: 0,
};

// ---- Public API ----

export function recordRequest(path: string, statusCode: number, responseTimeMs: number): void {
  metrics.requestCount += 1;
  metrics.responseTimeSum += responseTimeMs;
  metrics.responseTimeCount += 1;

  metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
  metrics.endpointHits[path] = (metrics.endpointHits[path] || 0) + 1;

  if (statusCode >= 400) {
    metrics.errorCount += 1;
  }
}

export function recordCacheHit(): void {
  metrics.cacheHits += 1;
}

export function recordCacheMiss(): void {
  metrics.cacheMisses += 1;
}

export function getMetrics(): {
  requestCount: number;
  errorCount: number;
  avgResponseTimeMs: number;
  statusCodes: Record<number, number>;
  endpointHits: Record<string, number>;
  startedAt: string;
  uptimeSeconds: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
} {
  const avgResponseTimeMs =
    metrics.responseTimeCount > 0
      ? Math.round(metrics.responseTimeSum / metrics.responseTimeCount)
      : 0;

  const totalCacheOps = metrics.cacheHits + metrics.cacheMisses;
  const cacheHitRate = totalCacheOps > 0 ? Math.round((metrics.cacheHits / totalCacheOps) * 100) : 0;

  return {
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    avgResponseTimeMs,
    statusCodes: { ...metrics.statusCodes },
    endpointHits: { ...metrics.endpointHits },
    startedAt: metrics.startedAt,
    uptimeSeconds: Math.round(process.uptime()),
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
    cacheHitRate,
  };
}

export async function getHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  firestore: {
    connected: boolean;
    latencyMs: number | null;
  };
  cacheStatus: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}> {
  const memUsage = process.memoryUsage();
  const totalCacheOps = metrics.cacheHits + metrics.cacheMisses;
  const cacheHitRate = totalCacheOps > 0 ? Math.round((metrics.cacheHits / totalCacheOps) * 100) : 0;

  // Lightweight Firestore connectivity check
  let firestoreConnected = false;
  let firestoreLatency: number | null = null;
  try {
    const start = Date.now();
    await collections.properties.count().get();
    firestoreLatency = Date.now() - start;
    firestoreConnected = true;
  } catch {
    firestoreConnected = false;
  }

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (!firestoreConnected) {
    status = 'unhealthy';
  } else if (firestoreLatency !== null && firestoreLatency > 5000) {
    status = 'degraded';
  } else if (memUsage.heapUsed / memUsage.heapTotal > 0.95) {
    status = 'degraded';
  }

  return {
    status,
    service: 'socialhomes-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    },
    firestore: {
      connected: firestoreConnected,
      latencyMs: firestoreLatency,
    },
    cacheStatus: {
      hits: metrics.cacheHits,
      misses: metrics.cacheMisses,
      hitRate: cacheHitRate,
    },
  };
}
