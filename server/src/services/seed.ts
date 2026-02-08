// ============================================================
// Firestore Seed Script
// Reads static data from app/src/data/ and writes to Firestore
// Run: npm run seed
// ============================================================

import { db, collections, batchWrite } from './firestore.js';
import { appToHact, getAllCodeListNames, getCodeList } from '../models/hact-codes.js';

// We read the compiled static data from the API route handlers which
// re-export the data. For seeding, we use a direct JSON approach.
// The seed data is exported as a JSON file by a build step, or we
// read it inline.

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

  // 16. HACT Code Lists
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

// If run directly, seed from the admin API endpoint
// The actual data loading happens server-side via the /api/v1/admin/seed endpoint
