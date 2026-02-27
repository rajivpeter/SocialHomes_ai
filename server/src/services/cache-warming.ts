// ============================================================
// SocialHomes.Ai — Cache Warming Service
// Task 5.2.6: Scheduled pre-fetch for estate data (weather,
// crime, demographics), background job runner with Firestore lock
// ============================================================

import { db, collections, getDocs, FieldValue, Timestamp } from './firestore.js';
import { fetchWithCache } from './external-api.js';
import type { EstateDoc } from '../models/firestore-schemas.js';

// ---- Types ----

interface WarmingJob {
  id: string;
  type: 'weather' | 'crime' | 'demographics' | 'compliance' | 'all';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  itemsProcessed: number;
  itemsTotal: number;
  errors: string[];
  lockHolder?: string;
  lockExpiresAt?: string;
}

interface CacheWarmingConfig {
  weatherIntervalHours: number;
  crimeIntervalHours: number;
  demographicsIntervalHours: number;
  complianceIntervalHours: number;
  batchSize: number;
  delayBetweenBatchesMs: number;
}

const DEFAULT_CONFIG: CacheWarmingConfig = {
  weatherIntervalHours: 2,
  crimeIntervalHours: 24,
  demographicsIntervalHours: 168, // weekly
  complianceIntervalHours: 12,
  batchSize: 5,
  delayBetweenBatchesMs: 2000,
};

// ---- Lock Management ----

const locksCollection = db.collection('systemLocks');
const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function acquireLock(jobType: string): Promise<string | null> {
  const lockId = `cache-warming:${jobType}`;
  const lockRef = locksCollection.doc(lockId);
  const now = Date.now();
  const instanceId = `instance-${now}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const lockDoc = await lockRef.get();
    if (lockDoc.exists) {
      const data = lockDoc.data();
      const expiresAt = data?.expiresAt?.toDate?.()?.getTime() ?? 0;
      if (expiresAt > now) {
        // Lock is held and not expired
        return null;
      }
    }

    // Acquire or renew lock
    await lockRef.set({
      holder: instanceId,
      acquiredAt: Timestamp.fromDate(new Date()),
      expiresAt: Timestamp.fromDate(new Date(now + LOCK_TTL_MS)),
      jobType,
    });

    return instanceId;
  } catch {
    return null;
  }
}

async function releaseLock(jobType: string): Promise<void> {
  const lockId = `cache-warming:${jobType}`;
  try {
    await locksCollection.doc(lockId).delete();
  } catch {
    // Non-critical
  }
}

// ---- Warming Functions ----

/**
 * Warm weather cache for all estates.
 * Fetches Open-Meteo forecasts and caches them.
 */
async function warmWeatherCache(estates: EstateDoc[]): Promise<{ processed: number; errors: string[] }> {
  let processed = 0;
  const errors: string[] = [];

  for (const estate of estates) {
    try {
      if (!estate.lat || !estate.lng) continue;

      await fetchWithCache(
        'open-meteo',
        `weather:${estate.lat}:${estate.lng}`,
        7200, // 2 hour TTL
        async () => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${estate.lat}&longitude=${estate.lng}&hourly=temperature_2m,relative_humidity_2m,precipitation,weathercode&forecast_days=3&timezone=Europe/London`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
          const data = await response.json() as Record<string, unknown>;
          return { data, httpStatus: response.status };
        },
        { simulated: true, hourly: { temperature_2m: [], relative_humidity_2m: [] } } as any,
        30, // rate limit
      );
      processed++;
    } catch (err: any) {
      errors.push(`Weather for ${estate.name}: ${err.message}`);
    }
  }

  return { processed, errors };
}

/**
 * Warm crime data cache for all estates.
 * Fetches Police.uk street-level crime data.
 */
async function warmCrimeCache(estates: EstateDoc[]): Promise<{ processed: number; errors: string[] }> {
  let processed = 0;
  const errors: string[] = [];

  for (const estate of estates) {
    try {
      if (!estate.lat || !estate.lng) continue;

      await fetchWithCache(
        'police.uk',
        `crime:${estate.lat}:${estate.lng}`,
        86400, // 24 hour TTL
        async () => {
          const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${estate.lat}&lng=${estate.lng}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Police.uk ${response.status}`);
          const data = await response.json() as Record<string, unknown>;
          return { data: { crimes: data } as any, httpStatus: response.status };
        },
        { crimes: [], simulated: true } as any,
        15, // rate limit
      );
      processed++;
    } catch (err: any) {
      errors.push(`Crime for ${estate.name}: ${err.message}`);
    }
  }

  return { processed, errors };
}

/**
 * Warm demographics cache for all estates.
 * Pre-fetches IMD and census data by postcode area.
 */
async function warmDemographicsCache(estates: EstateDoc[]): Promise<{ processed: number; errors: string[] }> {
  let processed = 0;
  const errors: string[] = [];

  const processedPostcodes = new Set<string>();

  for (const estate of estates) {
    try {
      if (!estate.postcode || processedPostcodes.has(estate.postcode)) continue;
      processedPostcodes.add(estate.postcode);

      await fetchWithCache(
        'postcodes.io',
        `postcode:${estate.postcode}`,
        604800, // 7 day TTL
        async () => {
          const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(estate.postcode)}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Postcodes.io ${response.status}`);
          const data = await response.json() as Record<string, unknown>;
          return { data, httpStatus: response.status };
        },
        { result: { lsoa: estate.postcode, admin_district: 'Unknown' } } as any,
        30,
      );
      processed++;
    } catch (err: any) {
      errors.push(`Demographics for ${estate.name}: ${err.message}`);
    }
  }

  return { processed, errors };
}

// ---- Main Warming Orchestrator ----

/**
 * Run cache warming for all (or specific) data types.
 * Uses Firestore lock to prevent duplicate runs across instances.
 */
export async function runCacheWarming(
  type: 'weather' | 'crime' | 'demographics' | 'all' = 'all',
  config: Partial<CacheWarmingConfig> = {},
): Promise<WarmingJob> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const jobId = `warming-${type}-${Date.now()}`;
  const job: WarmingJob = {
    id: jobId,
    type,
    status: 'pending',
    itemsProcessed: 0,
    itemsTotal: 0,
    errors: [],
  };

  // Acquire lock
  const lockHolder = await acquireLock(type);
  if (!lockHolder) {
    job.status = 'failed';
    job.errors.push('Failed to acquire lock — another warming job may be running');
    return job;
  }

  try {
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    job.lockHolder = lockHolder;

    // Fetch all estates
    const estates = await getDocs<EstateDoc>(collections.estates, undefined, undefined, 100);
    job.itemsTotal = estates.length;

    // Process in batches
    const batches: EstateDoc[][] = [];
    for (let i = 0; i < estates.length; i += cfg.batchSize) {
      batches.push(estates.slice(i, i + cfg.batchSize));
    }

    for (const batch of batches) {
      const results: { processed: number; errors: string[] }[] = [];

      if (type === 'weather' || type === 'all') {
        results.push(await warmWeatherCache(batch));
      }
      if (type === 'crime' || type === 'all') {
        results.push(await warmCrimeCache(batch));
      }
      if (type === 'demographics' || type === 'all') {
        results.push(await warmDemographicsCache(batch));
      }

      for (const result of results) {
        job.itemsProcessed += result.processed;
        job.errors.push(...result.errors);
      }

      // Delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, cfg.delayBetweenBatchesMs));
      }
    }

    job.status = 'completed';
    job.completedAt = new Date().toISOString();
  } catch (err: any) {
    job.status = 'failed';
    job.errors.push(`Job failed: ${err.message}`);
  } finally {
    await releaseLock(type);
  }

  // Persist job result
  try {
    await db.collection('cacheWarmingJobs').doc(jobId).set(job);
  } catch {
    // Non-critical
  }

  console.log(`[cache-warming] Job ${jobId}: ${job.status}, processed ${job.itemsProcessed}/${job.itemsTotal}, errors: ${job.errors.length}`);
  return job;
}

/**
 * Get the last warming job status.
 */
export async function getLastWarmingStatus(): Promise<WarmingJob | null> {
  try {
    const snapshot = await db.collection('cacheWarmingJobs')
      .orderBy('startedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as WarmingJob;
  } catch {
    return null;
  }
}
