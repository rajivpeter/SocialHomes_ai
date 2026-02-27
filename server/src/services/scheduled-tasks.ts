// ============================================================
// SocialHomes.Ai — Scheduled Task Runner
// Task 5.2.7: Compliance reminders, daily briefing pre-compute,
// weekly TSM refresh, monthly regulatory reports, arrears triggers
// ============================================================

import { db, collections, getDocs, FieldValue } from './firestore.js';
import { dispatchNotification, dispatchBulkNotification } from './notification-dispatch.js';
import { runCacheWarming } from './cache-warming.js';
import type { PropertyDoc, TenantDoc, CaseDoc } from '../models/firestore-schemas.js';

// ---- Types ----

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string; // cron expression or interval description
  lastRun?: string;
  nextRun?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  enabled: boolean;
  result?: {
    itemsProcessed: number;
    notifications: number;
    errors: string[];
    duration: number;
  };
}

// ---- Task Registry ----

const taskRegistry: ScheduledTask[] = [
  {
    id: 'compliance-reminders',
    name: 'Compliance Certificate Reminders',
    description: 'Check for expiring certificates and send reminders at 30/14/7 days',
    schedule: 'Daily at 08:00 UTC',
    status: 'idle',
    enabled: true,
  },
  {
    id: 'arrears-escalation',
    name: 'Arrears Escalation Triggers',
    description: 'Check arrears thresholds and trigger escalation actions',
    schedule: 'Daily at 09:00 UTC',
    status: 'idle',
    enabled: true,
  },
  {
    id: 'sla-breach-check',
    name: 'SLA Breach Detection',
    description: 'Check cases approaching or breaching SLA targets',
    schedule: 'Every 4 hours',
    status: 'idle',
    enabled: true,
  },
  {
    id: 'cache-warming',
    name: 'Cache Warming',
    description: 'Pre-fetch weather (2h), crime (24h), demographics (weekly)',
    schedule: 'Every 2 hours',
    status: 'idle',
    enabled: true,
  },
  {
    id: 'tsm-refresh',
    name: 'TSM Metrics Refresh',
    description: 'Recalculate Tenant Satisfaction Measures for regulatory reporting',
    schedule: 'Weekly on Monday at 06:00 UTC',
    status: 'idle',
    enabled: true,
  },
  {
    id: 'monthly-regulatory',
    name: 'Monthly Regulatory Report',
    description: 'Generate monthly KPI snapshot for RSH reporting',
    schedule: '1st of month at 02:00 UTC',
    status: 'idle',
    enabled: true,
  },
  {
    id: 'daily-briefing',
    name: 'Daily Briefing Pre-computation',
    description: 'Pre-compute neighbourhood briefings for all estates',
    schedule: 'Daily at 06:00 UTC',
    status: 'idle',
    enabled: true,
  },
];

// ---- Task Implementations ----

/**
 * Check all properties for expiring compliance certificates.
 * Sends notifications at 30, 14, and 7 day thresholds.
 */
export async function runComplianceReminders(): Promise<{ processed: number; notifications: number; errors: string[] }> {
  const properties = await getDocs<PropertyDoc>(collections.properties, undefined, undefined, 1000);
  let notifications = 0;
  const errors: string[] = [];
  const now = new Date();

  const certificateTypes = [
    { key: 'gasSafety', name: 'Gas Safety (CP12)', field: 'expiryDate' },
    { key: 'eicr', name: 'Electrical Safety (EICR)', field: 'expiryDate' },
    { key: 'epc', name: 'Energy Performance Certificate', field: 'validUntil' },
    { key: 'asbestos', name: 'Asbestos Management Survey', field: 'nextReviewDate' },
  ];

  for (const property of properties) {
    for (const cert of certificateTypes) {
      try {
        const certData = (property as any)[cert.key];
        if (!certData) continue;

        const expiryStr = certData[cert.field] || certData.expiryDate;
        if (!expiryStr) continue;

        const expiry = new Date(expiryStr);
        const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Send reminders at 30, 14, and 7 days
        const thresholds = [30, 14, 7];
        for (const threshold of thresholds) {
          if (daysRemaining === threshold || (daysRemaining <= 0 && threshold === 7)) {
            const priority = daysRemaining <= 7 ? 'critical' as const : daysRemaining <= 14 ? 'high' as const : 'medium' as const;
            await dispatchNotification({
              category: 'compliance-alert',
              priority,
              title: `${cert.name} expiring${daysRemaining <= 0 ? ' — OVERDUE' : ''}`,
              body: `${property.address}: ${cert.name} ${daysRemaining <= 0 ? 'has expired' : `expires in ${daysRemaining} days`}. Action required.`,
              entityType: 'property',
              entityId: property.id,
              actionUrl: `/properties/${property.id}`,
              recipientRole: 'manager',
            });
            notifications++;
          }
        }
      } catch (err: any) {
        errors.push(`${property.address} ${cert.name}: ${err.message}`);
      }
    }
  }

  return { processed: properties.length, notifications, errors };
}

/**
 * Check tenant arrears against escalation thresholds.
 * Warning: 4 weeks, Action: 8 weeks, Legal: 12 weeks.
 */
export async function runArrearsEscalation(): Promise<{ processed: number; notifications: number; errors: string[] }> {
  const tenants = await getDocs<TenantDoc>(collections.tenants, undefined, undefined, 1000);
  let notifications = 0;
  const errors: string[] = [];

  for (const tenant of tenants) {
    try {
      if (tenant.rentBalance >= 0) continue; // Not in arrears

      const weeksInArrears = Math.abs(tenant.rentBalance) / (tenant.weeklyCharge || 1);

      let threshold: 'warning' | 'action' | 'legal' | null = null;
      let priority: 'medium' | 'high' | 'critical' = 'medium';

      if (weeksInArrears >= 12) {
        threshold = 'legal';
        priority = 'critical';
      } else if (weeksInArrears >= 8) {
        threshold = 'action';
        priority = 'high';
      } else if (weeksInArrears >= 4) {
        threshold = 'warning';
        priority = 'medium';
      }

      if (threshold) {
        await dispatchNotification({
          category: 'arrears-alert',
          priority,
          title: `Arrears ${threshold} threshold — ${tenant.firstName} ${tenant.lastName}`,
          body: `£${Math.abs(tenant.rentBalance).toFixed(2)} in arrears (${weeksInArrears.toFixed(1)} weeks). ${threshold === 'legal' ? 'Pre-action protocol review required.' : threshold === 'action' ? 'Payment arrangement required.' : 'Welfare contact recommended.'}`,
          entityType: 'tenant',
          entityId: tenant.id,
          actionUrl: `/tenancies/${tenant.id}`,
          recipientUserId: tenant.assignedOfficer ? undefined : undefined,
          recipientRole: 'housing-officer',
        });
        notifications++;
      }
    } catch (err: any) {
      errors.push(`${tenant.firstName} ${tenant.lastName}: ${err.message}`);
    }
  }

  return { processed: tenants.length, notifications, errors };
}

/**
 * Check all open cases for SLA breaches or approaching breaches.
 */
export async function runSlaBreachCheck(): Promise<{ processed: number; notifications: number; errors: string[] }> {
  const cases = await getDocs<CaseDoc>(collections.cases, undefined, undefined, 1000);
  const openCases = cases.filter(c => !['completed', 'closed', 'cancelled'].includes(c.status));
  let notifications = 0;
  const errors: string[] = [];
  const now = new Date();

  for (const caseDoc of openCases) {
    try {
      if (!caseDoc.targetDate) continue;

      const target = new Date(caseDoc.targetDate);
      const daysRemaining = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 0) {
        // SLA breached
        await dispatchNotification({
          category: 'sla-breach',
          priority: caseDoc.isAwaabsLaw ? 'critical' : 'high',
          title: `SLA BREACHED — ${caseDoc.reference}`,
          body: `${caseDoc.type} case ${caseDoc.reference} has breached SLA by ${Math.abs(daysRemaining)} day(s). ${caseDoc.isAwaabsLaw ? 'AWAAB\'S LAW CASE — immediate escalation required.' : 'Escalation review needed.'}`,
          entityType: 'case',
          entityId: caseDoc.id,
          actionUrl: `/cases/${caseDoc.id}`,
          recipientRole: 'manager',
        });
        notifications++;
      } else if (daysRemaining <= 2) {
        // Approaching breach
        await dispatchNotification({
          category: 'sla-breach',
          priority: 'high',
          title: `SLA approaching — ${caseDoc.reference}`,
          body: `${caseDoc.type} case ${caseDoc.reference} will breach SLA in ${daysRemaining} day(s). Handler: ${caseDoc.handler}.`,
          entityType: 'case',
          entityId: caseDoc.id,
          actionUrl: `/cases/${caseDoc.id}`,
          recipientRole: 'housing-officer',
        });
        notifications++;
      }
    } catch (err: any) {
      errors.push(`${caseDoc.reference}: ${err.message}`);
    }
  }

  return { processed: openCases.length, notifications, errors };
}

/**
 * Refresh Tenant Satisfaction Measures (TSM) for regulatory reporting.
 */
export async function runTsmRefresh(): Promise<{ processed: number; metrics: Record<string, number> }> {
  const [cases, tenants, properties] = await Promise.all([
    getDocs<CaseDoc>(collections.cases, undefined, undefined, 2000),
    getDocs<TenantDoc>(collections.tenants, undefined, undefined, 1000),
    getDocs<PropertyDoc>(collections.properties, undefined, undefined, 1000),
  ]);

  const repairs = cases.filter(c => c.type === 'repair');
  const completedRepairs = repairs.filter(c => c.status === 'completed');
  const complaints = cases.filter(c => c.type === 'complaint');
  const asbCases = cases.filter(c => c.type === 'asb');

  // Calculate TSM metrics
  const metrics: Record<string, number> = {
    'TP01-overall-satisfaction': 0, // Placeholder — requires survey data
    'TP02-repairs-satisfaction': completedRepairs.length > 0
      ? completedRepairs.filter(r => (r.satisfaction || 0) >= 4).length / completedRepairs.length * 100
      : 0,
    'TP06-complaints-relative': complaints.length / (tenants.length || 1) * 100,
    'TP07-complaints-handling-satisfaction': 0, // Requires survey
    'TP10-asb-handling-satisfaction': 0, // Requires survey
    'RP01-gas-safety-compliance': properties.filter(p => p.compliance?.gasSafety === 'valid').length / (properties.length || 1) * 100,
    'RP02-fire-safety-compliance': properties.filter(p => p.compliance?.fireRisk === 'valid').length / (properties.length || 1) * 100,
    'CH01-repairs-completed-target': completedRepairs.filter(r => r.slaStatus === 'within').length / (completedRepairs.length || 1) * 100,
    'NM01-arrears-percentage': tenants.filter(t => t.rentBalance < 0).length / (tenants.length || 1) * 100,
    'total-properties': properties.length,
    'total-tenants': tenants.length,
    'total-open-repairs': repairs.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length,
    'total-open-complaints': complaints.filter(c => c.status !== 'closed').length,
    'void-rate': properties.filter(p => p.isVoid).length / (properties.length || 1) * 100,
  };

  // Persist to Firestore
  await db.collection('tsmMeasures').doc(`tsm-${new Date().toISOString().slice(0, 10)}`).set({
    ...metrics,
    calculatedAt: FieldValue.serverTimestamp(),
    period: new Date().toISOString().slice(0, 7), // YYYY-MM
  });

  return { processed: tenants.length + properties.length + cases.length, metrics };
}

// ---- Run All Scheduled Tasks ----

export async function runScheduledTask(taskId: string): Promise<ScheduledTask> {
  const task = taskRegistry.find(t => t.id === taskId);
  if (!task) throw new Error(`Unknown task: ${taskId}`);
  if (!task.enabled) throw new Error(`Task ${taskId} is disabled`);

  task.status = 'running';
  task.lastRun = new Date().toISOString();
  const start = Date.now();

  try {
    let result: { processed?: number; notifications?: number; errors?: string[]; metrics?: any; itemsProcessed?: number };

    switch (taskId) {
      case 'compliance-reminders':
        result = await runComplianceReminders();
        break;
      case 'arrears-escalation':
        result = await runArrearsEscalation();
        break;
      case 'sla-breach-check':
        result = await runSlaBreachCheck();
        break;
      case 'cache-warming':
        result = await runCacheWarming('all');
        break;
      case 'tsm-refresh':
        result = await runTsmRefresh();
        break;
      case 'daily-briefing':
        result = await runCacheWarming('all');
        break;
      case 'monthly-regulatory':
        result = await runTsmRefresh();
        break;
      default:
        throw new Error(`No implementation for task: ${taskId}`);
    }

    task.status = 'completed';
    task.result = {
      itemsProcessed: result.processed || result.itemsProcessed || 0,
      notifications: result.notifications || 0,
      errors: result.errors || [],
      duration: Date.now() - start,
    };
  } catch (err: any) {
    task.status = 'failed';
    task.result = {
      itemsProcessed: 0,
      notifications: 0,
      errors: [err.message],
      duration: Date.now() - start,
    };
  }

  return task;
}

export function getScheduledTasks(): ScheduledTask[] {
  return [...taskRegistry];
}

export function toggleTask(taskId: string, enabled: boolean): boolean {
  const task = taskRegistry.find(t => t.id === taskId);
  if (!task) return false;
  task.enabled = enabled;
  return true;
}
