// ============================================================
// SocialHomes.Ai — Awaab's Law Compliance Engine
// Task 5.2.13: Automatic deadline calculation, SLA breach
// detection, escalation, notification chain, audit trail
// ============================================================

import { db, collections, getDocs, FieldValue } from './firestore.js';
import { dispatchNotification } from './notification-dispatch.js';
import type { CaseDoc, PropertyDoc, TenantDoc } from '../models/firestore-schemas.js';

// ---- Awaab's Law Timeline Requirements ----

/**
 * Awaab's Law (Social Housing (Regulation) Act 2023) defines strict timelines
 * for addressing damp and mould hazards in social housing.
 *
 * Timelines:
 * - Emergency (Category 1 HHSRS): Investigate within 24 hours
 * - Urgent: Initial inspection within 7 calendar days
 * - Standard: Inspection within 14 calendar days
 * - Investigation deadline: From date of complaint/report
 * - Works must commence within defined period after investigation
 * - All works completed within maximum 56 calendar days
 */

export type HazardCategory = 'emergency' | 'category-1' | 'category-2' | 'precautionary';

export interface AwaabsLawTimeline {
  acknowledgeByDate: string;    // Within 14 calendar days
  investigateByDate: string;    // Based on hazard category
  worksStartByDate: string;     // Based on hazard category
  worksCompleteByDate: string;  // Maximum 56 calendar days
  hazardCategory: HazardCategory;
  currentPhase: 'reported' | 'acknowledged' | 'investigating' | 'works-scheduled' | 'works-in-progress' | 'completed' | 'breached';
  isCompliant: boolean;
  daysRemaining: number;
  nextDeadline: string;
  nextDeadlineType: string;
}

export interface AwaabsLawCaseAssessment {
  caseId: string;
  reference: string;
  propertyAddress: string;
  tenantName: string;
  hazardCategory: HazardCategory;
  timeline: AwaabsLawTimeline;
  escalationLevel: number; // 0-3
  escalationHistory: EscalationEntry[];
  riskFactors: string[];
  requiredActions: string[];
  complianceAudit: AuditEntry[];
}

interface EscalationEntry {
  level: number;
  escalatedTo: string;
  escalatedAt: string;
  reason: string;
}

interface AuditEntry {
  action: string;
  timestamp: string;
  actor: string;
  detail: string;
}

// ---- Timeline Calculation ----

const TIMELINE_RULES: Record<HazardCategory, { investigate: number; worksStart: number; worksComplete: number }> = {
  'emergency': { investigate: 1, worksStart: 1, worksComplete: 7 },    // 24 hours to make safe
  'category-1': { investigate: 7, worksStart: 14, worksComplete: 28 }, // 7 days to inspect
  'category-2': { investigate: 14, worksStart: 21, worksComplete: 42 },
  'precautionary': { investigate: 14, worksStart: 28, worksComplete: 56 },
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function calculateTimeline(
  reportedDate: string,
  hazardCategory: HazardCategory,
  currentStatus: string,
): AwaabsLawTimeline {
  const reported = new Date(reportedDate);
  const rules = TIMELINE_RULES[hazardCategory];
  const now = new Date();

  const acknowledgeBy = addDays(reported, 14);
  const investigateBy = addDays(reported, rules.investigate);
  const worksStartBy = addDays(reported, rules.worksStart);
  const worksCompleteBy = addDays(reported, rules.worksComplete);

  // Determine current phase
  let currentPhase: AwaabsLawTimeline['currentPhase'] = 'reported';
  if (currentStatus === 'completed' || currentStatus === 'closed') {
    currentPhase = 'completed';
  } else if (currentStatus === 'in-progress' || currentStatus === 'works-in-progress') {
    currentPhase = 'works-in-progress';
  } else if (currentStatus === 'scheduled' || currentStatus === 'works-scheduled') {
    currentPhase = 'works-scheduled';
  } else if (currentStatus === 'investigating' || currentStatus === 'inspection') {
    currentPhase = 'investigating';
  } else if (currentStatus === 'acknowledged' || currentStatus === 'open') {
    currentPhase = 'acknowledged';
  }

  // Determine next deadline
  let nextDeadline: Date;
  let nextDeadlineType: string;

  switch (currentPhase) {
    case 'reported':
      nextDeadline = acknowledgeBy;
      nextDeadlineType = 'Acknowledgement';
      break;
    case 'acknowledged':
      nextDeadline = investigateBy;
      nextDeadlineType = 'Investigation';
      break;
    case 'investigating':
      nextDeadline = worksStartBy;
      nextDeadlineType = 'Works commencement';
      break;
    case 'works-scheduled':
    case 'works-in-progress':
      nextDeadline = worksCompleteBy;
      nextDeadlineType = 'Works completion';
      break;
    default:
      nextDeadline = worksCompleteBy;
      nextDeadlineType = 'Overall completion';
  }

  const daysRemaining = Math.ceil((nextDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isCompliant = daysRemaining >= 0;
  const finalPhase: AwaabsLawTimeline['currentPhase'] = daysRemaining < 0 && currentPhase !== 'completed' ? 'breached' : currentPhase;

  return {
    acknowledgeByDate: acknowledgeBy.toISOString(),
    investigateByDate: investigateBy.toISOString(),
    worksStartByDate: worksStartBy.toISOString(),
    worksCompleteByDate: worksCompleteBy.toISOString(),
    hazardCategory,
    currentPhase: finalPhase,
    isCompliant,
    daysRemaining,
    nextDeadline: nextDeadline.toISOString(),
    nextDeadlineType,
  };
}

// ---- Case Assessment ----

export async function assessAwaabsLawCase(caseId: string): Promise<AwaabsLawCaseAssessment> {
  const caseDoc = await collections.cases.doc(caseId).get();
  if (!caseDoc.exists) throw new Error(`Case ${caseId} not found`);
  const caseData = { id: caseDoc.id, ...caseDoc.data() } as CaseDoc;

  if (caseData.type !== 'damp-mould' && caseData.type !== 'repair') {
    throw new Error(`Case ${caseId} is not a damp/mould or repair case`);
  }

  // Fetch related data
  const [propertyDoc, tenantDoc] = await Promise.all([
    collections.properties.doc(caseData.propertyId).get(),
    collections.tenants.doc(caseData.tenantId).get(),
  ]);

  const property = propertyDoc.exists ? (propertyDoc.data() as PropertyDoc) : null;
  const tenant = tenantDoc.exists ? (tenantDoc.data() as TenantDoc) : null;

  // Determine hazard category
  const hazardCategory = determineHazardCategory(caseData, property);

  // Calculate timeline
  const timeline = calculateTimeline(caseData.createdDate, hazardCategory, caseData.status);

  // Assess risk factors
  const riskFactors: string[] = [];
  if (tenant?.vulnerabilityFlags && tenant.vulnerabilityFlags.length > 0) {
    riskFactors.push('Vulnerable tenant household');
  }
  if (caseData.dampRiskScore && caseData.dampRiskScore > 70) {
    riskFactors.push(`High damp risk score: ${caseData.dampRiskScore}/100`);
  }
  if (property?.dampRisk && property.dampRisk > 50) {
    riskFactors.push(`Property has elevated damp risk: ${property.dampRisk}/100`);
  }
  if (timeline.daysRemaining <= 2 && timeline.daysRemaining > 0) {
    riskFactors.push('Approaching deadline — immediate action required');
  }
  if (timeline.daysRemaining <= 0) {
    riskFactors.push('DEADLINE BREACHED — regulatory non-compliance');
  }

  // Determine required actions
  const requiredActions = getRequiredActions(timeline, hazardCategory, caseData);

  // Build escalation history
  const escalationHistory: EscalationEntry[] = [];
  let escalationLevel = 0;

  if (timeline.daysRemaining <= 0) {
    escalationLevel = 3;
    escalationHistory.push({
      level: 3,
      escalatedTo: 'Director of Housing',
      escalatedAt: new Date().toISOString(),
      reason: 'Awaab\'s Law deadline breached',
    });
  } else if (timeline.daysRemaining <= 2) {
    escalationLevel = 2;
    escalationHistory.push({
      level: 2,
      escalatedTo: 'Housing Manager',
      escalatedAt: new Date().toISOString(),
      reason: `Only ${timeline.daysRemaining} day(s) remaining to ${timeline.nextDeadlineType}`,
    });
  } else if (timeline.daysRemaining <= 5) {
    escalationLevel = 1;
  }

  // Compliance audit trail
  const complianceAudit: AuditEntry[] = [
    {
      action: 'Case created',
      timestamp: caseData.createdDate,
      actor: caseData.handler,
      detail: `${caseData.type} case reported. Hazard category: ${hazardCategory}`,
    },
    {
      action: 'Timeline calculated',
      timestamp: new Date().toISOString(),
      actor: 'system',
      detail: `Deadlines: Acknowledge by ${timeline.acknowledgeByDate.slice(0, 10)}, Investigate by ${timeline.investigateByDate.slice(0, 10)}, Complete by ${timeline.worksCompleteByDate.slice(0, 10)}`,
    },
  ];

  return {
    caseId: caseData.id,
    reference: caseData.reference,
    propertyAddress: property?.address || 'Unknown',
    tenantName: tenant ? `${tenant.title} ${tenant.firstName} ${tenant.lastName}` : 'Unknown',
    hazardCategory,
    timeline,
    escalationLevel,
    escalationHistory,
    riskFactors,
    requiredActions,
    complianceAudit,
  };
}

// ---- Helpers ----

function determineHazardCategory(caseData: CaseDoc, property: PropertyDoc | null): HazardCategory {
  // Use explicit classification if available
  if (caseData.hazardClassification) {
    return caseData.hazardClassification as HazardCategory;
  }

  // Auto-determine from case data
  if (caseData.priority === 'emergency') return 'emergency';
  if (caseData.dampRiskScore && caseData.dampRiskScore > 80) return 'category-1';
  if (caseData.dampRiskScore && caseData.dampRiskScore > 50) return 'category-2';
  if (property?.dampRisk && property.dampRisk > 70) return 'category-1';

  return 'category-2'; // Default
}

function getRequiredActions(timeline: AwaabsLawTimeline, category: HazardCategory, caseData: CaseDoc): string[] {
  const actions: string[] = [];

  switch (timeline.currentPhase) {
    case 'reported':
      actions.push('Acknowledge complaint within 14 calendar days');
      if (category === 'emergency') {
        actions.push('Arrange emergency inspection within 24 hours');
        actions.push('Consider emergency decant if property is uninhabitable');
      }
      break;

    case 'acknowledged':
      actions.push(`Complete investigation by ${timeline.investigateByDate.slice(0, 10)}`);
      actions.push('Arrange qualified surveyor inspection');
      actions.push('Record evidence (photos, moisture readings, thermal imaging)');
      break;

    case 'investigating':
      actions.push(`Schedule remedial works to start by ${timeline.worksStartByDate.slice(0, 10)}`);
      actions.push('Prepare scope of works and contractor brief');
      actions.push('Notify tenant of findings and planned works');
      break;

    case 'works-scheduled':
    case 'works-in-progress':
      actions.push(`Complete all works by ${timeline.worksCompleteByDate.slice(0, 10)}`);
      actions.push('Ensure post-works inspection is scheduled');
      actions.push('Document all remedial works with before/after evidence');
      break;

    case 'breached':
      actions.push('IMMEDIATE: Escalate to Director of Housing');
      actions.push('Document reasons for breach and mitigation plan');
      actions.push('Notify tenant of delay and revised timeline');
      actions.push('Prepare for potential regulatory reporting');
      break;

    case 'completed':
      actions.push('Schedule follow-up inspection within 30 days');
      actions.push('Update property damp risk assessment');
      actions.push('Close case with full audit trail');
      break;
  }

  return actions;
}

// ---- Scan All Cases ----

export async function scanAwaabsLawCases(): Promise<{
  totalCases: number;
  compliant: number;
  atRisk: number;
  breached: number;
  cases: { caseId: string; reference: string; hazardCategory: string; daysRemaining: number; phase: string }[];
}> {
  const allCases = await getDocs<CaseDoc>(collections.cases, undefined, undefined, 2000);
  const dampCases = allCases.filter(c =>
    (c.type === 'damp-mould' || c.isAwaabsLaw) &&
    !['completed', 'closed', 'cancelled'].includes(c.status),
  );

  let compliant = 0;
  let atRisk = 0;
  let breached = 0;
  const caseResults: { caseId: string; reference: string; hazardCategory: string; daysRemaining: number; phase: string }[] = [];

  for (const caseDoc of dampCases) {
    try {
      const hazardCategory = determineHazardCategory(caseDoc, null);
      const timeline = calculateTimeline(caseDoc.createdDate, hazardCategory, caseDoc.status);

      caseResults.push({
        caseId: caseDoc.id,
        reference: caseDoc.reference,
        hazardCategory,
        daysRemaining: timeline.daysRemaining,
        phase: timeline.currentPhase,
      });

      if (timeline.daysRemaining <= 0) {
        breached++;
      } else if (timeline.daysRemaining <= 5) {
        atRisk++;
      } else {
        compliant++;
      }
    } catch {
      // Skip cases with errors
    }
  }

  // Sort by days remaining (most urgent first)
  caseResults.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return {
    totalCases: dampCases.length,
    compliant,
    atRisk,
    breached,
    cases: caseResults,
  };
}
