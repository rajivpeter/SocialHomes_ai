// ============================================================
// SocialHomes.Ai — Benefits Entitlement Engine
// Differentiator 4: Analyses tenant data against benefit rules
// to identify unclaimed entitlements and maximise income.
// ============================================================

import { collections, getDoc, getDocs } from './firestore.js';
import { fetchWithCache } from './external-api.js';
import type { TenantDoc, PropertyDoc } from '../models/firestore-schemas.js';

// ── Types ──
export interface BenefitEntitlement {
  benefit: string;
  status: 'currently-claiming' | 'likely-eligible' | 'potentially-eligible' | 'not-eligible';
  estimatedWeeklyAmount?: number;
  confidence: number; // 0–1
  reason: string;
}

export interface BenefitsAssessment {
  tenantId: string;
  tenantName: string;
  currentBenefits: string[];
  entitlements: BenefitEntitlement[];
  estimatedUnclaimedWeekly: number;
  estimatedUnclaimedAnnual: number;
  recommendedActions: string[];
  assessedAt: string;
}

// ── UK Benefit Rates 2025/26 ──
const UC_RATES = {
  singleUnder25: 71.70,
  single25Plus: 90.58,
  coupleUnder25: 112.55,
  couple25Plus: 142.13,
  childFirst: 74.58,
  childSubsequent: 63.94,
  disabledChildLower: 33.67,
  disabledChildHigher: 96.35,
  lcwElement: 44.01,
  lcwraElement: 94.32,
  carerElement: 44.01,
  housingElement: 'LHA-based', // varies by area
};

const PIP_RATES = {
  dailyLivingStandard: 72.65,
  dailyLivingEnhanced: 108.55,
  mobilityStandard: 28.70,
  mobilityEnhanced: 75.75,
};

const OTHER_RATES = {
  attendanceAllowance: { lower: 72.65, higher: 108.55 },
  carerAllowance: 81.90,
  winterFuelPayment: 200, // annual, per household
  coldWeatherPayment: 25, // per qualifying week
  pensionCredit: 218.15, // weekly guarantee credit single
};

// ── Determine Age from DOB ──
function getAge(dob: string): number {
  const birth = new Date(dob);
  return Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
}

// ── Check Benefit Entitlements ──
function assessEntitlements(tenant: TenantDoc, property: PropertyDoc | null): BenefitEntitlement[] {
  const entitlements: BenefitEntitlement[] = [];
  const age = tenant.dob ? getAge(tenant.dob) : 40;
  const household = tenant.household ?? [];
  const vulnFlags = (tenant.vulnerabilityFlags ?? []).map((v: any) => (v.flag || v.type || v.name || '').toLowerCase());
  const ucStatus = (tenant.ucStatus || '').toLowerCase();
  const children = household.filter((m: any) => (m.relationship || '').toLowerCase().includes('child') || (m.age ?? 99) < 18);
  const hasPartner = household.some((m: any) => {
    const rel = (m.relationship || '').toLowerCase();
    return rel.includes('partner') || rel.includes('spouse') || rel.includes('wife') || rel.includes('husband');
  });
  const hasDisability = vulnFlags.some(f => f.includes('disability') || f.includes('physical') || f.includes('mental'));
  const isCarer = vulnFlags.some(f => f.includes('carer'));
  const isElderly = age >= 66;

  // 1. Universal Credit
  if (ucStatus === 'active' || ucStatus === 'managed-payment') {
    entitlements.push({
      benefit: 'Universal Credit',
      status: 'currently-claiming',
      reason: 'Currently in receipt of UC',
      confidence: 1.0,
    });
  } else if (!isElderly && tenant.rentBalance < 0) {
    const weeklyRate = hasPartner
      ? (age >= 25 ? UC_RATES.couple25Plus : UC_RATES.coupleUnder25)
      : (age >= 25 ? UC_RATES.single25Plus : UC_RATES.singleUnder25);
    const childAmount = children.length > 0 ? UC_RATES.childFirst + Math.max(0, children.length - 1) * UC_RATES.childSubsequent : 0;
    const estimated = weeklyRate + childAmount;

    entitlements.push({
      benefit: 'Universal Credit',
      status: 'likely-eligible',
      estimatedWeeklyAmount: Math.round(estimated * 100) / 100,
      confidence: 0.75,
      reason: `Tenant in arrears and not currently claiming UC. Estimated entitlement based on household composition.`,
    });
  }

  // 2. Housing Element / Housing Benefit
  if (ucStatus === 'active' || ucStatus === 'managed-payment') {
    entitlements.push({
      benefit: 'UC Housing Element',
      status: 'currently-claiming',
      reason: 'Included in UC claim',
      confidence: 0.9,
    });
  } else if (tenant.rentBalance < 0) {
    entitlements.push({
      benefit: 'Housing Benefit / UC Housing Element',
      status: 'likely-eligible',
      estimatedWeeklyAmount: property?.weeklyRent ?? 150,
      confidence: 0.7,
      reason: 'Tenant in arrears — may be eligible for housing cost support up to Local Housing Allowance rate',
    });
  }

  // 3. PIP / Disability Benefits
  if (hasDisability) {
    const alreadyClaiming = vulnFlags.some(f => f.includes('pip') || f.includes('dla'));
    if (alreadyClaiming) {
      entitlements.push({
        benefit: 'Personal Independence Payment (PIP)',
        status: 'currently-claiming',
        reason: 'Disability flag indicates existing claim',
        confidence: 0.8,
      });
    } else {
      entitlements.push({
        benefit: 'Personal Independence Payment (PIP)',
        status: 'potentially-eligible',
        estimatedWeeklyAmount: PIP_RATES.dailyLivingStandard + PIP_RATES.mobilityStandard,
        confidence: 0.5,
        reason: 'Disability or health condition recorded — may qualify for PIP daily living and/or mobility components',
      });
    }
  }

  // 4. Attendance Allowance (65+)
  if (isElderly && hasDisability) {
    entitlements.push({
      benefit: 'Attendance Allowance',
      status: 'potentially-eligible',
      estimatedWeeklyAmount: OTHER_RATES.attendanceAllowance.lower,
      confidence: 0.5,
      reason: 'Tenant is 66+ with recorded health/disability needs — may qualify for Attendance Allowance',
    });
  }

  // 5. Carer's Allowance
  if (isCarer) {
    entitlements.push({
      benefit: "Carer's Allowance",
      status: 'potentially-eligible',
      estimatedWeeklyAmount: OTHER_RATES.carerAllowance,
      confidence: 0.6,
      reason: 'Carer flag recorded — if caring for someone 35+ hours/week, may be eligible',
    });
  }

  // 6. Pension Credit
  if (isElderly) {
    entitlements.push({
      benefit: 'Pension Credit',
      status: 'potentially-eligible',
      estimatedWeeklyAmount: OTHER_RATES.pensionCredit,
      confidence: 0.5,
      reason: 'Tenant is state pension age — may qualify for Pension Credit guarantee if income is below threshold',
    });
  }

  // 7. Council Tax Reduction
  if (tenant.rentBalance < 0 || ucStatus === 'transitioning' || ucStatus === 'pending') {
    entitlements.push({
      benefit: 'Council Tax Reduction',
      status: 'potentially-eligible',
      estimatedWeeklyAmount: 30,
      confidence: 0.6,
      reason: 'Low income indicators suggest eligibility for council tax reduction or single person discount',
    });
  }

  // 8. Free School Meals (if children)
  if (children.length > 0 && (ucStatus || tenant.rentBalance < -200)) {
    entitlements.push({
      benefit: 'Free School Meals',
      status: 'potentially-eligible',
      confidence: 0.6,
      reason: `${children.length} child(ren) in household — check entitlement based on UC/benefit status`,
    });
  }

  // 9. Winter Fuel Payment (elderly)
  if (isElderly) {
    entitlements.push({
      benefit: 'Winter Fuel Payment',
      status: 'likely-eligible',
      estimatedWeeklyAmount: Math.round(OTHER_RATES.winterFuelPayment / 52 * 100) / 100,
      confidence: 0.85,
      reason: 'Automatically eligible for Winter Fuel Payment based on age',
    });
  }

  // 10. Discretionary Housing Payment
  if (tenant.rentBalance < -500 && property) {
    entitlements.push({
      benefit: 'Discretionary Housing Payment (DHP)',
      status: 'potentially-eligible',
      confidence: 0.4,
      reason: 'Significant arrears detected — may qualify for short-term DHP from local authority',
    });
  }

  return entitlements;
}

// ── Main: Benefits Check ──
export async function checkBenefitsEntitlement(tenantId: string): Promise<BenefitsAssessment> {
  const tenant = await getDoc<TenantDoc>(collections.tenants, tenantId);
  if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

  const property = await getDoc<PropertyDoc>(collections.properties, tenant.propertyId);

  const entitlements = assessEntitlements(tenant, property);

  // Calculate unclaimed amounts
  const unclaimed = entitlements.filter(e => e.status === 'likely-eligible' || e.status === 'potentially-eligible');
  const estimatedWeekly = unclaimed.reduce((sum, e) => sum + (e.estimatedWeeklyAmount ?? 0), 0);

  // Current benefits
  const currentBenefits = entitlements
    .filter(e => e.status === 'currently-claiming')
    .map(e => e.benefit);

  // Recommended actions
  const actions: string[] = [];
  if (unclaimed.length > 0) {
    actions.push(`Review ${unclaimed.length} potential benefit entitlement(s) with tenant`);
  }
  const likelyEligible = entitlements.filter(e => e.status === 'likely-eligible');
  if (likelyEligible.length > 0) {
    actions.push(`Prioritise: ${likelyEligible.map(e => e.benefit).join(', ')}`);
  }
  if (estimatedWeekly > 50) {
    actions.push(`Refer to welfare rights adviser — estimated unclaimed benefits: £${estimatedWeekly.toFixed(2)}/week`);
  }
  if ((tenant.ucStatus || '').toLowerCase() === 'transitioning') {
    actions.push('Apply for Alternative Payment Arrangement (APA) to protect rent payments during UC transition');
  }
  if (actions.length === 0) {
    actions.push('No immediate action required — benefits appear to be maximised');
  }

  return {
    tenantId: tenant.id,
    tenantName: `${tenant.title} ${tenant.firstName} ${tenant.lastName}`,
    currentBenefits,
    entitlements,
    estimatedUnclaimedWeekly: Math.round(estimatedWeekly * 100) / 100,
    estimatedUnclaimedAnnual: Math.round(estimatedWeekly * 52 * 100) / 100,
    recommendedActions: actions,
    assessedAt: new Date().toISOString(),
  };
}
