// ============================================================
// SocialHomes.Ai — Tenant Activity Scoring
// Task 5.2.12: Contact frequency, case history, payment behaviour,
// engagement score, correlation with vulnerability, proactive triggers
// ============================================================

import { collections, getDocs } from './firestore.js';
import type { TenantDoc, CaseDoc, ActivityDoc } from '../models/firestore-schemas.js';

// ---- Types ----

export interface TenantActivityScore {
  tenantId: string;
  tenantName: string;
  engagementScore: number; // 0-100
  components: {
    contactFrequency: { score: number; weight: number; detail: string };
    caseHistory: { score: number; weight: number; detail: string };
    paymentBehaviour: { score: number; weight: number; detail: string };
    communicationResponsiveness: { score: number; weight: number; detail: string };
    serviceUsage: { score: number; weight: number; detail: string };
  };
  riskLevel: 'engaged' | 'moderate' | 'disengaged' | 'at-risk';
  vulnerabilityCorrelation: {
    vulnerabilityScore: number;
    correlationStrength: 'strong' | 'moderate' | 'weak' | 'none';
    combinedRisk: 'critical' | 'high' | 'medium' | 'low';
  };
  proactiveActions: string[];
  lastCalculated: string;
}

// ---- Weights ----

const WEIGHTS = {
  contactFrequency: 0.25,
  caseHistory: 0.20,
  paymentBehaviour: 0.30,
  communicationResponsiveness: 0.15,
  serviceUsage: 0.10,
};

// ---- Scoring Functions ----

function scoreContactFrequency(tenant: TenantDoc, activities: ActivityDoc[]): { score: number; detail: string } {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentContacts = activities.filter(a => new Date(a.date) > thirtyDaysAgo).length;

  // Ideal: 1-3 contacts per month = high engagement
  // 0 contacts = disengaged
  // 5+ = may indicate issues
  let score: number;
  let detail: string;

  if (recentContacts === 0) {
    score = 20;
    detail = `No contact in 30 days. Last contact: ${tenant.lastContact || 'unknown'}`;
  } else if (recentContacts <= 3) {
    score = 90;
    detail = `${recentContacts} contact(s) in 30 days — healthy engagement`;
  } else if (recentContacts <= 5) {
    score = 70;
    detail = `${recentContacts} contacts in 30 days — above average (may need support)`;
  } else {
    score = 50;
    detail = `${recentContacts} contacts in 30 days — high frequency (investigate underlying issues)`;
  }

  return { score, detail };
}

function scoreCaseHistory(cases: CaseDoc[]): { score: number; detail: string } {
  const sixMonths = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const recentCases = cases.filter(c => new Date(c.createdDate) > sixMonths);
  const openCases = recentCases.filter(c => !['completed', 'closed', 'cancelled'].includes(c.status));
  const resolvedCases = recentCases.filter(c => ['completed', 'closed'].includes(c.status));

  // Fewer open cases + more resolved = better score
  const openPenalty = Math.min(openCases.length * 15, 60);
  const resolvedBonus = Math.min(resolvedCases.length * 5, 30);
  const score = Math.max(10, Math.min(100, 70 - openPenalty + resolvedBonus));

  const complaints = recentCases.filter(c => c.type === 'complaint').length;
  const escalated = recentCases.filter(c => (c.stage || 0) >= 2).length;

  let detail = `${recentCases.length} cases in 6 months (${openCases.length} open, ${resolvedCases.length} resolved)`;
  if (complaints > 0) detail += `, ${complaints} complaint(s)`;
  if (escalated > 0) detail += `, ${escalated} escalated`;

  return { score, detail };
}

function scorePaymentBehaviour(tenant: TenantDoc): { score: number; detail: string } {
  const balance = tenant.rentBalance || 0;
  const weeklyCharge = tenant.weeklyCharge || 100;
  const weeksInArrears = balance < 0 ? Math.abs(balance) / weeklyCharge : 0;

  let score: number;
  let detail: string;

  if (balance >= 0) {
    score = 100;
    detail = `Account in credit: £${balance.toFixed(2)}`;
  } else if (weeksInArrears < 2) {
    score = 75;
    detail = `Minor arrears: £${Math.abs(balance).toFixed(2)} (${weeksInArrears.toFixed(1)} weeks)`;
  } else if (weeksInArrears < 4) {
    score = 50;
    detail = `Moderate arrears: £${Math.abs(balance).toFixed(2)} (${weeksInArrears.toFixed(1)} weeks)`;
  } else if (weeksInArrears < 8) {
    score = 25;
    detail = `Significant arrears: £${Math.abs(balance).toFixed(2)} (${weeksInArrears.toFixed(1)} weeks)`;
  } else {
    score = 10;
    detail = `Critical arrears: £${Math.abs(balance).toFixed(2)} (${weeksInArrears.toFixed(1)} weeks)`;
  }

  // UC transition penalty
  if (tenant.ucStatus === 'transitioning') {
    score = Math.max(score - 10, 0);
    detail += ' — UC transitioning';
  }

  return { score, detail };
}

function scoreCommunicationResponsiveness(tenant: TenantDoc, activities: ActivityDoc[]): { score: number; detail: string } {
  // Check if tenant responds to outbound communications
  const outbound = activities.filter(a => a.direction === 'outbound');
  const inbound = activities.filter(a => a.direction === 'inbound');

  if (outbound.length === 0) {
    return { score: 50, detail: 'No outbound communication recorded' };
  }

  const responseRate = inbound.length / outbound.length;

  if (responseRate >= 0.7) {
    return { score: 90, detail: `Good responsiveness: ${(responseRate * 100).toFixed(0)}% response rate` };
  } else if (responseRate >= 0.4) {
    return { score: 60, detail: `Moderate responsiveness: ${(responseRate * 100).toFixed(0)}% response rate` };
  } else {
    return { score: 30, detail: `Low responsiveness: ${(responseRate * 100).toFixed(0)}% response rate` };
  }
}

function scoreServiceUsage(tenant: TenantDoc, activities: ActivityDoc[]): { score: number; detail: string } {
  // Check usage of self-service features
  const portalActivities = activities.filter(a =>
    a.type === 'portal-login' || a.type === 'online-report' || a.type === 'self-service',
  );

  if (portalActivities.length === 0) {
    const pref = tenant.communicationPreference;
    if (pref === 'email' || pref === 'portal') {
      return { score: 40, detail: 'Digital preference set but no portal activity recorded' };
    }
    return { score: 30, detail: 'No digital service usage — traditional contact preferred' };
  }

  return {
    score: Math.min(90, 40 + portalActivities.length * 10),
    detail: `${portalActivities.length} self-service interaction(s) recorded`,
  };
}

// ---- Main Scoring Function ----

export async function calculateTenantActivityScore(tenantId: string): Promise<TenantActivityScore> {
  // Fetch tenant data
  const tenantDoc = await collections.tenants.doc(tenantId).get();
  if (!tenantDoc.exists) throw new Error(`Tenant ${tenantId} not found`);
  const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as TenantDoc;

  // Fetch related data
  const [cases, activities] = await Promise.all([
    getDocs<CaseDoc>(collections.cases, [{ field: 'tenantId', op: '==', value: tenantId }]),
    getDocs<ActivityDoc>(collections.activities, [{ field: 'tenantId', op: '==', value: tenantId }]),
  ]);

  // Calculate component scores
  const contactFreq = scoreContactFrequency(tenant, activities);
  const caseHist = scoreCaseHistory(cases);
  const paymentBehav = scorePaymentBehaviour(tenant);
  const commResp = scoreCommunicationResponsiveness(tenant, activities);
  const serviceUse = scoreServiceUsage(tenant, activities);

  // Calculate weighted total
  const engagementScore = Math.round(
    contactFreq.score * WEIGHTS.contactFrequency +
    caseHist.score * WEIGHTS.caseHistory +
    paymentBehav.score * WEIGHTS.paymentBehaviour +
    commResp.score * WEIGHTS.communicationResponsiveness +
    serviceUse.score * WEIGHTS.serviceUsage,
  );

  // Determine risk level
  let riskLevel: 'engaged' | 'moderate' | 'disengaged' | 'at-risk';
  if (engagementScore >= 70) riskLevel = 'engaged';
  else if (engagementScore >= 50) riskLevel = 'moderate';
  else if (engagementScore >= 30) riskLevel = 'disengaged';
  else riskLevel = 'at-risk';

  // Vulnerability correlation
  const vulnFlags = tenant.vulnerabilityFlags?.length || 0;
  const vulnerabilityScore = vulnFlags * 15; // rough estimate
  const correlationStrength: 'strong' | 'moderate' | 'weak' | 'none' =
    engagementScore < 40 && vulnerabilityScore > 40 ? 'strong' :
    engagementScore < 60 && vulnerabilityScore > 20 ? 'moderate' :
    vulnerabilityScore > 0 ? 'weak' : 'none';

  const combinedRisk: 'critical' | 'high' | 'medium' | 'low' =
    riskLevel === 'at-risk' && correlationStrength === 'strong' ? 'critical' :
    riskLevel === 'disengaged' || correlationStrength === 'strong' ? 'high' :
    riskLevel === 'moderate' || correlationStrength === 'moderate' ? 'medium' : 'low';

  // Generate proactive actions
  const proactiveActions: string[] = [];
  if (contactFreq.score < 30) proactiveActions.push('Schedule welfare check — no recent contact');
  if (paymentBehav.score < 30) proactiveActions.push('Refer to Money Advice Service for arrears support');
  if (commResp.score < 40) proactiveActions.push('Try alternative communication channel');
  if (serviceUse.score < 30) proactiveActions.push('Offer digital inclusion support and portal onboarding');
  if (combinedRisk === 'critical') proactiveActions.push('URGENT: Arrange face-to-face welfare visit');
  if (tenant.ucStatus === 'transitioning') proactiveActions.push('Monitor UC transition — offer benefits advice');

  return {
    tenantId,
    tenantName: `${tenant.title} ${tenant.firstName} ${tenant.lastName}`,
    engagementScore,
    components: {
      contactFrequency: { ...contactFreq, weight: WEIGHTS.contactFrequency },
      caseHistory: { ...caseHist, weight: WEIGHTS.caseHistory },
      paymentBehaviour: { ...paymentBehav, weight: WEIGHTS.paymentBehaviour },
      communicationResponsiveness: { ...commResp, weight: WEIGHTS.communicationResponsiveness },
      serviceUsage: { ...serviceUse, weight: WEIGHTS.serviceUsage },
    },
    riskLevel,
    vulnerabilityCorrelation: {
      vulnerabilityScore,
      correlationStrength,
      combinedRisk,
    },
    proactiveActions,
    lastCalculated: new Date().toISOString(),
  };
}

/**
 * Scan all tenants and return engagement summary.
 */
export async function scanAllTenantActivity(): Promise<{
  totalTenants: number;
  distribution: Record<string, number>;
  atRiskTenants: { tenantId: string; tenantName: string; score: number; actions: string[] }[];
}> {
  const tenants = await getDocs<TenantDoc>(collections.tenants, undefined, undefined, 1000);
  const distribution: Record<string, number> = { engaged: 0, moderate: 0, disengaged: 0, 'at-risk': 0 };
  const atRiskTenants: { tenantId: string; tenantName: string; score: number; actions: string[] }[] = [];

  for (const tenant of tenants) {
    try {
      const score = await calculateTenantActivityScore(tenant.id);
      distribution[score.riskLevel] = (distribution[score.riskLevel] || 0) + 1;

      if (score.riskLevel === 'at-risk' || score.riskLevel === 'disengaged') {
        atRiskTenants.push({
          tenantId: tenant.id,
          tenantName: score.tenantName,
          score: score.engagementScore,
          actions: score.proactiveActions,
        });
      }
    } catch {
      // Skip tenants with errors
    }
  }

  // Sort at-risk tenants by score (lowest first)
  atRiskTenants.sort((a, b) => a.score - b.score);

  return {
    totalTenants: tenants.length,
    distribution,
    atRiskTenants,
  };
}
