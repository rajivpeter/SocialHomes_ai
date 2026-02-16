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

// ---- Collection References ----
export const collections = {
  organisations: db.collection('organisations'),
  regions: db.collection('regions'),
  localAuthorities: db.collection('localAuthorities'),
  estates: db.collection('estates'),
  blocks: db.collection('blocks'),
  properties: db.collection('properties'),
  tenants: db.collection('tenants'),
  cases: db.collection('cases'),
  activities: db.collection('activities'),
  communications: db.collection('communications'),
  rentTransactions: db.collection('rentTransactions'),
  users: db.collection('users'),
  auditLog: db.collection('auditLog'),
  hactCodes: db.collection('hactCodes'),
  notifications: db.collection('notifications'),
  voidProperties: db.collection('voidProperties'),
  applicants: db.collection('applicants'),
  tsmMeasures: db.collection('tsmMeasures'),
  externalDataCache: db.collection('externalDataCache'),
};

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

export async function deleteDoc(
  collection: FirebaseFirestore.CollectionReference,
  id: string,
): Promise<void> {
  await collection.doc(id).delete();
}

export { FieldValue, Timestamp };
