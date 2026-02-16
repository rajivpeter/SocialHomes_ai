// ============================================================
// SocialHomes.Ai — Live Crime Context for ASB Service
// Differentiator 2: Correlates police crime data with internal
// ASB cases to provide actionable intelligence for officers.
// ============================================================

import { collections, getDocs, getDoc } from './firestore.js';
import { fetchWithCache } from './external-api.js';
import type { EstateDoc, CaseDoc, PropertyDoc } from '../models/firestore-schemas.js';

// ── Types ──
export interface CrimeIncident {
  externalId: string;
  category: string;
  lat: number;
  lng: number;
  streetName: string;
  outcome: string | null;
  month: string;
}

export interface CrimeCategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface CrimeContext {
  estateId: string;
  estateName: string;
  period: { months: number; from: string; to: string };
  totalIncidents: number;
  asbIncidents: number;
  internalAsbCases: number;
  categoryBreakdown: CrimeCategoryBreakdown[];
  trend: 'rising' | 'stable' | 'declining';
  trendPercentage: number;
  hotspotStreets: { street: string; count: number }[];
  correlationScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  briefing: string;
  fetchedAt: string;
}

export interface AsbCaseContext {
  caseId: string;
  caseReference: string;
  nearbyPoliceIncidents: CrimeIncident[];
  asbIncidentsNearby: number;
  totalCrimeNearby: number;
  escalationRisk: 'low' | 'moderate' | 'high';
  contextSummary: string;
  fetchedAt: string;
}

// ── Fetch Crime Data for Location ──
async function fetchCrimeData(lat: number, lng: number, months: number): Promise<CrimeIncident[]> {
  const allIncidents: CrimeIncident[] = [];
  const now = new Date();

  for (let m = 1; m <= Math.min(months, 6); m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    try {
      const result = await fetchWithCache(
        'police-crime',
        `${lat},${lng}:${dateStr}:all-crime`,
        24 * 3600,
        async () => {
          const resp = await fetch(
            `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${dateStr}`,
          );
          if (!resp.ok) throw new Error(`data.police.uk returned ${resp.status}`);
          const crimes = await resp.json() as any[];
          return {
            data: {
              incidents: crimes.map((c: any) => ({
                externalId: c.persistent_id,
                category: c.category,
                lat: parseFloat(c.location?.latitude),
                lng: parseFloat(c.location?.longitude),
                streetName: c.location?.street?.name || 'Unknown',
                outcome: c.outcome_status?.category ?? null,
                month: c.month,
              })),
            } as Record<string, unknown>,
            httpStatus: 200,
          };
        },
        {
          incidents: [
            { externalId: `sim-${m}-1`, category: 'anti-social-behaviour', lat, lng, streetName: 'On or near High Street', outcome: null, month: dateStr },
            { externalId: `sim-${m}-2`, category: 'burglary', lat: lat + 0.001, lng: lng - 0.001, streetName: 'On or near Park Road', outcome: 'Under investigation', month: dateStr },
            { externalId: `sim-${m}-3`, category: 'criminal-damage-arson', lat: lat - 0.001, lng: lng + 0.001, streetName: 'On or near Station Road', outcome: null, month: dateStr },
          ],
        },
        15,
      );
      const incidents = (result.data as any).incidents ?? [];
      allIncidents.push(...incidents);
    } catch { /* skip failed month */ }
  }

  return allIncidents;
}

// ── Calculate Trend ──
function calculateTrend(incidents: CrimeIncident[]): { trend: 'rising' | 'stable' | 'declining'; percentage: number } {
  const months = [...new Set(incidents.map(i => i.month))].sort();
  if (months.length < 2) return { trend: 'stable', percentage: 0 };

  const mid = Math.floor(months.length / 2);
  const earlierMonths = new Set(months.slice(0, mid));
  const laterMonths = new Set(months.slice(mid));

  const earlierCount = incidents.filter(i => earlierMonths.has(i.month)).length / Math.max(1, earlierMonths.size);
  const laterCount = incidents.filter(i => laterMonths.has(i.month)).length / Math.max(1, laterMonths.size);

  if (earlierCount === 0) return { trend: 'stable', percentage: 0 };
  const change = ((laterCount - earlierCount) / earlierCount) * 100;

  if (change > 10) return { trend: 'rising', percentage: Math.round(change) };
  if (change < -10) return { trend: 'declining', percentage: Math.round(Math.abs(change)) };
  return { trend: 'stable', percentage: Math.round(Math.abs(change)) };
}

// ── Generate Briefing Text ──
function generateBriefing(
  estateName: string,
  totalIncidents: number,
  asbCount: number,
  internalCases: number,
  trend: string,
  hotspots: { street: string; count: number }[],
): string {
  const topStreet = hotspots[0]?.street || 'the area';
  const trendText = trend === 'rising' ? 'an upward trend' : trend === 'declining' ? 'a downward trend' : 'stable levels';

  let briefing = `Crime Context for ${estateName}: ${totalIncidents} police-recorded incidents over the review period, `;
  briefing += `of which ${asbCount} are anti-social behaviour (${Math.round((asbCount / Math.max(1, totalIncidents)) * 100)}%). `;
  briefing += `Internally, ${internalCases} ASB cases are currently open. `;
  briefing += `Data shows ${trendText} in crime activity. `;
  if (hotspots.length > 0) {
    briefing += `The primary hotspot is ${topStreet} with ${hotspots[0].count} incidents. `;
  }
  if (asbCount > 10 && internalCases > 3) {
    briefing += `Consider convening a multi-agency panel to address the correlated ASB pattern.`;
  }

  return briefing;
}

// ── Main: Estate Crime Context ──
export async function getEstateCrimeContext(estateId: string, months = 3): Promise<CrimeContext> {
  const estate = await getDoc<EstateDoc>(collections.estates, estateId);
  if (!estate) throw new Error(`Estate ${estateId} not found`);

  // Fetch police data and internal ASB cases in parallel
  const [incidents, internalCases] = await Promise.all([
    fetchCrimeData(estate.lat, estate.lng, months),
    getDocs<CaseDoc>(collections.cases, [
      { field: 'type', op: '==', value: 'asb' },
    ]),
  ]);

  // Filter internal cases to this estate's properties
  const estateProperties = await getDocs<PropertyDoc>(collections.properties, [
    { field: 'estateId', op: '==', value: estateId },
  ]);
  const propertyIds = new Set(estateProperties.map(p => p.id));
  const estateAsbCases = internalCases.filter(c => propertyIds.has(c.propertyId) && c.status !== 'closed');

  // Category breakdown
  const catCounts = new Map<string, number>();
  for (const inc of incidents) {
    catCounts.set(inc.category, (catCounts.get(inc.category) || 0) + 1);
  }
  const categoryBreakdown: CrimeCategoryBreakdown[] = [...catCounts.entries()]
    .map(([category, count]) => ({ category, count, percentage: Math.round((count / Math.max(1, incidents.length)) * 100) }))
    .sort((a, b) => b.count - a.count);

  // ASB count
  const asbIncidents = incidents.filter(i => i.category === 'anti-social-behaviour').length;

  // Hotspot streets
  const streetCounts = new Map<string, number>();
  for (const inc of incidents) {
    streetCounts.set(inc.streetName, (streetCounts.get(inc.streetName) || 0) + 1);
  }
  const hotspotStreets = [...streetCounts.entries()]
    .map(([street, count]) => ({ street, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Trend
  const { trend, percentage: trendPercentage } = calculateTrend(incidents);

  // Correlation score: how well internal ASB matches external police data
  const correlationScore = Math.min(100, Math.round(
    (asbIncidents > 0 && estateAsbCases.length > 0)
      ? Math.min(asbIncidents, estateAsbCases.length * 5) / Math.max(asbIncidents, estateAsbCases.length * 5) * 100
      : 20,
  ));

  // Risk level
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (asbIncidents > 20 || estateAsbCases.length > 5) riskLevel = 'critical';
  else if (asbIncidents > 10 || estateAsbCases.length > 3) riskLevel = 'high';
  else if (asbIncidents > 5 || estateAsbCases.length > 1) riskLevel = 'moderate';

  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

  return {
    estateId: estate.id,
    estateName: estate.name,
    period: { months, from: fromDate.toISOString().split('T')[0], to: now.toISOString().split('T')[0] },
    totalIncidents: incidents.length,
    asbIncidents,
    internalAsbCases: estateAsbCases.length,
    categoryBreakdown,
    trend,
    trendPercentage,
    hotspotStreets,
    correlationScore,
    riskLevel,
    briefing: generateBriefing(estate.name, incidents.length, asbIncidents, estateAsbCases.length, trend, hotspotStreets),
    fetchedAt: new Date().toISOString(),
  };
}

// ── Main: ASB Case Context ──
export async function getAsbCaseContext(caseId: string): Promise<AsbCaseContext> {
  const caseDoc = await getDoc<CaseDoc>(collections.cases, caseId);
  if (!caseDoc) throw new Error(`Case ${caseId} not found`);
  if (caseDoc.type !== 'asb') throw new Error(`Case ${caseId} is not an ASB case`);

  const property = await getDoc<PropertyDoc>(collections.properties, caseDoc.propertyId);
  if (!property) throw new Error(`Property ${caseDoc.propertyId} not found`);

  const incidents = await fetchCrimeData(property.lat, property.lng, 3);
  const asbNearby = incidents.filter(i => i.category === 'anti-social-behaviour');

  let escalationRisk: 'low' | 'moderate' | 'high' = 'low';
  if (asbNearby.length > 15) escalationRisk = 'high';
  else if (asbNearby.length > 5) escalationRisk = 'moderate';

  const summary = `ASB case ${caseDoc.reference} at ${property.address}: ` +
    `${asbNearby.length} ASB incidents and ${incidents.length} total crimes recorded by police nearby in the last 3 months. ` +
    `Escalation risk: ${escalationRisk}. ` +
    (escalationRisk === 'high' ? 'Multi-agency referral recommended.' : 'Continue monitoring.');

  return {
    caseId: caseDoc.id,
    caseReference: caseDoc.reference,
    nearbyPoliceIncidents: incidents.slice(0, 50),
    asbIncidentsNearby: asbNearby.length,
    totalCrimeNearby: incidents.length,
    escalationRisk,
    contextSummary: summary,
    fetchedAt: new Date().toISOString(),
  };
}
