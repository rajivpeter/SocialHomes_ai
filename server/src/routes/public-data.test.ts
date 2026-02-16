// ============================================================
// SocialHomes.Ai — Public Data API Route Tests
// Tests all 13 API endpoints exposed by public-data.ts.
// Mocks Firestore, auth middleware, and global fetch.
// Uses raw HTTP requests against an Express test server.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from 'http';

// ── Module-level mock state (declared before vi.mock for hoisting) ──

const _cacheStore = new Map<string, any>();
const _mockFetch = vi.fn();

// ── Mock @google-cloud/firestore ──
vi.mock('@google-cloud/firestore', () => {
  class Timestamp {
    _seconds: number;
    _nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this._seconds = seconds;
      this._nanoseconds = nanoseconds;
    }
    toDate(): Date {
      return new Date(this._seconds * 1000);
    }
    static fromDate(date: Date): Timestamp {
      return new Timestamp(Math.floor(date.getTime() / 1000), 0);
    }
  }

  return {
    Firestore: class {
      collection(name: string) {
        return {
          doc: (id: string) => ({
            get: async () => {
              const entry = _cacheStore.get(id);
              return { exists: !!entry, data: () => entry ?? null };
            },
            set: async (data: any) => { _cacheStore.set(id, data); },
          }),
          add: async () => ({ id: 'mock-id' }),
        };
      }
    },
    FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
    Timestamp,
  };
});

// ── Mock auth middleware ──
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = { uid: 'test-user', email: 'test@rcha.org.uk', persona: 'housing-officer' };
    next();
  },
}));

// ── Stub global fetch ──
vi.stubGlobal('fetch', _mockFetch);

// ── Import router AFTER mocks ──
import express from 'express';
import { publicDataRouter } from './public-data.js';

// ── Test helper: start an ephemeral server, make one request, shut down ──

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/public-data', publicDataRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  });
  return app;
}

async function request(
  method: 'GET' | 'POST',
  path: string,
  body?: any,
): Promise<{ status: number; body: any }> {
  const app = makeApp();
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      const options: http.RequestOptions = {
        hostname: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          server.close();
          try { resolve({ status: res.statusCode!, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode!, body: data }); }
        });
      });

      req.on('error', (err) => { server.close(); reject(err); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

// ════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════

describe('Public Data API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _mockFetch.mockReset();
    _cacheStore.clear();
  });

  // ──────────────────────────────────────────────────────────────
  // 1. GET /postcode/:postcode
  // ──────────────────────────────────────────────────────────────
  describe('GET /postcode/:postcode', () => {
    it('returns postcode data on successful lookup', async () => {
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            postcode: 'SE15 4QN', latitude: 51.4697, longitude: -0.0599,
            admin_district: 'Southwark', admin_ward: 'Peckham',
            parish: 'Southwark, unparished area',
            parliamentary_constituency: 'Camberwell and Peckham',
            lsoa: 'Southwark 026A', msoa: 'Southwark 026',
            codes: { lsoa: 'E01003968', msoa: 'E02000818', admin_district: 'E09000028' },
          },
        }),
      });

      const res = await request('GET', '/api/v1/public-data/postcode/SE15%204QN');
      expect(res.status).toBe(200);
      expect(res.body.data.postcode).toBe('SE15 4QN');
      expect(res.body.data.latitude).toBe(51.4697);
      expect(res.body.data.adminDistrict).toBe('Southwark');
      expect(res.body.data.lsoaCode).toBe('E01003968');
    });

    it('returns simulated fallback when external API fails', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const res = await request('GET', '/api/v1/public-data/postcode/SE15%204QN');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('simulated');
      expect(res.body.data.postcode).toBe('SE15 4QN');
      expect(res.body.data.adminDistrict).toBe('Southwark');
    });

    it('normalises lowercase postcode to uppercase', async () => {
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            postcode: 'SE15 4QN', latitude: 51.47, longitude: -0.06,
            admin_district: 'Southwark', admin_ward: 'Peckham', parish: null,
            parliamentary_constituency: 'Camberwell and Peckham',
            lsoa: 'Southwark 026A', msoa: 'Southwark 026',
            codes: { lsoa: 'E01003968', msoa: 'E02000818', admin_district: 'E09000028' },
          },
        }),
      });
      const res = await request('GET', '/api/v1/public-data/postcode/se15%204qn');
      expect(res.status).toBe(200);
      // The fetch URL should contain the uppercased postcode
      expect(_mockFetch.mock.calls[0][0]).toContain('SE15');
    });

    it('response schema includes all expected fields', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('fail'));
      const res = await request('GET', '/api/v1/public-data/postcode/SW1A%201AA');
      expect(res.status).toBe(200);
      const d = res.body.data;
      for (const key of ['postcode', 'latitude', 'longitude', 'adminDistrict', 'lsoa', 'lsoaCode']) {
        expect(d).toHaveProperty(key);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 2. GET /postcode/validate/:postcode
  // ──────────────────────────────────────────────────────────────
  describe('GET /postcode/validate/:postcode', () => {
    it('returns valid=true for a valid postcode', async () => {
      _mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ result: true }) });
      const res = await request('GET', '/api/v1/public-data/postcode/validate/SE15%204QN');
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.postcode).toBe('SE15 4QN');
    });

    it('returns valid=false for an invalid postcode', async () => {
      _mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ result: false }) });
      const res = await request('GET', '/api/v1/public-data/postcode/validate/INVALID');
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(false);
    });

    it('returns valid=false when fetch fails', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const res = await request('GET', '/api/v1/public-data/postcode/validate/SE15%204QN');
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 3. POST /postcodes/bulk
  // ──────────────────────────────────────────────────────────────
  describe('POST /postcodes/bulk', () => {
    it('returns bulk results for valid postcodes array', async () => {
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: [
            { query: 'SE15 4QN', result: { postcode: 'SE15 4QN', latitude: 51.47 } },
            { query: 'E1 6AN', result: { postcode: 'E1 6AN', latitude: 51.52 } },
          ],
        }),
      });
      const res = await request('POST', '/api/v1/public-data/postcodes/bulk', { postcodes: ['SE15 4QN', 'E1 6AN'] });
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('postcodes.io');
      expect(res.body.results).toHaveLength(2);
    });

    it('returns 400 when postcodes array is missing', async () => {
      const res = await request('POST', '/api/v1/public-data/postcodes/bulk', {});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('postcodes array required');
    });

    it('returns 400 when postcodes is empty array', async () => {
      const res = await request('POST', '/api/v1/public-data/postcodes/bulk', { postcodes: [] });
      expect(res.status).toBe(400);
    });

    it('limits batch to 100 postcodes', async () => {
      const postcodes = Array.from({ length: 150 }, (_, i) => `TEST${i}`);
      _mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ result: [] }) });
      await request('POST', '/api/v1/public-data/postcodes/bulk', { postcodes });
      const fetchBody = JSON.parse(_mockFetch.mock.calls[0][1].body);
      expect(fetchBody.postcodes).toHaveLength(100);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 4. GET /uprn/:uprn
  // ──────────────────────────────────────────────────────────────
  describe('GET /uprn/:uprn', () => {
    it('returns UPRN data on successful lookup', async () => {
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uprn: '100023456789', postcode: 'SE15 4QN', latitude: 51.472, longitude: -0.059,
          country: 'England', class_desc: 'Residential', type_desc: 'Flat',
        }),
      });
      const res = await request('GET', '/api/v1/public-data/uprn/100023456789');
      expect(res.status).toBe(200);
      expect(res.body.data.uprn).toBe('100023456789');
      expect(res.body.data.classificationDesc).toBe('Residential');
      expect(res.body.data.typeDesc).toBe('Flat');
    });

    it('returns simulated fallback when UPRN API fails', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('uprn.uk down'));
      const res = await request('GET', '/api/v1/public-data/uprn/100023456789');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('simulated');
      expect(res.body.data.uprn).toBe('100023456789');
      expect(res.body.data.country).toBe('England');
    });

    it('response includes expected UPRN schema fields', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('fail'));
      const res = await request('GET', '/api/v1/public-data/uprn/999999999');
      for (const key of ['uprn', 'postcode', 'latitude', 'longitude', 'country', 'classificationDesc', 'typeDesc']) {
        expect(res.body.data).toHaveProperty(key);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 5. GET /uprn/postcode/:postcode
  // ──────────────────────────────────────────────────────────────
  describe('GET /uprn/postcode/:postcode', () => {
    it('returns UPRN list for a postcode', async () => {
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ uprn: '100023456789', address: '1 Example Road' }]),
      });
      const res = await request('GET', '/api/v1/public-data/uprn/postcode/SE15%204QN');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.results)).toBe(true);
    });

    it('returns simulated empty results on failure', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('fail'));
      const res = await request('GET', '/api/v1/public-data/uprn/postcode/SE15%204QN');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('simulated');
      expect(res.body.data.results).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 6. GET /crime/:lat/:lng
  // ──────────────────────────────────────────────────────────────
  describe('GET /crime/:lat/:lng', () => {
    it('returns crime data with incident details', async () => {
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            persistent_id: 'abc123', category: 'burglary',
            location: { latitude: '51.47', longitude: '-0.06', street: { name: 'High Street' } },
            outcome_status: { category: 'Under investigation' }, month: '2026-01',
          },
          {
            persistent_id: 'def456', category: 'anti-social-behaviour',
            location: { latitude: '51.471', longitude: '-0.061', street: { name: 'Park Road' } },
            outcome_status: null, month: '2026-01',
          },
        ]),
      });
      const res = await request('GET', '/api/v1/public-data/crime/51.47/-0.06');
      expect(res.status).toBe(200);
      expect(res.body.data.incidents).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.incidents[0].category).toBe('burglary');
      expect(res.body.data.incidents[1].outcome).toBeNull();
    });

    it('returns simulated fallback when police API fails', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('API timeout'));
      const res = await request('GET', '/api/v1/public-data/crime/51.47/-0.06');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('simulated');
      expect(res.body.data.incidents.length).toBeGreaterThan(0);
    });

    it('response schema includes location, incidents, total', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('fail'));
      const res = await request('GET', '/api/v1/public-data/crime/51.47/-0.06');
      expect(res.body.data).toHaveProperty('location');
      expect(res.body.data).toHaveProperty('incidents');
      expect(res.body.data).toHaveProperty('total');
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 7. GET /crime/postcode/:postcode
  // NOTE: Route ordering bug — /crime/:lat/:lng is defined BEFORE
  // /crime/postcode/:postcode in public-data.ts, so Express
  // matches /crime/postcode/SE154QN as /crime/:lat=postcode/:lng=SE154QN.
  // The tests below verify the ACTUAL behaviour (hitting /crime/:lat/:lng).
  // See ROUTE-BUG-001 in DEV-FIX-LIST.md.
  // ──────────────────────────────────────────────────────────────
  describe('GET /crime/postcode/:postcode', () => {
    it('geocodes postcode then fetches crime data', async () => {
      // First mock: postcodes.io geocoding
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { latitude: 51.472, longitude: -0.065 } }),
      });
      // Second mock: data.police.uk crime
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { persistent_id: 'c1', category: 'burglary', location: { latitude: '51.47', longitude: '-0.06', street: { name: 'High St' } }, outcome_status: null, month: '2026-01' },
        ]),
      });

      const res = await request('GET', '/api/v1/public-data/crime/postcode/SE15%204QN');
      expect(res.status).toBe(200);
      expect(res.body.data.postcode).toBe('SE15 4QN');
      expect(res.body.data.incidents).toBeDefined();
    });

    it('returns empty incidents when all fetches fail', async () => {
      // Geocode succeeds
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { latitude: 51.47, longitude: -0.06 } }),
      });
      // Crime fetch fails for each month
      _mockFetch.mockRejectedValue(new Error('fail'));

      const res = await request('GET', '/api/v1/public-data/crime/postcode/INVALID');
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 8. GET /weather/:lat/:lng
  // ──────────────────────────────────────────────────────────────
  describe('GET /weather/:lat/:lng', () => {
    it('returns weather forecast data', async () => {
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          daily: { time: ['2026-02-16'], temperature_2m_max: [8], temperature_2m_min: [3], precipitation_sum: [2.5] },
          hourly: { time: ['2026-02-16T00:00'], temperature_2m: [5] },
        }),
      });
      const res = await request('GET', '/api/v1/public-data/weather/51.47/-0.06');
      expect(res.status).toBe(200);
      expect(res.body.data.daily).toBeDefined();
      expect(res.body.data.hourly).toBeDefined();
      expect(res.body.data.location).toEqual({ lat: '51.47', lng: '-0.06' });
    });

    it('returns simulated fallback when Open-Meteo fails', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('down'));
      const res = await request('GET', '/api/v1/public-data/weather/51.47/-0.06');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('simulated');
      expect(res.body.data.daily.temperature_2m_max).toBeDefined();
    });

    it('response includes location and daily forecast', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('fail'));
      const res = await request('GET', '/api/v1/public-data/weather/51.47/-0.06');
      expect(res.body.data).toHaveProperty('location');
      expect(res.body.data).toHaveProperty('daily');
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 9. GET /weather/history/:lat/:lng
  // ──────────────────────────────────────────────────────────────
  describe('GET /weather/history/:lat/:lng', () => {
    it('returns historical weather data', async () => {
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          daily: { time: ['2025-11-18'], temperature_2m_mean: [7], precipitation_sum: [5] },
        }),
      });
      const res = await request('GET', '/api/v1/public-data/weather/history/51.47/-0.06');
      expect(res.status).toBe(200);
      expect(res.body.data.daily).toBeDefined();
    });

    it('returns simulated fallback on failure', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('fail'));
      const res = await request('GET', '/api/v1/public-data/weather/history/51.47/-0.06');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('simulated');
      expect(res.body.data.days).toBe(90);
    });

    it('accepts custom days query parameter', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('fail'));
      const res = await request('GET', '/api/v1/public-data/weather/history/51.47/-0.06?days=30');
      expect(res.status).toBe(200);
      expect(res.body.data.days).toBe(30);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 10. GET /flood/:lat/:lng
  // ──────────────────────────────────────────────────────────────
  describe('GET /flood/:lat/:lng', () => {
    it('returns flood alerts for location', async () => {
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{
            floodAreaID: 'FA-001', severity: 'Flood Warning', severityLevel: 3,
            description: 'River Thames at Southwark', timeRaised: '2026-02-16T10:00:00Z',
            message: 'Flooding expected',
          }],
        }),
      });
      const res = await request('GET', '/api/v1/public-data/flood/51.47/-0.06');
      expect(res.status).toBe(200);
      expect(res.body.data.alerts).toHaveLength(1);
      expect(res.body.data.alerts[0].areaId).toBe('FA-001');
      expect(res.body.data.total).toBe(1);
    });

    it('returns simulated fallback with empty alerts on failure', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('DEFRA down'));
      const res = await request('GET', '/api/v1/public-data/flood/51.47/-0.06');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('simulated');
      expect(res.body.data.alerts).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });

    it('returns empty alerts when no floods in area', async () => {
      _mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
      const res = await request('GET', '/api/v1/public-data/flood/52.0/0.1');
      expect(res.status).toBe(200);
      expect(res.body.data.alerts).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 11. GET /flood/postcode/:postcode (ROUTE-BUG-001 fixed)
  // ──────────────────────────────────────────────────────────────
  describe('GET /flood/postcode/:postcode', () => {
    it('geocodes postcode then fetches flood data', async () => {
      // First mock: postcodes.io geocoding
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { latitude: 51.472, longitude: -0.065 } }),
      });
      // Second mock: DEFRA flood API
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const res = await request('GET', '/api/v1/public-data/flood/postcode/SE15%204QN');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('defra-flood');
      expect(res.body.data.postcode).toBe('SE15 4QN');
      expect(res.body.data.alerts).toEqual([]);
    });

    it('returns 500 when both geocode and flood fetch fail', async () => {
      _mockFetch.mockRejectedValue(new Error('fail'));
      const res = await request('GET', '/api/v1/public-data/flood/postcode/INVALID');
      // The flood/postcode handler doesn't have simulated fallback built-in,
      // so it throws and Express error handler returns 500
      expect(res.status).toBe(500);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 12. GET /imd/:lsoaCode
  // ──────────────────────────────────────────────────────────────
  describe('GET /imd/:lsoaCode', () => {
    it('returns IMD data for valid LSOA code', async () => {
      _mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [{ attributes: {
            IMDScore: 35.2, IMDRank: 5840, IMDDecile: 2,
            IncScore: 0.18, IncRank: 4500, EmpScore: 0.14, EmpRank: 5200,
            EduScore: 22.5, EduRank: 6100, HeaScore: -0.42, HeaRank: 7000,
            CriScore: 0.85, CriRank: 3200, HouScore: 32.1, HouRank: 2800,
            LivScore: 28.7, LivRank: 4100,
          }}],
        }),
      });
      const res = await request('GET', '/api/v1/public-data/imd/E01003968');
      expect(res.status).toBe(200);
      expect(res.body.data.lsoaCode).toBe('E01003968');
      expect(res.body.data.imdScore).toBe(35.2);
      expect(res.body.data.imdDecile).toBe(2);
      expect(res.body.data.crimeScore).toBe(0.85);
    });

    it('returns simulated fallback when ArcGIS fails', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('ArcGIS down'));
      const res = await request('GET', '/api/v1/public-data/imd/E01003968');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('simulated');
      expect(res.body.data.imdScore).toBe(35.2);
    });

    it('returns simulated fallback when LSOA not found', async () => {
      _mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) });
      const res = await request('GET', '/api/v1/public-data/imd/INVALID_LSOA');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('simulated');
    });

    it('response schema includes all deprivation domain scores', async () => {
      _mockFetch.mockRejectedValueOnce(new Error('fail'));
      const res = await request('GET', '/api/v1/public-data/imd/E01003968');
      for (const key of ['imdScore', 'imdDecile', 'incomeScore', 'employmentScore', 'educationScore', 'healthScore', 'crimeScore', 'housingScore', 'livingEnvironmentScore']) {
        expect(res.body.data).toHaveProperty(key);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 13. GET /epc/:postcode
  // ──────────────────────────────────────────────────────────────
  describe('GET /epc/:postcode', () => {
    it('returns simulated EPC data when no API key is set', async () => {
      const saved = process.env.EPC_API_KEY;
      delete process.env.EPC_API_KEY;
      const res = await request('GET', '/api/v1/public-data/epc/SE15%204QN');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('simulated');
      expect(res.body.data.results).toHaveLength(2);
      expect(res.body.data.results[0]).toHaveProperty('rating');
      expect(res.body.data.results[0]).toHaveProperty('sapScore');
      if (saved) process.env.EPC_API_KEY = saved;
    });

    it('EPC simulated data has realistic ratings', async () => {
      delete process.env.EPC_API_KEY;
      const res = await request('GET', '/api/v1/public-data/epc/SE15%204QN');
      const validRatings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      for (const r of res.body.data.results) {
        expect(validRatings).toContain(r.rating);
        expect(r.sapScore).toBeGreaterThan(0);
        expect(r.sapScore).toBeLessThan(100);
      }
    });

    it('response includes postcode and results array', async () => {
      delete process.env.EPC_API_KEY;
      const res = await request('GET', '/api/v1/public-data/epc/E1%206AN');
      expect(res.body.data).toHaveProperty('postcode');
      expect(Array.isArray(res.body.data.results)).toBe(true);
    });
  });
});
