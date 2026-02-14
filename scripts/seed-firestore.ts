#!/usr/bin/env tsx
// ============================================================
// Seed Firestore via the deployed Cloud Run admin API
// Reads all static data from app/src/data/ and POSTs to API
//
// Usage:
//   npx tsx --tsconfig scripts/tsconfig.json scripts/seed-firestore.ts
//   npx tsx --tsconfig scripts/tsconfig.json scripts/seed-firestore.ts --local
// ============================================================

import {
  organisation,
  regions,
  localAuthorities,
  estates,
  blocks,
  properties,
  tenants,
  allCases,
  activities,
  communications,
  notifications,
  tsmMeasures,
  voidProperties,
  applicants,
} from '../app/src/data/index';

const CLOUD_RUN_URL = 'https://socialhomes-674258130066.europe-west2.run.app';
const LOCAL_URL = 'http://localhost:8080';

const isLocal = process.argv.includes('--local');
const baseUrl = isLocal ? LOCAL_URL : CLOUD_RUN_URL;

// Build the seed payload matching the server's SeedData interface
const seedData = {
  organisation,
  regions,
  localAuthorities,
  estates,
  blocks,
  properties,
  tenants,
  cases: allCases,
  activities: activities || [],
  communications: communications || [],
  notifications: notifications || [],
  tsmMeasures: tsmMeasures || [],
  voidProperties: voidProperties || [],
  applicants: applicants || [],
  rentTransactions: [], // Generated at runtime
};

async function seed() {
  console.log(`🌱 Seeding Firestore via ${baseUrl}/api/v1/admin/seed`);
  console.log(`   Regions:     ${seedData.regions.length}`);
  console.log(`   LAs:         ${seedData.localAuthorities.length}`);
  console.log(`   Estates:     ${seedData.estates.length}`);
  console.log(`   Blocks:      ${seedData.blocks.length}`);
  console.log(`   Properties:  ${seedData.properties.length}`);
  console.log(`   Tenants:     ${seedData.tenants.length}`);
  console.log(`   Cases:       ${seedData.cases.length}`);
  console.log(`   Activities:  ${seedData.activities.length}`);
  console.log(`   TSM:         ${seedData.tsmMeasures.length}`);
  console.log('');

  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Persona': 'coo', // Highest permission level
      },
      body: JSON.stringify(seedData),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`❌ Seed failed (${response.status}): ${err}`);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Seed complete:', result);
  } catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
    if (err.cause) console.error('   Cause:', err.cause);
    process.exit(1);
  }
}

seed();
