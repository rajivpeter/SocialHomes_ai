// ============================================================
// SocialHomes.Ai — Audit Log Query API
// Task 5.2.10: Filtering, full-text search, pagination,
// CSV export for GDPR SAR, aggregation, retention policy
// ============================================================

import { db, collections } from './firestore.js';
import type { AuditDoc } from '../models/firestore-schemas.js';

// ---- Types ----

export interface AuditQueryParams {
  entity?: string;
  entityId?: string;
  user?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  offset?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'user' | 'action';
  sortDirection?: 'asc' | 'desc';
}

export interface AuditQueryResult {
  items: AuditDoc[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface AuditAggregation {
  actionsByType: Record<string, number>;
  actionsByUser: Record<string, number>;
  actionsByDay: { date: string; count: number }[];
  totalActions: number;
  period: { from: string; to: string };
}

// ---- Query ----

export async function queryAuditLog(params: AuditQueryParams): Promise<AuditQueryResult> {
  const limit = Math.min(params.limit || 50, 200);
  const offset = params.offset || 0;

  // Fetch with Firestore filters where possible
  let query: FirebaseFirestore.Query = collections.auditLog;

  if (params.entity) {
    query = query.where('entity', '==', params.entity);
  }
  if (params.entityId) {
    query = query.where('entityId', '==', params.entityId);
  }
  if (params.user) {
    query = query.where('user', '==', params.user);
  }
  if (params.action) {
    query = query.where('action', '==', params.action);
  }

  // Order by timestamp descending
  query = query.orderBy('timestamp', params.sortDirection || 'desc');

  // Fetch more than needed for in-memory filtering
  const fetchLimit = (offset + limit) * 2 + 100;
  const snapshot = await query.limit(fetchLimit).get();

  let items = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Normalise timestamp
    timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp || '',
  })) as AuditDoc[];

  // In-memory date range filter (Firestore compound queries limited)
  if (params.dateFrom) {
    const from = new Date(params.dateFrom);
    items = items.filter(item => new Date(item.timestamp) >= from);
  }
  if (params.dateTo) {
    const to = new Date(params.dateTo);
    items = items.filter(item => new Date(item.timestamp) <= to);
  }

  // In-memory text search
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    items = items.filter(item =>
      item.field?.toLowerCase().includes(searchLower) ||
      item.oldValue?.toLowerCase().includes(searchLower) ||
      item.newValue?.toLowerCase().includes(searchLower) ||
      item.action?.toLowerCase().includes(searchLower) ||
      item.entity?.toLowerCase().includes(searchLower),
    );
  }

  const total = items.length;
  const paginatedItems = items.slice(offset, offset + limit);

  return {
    items: paginatedItems,
    total,
    offset,
    limit,
    hasMore: offset + limit < total,
  };
}

// ---- Aggregation ----

export async function aggregateAuditLog(
  dateFrom: string,
  dateTo: string,
  user?: string,
): Promise<AuditAggregation> {
  let query: FirebaseFirestore.Query = collections.auditLog
    .orderBy('timestamp', 'desc')
    .limit(5000);

  if (user) {
    query = collections.auditLog
      .where('user', '==', user)
      .orderBy('timestamp', 'desc')
      .limit(5000);
  }

  const snapshot = await query.get();

  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  const items = snapshot.docs
    .map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp || '',
      };
    })
    .filter(item => {
      const ts = new Date(item.timestamp);
      return ts >= from && ts <= to;
    });

  // Aggregate by action type
  const actionsByType: Record<string, number> = {};
  const actionsByUser: Record<string, number> = {};
  const dayCountMap: Record<string, number> = {};

  for (const item of items) {
    const action = (item as any).action || 'unknown';
    actionsByType[action] = (actionsByType[action] || 0) + 1;

    const u = (item as any).user || 'unknown';
    actionsByUser[u] = (actionsByUser[u] || 0) + 1;

    const day = item.timestamp.slice(0, 10);
    dayCountMap[day] = (dayCountMap[day] || 0) + 1;
  }

  const actionsByDay = Object.entries(dayCountMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    actionsByType,
    actionsByUser,
    actionsByDay,
    totalActions: items.length,
    period: { from: dateFrom, to: dateTo },
  };
}

// ---- CSV Export (for GDPR SAR) ----

export async function exportAuditLogCsv(params: AuditQueryParams): Promise<string> {
  const queryParams = { ...params, limit: 10000, offset: 0 };
  const result = await queryAuditLog(queryParams);

  const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'Field', 'Old Value', 'New Value'];
  const rows = result.items.map(item => [
    item.timestamp,
    item.user,
    item.action,
    item.entity,
    item.entityId,
    item.field,
    `"${(item.oldValue || '').replace(/"/g, '""')}"`,
    `"${(item.newValue || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// ---- Retention Policy ----

/**
 * Delete audit log entries older than the retention period.
 * Default: 7 years (regulatory requirement for housing associations).
 */
export async function enforceRetentionPolicy(retentionYears = 7): Promise<{ deleted: number }> {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);

  const snapshot = await collections.auditLog
    .where('timestamp', '<', cutoffDate)
    .limit(500) // Process in batches
    .get();

  if (snapshot.empty) return { deleted: 0 };

  const batch = db.batch();
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();

  return { deleted: snapshot.size };
}

// ---- Write Audit Entry ----

export async function writeAuditEntry(
  user: string,
  action: string,
  entity: string,
  entityId: string,
  field: string,
  oldValue: string,
  newValue: string,
  ip?: string,
): Promise<string> {
  const ref = await collections.auditLog.add({
    timestamp: new Date().toISOString(),
    user,
    action,
    entity,
    entityId,
    field,
    oldValue,
    newValue,
    ip: ip || 'unknown',
  });
  return ref.id;
}
