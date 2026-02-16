// ============================================================
// SocialHomes.Ai — Public Data API Routes
// Server-side proxy for all external public-service APIs.
// GP-1: Client never calls external APIs directly.
// GP-2: Graceful degradation with simulated fallback.
// GP-3: Firestore cache with TTL.
// GP-4: Audit trail for every external call.
// GP-5: Rate limiting per API.
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { fetchWithCache } from '../services/external-api.js';
import {
  getCensusData,
  getNomisLabourMarket,
  verifyGasSafeEngineer,
  verifyElectricalEngineer,
} from '../services/census-nomis.js';

export const publicDataRouter = Router();
publicDataRouter.use(authMiddleware);

// ── Cache TTLs (seconds) ──
const TTL = {
  POSTCODE: 90 * 24 * 3600,   // 90 days
  UPRN: 90 * 24 * 3600,       // 90 days
  CRIME: 24 * 3600,           // 24 hours
  WEATHER: 3600,               // 1 hour
  WEATHER_HISTORY: 7 * 24 * 3600, // 7 days
  FLOOD: 3600,                 // 1 hour
  IMD: 90 * 24 * 3600,        // 90 days
  EPC: 30 * 24 * 3600,        // 30 days
  CENSUS: 30 * 24 * 3600,     // 30 days
  NOMIS: 7 * 24 * 3600,       // 7 days
  GAS_SAFE: 24 * 3600,        // 24 hours
  ELECTRICAL: 24 * 3600,      // 24 hours
};

// ============================================================
// 3.2  postcodes.io — Postcode Lookup, LSOA, Ward, Geography
// ============================================================

publicDataRouter.get('/postcode/:postcode', async (req, res, next) => {
  try {
    const postcode = req.params.postcode.trim().toUpperCase();

    const result = await fetchWithCache(
      'postcodes.io',
      postcode,
      TTL.POSTCODE,
      async () => {
        const resp = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
        if (!resp.ok) throw new Error(`postcodes.io returned ${resp.status}`);
        const json = await resp.json() as { result: Record<string, unknown> };
        const r = json.result;
        return {
          data: {
            postcode: r.postcode,
            latitude: r.latitude,
            longitude: r.longitude,
            adminDistrict: r.admin_district,
            adminWard: r.admin_ward,
            parish: r.parish,
            constituency: r.parliamentary_constituency,
            lsoa: r.lsoa,
            msoa: r.msoa,
            lsoaCode: (r.codes as any)?.lsoa,
            msoaCode: (r.codes as any)?.msoa,
            adminDistrictCode: (r.codes as any)?.admin_district,
          } as Record<string, unknown>,
          httpStatus: 200,
        };
      },
      // Simulated fallback
      {
        postcode,
        latitude: 51.47,
        longitude: -0.01,
        adminDistrict: 'Southwark',
        adminWard: 'Peckham',
        parish: null,
        constituency: 'Camberwell and Peckham',
        lsoa: 'Southwark 026A',
        msoa: 'Southwark 026',
        lsoaCode: 'E01003968',
        msoaCode: 'E02000818',
        adminDistrictCode: 'E09000028',
      },
      120, // max 120 req/min
    );

    res.json(result);
  } catch (err) { next(err); }
});

publicDataRouter.get('/postcode/validate/:postcode', async (req, res, next) => {
  try {
    const postcode = req.params.postcode.trim().toUpperCase();
    const resp = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}/validate`);
    const json = await resp.json() as { result: boolean };
    res.json({ postcode, valid: json.result ?? false });
  } catch {
    res.json({ postcode: req.params.postcode, valid: false });
  }
});

publicDataRouter.post('/postcodes/bulk', async (req, res, next) => {
  try {
    const { postcodes } = req.body as { postcodes: string[] };
    if (!Array.isArray(postcodes) || postcodes.length === 0) {
      return res.status(400).json({ error: 'postcodes array required' });
    }
    const batch = postcodes.slice(0, 100); // Max 100
    const resp = await fetch('https://api.postcodes.io/postcodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postcodes: batch }),
    });
    if (!resp.ok) throw new Error(`postcodes.io bulk returned ${resp.status}`);
    const json = await resp.json() as { result: any[] };
    res.json({ source: 'postcodes.io', results: json.result ?? [] });
  } catch (err) { next(err); }
});

// ============================================================
// 3.3  Open UPRN (uprn.uk) — UPRN Lookup
// ============================================================

publicDataRouter.get('/uprn/:uprn', async (req, res, next) => {
  try {
    const uprn = req.params.uprn.trim();

    const result = await fetchWithCache(
      'uprn.uk',
      uprn,
      TTL.UPRN,
      async () => {
        const resp = await fetch(`https://uprn.uk/${encodeURIComponent(uprn)}.json`);
        if (!resp.ok) throw new Error(`uprn.uk returned ${resp.status}`);
        const json = await resp.json() as Record<string, unknown>;
        return {
          data: {
            uprn: json.uprn,
            postcode: json.postcode,
            latitude: json.latitude,
            longitude: json.longitude,
            country: json.country,
            classificationDesc: json.class_desc,
            typeDesc: json.type_desc,
          } as Record<string, unknown>,
          httpStatus: 200,
        };
      },
      {
        uprn,
        postcode: 'SE15 4QN',
        latitude: 51.472,
        longitude: -0.059,
        country: 'England',
        classificationDesc: 'Residential',
        typeDesc: 'Flat',
      },
    );

    res.json(result);
  } catch (err) { next(err); }
});

publicDataRouter.get('/uprn/postcode/:postcode', async (req, res, next) => {
  try {
    const postcode = req.params.postcode.trim().replace(/\s+/g, '+');

    const result = await fetchWithCache(
      'uprn.uk-postcode',
      postcode,
      TTL.UPRN,
      async () => {
        const resp = await fetch(`https://uprn.uk/postcode/${encodeURIComponent(postcode)}.json`);
        if (!resp.ok) throw new Error(`uprn.uk returned ${resp.status}`);
        const json = await resp.json() as any[];
        return {
          data: { postcode, results: Array.isArray(json) ? json : [] } as Record<string, unknown>,
          httpStatus: 200,
        };
      },
      { postcode, results: [] },
    );

    res.json(result);
  } catch (err) { next(err); }
});

// ============================================================
// 3.1  data.police.uk — Street-Level Crime & ASB
// ============================================================

// NOTE: /crime/postcode route MUST be defined before /crime/:lat/:lng
//       to avoid Express route shadowing (ROUTE-BUG-001 fix)
publicDataRouter.get('/crime/postcode/:postcode', async (req, res, next) => {
  try {
    const postcode = req.params.postcode.trim().toUpperCase();
    const months = parseInt((req.query.months as string) || '3', 10);

    // Step 1: Geocode postcode via postcodes.io
    let lat: number, lng: number;
    try {
      const geoResp = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
      const geoJson = await geoResp.json() as { result?: { latitude: number; longitude: number } };
      lat = geoJson.result?.latitude ?? 51.47;
      lng = geoJson.result?.longitude ?? -0.01;
    } catch {
      lat = 51.47;
      lng = -0.01;
    }

    // Step 2: Fetch crime data for recent months
    const now = new Date();
    const allIncidents: any[] = [];
    for (let m = 1; m <= Math.min(months, 6); m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      try {
        const resp = await fetch(`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${dateStr}`);
        if (resp.ok) {
          const crimes = await resp.json() as any[];
          for (const c of crimes) {
            allIncidents.push({
              externalId: c.persistent_id,
              category: c.category,
              lat: parseFloat(c.location?.latitude),
              lng: parseFloat(c.location?.longitude),
              streetName: c.location?.street?.name,
              outcome: c.outcome_status?.category ?? null,
              month: c.month,
            });
          }
        }
      } catch { /* skip failed month */ }
    }

    res.json({
      source: allIncidents.length > 0 ? 'police-crime' : 'simulated',
      data: { postcode, lat, lng, months, incidents: allIncidents, total: allIncidents.length },
      cached: false,
    });
  } catch (err) { next(err); }
});

publicDataRouter.get('/crime/:lat/:lng', async (req, res, next) => {
  try {
    const { lat, lng } = req.params;
    const date = (req.query.date as string) || undefined;
    const category = (req.query.category as string) || 'all-crime';
    const key = `${lat},${lng}:${date || 'latest'}:${category}`;

    const result = await fetchWithCache(
      'police-crime',
      key,
      TTL.CRIME,
      async () => {
        let url = `https://data.police.uk/api/crimes-street/${category}?lat=${lat}&lng=${lng}`;
        if (date) url += `&date=${date}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`data.police.uk returned ${resp.status}`);
        const crimes = await resp.json() as any[];
        // Transform to internal schema
        const incidents = crimes.map((c: any) => ({
          externalId: c.persistent_id,
          category: c.category,
          lat: parseFloat(c.location?.latitude),
          lng: parseFloat(c.location?.longitude),
          streetName: c.location?.street?.name,
          outcome: c.outcome_status?.category ?? null,
          month: c.month,
        }));
        return {
          data: { location: { lat, lng }, date, category, incidents, total: incidents.length } as Record<string, unknown>,
          httpStatus: 200,
        };
      },
      {
        location: { lat, lng },
        date, category,
        incidents: [
          { externalId: 'sim-1', category: 'anti-social-behaviour', lat: parseFloat(lat), lng: parseFloat(lng), streetName: 'On or near High Street', outcome: null, month: '2026-01' },
          { externalId: 'sim-2', category: 'burglary', lat: parseFloat(lat) + 0.001, lng: parseFloat(lng) - 0.001, streetName: 'On or near Park Road', outcome: 'Under investigation', month: '2026-01' },
        ],
        total: 2,
      },
      15, // data.police.uk: 15 req/sec
    );

    res.json(result);
  } catch (err) { next(err); }
});

// ============================================================
// 3.4  Open-Meteo — Weather Forecasts & Historical Data
// ============================================================

publicDataRouter.get('/weather/:lat/:lng', async (req, res, next) => {
  try {
    const { lat, lng } = req.params;

    const result = await fetchWithCache(
      'open-meteo',
      `${lat},${lng}`,
      TTL.WEATHER,
      async () => {
        const resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max` +
          `&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,surface_pressure,precipitation` +
          `&timezone=Europe/London&forecast_days=7`
        );
        if (!resp.ok) throw new Error(`open-meteo returned ${resp.status}`);
        const json = await resp.json() as Record<string, unknown>;
        return {
          data: { location: { lat, lng }, daily: json.daily, hourly: json.hourly } as Record<string, unknown>,
          httpStatus: 200,
        };
      },
      {
        location: { lat, lng },
        daily: {
          time: ['2026-02-16', '2026-02-17', '2026-02-18'],
          temperature_2m_max: [8, 7, 9],
          temperature_2m_min: [3, 2, 4],
          precipitation_sum: [12.5, 8.2, 0],
          relative_humidity_2m_mean: [85, 82, 75],
        },
        hourly: null,
      },
      100, // 10k/day ≈ ~7/min
    );

    res.json(result);
  } catch (err) { next(err); }
});

publicDataRouter.get('/weather/history/:lat/:lng', async (req, res, next) => {
  try {
    const { lat, lng } = req.params;
    const days = parseInt((req.query.days as string) || '90', 10);
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 3600 * 1000);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const result = await fetchWithCache(
      'open-meteo-history',
      `${lat},${lng}:${days}d`,
      TTL.WEATHER_HISTORY,
      async () => {
        const resp = await fetch(
          `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
          `&start_date=${startStr}&end_date=${endStr}` +
          `&daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean` +
          `&timezone=Europe/London`
        );
        if (!resp.ok) throw new Error(`open-meteo archive returned ${resp.status}`);
        const json = await resp.json() as Record<string, unknown>;
        return {
          data: { location: { lat, lng }, days, daily: json.daily } as Record<string, unknown>,
          httpStatus: 200,
        };
      },
      {
        location: { lat, lng },
        days,
        daily: { time: [startStr, endStr], temperature_2m_mean: [8, 7], precipitation_sum: [5, 10], relative_humidity_2m_mean: [80, 85] },
      },
    );

    res.json(result);
  } catch (err) { next(err); }
});

// ============================================================
// 3.5  DEFRA Flood Risk API — Flood Warnings & Risk Zones
// ============================================================

// NOTE: /flood/postcode route MUST be defined before /flood/:lat/:lng
//       to avoid Express route shadowing (ROUTE-BUG-001 fix)
publicDataRouter.get('/flood/postcode/:postcode', async (req, res, next) => {
  try {
    const postcode = req.params.postcode.trim().toUpperCase();

    // Geocode via postcodes.io
    let lat = 51.47, lng = -0.01;
    try {
      const geoResp = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
      const geoJson = await geoResp.json() as { result?: { latitude: number; longitude: number } };
      lat = geoJson.result?.latitude ?? lat;
      lng = geoJson.result?.longitude ?? lng;
    } catch { /* use defaults */ }

    // Redirect to lat/lng handler
    const resp = await fetch(
      `https://environment.data.gov.uk/flood-monitoring/id/floods?lat=${lat}&long=${lng}&dist=5`
    );
    const json = await resp.json() as { items: any[] };
    const alerts = (json.items ?? []).map((item: any) => ({
      areaId: item.floodAreaID,
      severity: item.severity,
      severityLevel: item.severityLevel,
      description: item.description,
      raisedAt: item.timeRaised,
      message: item.message,
    }));

    res.json({
      source: 'defra-flood',
      data: { postcode, lat, lng, alerts, total: alerts.length },
      cached: false,
    });
  } catch (err) { next(err); }
});

publicDataRouter.get('/flood/:lat/:lng', async (req, res, next) => {
  try {
    const { lat, lng } = req.params;
    const dist = (req.query.dist as string) || '5';

    const result = await fetchWithCache(
      'defra-flood',
      `${lat},${lng}:${dist}`,
      TTL.FLOOD,
      async () => {
        const resp = await fetch(
          `https://environment.data.gov.uk/flood-monitoring/id/floods?lat=${lat}&long=${lng}&dist=${dist}`
        );
        if (!resp.ok) throw new Error(`DEFRA flood API returned ${resp.status}`);
        const json = await resp.json() as { items: any[] };
        const alerts = (json.items ?? []).map((item: any) => ({
          areaId: item.floodAreaID,
          severity: item.severity,
          severityLevel: item.severityLevel,
          description: item.description,
          raisedAt: item.timeRaised,
          message: item.message,
        }));
        return {
          data: { location: { lat, lng }, alerts, total: alerts.length } as Record<string, unknown>,
          httpStatus: 200,
        };
      },
      { location: { lat, lng }, alerts: [], total: 0 },
    );

    res.json(result);
  } catch (err) { next(err); }
});

// ============================================================
// 3.6  IMD — Index of Multiple Deprivation (LSOA-based)
// ============================================================

publicDataRouter.get('/imd/:lsoaCode', async (req, res, next) => {
  try {
    const lsoaCode = req.params.lsoaCode.trim();

    const result = await fetchWithCache(
      'imd',
      lsoaCode,
      TTL.IMD,
      async () => {
        // Query ArcGIS REST service for IMD data by LSOA code
        const url = `https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/IMD_2019/FeatureServer/0/query` +
          `?where=lsoa11cd='${encodeURIComponent(lsoaCode)}'&outFields=*&f=json`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`ArcGIS IMD returned ${resp.status}`);
        const json = await resp.json() as { features?: { attributes: Record<string, unknown> }[] };
        const attrs = json.features?.[0]?.attributes;
        if (!attrs) throw new Error('LSOA not found in IMD dataset');
        return {
          data: {
            lsoaCode,
            imdScore: attrs.IMDScore ?? attrs.IMDScore0,
            imdRank: attrs.IMDRank ?? attrs.IMDRank0,
            imdDecile: attrs.IMDDecile ?? attrs.IMDDec0,
            incomeScore: attrs.IncScore,
            incomeRank: attrs.IncRank,
            employmentScore: attrs.EmpScore,
            employmentRank: attrs.EmpRank,
            educationScore: attrs.EduScore,
            educationRank: attrs.EduRank,
            healthScore: attrs.HeaScore,
            healthRank: attrs.HeaRank,
            crimeScore: attrs.CriScore,
            crimeRank: attrs.CriRank,
            housingScore: attrs.HouScore,
            housingRank: attrs.HouRank,
            livingEnvironmentScore: attrs.LivScore,
            livingEnvironmentRank: attrs.LivRank,
          } as Record<string, unknown>,
          httpStatus: 200,
        };
      },
      {
        lsoaCode,
        imdScore: 35.2,
        imdRank: 5840,
        imdDecile: 2,
        incomeScore: 0.18,
        employmentScore: 0.14,
        educationScore: 22.5,
        healthScore: -0.42,
        crimeScore: 0.85,
        housingScore: 32.1,
        livingEnvironmentScore: 28.7,
      },
    );

    res.json(result);
  } catch (err) { next(err); }
});

// ============================================================
// EPC Register (existing — requires API key)
// ============================================================

publicDataRouter.get('/epc/:postcode', async (req, res, next) => {
  try {
    const postcode = req.params.postcode.replace(/\s+/g, '+');
    const epcApiKey = process.env.EPC_API_KEY;

    if (!epcApiKey) {
      return res.json({
        source: 'simulated',
        data: {
          postcode: req.params.postcode,
          results: [
            { address: '1 Example Road', rating: 'C', sapScore: 68, date: '2023-06-15' },
            { address: '2 Example Road', rating: 'D', sapScore: 55, date: '2022-11-20' },
          ],
        },
        cached: false,
      });
    }

    const result = await fetchWithCache(
      'epc-register',
      postcode,
      TTL.EPC,
      async () => {
        const resp = await fetch(`https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${postcode}`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${epcApiKey}:`).toString('base64')}`,
            'Accept': 'application/json',
          },
        });
        if (!resp.ok) throw new Error(`EPC API returned ${resp.status}`);
        const json = await resp.json() as { rows?: any[] };
        return {
          data: { postcode: req.params.postcode, results: json.rows ?? [] } as Record<string, unknown>,
          httpStatus: 200,
        };
      },
    );

    res.json(result);
  } catch (err) { next(err); }
});

// ============================================================
// 3.7  Census 2021 (ONS via NOMIS) — Population, Households,
//      Tenure, Ethnicity, Health by LSOA
// ============================================================

publicDataRouter.get('/census/:lsoaCode', async (req, res, next) => {
  try {
    const lsoaCode = req.params.lsoaCode.trim();
    const result = await getCensusData(lsoaCode);
    res.json(result);
  } catch (err) { next(err); }
});

// ============================================================
// 3.8  NOMIS — Labour Market Stats (Claimant Count,
//      Employment/Unemployment, Industry Sectors) by LSOA
// ============================================================

publicDataRouter.get('/nomis/:lsoaCode', async (req, res, next) => {
  try {
    const lsoaCode = req.params.lsoaCode.trim();
    const result = await getNomisLabourMarket(lsoaCode);
    res.json(result);
  } catch (err) { next(err); }
});

// ============================================================
// 3.9  Gas Safe Register — Contractor Verification
// ============================================================

publicDataRouter.get('/gas-safe/:registrationNumber', async (req, res, next) => {
  try {
    const registrationNumber = req.params.registrationNumber.trim();
    const result = await verifyGasSafeEngineer(registrationNumber);
    res.json(result);
  } catch (err) { next(err); }
});

// ============================================================
// 3.10 Electrical Safety Register — Contractor Verification
// ============================================================

publicDataRouter.get('/electrical-safety/:registrationNumber', async (req, res, next) => {
  try {
    const registrationNumber = req.params.registrationNumber.trim();
    const result = await verifyElectricalEngineer(registrationNumber);
    res.json(result);
  } catch (err) { next(err); }
});
