// ============================================================
// Firestore Seed Script
// Seeds all collections with comprehensive mock data.
//
// Usage:
//   npm run seed              # Seed (additive — won't overwrite)
//   npm run seed -- --clear   # Wipe all collections first, then seed
// ============================================================

import { db, collections, batchWrite } from './firestore.js';
import { appToHact, getAllCodeListNames, getCodeList } from '../models/hact-codes.js';

interface SeedData {
  organisation: any;
  regions: any[];
  localAuthorities: any[];
  estates: any[];
  blocks: any[];
  properties: any[];
  tenants: any[];
  cases: any[];
  activities: any[];
  communications: any[];
  notifications: any[];
  tsmMeasures: any[];
  voidProperties: any[];
  applicants: any[];
  rentTransactions: any[];
  viewings: any[];
  applications: any[];
}

function addHactCodesToProperty(property: any) {
  return {
    ...property,
    hact: {
      propertyPrimaryTypeCode: '07-00-00', // Housing
      propertySubtypeCode: appToHact('PropertySubtypeCode', property.type) || '07-01-00',
      tenureTypeCode: appToHact('TenureTypeCode', property.tenureType) || '100',
      heatingTypeCode: appToHact('HeatingTypeCode', property.heatingType) || '10',
    },
  };
}

function addHactCodesToTenant(tenant: any) {
  return {
    ...tenant,
    hact: {
      personName: { given: tenant.firstName, family: tenant.lastName, title: tenant.title },
      communicationChannelCode: appToHact('CommunicationChannelCode', tenant.communicationPreference) || '20',
      paymentMethodCode: appToHact('PaymentMethodCode', tenant.paymentMethod) || '10',
      tenureTypeCode: appToHact('TenureTypeCode', tenant.tenancyType) || '100',
    },
  };
}

export async function seedFirestore(data: SeedData) {
  console.log('🌱 Starting Firestore seed...');
  const startTime = Date.now();

  // 1. Organisation
  console.log('  → Seeding organisation...');
  await collections.organisations.doc('rcha').set(data.organisation);

  // 2. Regions
  console.log(`  → Seeding ${data.regions.length} regions...`);
  await batchWrite(data.regions.map(r => ({ collection: collections.regions, id: r.id, data: r })));

  // 3. Local Authorities
  console.log(`  → Seeding ${data.localAuthorities.length} local authorities...`);
  await batchWrite(data.localAuthorities.map(la => ({ collection: collections.localAuthorities, id: la.id, data: la })));

  // 4. Estates
  console.log(`  → Seeding ${data.estates.length} estates...`);
  await batchWrite(data.estates.map(e => ({ collection: collections.estates, id: e.id, data: e })));

  // 5. Blocks
  console.log(`  → Seeding ${data.blocks.length} blocks...`);
  await batchWrite(data.blocks.map(b => ({ collection: collections.blocks, id: b.id, data: b })));

  // 6. Properties (with HACT codes)
  console.log(`  → Seeding ${data.properties.length} properties...`);
  await batchWrite(data.properties.map(p => ({
    collection: collections.properties,
    id: p.id,
    data: addHactCodesToProperty(p),
  })));

  // 7. Tenants (with HACT codes)
  console.log(`  → Seeding ${data.tenants.length} tenants...`);
  await batchWrite(data.tenants.map(t => ({
    collection: collections.tenants,
    id: t.id,
    data: addHactCodesToTenant(t),
  })));

  // 8. Cases (all types merged)
  console.log(`  → Seeding ${data.cases.length} cases...`);
  await batchWrite(data.cases.map(c => ({ collection: collections.cases, id: c.id, data: c })));

  // 9. Activities
  if (data.activities.length > 0) {
    console.log(`  → Seeding ${data.activities.length} activities...`);
    await batchWrite(data.activities.map(a => ({ collection: collections.activities, id: a.id, data: a })));
  }

  // 10. Communications
  if (data.communications.length > 0) {
    console.log(`  → Seeding ${data.communications.length} communications...`);
    await batchWrite(data.communications.map(c => ({ collection: collections.communications, id: c.id, data: c })));
  }

  // 11. Notifications
  if (data.notifications.length > 0) {
    console.log(`  → Seeding ${data.notifications.length} notifications...`);
    await batchWrite(data.notifications.map(n => ({ collection: collections.notifications, id: n.id, data: n })));
  }

  // 12. TSM Measures
  if (data.tsmMeasures.length > 0) {
    console.log(`  → Seeding ${data.tsmMeasures.length} TSM measures...`);
    await batchWrite(data.tsmMeasures.map(m => ({ collection: collections.tsmMeasures, id: m.id, data: m })));
  }

  // 13. Void Properties
  if (data.voidProperties.length > 0) {
    console.log(`  → Seeding ${data.voidProperties.length} void properties...`);
    await batchWrite(data.voidProperties.map(v => ({ collection: collections.voidProperties, id: v.id, data: v })));
  }

  // 14. Applicants
  if (data.applicants.length > 0) {
    console.log(`  → Seeding ${data.applicants.length} applicants...`);
    await batchWrite(data.applicants.map(a => ({ collection: collections.applicants, id: a.id, data: a })));
  }

  // 15. Rent Transactions
  if (data.rentTransactions.length > 0) {
    console.log(`  → Seeding ${data.rentTransactions.length} rent transactions...`);
    await batchWrite(data.rentTransactions.map(r => ({ collection: collections.rentTransactions, id: r.id, data: r })));
  }

  // 16. Viewings
  if (data.viewings && data.viewings.length > 0) {
    console.log(`  → Seeding ${data.viewings.length} viewings...`);
    await batchWrite(data.viewings.map(v => ({ collection: collections.viewings, id: v.id, data: v })));
  }

  // 17. Applications
  if (data.applications && data.applications.length > 0) {
    console.log(`  → Seeding ${data.applications.length} applications...`);
    await batchWrite(data.applications.map(a => ({ collection: collections.applications, id: a.id, data: a })));
  }

  // 18. HACT Code Lists
  console.log('  → Seeding HACT code lists...');
  const codeListNames = getAllCodeListNames();
  await batchWrite(codeListNames.map(name => ({
    collection: collections.hactCodes,
    id: name,
    data: { name, codes: getCodeList(name) },
  })));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Firestore seed complete in ${elapsed}s`);
}

// ---- CLI Entry Point ----
// Run directly: npm run seed
// With clear: npm run seed -- --clear

async function clearCollections() {
  const collectionNames = Object.keys(collections) as Array<keyof typeof collections>;
  console.log('🗑️  Clearing all collections...');

  for (const name of collectionNames) {
    const col = collections[name];
    const snapshot = await col.limit(500).get();
    if (snapshot.empty) continue;

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`  → Cleared ${snapshot.size} docs from ${name}`);

    // Handle collections with more than 500 docs
    if (snapshot.size === 500) {
      let more = true;
      while (more) {
        const next = await col.limit(500).get();
        if (next.empty) { more = false; break; }
        const b = db.batch();
        next.docs.forEach(doc => b.delete(doc.ref));
        await b.commit();
        console.log(`  → Cleared ${next.size} more docs from ${name}`);
        if (next.size < 500) more = false;
      }
    }
  }
  console.log('✅ All collections cleared');
}

const isDirectRun = process.argv[1]?.endsWith('seed.ts') ||
                    process.argv[1]?.endsWith('seed.js') ||
                    process.argv[1]?.includes('tsx');

if (isDirectRun) {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  (async () => {
    try {
      // Dynamic path prevents tsc from following into seed-data.ts
      // (which imports from app/ with incompatible tsconfig)
      const seedDataModule = './seed-data.js';
      const { getSeedData } = await import(seedDataModule);
      const data = getSeedData();

      console.log('📊 Seed data summary:');
      console.log(`  Regions: ${data.regions.length}`);
      console.log(`  Local Authorities: ${data.localAuthorities.length}`);
      console.log(`  Estates: ${data.estates.length}`);
      console.log(`  Blocks: ${data.blocks.length}`);
      console.log(`  Properties: ${data.properties.length}`);
      console.log(`  Tenants: ${data.tenants.length}`);
      console.log(`  Cases: ${data.cases.length}`);
      console.log(`  Activities: ${data.activities.length}`);
      console.log(`  Communications: ${data.communications.length}`);
      console.log(`  Notifications: ${data.notifications.length}`);
      console.log(`  TSM Measures: ${data.tsmMeasures.length}`);
      console.log(`  Void Properties: ${data.voidProperties.length}`);
      console.log(`  Applicants: ${data.applicants.length}`);
      console.log(`  Rent Transactions: ${data.rentTransactions.length}`);
      console.log(`  Viewings: ${data.viewings?.length || 0}`);
      console.log(`  Applications: ${data.applications?.length || 0}`);

      if (shouldClear) {
        await clearCollections();
      }

      await seedFirestore(data);
      process.exit(0);
    } catch (err) {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    }
  })();
}
