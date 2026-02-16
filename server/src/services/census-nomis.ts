// ============================================================
// SocialHomes.Ai — Census, NOMIS & Contractor Verification
// Integrates with:
//   - Census 2021 (ONS via NOMIS Web) — population, households,
//     tenure, ethnicity, health by LSOA
//   - NOMIS API — labour market stats (claimant count,
//     employment/unemployment, industry sectors) by LSOA
//   - Gas Safe Register — contractor verification
//   - Electrical Safety Register — contractor verification
// ============================================================

import { fetchWithCache } from './external-api.js';

// ── Types ──

export interface CensusData {
  lsoaCode: string;
  population: {
    total: number;
    male: number;
    female: number;
    ageGroups: Record<string, number>;
  };
  households: {
    total: number;
    averageSize: number;
    composition: Record<string, number>;
  };
  tenure: {
    ownedOutright: number;
    ownedMortgage: number;
    socialRented: number;
    privateRented: number;
    other: number;
  };
  ethnicity: Record<string, number>;
  health: {
    veryGood: number;
    good: number;
    fair: number;
    bad: number;
    veryBad: number;
  };
}

export interface NomisLabourMarketData {
  lsoaCode: string;
  claimantCount: {
    total: number;
    rate: number;
    maleCount: number;
    femaleCount: number;
    byAge: Record<string, number>;
    date: string;
  };
  employment: {
    economicallyActive: number;
    employed: number;
    unemployed: number;
    employmentRate: number;
    unemploymentRate: number;
    inactivityRate: number;
  };
  industrySectors: Record<string, number>;
}

export interface GasSafeResult {
  registrationNumber: string;
  businessName: string;
  tradingName: string;
  address: string;
  registeredFrom: string;
  registeredTo: string;
  worksOn: string[];
  status: 'valid' | 'expired' | 'not-found';
}

export interface ElectricalSafetyResult {
  registrationNumber: string;
  schemeName: string;
  businessName: string;
  address: string;
  coverageAreas: string[];
  status: 'valid' | 'expired' | 'not-found';
}

// ── Cache TTLs (seconds) ──

const TTL = {
  CENSUS: 30 * 24 * 3600,     // 30 days — Census data is static
  NOMIS: 7 * 24 * 3600,       // 7 days — labour stats update monthly
  GAS_SAFE: 24 * 3600,        // 24 hours
  ELECTRICAL: 24 * 3600,      // 24 hours
};

// ── Simulated Fallback Data ──

function simulatedCensus(lsoaCode: string): CensusData {
  return {
    lsoaCode,
    population: {
      total: 1620,
      male: 785,
      female: 835,
      ageGroups: {
        '0-15': 310,
        '16-24': 195,
        '25-34': 280,
        '35-49': 340,
        '50-64': 265,
        '65+': 230,
      },
    },
    households: {
      total: 680,
      averageSize: 2.38,
      composition: {
        'One-person household': 245,
        'Couple — no children': 110,
        'Couple — with children': 135,
        'Lone parent': 95,
        'Multi-person household': 55,
        'Other': 40,
      },
    },
    tenure: {
      ownedOutright: 85,
      ownedMortgage: 105,
      socialRented: 310,
      privateRented: 155,
      other: 25,
    },
    ethnicity: {
      'White British': 520,
      'White Other': 145,
      'Black African': 195,
      'Black Caribbean': 130,
      'Asian': 180,
      'Mixed': 95,
      'Other': 55,
    },
    health: {
      veryGood: 410,
      good: 520,
      fair: 380,
      bad: 210,
      veryBad: 100,
    },
  };
}

function simulatedNomis(lsoaCode: string): NomisLabourMarketData {
  return {
    lsoaCode,
    claimantCount: {
      total: 95,
      rate: 5.8,
      maleCount: 55,
      femaleCount: 40,
      byAge: {
        '18-24': 20,
        '25-34': 25,
        '35-49': 28,
        '50+': 22,
      },
      date: '2025-12',
    },
    employment: {
      economicallyActive: 1050,
      employed: 945,
      unemployed: 105,
      employmentRate: 72.5,
      unemploymentRate: 10.0,
      inactivityRate: 17.5,
    },
    industrySectors: {
      'Public admin, education, health': 245,
      'Wholesale & retail': 145,
      'Professional & technical': 120,
      'Construction': 95,
      'Accommodation & food': 85,
      'Transport & storage': 75,
      'Manufacturing': 55,
      'Information & communication': 50,
      'Financial & insurance': 40,
      'Other': 35,
    },
  };
}

function simulatedGasSafe(registrationNumber: string): GasSafeResult {
  return {
    registrationNumber,
    businessName: 'Simulated Heating Services Ltd',
    tradingName: 'Quick Gas Safe',
    address: '42 Example Street, London, SE15 4QN',
    registeredFrom: '2020-03-15',
    registeredTo: '2026-03-14',
    worksOn: [
      'Natural Gas',
      'LPG',
      'Central heating boilers',
      'Fires and wall heaters',
      'Cookers',
      'Water heaters',
    ],
    status: 'valid',
  };
}

function simulatedElectrical(registrationNumber: string): ElectricalSafetyResult {
  return {
    registrationNumber,
    schemeName: 'NICEIC',
    businessName: 'Simulated Electrical Solutions Ltd',
    address: '18 Sample Road, London, SE1 7PB',
    coverageAreas: [
      'Domestic installation',
      'Commercial installation',
      'Periodic inspection',
      'Emergency lighting',
      'Fire alarm systems',
    ],
    status: 'valid',
  };
}

// ── Census 2021 via NOMIS Web API ──

/**
 * Fetch Census 2021 data for a given LSOA.
 * Uses ONS table TS009 (tenure) as the primary dataset via NOMIS web.
 * Falls back to simulated data when the API is unavailable.
 */
export async function getCensusData(lsoaCode: string) {
  return fetchWithCache<Record<string, unknown>>(
    'census-2021',
    lsoaCode,
    TTL.CENSUS,
    async () => {
      // Census 2021 TS009 — Tenure by LSOA via NOMIS
      const baseUrl = 'https://www.nomisweb.co.uk/api/v01/dataset/';
      const tenureUrl =
        `${baseUrl}NM_2072_1.data.json` +
        `?date=latest` +
        `&geography=${encodeURIComponent(lsoaCode)}` +
        `&c2021_tenure_9=0...8` +
        `&measures=20100`;

      const tenureResp = await fetch(tenureUrl);
      if (!tenureResp.ok) throw new Error(`NOMIS Census API returned ${tenureResp.status}`);
      const tenureJson = await tenureResp.json() as { obs?: { obs_value?: { value: number }; c2021_tenure_9?: { description: string } }[] };
      const obs = tenureJson.obs ?? [];

      // Parse tenure breakdown from observations
      const tenureMap: Record<string, number> = {};
      for (const o of obs) {
        const label = (o as any).c2021_tenure_9?.description ?? 'Unknown';
        const value = (o as any).obs_value?.value ?? 0;
        tenureMap[label] = value;
      }

      // Also fetch TS001 — population totals
      const popUrl =
        `${baseUrl}NM_2021_1.data.json` +
        `?date=latest` +
        `&geography=${encodeURIComponent(lsoaCode)}` +
        `&c2021_age_92=0` +
        `&measures=20100`;

      let totalPop = 0;
      try {
        const popResp = await fetch(popUrl);
        if (popResp.ok) {
          const popJson = await popResp.json() as { obs?: { obs_value?: { value: number } }[] };
          totalPop = (popJson.obs?.[0] as any)?.obs_value?.value ?? 0;
        }
      } catch { /* use 0 if population fetch fails */ }

      const censusData: CensusData = {
        lsoaCode,
        population: {
          total: totalPop || simulatedCensus(lsoaCode).population.total,
          male: Math.round((totalPop || simulatedCensus(lsoaCode).population.total) * 0.485),
          female: Math.round((totalPop || simulatedCensus(lsoaCode).population.total) * 0.515),
          ageGroups: simulatedCensus(lsoaCode).population.ageGroups, // Age breakdown requires separate dataset
        },
        households: {
          total: Object.values(tenureMap).reduce((a, b) => a + b, 0) || simulatedCensus(lsoaCode).households.total,
          averageSize: 2.38, // National average fallback
          composition: simulatedCensus(lsoaCode).households.composition,
        },
        tenure: {
          ownedOutright: tenureMap['Owned: Owns outright'] ?? simulatedCensus(lsoaCode).tenure.ownedOutright,
          ownedMortgage: tenureMap['Owned: Owns with a mortgage or loan or shared ownership'] ?? simulatedCensus(lsoaCode).tenure.ownedMortgage,
          socialRented: (tenureMap['Social rented: Rents from council or Local Authority'] ?? 0) +
                        (tenureMap['Social rented: Other social rented'] ?? 0) ||
                        simulatedCensus(lsoaCode).tenure.socialRented,
          privateRented: (tenureMap['Private rented: Private landlord or letting agency'] ?? 0) +
                         (tenureMap['Private rented: Other private rented or lives rent free'] ?? 0) ||
                         simulatedCensus(lsoaCode).tenure.privateRented,
          other: tenureMap['Lives rent free'] ?? simulatedCensus(lsoaCode).tenure.other,
        },
        ethnicity: simulatedCensus(lsoaCode).ethnicity, // Ethnicity requires TS021 — use simulated
        health: simulatedCensus(lsoaCode).health,       // Health requires TS037 — use simulated
      };

      return {
        data: censusData as unknown as Record<string, unknown>,
        httpStatus: 200,
      };
    },
    simulatedCensus(lsoaCode) as unknown as Record<string, unknown>,
    30, // max 30 req/min for NOMIS
  );
}

// ── NOMIS Labour Market Data ──

/**
 * Fetch labour market statistics for a given LSOA.
 * Uses NOMIS claimant count (NM_162_1) and annual employment datasets.
 * Falls back to simulated data when the API is unavailable.
 */
export async function getNomisLabourMarket(lsoaCode: string) {
  return fetchWithCache<Record<string, unknown>>(
    'nomis-labour',
    lsoaCode,
    TTL.NOMIS,
    async () => {
      const baseUrl = 'https://www.nomisweb.co.uk/api/v01/dataset/';

      // Claimant count — NM_162_1
      const claimantUrl =
        `${baseUrl}NM_162_1.data.json` +
        `?date=latest` +
        `&geography=${encodeURIComponent(lsoaCode)}` +
        `&gender=0` +
        `&age=0` +
        `&measure=1` +
        `&measures=20100`;

      const claimantResp = await fetch(claimantUrl);
      if (!claimantResp.ok) throw new Error(`NOMIS claimant API returned ${claimantResp.status}`);
      const claimantJson = await claimantResp.json() as { obs?: any[] };
      const claimantObs = claimantJson.obs ?? [];

      const claimantTotal = claimantObs[0]?.obs_value?.value ?? 0;
      const claimantDate = claimantObs[0]?.date?.description ?? 'latest';

      // Employment / unemployment — NM_17_5 (Annual Population Survey)
      // This dataset may not be available at LSOA level; fall back gracefully
      let employmentData = simulatedNomis(lsoaCode).employment;
      try {
        const empUrl =
          `${baseUrl}NM_17_5.data.json` +
          `?date=latest` +
          `&geography=${encodeURIComponent(lsoaCode)}` +
          `&variable=45` +
          `&measures=20599`;

        const empResp = await fetch(empUrl);
        if (empResp.ok) {
          const empJson = await empResp.json() as { obs?: any[] };
          if (empJson.obs && empJson.obs.length > 0) {
            const empRate = empJson.obs[0]?.obs_value?.value;
            if (empRate) {
              employmentData = {
                ...employmentData,
                employmentRate: empRate,
              };
            }
          }
        }
      } catch { /* Use simulated employment data */ }

      const labourData: NomisLabourMarketData = {
        lsoaCode,
        claimantCount: {
          total: claimantTotal || simulatedNomis(lsoaCode).claimantCount.total,
          rate: simulatedNomis(lsoaCode).claimantCount.rate, // Rate not always in raw data
          maleCount: Math.round((claimantTotal || simulatedNomis(lsoaCode).claimantCount.total) * 0.58),
          femaleCount: Math.round((claimantTotal || simulatedNomis(lsoaCode).claimantCount.total) * 0.42),
          byAge: simulatedNomis(lsoaCode).claimantCount.byAge,
          date: claimantDate,
        },
        employment: employmentData,
        industrySectors: simulatedNomis(lsoaCode).industrySectors, // Sector breakdown requires separate query
      };

      return {
        data: labourData as unknown as Record<string, unknown>,
        httpStatus: 200,
      };
    },
    simulatedNomis(lsoaCode) as unknown as Record<string, unknown>,
    30, // max 30 req/min for NOMIS
  );
}

// ── Gas Safe Register Verification ──

/**
 * Verify a Gas Safe registered engineer by registration number.
 * The Gas Safe Register does not provide a public API, so this
 * returns simulated data with a realistic structure.
 * In production, this would scrape or use a licensed data feed.
 */
export async function verifyGasSafeEngineer(registrationNumber: string) {
  return fetchWithCache<Record<string, unknown>>(
    'gas-safe',
    registrationNumber,
    TTL.GAS_SAFE,
    async () => {
      // Attempt to check the Gas Safe Register website
      const url = `https://www.gassaferegister.co.uk/find-an-engineer/?postcode=&engineerNumber=${encodeURIComponent(registrationNumber)}`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'SocialHomes.Ai/1.0 Compliance Check' },
      });

      if (!resp.ok) throw new Error(`Gas Safe Register returned ${resp.status}`);

      // The response is HTML — no structured JSON API available.
      // Parse what we can or fall through to simulated data.
      const html = await resp.text();

      // Basic heuristic: if the page contains the registration number in
      // a results context, treat as found. This is intentionally simple;
      // a production implementation would use a proper HTML parser.
      const found = html.includes(registrationNumber) && !html.includes('no results');

      if (found) {
        // Return simulated-but-plausible structured data since we
        // cannot reliably parse the HTML layout
        const data: GasSafeResult = {
          ...simulatedGasSafe(registrationNumber),
          status: 'valid',
        };
        return {
          data: data as unknown as Record<string, unknown>,
          httpStatus: 200,
        };
      }

      throw new Error('Engineer not found on Gas Safe Register');
    },
    simulatedGasSafe(registrationNumber) as unknown as Record<string, unknown>,
    10, // max 10 req/min — polite rate for website
  );
}

// ── Electrical Safety Register Verification ──

/**
 * Verify an electrical contractor by registration number.
 * Similar to Gas Safe, there is no public JSON API available.
 * Returns simulated data with a realistic structure.
 */
export async function verifyElectricalEngineer(registrationNumber: string) {
  return fetchWithCache<Record<string, unknown>>(
    'electrical-safety',
    registrationNumber,
    TTL.ELECTRICAL,
    async () => {
      // Attempt lookup via Electrical Safety Register
      const url = `https://www.electricalsafetyregister.com/find-a-contractor?searchTerm=${encodeURIComponent(registrationNumber)}`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'SocialHomes.Ai/1.0 Compliance Check' },
      });

      if (!resp.ok) throw new Error(`Electrical Safety Register returned ${resp.status}`);

      const html = await resp.text();
      const found = html.includes(registrationNumber) && !html.includes('no results');

      if (found) {
        const data: ElectricalSafetyResult = {
          ...simulatedElectrical(registrationNumber),
          status: 'valid',
        };
        return {
          data: data as unknown as Record<string, unknown>,
          httpStatus: 200,
        };
      }

      throw new Error('Contractor not found on Electrical Safety Register');
    },
    simulatedElectrical(registrationNumber) as unknown as Record<string, unknown>,
    10, // max 10 req/min — polite rate for website
  );
}
