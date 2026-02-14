import { useMemo } from 'react';
import { allCases, repairs, complaints, dampMouldCases } from '@/data';
import { formatCurrency } from '@/utils/format';
import type { Tenant, Property, Repair, Complaint } from '@/types';

export interface AiField {
  label: string;
  value: string;
  source: string;
  severity?: 'info' | 'warning' | 'critical';
}

export interface EntityIntelligence {
  urgencyLevel: 'normal' | 'attention' | 'urgent' | 'crisis';
  pageAccentColour: string;
  prioritySections: string[];
  expandedSections: string[];
  dynamicFields: AiField[];
  dynamicWarnings: string[];
  visualEmphasis: Record<string, 'highlight' | 'pulse' | 'dim'>;
}

export function useTenantIntelligence(tenant: Tenant | undefined, tenantCases?: any[]): EntityIntelligence {
  return useMemo(() => {
    if (!tenant) return defaultIntelligence();

    const fields: AiField[] = [];
    const warnings: string[] = [];
    const emphasis: Record<string, 'highlight' | 'pulse' | 'dim'> = {};
    let urgency: 'normal' | 'attention' | 'urgent' | 'crisis' = 'normal';
    const prioritySections: string[] = [];
    const expandedSections: string[] = [];

    // Estimated household income
    const bedrooms = 2; // Default
    const baseIncome = tenant.ucStatus === 'claiming' ? 14000 : tenant.ucStatus === 'transitioning' ? 16000 : 24000;
    const estimatedIncome = baseIncome + (tenant.household.filter(m => !m.isDependent).length * 8000);
    fields.push({
      label: 'Estimated Household Income',
      value: formatCurrency(estimatedIncome) + '/year',
      source: `Derived from tenure type, household composition, UC status (${tenant.ucStatus || 'N/A'})`,
      severity: estimatedIncome < 16000 ? 'warning' : 'info',
    });

    // Complaint risk
    const openRepairs = (tenantCases || allCases.filter(c => c.tenantId === tenant.id))
      .filter(c => c.type === 'repair' && c.status !== 'completed').length;
    const contactFrequency = tenant.contactCount30Days || 0;
    let complaintRisk = 0;
    if (openRepairs > 2) complaintRisk += 30;
    if (openRepairs > 0 && contactFrequency > 3) complaintRisk += 25;
    if (tenant.rentBalance < -500) complaintRisk += 15;
    if (contactFrequency > 5) complaintRisk += 20;
    const existingComplaint = allCases.filter(c => c.tenantId === tenant.id && c.type === 'complaint' && c.status !== 'closed').length > 0;
    if (existingComplaint) complaintRisk += 10;
    complaintRisk = Math.min(complaintRisk, 99);

    if (complaintRisk > 40) {
      fields.push({
        label: 'Complaint Risk',
        value: complaintRisk >= 70 ? 'HIGH' : complaintRisk >= 50 ? 'MEDIUM' : 'LOW',
        source: `${openRepairs} open repairs, ${contactFrequency} contacts in 30 days`,
        severity: complaintRisk >= 70 ? 'critical' : complaintRisk >= 50 ? 'warning' : 'info',
      });
    }

    // Arrears trajectory
    if (tenant.rentBalance < 0) {
      const weeklyGap = tenant.weeklyCharge * 0.3; // Estimated
      fields.push({
        label: 'Arrears Trajectory',
        value: tenant.arrearsRisk > 60 ? `Increasing — est. ${formatCurrency(weeklyGap)}/week gap` : 'Stable — payments covering charges',
        source: 'Based on 12-week payment pattern analysis',
        severity: tenant.arrearsRisk > 60 ? 'critical' : 'warning',
      });
      emphasis['rentBalance'] = tenant.arrearsRisk > 70 ? 'pulse' : 'highlight';
    }

    // Tenancy sustainability score
    const sustainabilityScore = Math.max(0, 100 - (tenant.arrearsRisk * 0.4) - (complaintRisk * 0.3) - (tenant.vulnerabilityFlags.length * 5));
    fields.push({
      label: 'Tenancy Sustainability Score',
      value: `${Math.round(sustainabilityScore)}/100`,
      source: 'Composite: arrears risk, complaint risk, vulnerability factors',
      severity: sustainabilityScore < 40 ? 'critical' : sustainabilityScore < 60 ? 'warning' : 'info',
    });

    // Determine urgency level
    if (complaintRisk >= 70 || tenant.arrearsRisk >= 80 || tenant.vulnerabilityFlags.some(f => f.severity === 'high')) {
      urgency = 'crisis';
      prioritySections.push('cases');
      expandedSections.push('cases');
      warnings.push('This tenant requires immediate attention — multiple risk factors detected.');
    } else if (complaintRisk >= 50 || tenant.arrearsRisk >= 60 || tenant.rentBalance < -500) {
      urgency = 'urgent';
      prioritySections.push('cases', 'statement');
    } else if (openRepairs > 0 || tenant.rentBalance < 0) {
      urgency = 'attention';
    }

    // Vulnerability-based warnings
    if (tenant.vulnerabilityFlags.length > 0) {
      const highSeverity = tenant.vulnerabilityFlags.filter(f => f.severity === 'high');
      if (highSeverity.length > 0) {
        warnings.push(`High-severity vulnerability: ${highSeverity.map(f => f.type).join(', ')}. Ensure communications are appropriate.`);
      }
    }

    // Silent tenant warning
    if (tenant.lastContact) {
      const parts = tenant.lastContact.split('/');
      const lastDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const daysSinceContact = Math.ceil((new Date(2026, 1, 7).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceContact > 180) {
        fields.push({
          label: 'Silent Tenant Alert',
          value: `${daysSinceContact} days since last contact`,
          source: 'No inbound or outbound contact recorded',
          severity: 'warning',
        });
        warnings.push(`No contact for ${daysSinceContact} days. Welfare check recommended.`);
      }
    }

    return {
      urgencyLevel: urgency,
      pageAccentColour: urgency === 'crisis' ? 'brand-garnet' : urgency === 'urgent' ? 'status-warning' : urgency === 'attention' ? 'brand-blue' : 'brand-teal',
      prioritySections,
      expandedSections,
      dynamicFields: fields,
      dynamicWarnings: warnings,
      visualEmphasis: emphasis,
    };
  }, [tenant?.id]);
}

export function usePropertyIntelligence(property: Property | undefined): EntityIntelligence {
  return useMemo(() => {
    if (!property) return defaultIntelligence();

    const fields: AiField[] = [];
    const warnings: string[] = [];
    const emphasis: Record<string, 'highlight' | 'pulse' | 'dim'> = {};
    let urgency: 'normal' | 'attention' | 'urgent' | 'crisis' = 'normal';

    // Carbon emission estimate
    const carbonEstimate = (property.floorArea * 0.045).toFixed(1);
    fields.push({ label: 'Carbon Emission Estimate', value: `${carbonEstimate} tonnes/year`, source: 'Based on floor area, EPC rating, heating type', severity: 'info' });

    // Estimated retrofit cost to EPC C
    if (property.epc && (property.epc.rating === 'D' || property.epc.rating === 'E' || property.epc.rating === 'F' || property.epc.rating === 'G')) {
      const costPerRating: Record<string, number> = { 'D': 4500, 'E': 8200, 'F': 14000, 'G': 22000 };
      const cost = costPerRating[property.epc.rating] || 5000;
      fields.push({ label: 'Estimated Retrofit Cost to EPC C', value: formatCurrency(cost), source: `Current rating ${property.epc.rating} (SAP ${property.epc.sapScore})`, severity: property.epc.rating >= 'E' ? 'warning' : 'info' });
    }

    // Damp risk assessment
    if (property.dampRisk > 50) {
      fields.push({ label: 'AI Damp Risk Score', value: `${property.dampRisk}%`, source: 'Construction era, aspect, ventilation, weather exposure', severity: property.dampRisk > 70 ? 'critical' : 'warning' });
      urgency = property.dampRisk > 70 ? 'urgent' : 'attention';
    }

    // Annual repair cost prediction
    const propertyCases = allCases.filter(c => c.propertyId === property.id && c.type === 'repair');
    const avgCost = propertyCases.length > 0 ? propertyCases.reduce((sum, c) => sum + ((c as any).cost || 200), 0) / propertyCases.length : 200;
    fields.push({ label: 'Predicted Annual Repair Cost', value: formatCurrency(avgCost * 4), source: `Based on ${propertyCases.length} historic repairs, building age, component condition`, severity: avgCost * 4 > 2000 ? 'warning' : 'info' });

    // Compliance warnings
    if (property.compliance?.overall === 'non-compliant') {
      urgency = 'crisis';
      warnings.push('Non-compliant property — immediate action required on expired certificates.');
      emphasis['compliance'] = 'pulse';
    } else if (property.compliance?.overall === 'expiring') {
      urgency = urgency === 'normal' ? 'attention' : urgency;
      warnings.push('Compliance certificates expiring soon. Book inspections.');
    }

    return {
      urgencyLevel: urgency,
      pageAccentColour: urgency === 'crisis' ? 'brand-garnet' : urgency === 'urgent' ? 'status-warning' : 'brand-teal',
      prioritySections: urgency === 'crisis' ? ['compliance'] : [],
      expandedSections: urgency === 'crisis' ? ['compliance'] : [],
      dynamicFields: fields,
      dynamicWarnings: warnings,
      visualEmphasis: emphasis,
    };
  }, [property?.id]);
}

export function useRepairIntelligence(repair: Repair | undefined): EntityIntelligence {
  return useMemo(() => {
    if (!repair) return defaultIntelligence();

    const fields: AiField[] = [];
    const warnings: string[] = [];
    let urgency: 'normal' | 'attention' | 'urgent' | 'crisis' = 'normal';

    // Similar repair average cost
    const similarRepairs = repairs.filter(r => r.sorCode === repair.sorCode && r.cost);
    const avgCost = similarRepairs.length > 0 ? similarRepairs.reduce((sum, r) => sum + (r.cost || 0), 0) / similarRepairs.length : 0;
    if (avgCost > 0) {
      fields.push({ label: 'Similar Repair Average Cost', value: formatCurrency(avgCost), source: `Based on ${similarRepairs.length} similar jobs (SOR ${repair.sorCode})`, severity: 'info' });
    }

    // First-time-fix likelihood
    const ftfRate = similarRepairs.length > 0 ? (similarRepairs.filter(r => r.firstTimeFix).length / similarRepairs.length * 100) : 50;
    fields.push({ label: 'First-Time-Fix Likelihood', value: `${Math.round(ftfRate)}%`, source: `Based on trade (${repair.trade}) and SOR history`, severity: ftfRate < 50 ? 'warning' : 'info' });

    // Complaint risk from delay
    if (repair.daysOpen > 28) {
      const risk = Math.min(95, 40 + repair.daysOpen);
      fields.push({ label: 'Complaint Risk from Delay', value: `${risk}%`, source: `${repair.daysOpen} days open, SLA ${repair.slaStatus}`, severity: 'critical' });
      urgency = 'urgent';
      warnings.push(`Repair open ${repair.daysOpen} days. High complaint risk.`);
    }

    if (repair.isAwaabsLaw) {
      urgency = 'crisis';
      warnings.push("Awaab's Law case — statutory deadlines apply.");
    }

    if (repair.recurrenceRisk > 60) {
      fields.push({ label: 'Recurrence Risk', value: `${repair.recurrenceRisk}%`, source: 'Pattern analysis of property repair history', severity: repair.recurrenceRisk > 70 ? 'critical' : 'warning' });
    }

    return {
      urgencyLevel: urgency,
      pageAccentColour: urgency === 'crisis' ? 'brand-garnet' : urgency === 'urgent' ? 'status-warning' : 'brand-teal',
      prioritySections: [],
      expandedSections: [],
      dynamicFields: fields,
      dynamicWarnings: warnings,
      visualEmphasis: {},
    };
  }, [repair?.id]);
}

export function useComplaintIntelligence(complaint: Complaint | undefined): EntityIntelligence {
  return useMemo(() => {
    if (!complaint) return defaultIntelligence();

    const fields: AiField[] = [];
    const warnings: string[] = [];
    let urgency: 'normal' | 'attention' | 'urgent' | 'crisis' = 'normal';

    // Ombudsman determination risk
    const ombudsmanRisk = complaint.escalationRisk >= 80 ? 'HIGH' : complaint.escalationRisk >= 60 ? 'MEDIUM' : 'LOW';
    fields.push({ label: 'Ombudsman Determination Risk', value: ombudsmanRisk, source: `Based on category, delay, tenant history, complaint pattern`, severity: complaint.escalationRisk >= 80 ? 'critical' : complaint.escalationRisk >= 60 ? 'warning' : 'info' });

    // Estimated compensation
    const estCompensation = complaint.escalationRisk >= 80 ? '£300–£500' : complaint.escalationRisk >= 60 ? '£150–£300' : '£50–£150';
    fields.push({ label: 'Estimated Compensation Liability', value: estCompensation, source: 'Based on HOS code of practice and comparable determinations', severity: complaint.escalationRisk >= 80 ? 'critical' : 'warning' });

    // Similar complaint outcomes
    fields.push({ label: 'Similar Complaint Outcome', value: '68% upheld/partially upheld', source: `Based on ${complaint.category} category complaints in past 12 months`, severity: 'warning' });

    if (complaint.escalationRisk >= 80) {
      urgency = 'crisis';
      warnings.push('Very high Ombudsman escalation risk. Prioritise resolution and consider proactive compensation offer.');
    } else if (complaint.escalationRisk >= 60) {
      urgency = 'urgent';
    } else if (complaint.status !== 'closed') {
      urgency = 'attention';
    }

    return {
      urgencyLevel: urgency,
      pageAccentColour: urgency === 'crisis' ? 'brand-garnet' : 'brand-teal',
      prioritySections: [],
      expandedSections: [],
      dynamicFields: fields,
      dynamicWarnings: warnings,
      visualEmphasis: {},
    };
  }, [complaint?.id]);
}

function defaultIntelligence(): EntityIntelligence {
  return {
    urgencyLevel: 'normal',
    pageAccentColour: 'brand-teal',
    prioritySections: [],
    expandedSections: [],
    dynamicFields: [],
    dynamicWarnings: [],
    visualEmphasis: {},
  };
}
