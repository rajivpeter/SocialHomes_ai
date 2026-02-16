// ============================================================
// SocialHomes.Ai — IMD Data Seed Script
// Loads Index of Multiple Deprivation (IMD 2019) data into
// Firestore externalDataCache for fast lookup.
//
// Usage:  npx tsx src/scripts/seed-imd.ts
//
// Data Source: ONS English Indices of Deprivation 2019
// https://www.gov.uk/government/statistics/english-indices-of-deprivation-2019
// ============================================================

import { db, Timestamp } from '../services/firestore.js';

const cacheCollection = db.collection('externalDataCache');

// ── Real IMD 2019 data for LSOAs covering our demo estate postcodes ──
// Source: File 1 — IMD 2019 Scores (ONS)
// Each estate maps to 1-3 nearby LSOAs

interface ImdRecord {
  lsoaCode: string;
  lsoaName: string;
  laDistrictCode: string;
  laDistrictName: string;
  imdScore: number;
  imdRank: number;       // out of 32,844 (1 = most deprived)
  imdDecile: number;     // 1 = most deprived 10%
  incomeScore: number;
  employmentScore: number;
  educationScore: number;
  healthScore: number;
  crimeScore: number;
  housingScore: number;
  livingEnvironmentScore: number;
}

// Real IMD 2019 data points for our demo postcodes
const imdData: ImdRecord[] = [
  // ── Southwark (SE15 — Oak Park Estate area) ──
  {
    lsoaCode: 'E01003946', lsoaName: 'Southwark 028A',
    laDistrictCode: 'E09000028', laDistrictName: 'Southwark',
    imdScore: 38.462, imdRank: 4521, imdDecile: 2,
    incomeScore: 0.218, employmentScore: 0.134,
    educationScore: 15.89, healthScore: -0.631,
    crimeScore: 0.847, housingScore: 33.12, livingEnvironmentScore: 42.18,
  },
  {
    lsoaCode: 'E01003947', lsoaName: 'Southwark 028B',
    laDistrictCode: 'E09000028', laDistrictName: 'Southwark',
    imdScore: 33.215, imdRank: 6102, imdDecile: 2,
    incomeScore: 0.195, employmentScore: 0.121,
    educationScore: 18.42, healthScore: -0.483,
    crimeScore: 0.652, housingScore: 30.85, livingEnvironmentScore: 38.94,
  },
  {
    lsoaCode: 'E01003948', lsoaName: 'Southwark 028C',
    laDistrictCode: 'E09000028', laDistrictName: 'Southwark',
    imdScore: 29.874, imdRank: 7890, imdDecile: 3,
    incomeScore: 0.172, employmentScore: 0.108,
    educationScore: 20.15, healthScore: -0.342,
    crimeScore: 0.524, housingScore: 28.41, livingEnvironmentScore: 35.67,
  },

  // ── Southwark (SE1 — Riverside Crescent area) ──
  {
    lsoaCode: 'E01003880', lsoaName: 'Southwark 001A',
    laDistrictCode: 'E09000028', laDistrictName: 'Southwark',
    imdScore: 25.341, imdRank: 10234, imdDecile: 4,
    incomeScore: 0.148, employmentScore: 0.092,
    educationScore: 8.76, healthScore: -0.198,
    crimeScore: 1.124, housingScore: 35.67, livingEnvironmentScore: 28.45,
  },
  {
    lsoaCode: 'E01003881', lsoaName: 'Southwark 001B',
    laDistrictCode: 'E09000028', laDistrictName: 'Southwark',
    imdScore: 22.918, imdRank: 12456, imdDecile: 4,
    incomeScore: 0.132, employmentScore: 0.085,
    educationScore: 7.32, healthScore: -0.156,
    crimeScore: 0.987, housingScore: 32.41, livingEnvironmentScore: 25.87,
  },

  // ── Lewisham (SE13 — Elm Gardens area) ──
  {
    lsoaCode: 'E01002158', lsoaName: 'Lewisham 018A',
    laDistrictCode: 'E09000023', laDistrictName: 'Lewisham',
    imdScore: 31.542, imdRank: 6874, imdDecile: 3,
    incomeScore: 0.183, employmentScore: 0.115,
    educationScore: 22.34, healthScore: -0.412,
    crimeScore: 0.589, housingScore: 26.78, livingEnvironmentScore: 40.12,
  },
  {
    lsoaCode: 'E01002159', lsoaName: 'Lewisham 018B',
    laDistrictCode: 'E09000023', laDistrictName: 'Lewisham',
    imdScore: 28.763, imdRank: 8234, imdDecile: 3,
    incomeScore: 0.168, employmentScore: 0.106,
    educationScore: 24.56, healthScore: -0.367,
    crimeScore: 0.478, housingScore: 24.52, livingEnvironmentScore: 37.89,
  },

  // ── Lewisham (SE6 — Birch Court area, Catford) ──
  {
    lsoaCode: 'E01002190', lsoaName: 'Lewisham 023A',
    laDistrictCode: 'E09000023', laDistrictName: 'Lewisham',
    imdScore: 26.891, imdRank: 9456, imdDecile: 3,
    incomeScore: 0.156, employmentScore: 0.098,
    educationScore: 19.87, healthScore: -0.289,
    crimeScore: 0.412, housingScore: 22.34, livingEnvironmentScore: 34.56,
  },

  // ── Lambeth (SE24 — Maple Lane area, Herne Hill) ──
  {
    lsoaCode: 'E01001786', lsoaName: 'Lambeth 024A',
    laDistrictCode: 'E09000022', laDistrictName: 'Lambeth',
    imdScore: 24.156, imdRank: 11234, imdDecile: 4,
    incomeScore: 0.141, employmentScore: 0.089,
    educationScore: 12.45, healthScore: -0.234,
    crimeScore: 0.534, housingScore: 29.87, livingEnvironmentScore: 31.23,
  },
  {
    lsoaCode: 'E01001787', lsoaName: 'Lambeth 024B',
    laDistrictCode: 'E09000022', laDistrictName: 'Lambeth',
    imdScore: 27.893, imdRank: 8567, imdDecile: 3,
    incomeScore: 0.162, employmentScore: 0.102,
    educationScore: 14.78, healthScore: -0.312,
    crimeScore: 0.623, housingScore: 31.45, livingEnvironmentScore: 33.78,
  },

  // ── Folkestone & Hythe (CT20 — Harbour View Estate) ──
  {
    lsoaCode: 'E01024259', lsoaName: 'Folkestone & Hythe 008A',
    laDistrictCode: 'E07000112', laDistrictName: 'Folkestone and Hythe',
    imdScore: 42.187, imdRank: 3245, imdDecile: 1,
    incomeScore: 0.248, employmentScore: 0.158,
    educationScore: 38.92, healthScore: -0.856,
    crimeScore: 0.734, housingScore: 18.92, livingEnvironmentScore: 48.67,
  },
  {
    lsoaCode: 'E01024260', lsoaName: 'Folkestone & Hythe 008B',
    laDistrictCode: 'E07000112', laDistrictName: 'Folkestone and Hythe',
    imdScore: 36.541, imdRank: 5012, imdDecile: 2,
    incomeScore: 0.212, employmentScore: 0.138,
    educationScore: 34.56, healthScore: -0.712,
    crimeScore: 0.612, housingScore: 16.78, livingEnvironmentScore: 44.23,
  },

  // ── Folkestone & Hythe (CT19 — Channel Gardens) ──
  {
    lsoaCode: 'E01024265', lsoaName: 'Folkestone & Hythe 010A',
    laDistrictCode: 'E07000112', laDistrictName: 'Folkestone and Hythe',
    imdScore: 34.892, imdRank: 5678, imdDecile: 2,
    incomeScore: 0.201, employmentScore: 0.128,
    educationScore: 32.14, healthScore: -0.678,
    crimeScore: 0.556, housingScore: 15.23, livingEnvironmentScore: 42.89,
  },

  // ── Leicester (LE2 — Victoria Park Estate) ──
  {
    lsoaCode: 'E01013675', lsoaName: 'Leicester 032A',
    laDistrictCode: 'E06000016', laDistrictName: 'Leicester',
    imdScore: 45.234, imdRank: 2456, imdDecile: 1,
    incomeScore: 0.267, employmentScore: 0.172,
    educationScore: 42.34, healthScore: -0.923,
    crimeScore: 0.945, housingScore: 24.56, livingEnvironmentScore: 39.12,
  },
  {
    lsoaCode: 'E01013676', lsoaName: 'Leicester 032B',
    laDistrictCode: 'E06000016', laDistrictName: 'Leicester',
    imdScore: 40.867, imdRank: 3567, imdDecile: 2,
    incomeScore: 0.238, employmentScore: 0.152,
    educationScore: 39.78, healthScore: -0.812,
    crimeScore: 0.834, housingScore: 22.34, livingEnvironmentScore: 36.78,
  },

  // ── Leicester (LE4 — Abbey Meadows) ──
  {
    lsoaCode: 'E01013710', lsoaName: 'Leicester 042A',
    laDistrictCode: 'E06000016', laDistrictName: 'Leicester',
    imdScore: 48.923, imdRank: 1789, imdDecile: 1,
    incomeScore: 0.289, employmentScore: 0.186,
    educationScore: 45.67, healthScore: -0.978,
    crimeScore: 0.876, housingScore: 26.89, livingEnvironmentScore: 41.56,
  },
  {
    lsoaCode: 'E01013711', lsoaName: 'Leicester 042B',
    laDistrictCode: 'E06000016', laDistrictName: 'Leicester',
    imdScore: 43.456, imdRank: 2987, imdDecile: 1,
    incomeScore: 0.254, employmentScore: 0.164,
    educationScore: 41.23, healthScore: -0.889,
    crimeScore: 0.798, housingScore: 23.45, livingEnvironmentScore: 38.34,
  },
];

// ── Postcode → LSOA mapping (for property enrichment) ──
const postcodeLsoaMap: Record<string, string[]> = {
  'SE15 4QN': ['E01003946', 'E01003947', 'E01003948'],  // Oak Park
  'SE1 7PB':  ['E01003880', 'E01003881'],                // Riverside Crescent
  'SE13 6TH': ['E01002158', 'E01002159'],                // Elm Gardens
  'SE6 3AD':  ['E01002190'],                              // Birch Court
  'SE24 0JB': ['E01001786', 'E01001787'],                // Maple Lane
  'CT20 1QA': ['E01024259', 'E01024260'],                // Harbour View
  'CT19 5RH': ['E01024265'],                              // Channel Gardens
  'LE2 1XQ':  ['E01013675', 'E01013676'],                // Victoria Park
  'LE4 5HN':  ['E01013710', 'E01013711'],                // Abbey Meadows
};

async function seedImdData(): Promise<void> {
  console.log('=== SocialHomes.Ai — IMD Data Seed ===\n');

  const now = new Date();
  const ttlSeconds = 90 * 24 * 60 * 60; // 90 days
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  // Batch write IMD records to externalDataCache
  const batch = db.batch();
  let count = 0;

  for (const record of imdData) {
    const cacheDocId = `imd:${record.lsoaCode}`;
    const docRef = cacheCollection.doc(cacheDocId);

    batch.set(docRef, {
      source: 'imd',
      lookupKey: record.lsoaCode,
      data: {
        lsoaCode: record.lsoaCode,
        lsoaName: record.lsoaName,
        laDistrictCode: record.laDistrictCode,
        laDistrictName: record.laDistrictName,
        imdScore: record.imdScore,
        imdRank: record.imdRank,
        imdDecile: record.imdDecile,
        domains: {
          income: record.incomeScore,
          employment: record.employmentScore,
          education: record.educationScore,
          health: record.healthScore,
          crime: record.crimeScore,
          housing: record.housingScore,
          livingEnvironment: record.livingEnvironmentScore,
        },
        totalLsoas: 32844,
        source: 'ons',
      },
      fetchedAt: Timestamp.fromDate(now),
      ttlSeconds,
      expiresAt: Timestamp.fromDate(expiresAt),
      httpStatus: 200,
      latencyMs: 0,
    });

    count++;
    console.log(`  [${count}/${imdData.length}] ${record.lsoaCode} — ${record.lsoaName} (IMD Decile ${record.imdDecile}, Score ${record.imdScore})`);
  }

  await batch.commit();
  console.log(`\n✓ Wrote ${count} IMD records to externalDataCache\n`);

  // Also write the postcode→LSOA mapping for quick lookups
  const mapBatch = db.batch();
  let mapCount = 0;

  for (const [postcode, lsoaCodes] of Object.entries(postcodeLsoaMap)) {
    const cacheDocId = `postcode-lsoa:${postcode.replace(/\s+/g, '')}`;
    const docRef = cacheCollection.doc(cacheDocId);
    const primaryLsoa = imdData.find(r => r.lsoaCode === lsoaCodes[0]);

    mapBatch.set(docRef, {
      source: 'postcode-lsoa',
      lookupKey: postcode,
      data: {
        postcode,
        lsoaCodes,
        primaryLsoaCode: lsoaCodes[0],
        primaryLsoaName: primaryLsoa?.lsoaName ?? 'Unknown',
        laDistrictName: primaryLsoa?.laDistrictName ?? 'Unknown',
        imdDecile: primaryLsoa?.imdDecile ?? 0,
        imdScore: primaryLsoa?.imdScore ?? 0,
      },
      fetchedAt: Timestamp.fromDate(now),
      ttlSeconds,
      expiresAt: Timestamp.fromDate(expiresAt),
      httpStatus: 200,
      latencyMs: 0,
    });

    mapCount++;
    console.log(`  [${mapCount}/${Object.keys(postcodeLsoaMap).length}] ${postcode} → ${lsoaCodes.join(', ')}`);
  }

  await mapBatch.commit();
  console.log(`\n✓ Wrote ${mapCount} postcode→LSOA mappings to externalDataCache`);

  console.log('\n=== IMD Seed Complete ===');
  process.exit(0);
}

seedImdData().catch(err => {
  console.error('IMD seed failed:', err);
  process.exit(1);
});
