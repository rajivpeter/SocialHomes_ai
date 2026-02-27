// ============================================================
// SocialHomes.Ai — GDPR Data Export Pipeline
// Task 5.2.16: Automated SAR processing, tenant data collation,
// PII redaction, right-to-erasure cascade
// ============================================================

import { db, collections, getDocs, FieldValue } from './firestore.js';
import { exportAuditLogCsv } from './audit-log.js';
import type { TenantDoc, CaseDoc, ActivityDoc, PropertyDoc } from '../models/firestore-schemas.js';

// ---- Types ----

export interface SarRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  requestedAt: string;
  requestedBy: string; // person who made the request
  requestType: 'subject-access' | 'right-to-erasure' | 'rectification' | 'portability';
  status: 'received' | 'processing' | 'awaiting-verification' | 'complete' | 'rejected';
  dueDate: string; // 30 calendar days from request
  completedAt?: string;
  notes?: string;
  exportFileId?: string;
  verificationMethod?: string;
}

export interface TenantDataExport {
  exportId: string;
  tenantId: string;
  generatedAt: string;
  sections: {
    personalData: Record<string, unknown>;
    tenancyData: Record<string, unknown>;
    cases: Record<string, unknown>[];
    activities: Record<string, unknown>[];
    communications: Record<string, unknown>[];
    rentTransactions: Record<string, unknown>[];
    auditLog: string; // CSV
    files: Record<string, unknown>[];
  };
  metadata: {
    totalRecords: number;
    collectionsSearched: string[];
    piiFieldsIncluded: string[];
    generationTimeMs: number;
  };
}

export interface ErasureResult {
  tenantId: string;
  status: 'completed' | 'partial' | 'failed';
  collectionsProcessed: string[];
  recordsDeleted: number;
  recordsAnonymised: number;
  retainedForLegal: string[];
  errors: string[];
}

// ---- SAR Requests Collection ----

const sarCollection = db.collection('sarRequests');

// ---- SAR Request Management ----

export async function createSarRequest(
  tenantId: string,
  requestType: SarRequest['requestType'],
  requestedBy: string,
): Promise<SarRequest> {
  // Fetch tenant for name
  const tenantDoc = await collections.tenants.doc(tenantId).get();
  const tenant = tenantDoc.exists ? tenantDoc.data() as TenantDoc : null;
  const tenantName = tenant ? `${tenant.title} ${tenant.firstName} ${tenant.lastName}` : 'Unknown';

  const now = new Date();
  const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 calendar days

  const request: Omit<SarRequest, 'id'> = {
    tenantId,
    tenantName,
    requestedAt: now.toISOString(),
    requestedBy,
    requestType,
    status: 'received',
    dueDate: dueDate.toISOString(),
  };

  const ref = await sarCollection.add(request);
  return { id: ref.id, ...request };
}

export async function updateSarStatus(
  requestId: string,
  status: SarRequest['status'],
  notes?: string,
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (notes) update.notes = notes;
  if (status === 'complete') update.completedAt = new Date().toISOString();
  await sarCollection.doc(requestId).update(update);
}

export async function getSarRequests(status?: string): Promise<SarRequest[]> {
  let query: FirebaseFirestore.Query = sarCollection.orderBy('requestedAt', 'desc');
  if (status) {
    query = sarCollection.where('status', '==', status).orderBy('requestedAt', 'desc');
  }
  const snapshot = await query.limit(100).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SarRequest));
}

// ---- Data Export ----

/**
 * Collate all data held about a tenant across all Firestore collections.
 * This is the core of Subject Access Request processing.
 */
export async function exportTenantData(tenantId: string): Promise<TenantDataExport> {
  const start = Date.now();
  const exportId = `export-${tenantId}-${Date.now()}`;

  // 1. Personal data
  const tenantDoc = await collections.tenants.doc(tenantId).get();
  const personalData = tenantDoc.exists ? tenantDoc.data()! : {};

  // 2. Property data (linked via propertyId)
  let tenancyData: Record<string, unknown> = {};
  if (personalData.propertyId) {
    const propDoc = await collections.properties.doc(personalData.propertyId as string).get();
    if (propDoc.exists) {
      tenancyData = {
        address: propDoc.data()!.address,
        postcode: propDoc.data()!.postcode,
        weeklyRent: propDoc.data()!.weeklyRent,
        tenureType: propDoc.data()!.tenureType,
        bedrooms: propDoc.data()!.bedrooms,
      };
    }
  }

  // 3. Cases
  const cases = await getDocs<CaseDoc>(collections.cases, [
    { field: 'tenantId', op: '==', value: tenantId },
  ]);

  // 4. Activities
  const activities = await getDocs<ActivityDoc>(collections.activities, [
    { field: 'tenantId', op: '==', value: tenantId },
  ]);

  // 5. Communications
  const commsSnapshot = await collections.communications
    .where('tenantId', '==', tenantId)
    .get();
  const communications = commsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 6. Rent transactions
  const rentSnapshot = await collections.rentTransactions
    .where('tenantId', '==', tenantId)
    .get();
  const rentTransactions = rentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 7. Audit log (filtered to this tenant)
  const auditCsv = await exportAuditLogCsv({ entityId: tenantId, limit: 5000 });

  // 8. Files
  const filesSnapshot = await db.collection('files')
    .where('entityType', '==', 'tenant')
    .where('entityId', '==', tenantId)
    .get();
  const files = filesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const totalRecords = 1 + cases.length + activities.length + communications.length + rentTransactions.length + files.length;

  const result: TenantDataExport = {
    exportId,
    tenantId,
    generatedAt: new Date().toISOString(),
    sections: {
      personalData: redactInternalFields(personalData),
      tenancyData,
      cases: cases.map(c => redactInternalFields(c as unknown as Record<string, unknown>)),
      activities: activities.map(a => redactInternalFields(a as unknown as Record<string, unknown>)),
      communications,
      rentTransactions,
      auditLog: auditCsv,
      files: files.map(f => ({ name: (f as any).originalName, category: (f as any).category, uploadedAt: (f as any).uploadedAt })),
    },
    metadata: {
      totalRecords,
      collectionsSearched: ['tenants', 'cases', 'activities', 'communications', 'rentTransactions', 'auditLog', 'files'],
      piiFieldsIncluded: ['firstName', 'lastName', 'dob', 'email', 'phone', 'mobile', 'address'],
      generationTimeMs: Date.now() - start,
    },
  };

  return result;
}

// ---- Right to Erasure ----

/**
 * Process a right-to-erasure request.
 * Some data must be retained for legal/regulatory reasons.
 */
export async function processErasureRequest(tenantId: string, requestedBy: string): Promise<ErasureResult> {
  const errors: string[] = [];
  let recordsDeleted = 0;
  let recordsAnonymised = 0;
  const retainedForLegal: string[] = [];

  // 1. Anonymise tenant personal data (retain structure for regulatory reporting)
  try {
    await collections.tenants.doc(tenantId).update({
      firstName: '[REDACTED]',
      lastName: '[REDACTED]',
      email: '[REDACTED]',
      phone: '[REDACTED]',
      mobile: '[REDACTED]',
      dob: '[REDACTED]',
      'emergencyContact.name': '[REDACTED]',
      'emergencyContact.phone': '[REDACTED]',
      household: [],
      erasedAt: FieldValue.serverTimestamp(),
      erasedBy: requestedBy,
    });
    recordsAnonymised++;
  } catch (err: any) {
    errors.push(`Tenant anonymisation failed: ${err.message}`);
  }

  // 2. Delete non-essential communications
  try {
    const commsSnapshot = await collections.communications
      .where('tenantId', '==', tenantId)
      .get();
    const batch = db.batch();
    for (const doc of commsSnapshot.docs) {
      batch.delete(doc.ref);
      recordsDeleted++;
    }
    await batch.commit();
  } catch (err: any) {
    errors.push(`Communications deletion failed: ${err.message}`);
  }

  // 3. Anonymise case data (retain for regulatory — 6 year requirement)
  try {
    const casesSnapshot = await collections.cases
      .where('tenantId', '==', tenantId)
      .get();
    const batch = db.batch();
    for (const doc of casesSnapshot.docs) {
      batch.update(doc.ref, {
        'description': '[REDACTED under GDPR right to erasure]',
        'subject': '[REDACTED]',
      });
      recordsAnonymised++;
    }
    await batch.commit();
    retainedForLegal.push(`${casesSnapshot.size} cases retained (anonymised) for regulatory compliance (6 year requirement)`);
  } catch (err: any) {
    errors.push(`Cases anonymisation failed: ${err.message}`);
  }

  // 4. Anonymise activities
  try {
    const activitiesSnapshot = await collections.activities
      .where('tenantId', '==', tenantId)
      .get();
    const batch = db.batch();
    for (const doc of activitiesSnapshot.docs) {
      batch.update(doc.ref, {
        description: '[REDACTED]',
        subject: '[REDACTED]',
      });
      recordsAnonymised++;
    }
    await batch.commit();
  } catch (err: any) {
    errors.push(`Activities anonymisation failed: ${err.message}`);
  }

  // 5. Retain rent transactions (financial records — 7 year legal requirement)
  const rentSnapshot = await collections.rentTransactions
    .where('tenantId', '==', tenantId)
    .count()
    .get();
  retainedForLegal.push(`${rentSnapshot.data().count} rent transactions retained (7 year legal requirement)`);

  // 6. Retain audit log (regulatory requirement)
  retainedForLegal.push('Audit log entries retained for regulatory compliance');

  // 7. Delete uploaded files
  try {
    const filesSnapshot = await db.collection('files')
      .where('entityType', '==', 'tenant')
      .where('entityId', '==', tenantId)
      .get();
    const batch = db.batch();
    for (const doc of filesSnapshot.docs) {
      batch.delete(doc.ref);
      recordsDeleted++;
    }
    await batch.commit();
  } catch (err: any) {
    errors.push(`Files deletion failed: ${err.message}`);
  }

  // 8. Log the erasure action
  try {
    await collections.auditLog.add({
      timestamp: FieldValue.serverTimestamp(),
      user: requestedBy,
      action: 'gdpr-erasure',
      entity: 'tenant',
      entityId: tenantId,
      field: 'full-erasure',
      oldValue: 'personal data',
      newValue: 'REDACTED/DELETED',
      ip: 'system',
    });
  } catch {
    // Non-critical
  }

  return {
    tenantId,
    status: errors.length === 0 ? 'completed' : (recordsDeleted + recordsAnonymised > 0 ? 'partial' : 'failed'),
    collectionsProcessed: ['tenants', 'communications', 'cases', 'activities', 'files'],
    recordsDeleted,
    recordsAnonymised,
    retainedForLegal,
    errors,
  };
}

// ---- Retention Policy ----

export interface RetentionPolicy {
  collection: string;
  retentionPeriod: string;
  legalBasis: string;
  autoDelete: boolean;
}

export function getRetentionPolicies(): RetentionPolicy[] {
  return [
    { collection: 'tenants', retentionPeriod: '6 years after tenancy ends', legalBasis: 'Limitation Act 1980', autoDelete: false },
    { collection: 'cases', retentionPeriod: '6 years after closure', legalBasis: 'Housing Ombudsman requirements', autoDelete: false },
    { collection: 'rentTransactions', retentionPeriod: '7 years', legalBasis: 'Financial record keeping (HMRC)', autoDelete: false },
    { collection: 'communications', retentionPeriod: '3 years', legalBasis: 'Operational necessity', autoDelete: true },
    { collection: 'auditLog', retentionPeriod: '7 years', legalBasis: 'Regulatory compliance', autoDelete: true },
    { collection: 'activities', retentionPeriod: '6 years', legalBasis: 'Housing Ombudsman requirements', autoDelete: false },
    { collection: 'files', retentionPeriod: 'Varies by category', legalBasis: 'Category-dependent', autoDelete: false },
    { collection: 'notifications', retentionPeriod: '90 days', legalBasis: 'Operational necessity', autoDelete: true },
    { collection: 'aiConversations', retentionPeriod: '30 days', legalBasis: 'Operational necessity', autoDelete: true },
  ];
}

// ---- Helpers ----

function redactInternalFields(data: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...data };
  // Remove internal Firestore references
  delete redacted._path;
  delete redacted._converter;
  delete redacted.hact;  // Internal HACT codes not relevant to SAR
  return redacted;
}
