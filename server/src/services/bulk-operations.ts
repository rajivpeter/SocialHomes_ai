// ============================================================
// SocialHomes.Ai — Bulk Operations API
// Task 5.2.9: Batch case updates, bulk communication send,
// batch compliance upload, batch arrears action, progress tracking
// ============================================================

import { db, collections, getDocs, FieldValue } from './firestore.js';
import { dispatchBulkNotification } from './notification-dispatch.js';
import type { CaseDoc, TenantDoc, PropertyDoc } from '../models/firestore-schemas.js';

// ---- Types ----

export interface BulkOperationResult {
  operationId: string;
  type: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: { itemId: string; error: string }[];
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

// ---- Progress Tracking ----

const activeOperations = new Map<string, BulkOperationResult>();

function createOperation(type: string, total: number): BulkOperationResult {
  const op: BulkOperationResult = {
    operationId: `bulk-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    status: 'running',
    total,
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
    startedAt: new Date().toISOString(),
  };
  activeOperations.set(op.operationId, op);
  return op;
}

function completeOperation(op: BulkOperationResult): BulkOperationResult {
  op.completedAt = new Date().toISOString();
  op.duration = new Date(op.completedAt).getTime() - new Date(op.startedAt).getTime();
  op.status = op.failed === 0 ? 'completed' : (op.succeeded > 0 ? 'partial' : 'failed');
  return op;
}

// ---- Batch Case Status Update ----

export async function bulkUpdateCaseStatus(
  caseIds: string[],
  newStatus: string,
  updatedBy: string,
  notes?: string,
): Promise<BulkOperationResult> {
  const op = createOperation('case-status-update', caseIds.length);

  for (let i = 0; i < caseIds.length; i += 500) {
    const batch = db.batch();
    const chunk = caseIds.slice(i, i + 500);

    for (const caseId of chunk) {
      try {
        const ref = collections.cases.doc(caseId);
        const updateData: Record<string, unknown> = {
          status: newStatus,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy,
        };
        if (newStatus === 'completed' || newStatus === 'closed') {
          updateData.closedDate = new Date().toISOString();
        }
        batch.update(ref, updateData as any);

        // Log activity
        const activityRef = collections.activities.doc();
        batch.set(activityRef, {
          caseId,
          tenantId: '',
          type: 'status-change',
          subject: `Status changed to ${newStatus}`,
          description: notes || `Bulk operation: status updated to ${newStatus}`,
          date: new Date().toISOString(),
          officer: updatedBy,
        });

        op.succeeded++;
      } catch (err: any) {
        op.failed++;
        op.errors.push({ itemId: caseId, error: err.message });
      }
      op.processed++;
    }

    try {
      await batch.commit();
    } catch (err: any) {
      // If batch fails, mark all as failed
      for (const caseId of chunk) {
        op.failed++;
        op.errors.push({ itemId: caseId, error: `Batch commit failed: ${err.message}` });
      }
    }
  }

  return completeOperation(op);
}

// ---- Bulk Communication Send ----

export async function bulkSendCommunication(
  tenantIds: string[],
  templateId: string,
  subject: string,
  body: string,
  channels: ('in-app' | 'email' | 'sms')[],
  senderId: string,
): Promise<BulkOperationResult> {
  const op = createOperation('communication-send', tenantIds.length);

  for (const tenantId of tenantIds) {
    try {
      await dispatchBulkNotification([tenantId], {
        category: 'system',
        priority: 'medium',
        title: subject,
        body,
        entityType: 'tenant',
        entityId: tenantId,
        templateId,
        channels,
        metadata: { senderId, bulkOperation: op.operationId },
      });
      op.succeeded++;
    } catch (err: any) {
      op.failed++;
      op.errors.push({ itemId: tenantId, error: err.message });
    }
    op.processed++;
  }

  return completeOperation(op);
}

// ---- Batch Compliance Certificate Upload ----

export async function bulkUploadCompliance(
  updates: { propertyId: string; certificateType: string; data: Record<string, unknown> }[],
  uploadedBy: string,
): Promise<BulkOperationResult> {
  const op = createOperation('compliance-upload', updates.length);

  for (let i = 0; i < updates.length; i += 500) {
    const batch = db.batch();
    const chunk = updates.slice(i, i + 500);

    for (const update of chunk) {
      try {
        const ref = collections.properties.doc(update.propertyId);
        const updateObj: Record<string, unknown> = {};
        updateObj[update.certificateType] = {
          ...update.data,
          uploadedBy,
          uploadedAt: new Date().toISOString(),
        };
        updateObj[`compliance.${update.certificateType}`] = 'valid';
        batch.update(ref, updateObj as any);

        // Audit log
        const auditRef = collections.auditLog.doc();
        batch.set(auditRef, {
          timestamp: FieldValue.serverTimestamp(),
          user: uploadedBy,
          action: 'compliance-upload',
          entity: 'property',
          entityId: update.propertyId,
          field: update.certificateType,
          oldValue: '',
          newValue: JSON.stringify(update.data),
          ip: 'bulk-operation',
        });

        op.succeeded++;
      } catch (err: any) {
        op.failed++;
        op.errors.push({ itemId: update.propertyId, error: err.message });
      }
      op.processed++;
    }

    try {
      await batch.commit();
    } catch (err: any) {
      op.errors.push({ itemId: 'batch', error: `Batch commit failed: ${err.message}` });
    }
  }

  return completeOperation(op);
}

// ---- Batch Arrears Action ----

export async function bulkArrearsAction(
  tenantIds: string[],
  actionType: 'pap-letter' | 'payment-plan' | 'welfare-visit' | 'referral',
  actionDetails: Record<string, unknown>,
  officer: string,
): Promise<BulkOperationResult> {
  const op = createOperation('arrears-action', tenantIds.length);

  for (const tenantId of tenantIds) {
    try {
      // Create activity record
      await collections.activities.add({
        tenantId,
        type: `arrears-${actionType}`,
        subject: `Arrears action: ${actionType}`,
        description: JSON.stringify(actionDetails),
        date: new Date().toISOString(),
        officer,
      });

      // Send notification to tenant (via in-app channel)
      await dispatchBulkNotification([tenantId], {
        category: 'arrears-alert',
        priority: 'medium',
        title: `Arrears action: ${actionType.replace(/-/g, ' ')}`,
        body: `An arrears action has been recorded for your account.`,
        entityType: 'tenant',
        entityId: tenantId,
        channels: ['in-app'],
      });

      op.succeeded++;
    } catch (err: any) {
      op.failed++;
      op.errors.push({ itemId: tenantId, error: err.message });
    }
    op.processed++;
  }

  return completeOperation(op);
}

// ---- Operation Status ----

export function getOperationStatus(operationId: string): BulkOperationResult | null {
  return activeOperations.get(operationId) || null;
}

export function getAllActiveOperations(): BulkOperationResult[] {
  return Array.from(activeOperations.values()).filter(op => op.status === 'running');
}
