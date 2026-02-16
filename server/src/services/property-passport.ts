// ============================================================
// SocialHomes.Ai — Property Passport Service
// Differentiator 5: Aggregates ALL data per property from
// internal and external sources into a unified dossier.
// ============================================================

import { collections, getDoc, getDocs, serializeFirestoreData } from './firestore.js';
import { fetchWithCache } from './external-api.js';
import { predictDampRisk, type DampPrediction } from './damp-prediction.js';
import type { PropertyDoc, TenantDoc, CaseDoc, BlockDoc, EstateDoc } from '../models/firestore-schemas.js';

// ── Types ──
export interface PropertyPassport {
  property: {
    id: string;
    uprn: string;
    address: string;
    postcode: string;
    type: string;
    bedrooms: number;
    floorArea: number;
    heatingType: string;
    tenureType: string;
    isVoid: boolean;
    weeklyRent: number;
    serviceCharge: number;
    lat: number;
    lng: number;
  };
  block: {
    id: string;
    name: string;
    constructionYear: number;
    constructionType: string;
    storeys: number;
    totalUnits: number;
    higherRisk: boolean;
  } | null;
  estate: {
    id: string;
    name: string;
    postcode: string;
    schemeType: string;
    managingOfficer: string;
  } | null;
  tenant: {
    id: string;
    name: string;
    tenancyType: string;
    tenancyStartDate: string;
    tenancyStatus: string;
    householdSize: number;
    vulnerabilityFlags: string[];
    assignedOfficer: string;
  } | null;
  compliance: {
    overall: string;
    gasSafety: Record<string, any> | null;
    eicr: Record<string, any> | null;
    asbestos: Record<string, any> | null;
    smokeAlarms: Record<string, any> | null;
    coAlarms: Record<string, any> | null;
    boiler: Record<string, any> | null;
  };
  epc: {
    rating: string;
    sapScore: number;
    wallsDescription: string;
    roofDescription: string;
    windowsDescription: string;
    heatingDescription: string;
  };
  dampIntelligence: DampPrediction | null;
  caseHistory: {
    totalCases: number;
    openCases: number;
    repairs: { total: number; open: number; emergency: number };
    complaints: { total: number; open: number };
    dampMould: { total: number; open: number; awaabsLaw: number };
    asb: { total: number; open: number };
    financial: { total: number; open: number };
  };
  externalData: {
    weather: Record<string, unknown> | null;
    crime: Record<string, unknown> | null;
    flood: Record<string, unknown> | null;
    imd: Record<string, unknown> | null;
  };
  financials: {
    weeklyRent: number;
    serviceCharge: number;
    currentBalance: number;
    arrearsWeeks: number;
    arrearsRisk: number;
  };
  generatedAt: string;
}

// ── Main: Generate Property Passport ──
export async function generatePropertyPassport(propertyId: string): Promise<PropertyPassport> {
  const property = await getDoc<PropertyDoc>(collections.properties, propertyId);
  if (!property) throw new Error(`Property ${propertyId} not found`);

  // Load all related data in parallel
  const [block, estate, tenant, propertyCases, dampPrediction] = await Promise.all([
    property.blockId ? getDoc<BlockDoc>(collections.blocks, property.blockId) : null,
    property.estateId ? getDoc<EstateDoc>(collections.estates, property.estateId) : null,
    property.currentTenancyId
      ? getDoc<TenantDoc>(collections.tenants, property.currentTenancyId)
      : null,
    getDocs<CaseDoc>(collections.cases, [{ field: 'propertyId', op: '==', value: propertyId }]),
    predictDampRisk(propertyId).catch(() => null),
  ]);

  // External data (best-effort, parallel)
  const [weatherData, crimeData, floodData, imdData] = await Promise.all([
    fetchExternalSafe('weather', property.lat, property.lng),
    fetchExternalSafe('crime', property.lat, property.lng),
    fetchExternalSafe('flood', property.lat, property.lng),
    fetchExternalSafe('imd', property.postcode),
  ]);

  // Compile case history
  const repairs = propertyCases.filter(c => c.type === 'repair');
  const complaints = propertyCases.filter(c => c.type === 'complaint');
  const dampCases = propertyCases.filter(c => c.type === 'damp-mould');
  const asbCases = propertyCases.filter(c => c.type === 'asb');
  const financialCases = propertyCases.filter(c => c.type === 'financial');

  const epc = property.epc || {};

  return {
    property: {
      id: property.id,
      uprn: property.uprn,
      address: property.address,
      postcode: property.postcode,
      type: property.type,
      bedrooms: property.bedrooms,
      floorArea: property.floorArea,
      heatingType: property.heatingType,
      tenureType: property.tenureType,
      isVoid: property.isVoid,
      weeklyRent: property.weeklyRent,
      serviceCharge: property.serviceCharge,
      lat: property.lat,
      lng: property.lng,
    },
    block: block ? {
      id: block.id,
      name: block.name,
      constructionYear: block.constructionYear,
      constructionType: block.constructionType,
      storeys: block.storeys,
      totalUnits: block.totalUnits,
      higherRisk: block.higherRisk,
    } : null,
    estate: estate ? {
      id: estate.id,
      name: estate.name,
      postcode: estate.postcode,
      schemeType: estate.schemeType,
      managingOfficer: estate.managingOfficer,
    } : null,
    tenant: tenant ? {
      id: tenant.id,
      name: `${tenant.title} ${tenant.firstName} ${tenant.lastName}`,
      tenancyType: tenant.tenancyType,
      tenancyStartDate: tenant.tenancyStartDate,
      tenancyStatus: tenant.tenancyStatus,
      householdSize: (tenant.household ?? []).length + 1,
      vulnerabilityFlags: (tenant.vulnerabilityFlags ?? []).map((v: any) => v.flag || v.type || v.name || ''),
      assignedOfficer: tenant.assignedOfficer,
    } : null,
    compliance: {
      overall: Object.values(property.compliance || {}).every(v => v === 'compliant' || v === 'valid')
        ? 'compliant'
        : 'non-compliant',
      gasSafety: property.gasSafety || null,
      eicr: property.eicr || null,
      asbestos: property.asbestos || null,
      smokeAlarms: property.smokeAlarms || null,
      coAlarms: property.coAlarms || null,
      boiler: property.boiler || null,
    },
    epc: {
      rating: epc.rating || epc.currentEnergyRating || 'N/A',
      sapScore: epc.sapScore ?? epc.sap_score ?? 0,
      wallsDescription: epc.wallsDesc || epc.walls_description || 'N/A',
      roofDescription: epc.roofDesc || epc.roof_description || 'N/A',
      windowsDescription: epc.windowsDesc || epc.windows_description || 'N/A',
      heatingDescription: epc.heatingDesc || epc.heating_description || property.heatingType || 'N/A',
    },
    dampIntelligence: dampPrediction,
    caseHistory: {
      totalCases: propertyCases.length,
      openCases: propertyCases.filter(c => c.status !== 'closed' && c.status !== 'completed' && c.status !== 'cancelled').length,
      repairs: {
        total: repairs.length,
        open: repairs.filter(c => c.status !== 'completed' && c.status !== 'cancelled').length,
        emergency: repairs.filter(c => c.priority === 'emergency').length,
      },
      complaints: {
        total: complaints.length,
        open: complaints.filter(c => c.status !== 'closed').length,
      },
      dampMould: {
        total: dampCases.length,
        open: dampCases.filter(c => c.status !== 'closed').length,
        awaabsLaw: dampCases.filter(c => c.isAwaabsLaw).length,
      },
      asb: {
        total: asbCases.length,
        open: asbCases.filter(c => c.status !== 'closed').length,
      },
      financial: {
        total: financialCases.length,
        open: financialCases.filter(c => c.status !== 'closed').length,
      },
    },
    externalData: {
      weather: weatherData,
      crime: crimeData,
      flood: floodData,
      imd: imdData,
    },
    financials: {
      weeklyRent: property.weeklyRent,
      serviceCharge: property.serviceCharge,
      currentBalance: tenant?.rentBalance ?? 0,
      arrearsWeeks: tenant && tenant.rentBalance < 0
        ? Math.round(Math.abs(tenant.rentBalance) / Math.max(1, tenant.weeklyCharge ?? property.weeklyRent) * 10) / 10
        : 0,
      arrearsRisk: tenant?.arrearsRisk ?? 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

// ── Safe External Data Fetch ──
async function fetchExternalSafe(
  type: 'weather' | 'crime' | 'flood' | 'imd',
  latOrPostcode: number | string,
  lng?: number,
): Promise<Record<string, unknown> | null> {
  try {
    switch (type) {
      case 'weather': {
        const resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latOrPostcode}&longitude=${lng}` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean` +
          `&timezone=Europe/London&forecast_days=3`,
        );
        if (!resp.ok) return null;
        return await resp.json() as Record<string, unknown>;
      }
      case 'crime': {
        const resp = await fetch(
          `https://data.police.uk/api/crimes-street/all-crime?lat=${latOrPostcode}&lng=${lng}`,
        );
        if (!resp.ok) return null;
        const crimes = await resp.json() as any[];
        return { totalIncidents: crimes.length, asbCount: crimes.filter((c: any) => c.category === 'anti-social-behaviour').length };
      }
      case 'flood': {
        const resp = await fetch(
          `https://environment.data.gov.uk/flood-monitoring/id/floods?lat=${latOrPostcode}&long=${lng}&dist=5`,
        );
        if (!resp.ok) return null;
        const json = await resp.json() as { items?: any[] };
        return { activeWarnings: (json.items ?? []).length };
      }
      case 'imd': {
        // Get LSOA from postcode first
        const geoResp = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(String(latOrPostcode))}`);
        if (!geoResp.ok) return null;
        const geoJson = await geoResp.json() as { result?: { codes?: { lsoa?: string } } };
        const lsoaCode = geoJson.result?.codes?.lsoa;
        if (!lsoaCode) return null;

        const url = `https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/IMD_2019/FeatureServer/0/query` +
          `?where=lsoa11cd='${encodeURIComponent(lsoaCode)}'&outFields=*&f=json`;
        const imdResp = await fetch(url);
        if (!imdResp.ok) return null;
        const imdJson = await imdResp.json() as any;
        const attrs = imdJson.features?.[0]?.attributes;
        return attrs ? { imdDecile: attrs.IMDDecile, imdScore: attrs.IMDScore } : null;
      }
    }
  } catch {
    return null;
  }
}
