import { Firestore, FieldValue, Timestamp } from '@google-cloud/firestore';

// On Cloud Run, GOOGLE_CLOUD_PROJECT is auto-set. Locally, set via FIRESTORE_PROJECT_ID.
const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIRESTORE_PROJECT_ID;

export const db = new Firestore({
  projectId,
  ignoreUndefinedProperties: true,
});

/**
 * Recursively convert Firestore-specific types to plain JSON-safe values.
 * This runs BEFORE Express serialises data with res.json(), so React
 * components never receive opaque objects (prevents Error #310).
 */
export function serializeFirestoreData(value: any): any {
  if (value === null || value === undefined) return value;

  // Firestore Timestamp → ISO string
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  // Native Date → ISO string
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Arrays
  if (Array.isArray(value)) {
    return value.map(serializeFirestoreData);
  }

  // Plain objects — recurse
  if (typeof value === 'object') {
    // DocumentReference — just return the path string
    if (value.constructor?.name === 'DocumentReference' || ('_path' in value && '_converter' in value)) {
      return value.path || String(value);
    }
    // GeoPoint — keep lat/lng as plain numbers
    if (value.constructor?.name === 'GeoPoint') {
      return { latitude: value.latitude, longitude: value.longitude };
    }
    // Generic object — recurse into every key
    const out: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      out[key] = serializeFirestoreData(value[key]);
    }
    return out;
  }

  return value;
}

// ---- Multi-tenancy: Org-scoped collection references ----

/**
 * Returns Firestore collection references scoped to an organisation.
 * Org-specific data lives under `orgs/{orgId}/...` for full data isolation.
 * Global collections (users, organisations, auditLog) remain at root level.
 *
 * @param orgId - Organisation identifier (defaults to 'rcha' for backward compatibility)
 */
export function getCollections(orgId: string = 'rcha') {
  const prefix = `orgs/${orgId}`;
  return {
    // Org-scoped collections
    regions: db.collection(`${prefix}/regions`),
    localAuthorities: db.collection(`${prefix}/localAuthorities`),
    estates: db.collection(`${prefix}/estates`),
    blocks: db.collection(`${prefix}/blocks`),
    properties: db.collection(`${prefix}/properties`),
    tenants: db.collection(`${prefix}/tenants`),
    cases: db.collection(`${prefix}/cases`),
    activities: db.collection(`${prefix}/activities`),
    communications: db.collection(`${prefix}/communications`),
    rentTransactions: db.collection(`${prefix}/rentTransactions`),
    hactCodes: db.collection(`${prefix}/hactCodes`),
    notifications: db.collection(`${prefix}/notifications`),
    voidProperties: db.collection(`${prefix}/voidProperties`),
    applicants: db.collection(`${prefix}/applicants`),
    tsmMeasures: db.collection(`${prefix}/tsmMeasures`),
    externalDataCache: db.collection(`${prefix}/externalDataCache`),
    viewings: db.collection(`${prefix}/viewings`),
    applications: db.collection(`${prefix}/applications`),
    // Global collections (NOT org-scoped)
    users: db.collection('users'),
    organisations: db.collection('organisations'),
    auditLog: db.collection('auditLog'),
  };
}

// Backward-compatible default export — existing routes that import `collections`
// continue to work against the default 'rcha' org without any code changes.
export const collections = getCollections('rcha');

// ---- Helpers ----
export async function getDoc<T>(collection: FirebaseFirestore.CollectionReference, id: string): Promise<T | null> {
  const doc = await collection.doc(id).get();
  if (!doc.exists) return null;
  return serializeFirestoreData({ id: doc.id, ...doc.data() }) as T;
}

export async function getDocs<T>(
  collection: FirebaseFirestore.CollectionReference,
  filters?: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[],
  orderBy?: { field: string; direction?: 'asc' | 'desc' },
  limit?: number,
): Promise<T[]> {
  let query: FirebaseFirestore.Query = collection;

  if (filters) {
    for (const f of filters) {
      query = query.where(f.field, f.op, f.value);
    }
  }
  if (orderBy) {
    query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
  }
  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => serializeFirestoreData({ id: doc.id, ...doc.data() }) as T);
}

export async function setDoc(
  collection: FirebaseFirestore.CollectionReference,
  id: string,
  data: Record<string, any>,
): Promise<void> {
  await collection.doc(id).set(data);
}

export async function updateDoc(
  collection: FirebaseFirestore.CollectionReference,
  id: string,
  data: Record<string, any>,
): Promise<void> {
  await collection.doc(id).update(data);
}

export async function batchWrite(
  operations: { collection: FirebaseFirestore.CollectionReference; id: string; data: Record<string, any> }[],
): Promise<void> {
  // Firestore batch limit is 500
  const chunks = [];
  for (let i = 0; i < operations.length; i += 500) {
    chunks.push(operations.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const batch = db.batch();
    for (const op of chunk) {
      batch.set(op.collection.doc(op.id), op.data);
    }
    await batch.commit();
  }
}

export async function addDoc(
  collection: FirebaseFirestore.CollectionReference,
  data: Record<string, any>,
): Promise<string> {
  const ref = await collection.add(data);
  return ref.id;
}

export async function deleteDoc(
  collection: FirebaseFirestore.CollectionReference,
  id: string,
): Promise<void> {
  await collection.doc(id).delete();
}

export { FieldValue, Timestamp };
