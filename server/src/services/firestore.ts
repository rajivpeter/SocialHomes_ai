import { Firestore, FieldValue, Timestamp } from '@google-cloud/firestore';

// On Cloud Run, GOOGLE_CLOUD_PROJECT is auto-set. Locally, set via FIRESTORE_PROJECT_ID.
const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIRESTORE_PROJECT_ID;

export const db = new Firestore({
  projectId,
  // On Cloud Run: auto-authenticates via metadata server
  // Locally: uses GOOGLE_APPLICATION_CREDENTIALS or emulator
  ...(process.env.FIRESTORE_EMULATOR_HOST ? {} : {}),
});

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
};

// ---- Helpers ----
export async function getDoc<T>(collection: FirebaseFirestore.CollectionReference, id: string): Promise<T | null> {
  const doc = await collection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as T;
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
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
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
