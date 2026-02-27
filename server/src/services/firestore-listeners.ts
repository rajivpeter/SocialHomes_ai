// ============================================================
// SocialHomes.Ai — Firestore Real-Time Listeners
// Task 5.2.8: Server-side onSnapshot subscriptions on cases,
// change detection, WebSocket broadcast, optimistic locking
// ============================================================

import { db, collections } from './firestore.js';
import { sendToUser, emitCaseUpdate, emitSlaBreach, emitComplianceAlert } from './websocket.js';
import { dispatchNotification } from './notification-dispatch.js';
import type { CaseDoc } from '../models/firestore-schemas.js';

// ---- Active Listeners ----

const activeListeners: Map<string, () => void> = new Map();

// ---- Case Locks (Optimistic Locking) ----

interface CaseLock {
  caseId: string;
  lockedBy: string;
  lockedAt: string;
  expiresAt: number; // timestamp ms
}

const caseLocks = new Map<string, CaseLock>();
const LOCK_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function acquireCaseLock(caseId: string, userId: string): { success: boolean; lockedBy?: string } {
  const existing = caseLocks.get(caseId);
  if (existing && existing.expiresAt > Date.now() && existing.lockedBy !== userId) {
    return { success: false, lockedBy: existing.lockedBy };
  }

  caseLocks.set(caseId, {
    caseId,
    lockedBy: userId,
    lockedAt: new Date().toISOString(),
    expiresAt: Date.now() + LOCK_EXPIRY_MS,
  });
  return { success: true };
}

export function releaseCaseLock(caseId: string, userId: string): boolean {
  const lock = caseLocks.get(caseId);
  if (!lock) return true;
  if (lock.lockedBy !== userId) return false;
  caseLocks.delete(caseId);
  return true;
}

export function getCaseLock(caseId: string): CaseLock | null {
  const lock = caseLocks.get(caseId);
  if (!lock) return null;
  if (lock.expiresAt < Date.now()) {
    caseLocks.delete(caseId);
    return null;
  }
  return lock;
}

// ---- Listener: Cases Collection ----

export function startCasesListener(): void {
  if (activeListeners.has('cases')) return;

  console.log('[firestore-listeners] Starting cases collection listener');

  const unsubscribe = collections.cases.onSnapshot(
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const caseData = { id: change.doc.id, ...change.doc.data() } as CaseDoc;

        switch (change.type) {
          case 'added':
            // New case created — notify handler
            if (caseData.handler) {
              dispatchNotification({
                category: 'case-update',
                priority: caseData.priority === 'emergency' ? 'critical' : 'medium',
                title: `New ${caseData.type} case: ${caseData.reference}`,
                body: `${caseData.subject} — Priority: ${caseData.priority}`,
                entityType: 'case',
                entityId: caseData.id,
                actionUrl: `/cases/${caseData.id}`,
                recipientRole: 'housing-officer',
              }).catch(() => {});
            }
            break;

          case 'modified':
            // Case updated — detect status changes
            handleCaseModification(caseData);
            break;

          case 'removed':
            // Rare — case deleted
            break;
        }
      }
    },
    (error) => {
      console.error('[firestore-listeners] Cases listener error:', error.message);
      // Auto-restart after delay
      activeListeners.delete('cases');
      setTimeout(() => startCasesListener(), 10000);
    },
  );

  activeListeners.set('cases', unsubscribe);
}

function handleCaseModification(caseData: CaseDoc): void {
  // Emit WebSocket update
  emitCaseUpdate(caseData.id, 'status', null, caseData.status, 'system');

  // Check for SLA breach
  if (caseData.targetDate) {
    const target = new Date(caseData.targetDate);
    const now = new Date();
    if (target < now && caseData.slaStatus !== 'breached') {
      emitSlaBreach(
        caseData.id,
        caseData.reference,
        caseData.type,
        new Date().toISOString(),
      );
    }
  }

  // Awaab's Law escalation
  if (caseData.isAwaabsLaw && caseData.status === 'open') {
    dispatchNotification({
      category: 'damp-alert',
      priority: 'critical',
      title: `Awaab's Law case requires attention: ${caseData.reference}`,
      body: `Damp/mould case with Awaab's Law obligations. Current status: ${caseData.status}.`,
      entityType: 'case',
      entityId: caseData.id,
      actionUrl: `/cases/${caseData.id}`,
      recipientRole: 'manager',
    }).catch(() => {});
  }
}

// ---- Listener: Properties (Compliance) ----

export function startComplianceListener(): void {
  if (activeListeners.has('compliance')) return;

  console.log('[firestore-listeners] Starting compliance listener');

  const unsubscribe = collections.properties.onSnapshot(
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type !== 'modified') continue;

        const property = { id: change.doc.id, ...change.doc.data() } as any;
        const compliance = property.compliance || {};

        // Check for compliance status changes
        for (const [type, status] of Object.entries(compliance)) {
          if (status === 'expired' || status === 'overdue') {
            emitComplianceAlert(property.id, type, 0);
          }
        }
      }
    },
    (error) => {
      console.error('[firestore-listeners] Compliance listener error:', error.message);
      activeListeners.delete('compliance');
      setTimeout(() => startComplianceListener(), 10000);
    },
  );

  activeListeners.set('compliance', unsubscribe);
}

// ---- Lifecycle ----

export function startAllListeners(): void {
  startCasesListener();
  startComplianceListener();
  console.log('[firestore-listeners] All listeners started');
}

export function stopAllListeners(): void {
  for (const [name, unsubscribe] of activeListeners) {
    unsubscribe();
    console.log(`[firestore-listeners] Stopped ${name} listener`);
  }
  activeListeners.clear();
}

export function getListenerStatus(): { name: string; active: boolean }[] {
  const expected = ['cases', 'compliance'];
  return expected.map(name => ({
    name,
    active: activeListeners.has(name),
  }));
}
