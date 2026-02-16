// ============================================================
// SocialHomes.Ai — Predictive Damp Intelligence Service
// Differentiator 1: 5-factor weighted algorithm that predicts
// damp/mould risk before it manifests visibly.
// ============================================================

import { collections, getDocs, getDoc, serializeFirestoreData } from './firestore.js';
import { fetchWithCache } from './external-api.js';
import type { PropertyDoc, CaseDoc, EstateDoc, BlockDoc, TenantDoc } from '../models/firestore-schemas.js';

// ── Weights ──
const WEIGHTS = {
  weather: 0.25,
  building: 0.25,
  history: 0.20,
  sensor: 0.20,
  occupancy: 0.10,
};

// ── Risk Thresholds ──
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export function classifyRisk(score: number): RiskLevel {
  if (score <= 30) return 'low';
  if (score <= 50) return 'moderate';
  if (score <= 70) return 'high';
  return 'critical';
}

// ── Factor Interfaces ──
export interface DampFactor {
  name: string;
  weight: number;
  rawScore: number;      // 0–100
  weightedScore: number;  // rawScore * weight
  details: Record<string, unknown>;
}

export interface DampPrediction {
  propertyId: string;
  address: string;
  overallScore: number;
  riskLevel: RiskLevel;
  factors: DampFactor[];
  recommendations: string[];
  isAwaabsLaw: boolean;
  predictedAt: string;
}

// ── Weather Factor ──
async function calculateWeatherFactor(lat: number, lng: number): Promise<DampFactor> {
  let humidity = 80;
  let precipitation = 8;
  let temperature = 7;

  try {
    const result = await fetchWithCache(
      'open-meteo',
      `${lat},${lng}`,
      3600,
      async () => {
        const resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
          `&daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean` +
          `&timezone=Europe/London&forecast_days=7`,
        );
        if (!resp.ok) throw new Error(`open-meteo returned ${resp.status}`);
        const json = await resp.json() as Record<string, any>;
        return { data: json as Record<string, unknown>, httpStatus: 200 };
      },
      { daily: { relative_humidity_2m_mean: [80], precipitation_sum: [8], temperature_2m_mean: [7] } },
    );
    const daily = (result.data as any).daily;
    if (daily) {
      const humArr = daily.relative_humidity_2m_mean ?? [];
      const precArr = daily.precipitation_sum ?? [];
      const tempArr = daily.temperature_2m_mean ?? [];
      humidity = humArr.length > 0 ? humArr.reduce((a: number, b: number) => a + b, 0) / humArr.length : 80;
      precipitation = precArr.length > 0 ? precArr.reduce((a: number, b: number) => a + b, 0) / precArr.length : 8;
      temperature = tempArr.length > 0 ? tempArr.reduce((a: number, b: number) => a + b, 0) / tempArr.length : 7;
    }
  } catch { /* use defaults */ }

  // Score: high humidity + high precipitation + low temp = higher risk
  const humidityScore = Math.min(100, Math.max(0, (humidity - 60) * 2.5)); // 60%=0, 100%=100
  const precipScore = Math.min(100, precipitation * 5); // 20mm/day = 100
  const tempScore = Math.min(100, Math.max(0, (15 - temperature) * 10)); // <5°C=100, >15°C=0
  const rawScore = Math.round(humidityScore * 0.5 + precipScore * 0.3 + tempScore * 0.2);

  return {
    name: 'Weather',
    weight: WEIGHTS.weather,
    rawScore,
    weightedScore: Math.round(rawScore * WEIGHTS.weather * 100) / 100,
    details: { humidity, precipitation, temperature, humidityScore, precipScore, tempScore },
  };
}

// ── Building Fabric Factor ──
function calculateBuildingFactor(property: PropertyDoc, block?: BlockDoc | null): DampFactor {
  let rawScore = 30; // Default moderate

  const epc = property.epc || {};
  const sapScore = epc.sapScore ?? epc.sap_score ?? 65;

  // Poor EPC = higher damp risk
  const epcScore = Math.max(0, Math.min(100, 100 - sapScore));

  // Wall type risk
  let wallScore = 40;
  const wallDesc = String(epc.wallsDesc || epc.walls_description || '').toLowerCase();
  if (wallDesc.includes('solid') || wallDesc.includes('no insulation')) wallScore = 80;
  else if (wallDesc.includes('cavity') && wallDesc.includes('no insulation')) wallScore = 65;
  else if (wallDesc.includes('insulated')) wallScore = 20;

  // Roof risk
  let roofScore = 30;
  const roofDesc = String(epc.roofDesc || epc.roof_description || '').toLowerCase();
  if (roofDesc.includes('no insulation')) roofScore = 80;
  else if (roofDesc.includes('limited')) roofScore = 55;
  else if (roofDesc.includes('insulated') || roofDesc.includes('200mm')) roofScore = 15;

  // Heating type
  let heatingScore = 30;
  const heating = (property.heatingType || '').toLowerCase();
  if (heating.includes('none') || heating === '') heatingScore = 90;
  else if (heating.includes('electric') || heating.includes('storage')) heatingScore = 55;
  else if (heating.includes('gas') || heating.includes('central')) heatingScore = 20;

  // Construction era
  let eraScore = 40;
  const constructionYear = block?.constructionYear ?? 1970;
  if (constructionYear < 1945) eraScore = 75;
  else if (constructionYear < 1970) eraScore = 60;
  else if (constructionYear < 1990) eraScore = 40;
  else eraScore = 20;

  rawScore = Math.round(epcScore * 0.3 + wallScore * 0.25 + roofScore * 0.15 + heatingScore * 0.15 + eraScore * 0.15);

  return {
    name: 'Building Fabric',
    weight: WEIGHTS.building,
    rawScore,
    weightedScore: Math.round(rawScore * WEIGHTS.building * 100) / 100,
    details: { sapScore, epcScore, wallScore, roofScore, heatingScore, eraScore, constructionYear },
  };
}

// ── History Factor ──
function calculateHistoryFactor(propertyCases: CaseDoc[]): DampFactor {
  const dampCases = propertyCases.filter(c => c.type === 'damp-mould');
  const allRepairs = propertyCases.filter(c => c.type === 'repair');
  const dampRelatedRepairs = allRepairs.filter(c => {
    const desc = ((c.description || '') + ' ' + (c.sorDescription || '')).toLowerCase();
    return desc.includes('damp') || desc.includes('mould') || desc.includes('mold') || desc.includes('condensation') || desc.includes('leak');
  });

  const totalDampIncidents = dampCases.length + dampRelatedRepairs.length;
  const openDamp = dampCases.filter(c => c.status !== 'closed');
  const hasAwaabs = dampCases.some(c => c.isAwaabsLaw);

  // More incidents = higher risk, recency matters
  let rawScore = Math.min(100, totalDampIncidents * 20);
  if (openDamp.length > 0) rawScore = Math.min(100, rawScore + 25);
  if (hasAwaabs) rawScore = Math.min(100, rawScore + 15);

  // Check recurrence
  const recentDamp = dampCases.filter(c => {
    const created = new Date(c.createdDate);
    return created > new Date(Date.now() - 365 * 24 * 3600 * 1000);
  });
  if (recentDamp.length >= 2) rawScore = Math.min(100, rawScore + 15);

  return {
    name: 'Repair History',
    weight: WEIGHTS.history,
    rawScore,
    weightedScore: Math.round(rawScore * WEIGHTS.history * 100) / 100,
    details: {
      totalDampIncidents,
      openDampCases: openDamp.length,
      dampRelatedRepairs: dampRelatedRepairs.length,
      hasAwaabsLawCase: hasAwaabs,
      recentDampCount: recentDamp.length,
    },
  };
}

// ── Sensor Factor (simulated — IoT not yet connected) ──
function calculateSensorFactor(property: PropertyDoc): DampFactor {
  // Simulated IoT sensor data based on property characteristics
  const dampRisk = property.dampRisk ?? 30;

  // Generate plausible sensor readings based on known damp risk
  const internalHumidity = 45 + (dampRisk / 100) * 35; // 45-80%
  const wallMoisture = 5 + (dampRisk / 100) * 20;       // 5-25%
  const dewPointDelta = 8 - (dampRisk / 100) * 7;       // 1-8°C gap
  const ventilationRate = 0.8 - (dampRisk / 100) * 0.5;  // 0.3-0.8 ACH

  // High humidity + high moisture + small dew gap + low ventilation = risk
  const humScore = Math.min(100, Math.max(0, (internalHumidity - 50) * 3.3));
  const moistScore = Math.min(100, Math.max(0, (wallMoisture - 5) * 5));
  const dewScore = Math.min(100, Math.max(0, (5 - dewPointDelta) * 25));
  const ventScore = Math.min(100, Math.max(0, (0.7 - ventilationRate) * 250));

  const rawScore = Math.round(humScore * 0.35 + moistScore * 0.30 + dewScore * 0.20 + ventScore * 0.15);

  return {
    name: 'Environmental Sensors',
    weight: WEIGHTS.sensor,
    rawScore,
    weightedScore: Math.round(rawScore * WEIGHTS.sensor * 100) / 100,
    details: {
      source: 'simulated',
      internalHumidity: Math.round(internalHumidity * 10) / 10,
      wallMoisturePercent: Math.round(wallMoisture * 10) / 10,
      dewPointDelta: Math.round(dewPointDelta * 10) / 10,
      ventilationRateACH: Math.round(ventilationRate * 100) / 100,
    },
  };
}

// ── Occupancy Factor ──
function calculateOccupancyFactor(property: PropertyDoc, tenant?: TenantDoc | null): DampFactor {
  let rawScore = 30;

  if (!tenant) {
    // Void property — still at risk from disuse
    return {
      name: 'Occupancy',
      weight: WEIGHTS.occupancy,
      rawScore: property.isVoid ? 45 : 30,
      weightedScore: Math.round((property.isVoid ? 45 : 30) * WEIGHTS.occupancy * 100) / 100,
      details: { isVoid: property.isVoid, householdSize: 0 },
    };
  }

  const household = tenant.household ?? [];
  const bedrooms = property.bedrooms || 1;
  const householdSize = household.length + 1; // tenant + household members
  const occupancyRatio = householdSize / Math.max(1, bedrooms);

  // Overcrowding increases moisture generation
  let overcrowdScore = 0;
  if (occupancyRatio > 2) overcrowdScore = 80;
  else if (occupancyRatio > 1.5) overcrowdScore = 50;
  else if (occupancyRatio > 1) overcrowdScore = 25;

  // Vulnerability flags may indicate inability to heat/ventilate
  const vulnFlags = tenant.vulnerabilityFlags ?? [];
  const hasRelevantVuln = vulnFlags.some((v: any) => {
    const flag = (v.flag || v.type || v.name || '').toLowerCase();
    return flag.includes('health') || flag.includes('disability') || flag.includes('elderly') || flag.includes('fuel poverty');
  });
  const vulnScore = hasRelevantVuln ? 40 : 0;

  // Arrears may indicate fuel poverty (can't afford heating)
  const arrearsScore = tenant.rentBalance < -500 ? 50 : tenant.rentBalance < 0 ? 25 : 0;

  rawScore = Math.round(overcrowdScore * 0.4 + vulnScore * 0.35 + arrearsScore * 0.25);

  return {
    name: 'Occupancy',
    weight: WEIGHTS.occupancy,
    rawScore,
    weightedScore: Math.round(rawScore * WEIGHTS.occupancy * 100) / 100,
    details: { householdSize, bedrooms, occupancyRatio, hasRelevantVuln, arrearsScore },
  };
}

// ── Recommendations Engine ──
function generateRecommendations(factors: DampFactor[], riskLevel: RiskLevel): string[] {
  const recs: string[] = [];

  const weather = factors.find(f => f.name === 'Weather');
  const building = factors.find(f => f.name === 'Building Fabric');
  const history = factors.find(f => f.name === 'Repair History');
  const sensor = factors.find(f => f.name === 'Environmental Sensors');
  const occupancy = factors.find(f => f.name === 'Occupancy');

  if (riskLevel === 'critical') {
    recs.push('URGENT: Arrange immediate property inspection under Awaab\'s Law timescales');
    recs.push('Commission specialist damp survey within 14 days');
  }

  if (building && building.rawScore > 60) {
    if ((building.details.wallScore as number) > 60)
      recs.push('Consider external or cavity wall insulation to reduce thermal bridging');
    if ((building.details.heatingScore as number) > 50)
      recs.push('Upgrade heating system — current system may not adequately prevent condensation');
    if ((building.details.roofScore as number) > 50)
      recs.push('Inspect roof insulation and repair any defects to reduce cold surfaces');
  }

  if (sensor && sensor.rawScore > 50) {
    if ((sensor.details.ventilationRateACH as number) < 0.5)
      recs.push('Install or upgrade mechanical ventilation (MVHR) to improve air exchange');
    if ((sensor.details.internalHumidity as number) > 65)
      recs.push('Provide tenant with dehumidifier and moisture management guidance');
  }

  if (history && (history.details.recentDampCount as number) >= 2) {
    recs.push('Recurring damp pattern detected — investigate root cause, not just symptoms');
  }

  if (occupancy && (occupancy.details.occupancyRatio as number) > 1.5) {
    recs.push('Property may be overcrowded — assess household needs and consider transfer');
  }

  if (weather && weather.rawScore > 60) {
    recs.push('Current weather conditions are high-risk — proactively contact tenant about ventilation');
  }

  if (recs.length === 0) {
    recs.push('Continue routine monitoring — no immediate action required');
  }

  return recs;
}

// ── Main Prediction Function ──
export async function predictDampRisk(propertyId: string): Promise<DampPrediction> {
  const property = await getDoc<PropertyDoc>(collections.properties, propertyId);
  if (!property) throw new Error(`Property ${propertyId} not found`);

  // Load related data in parallel
  const [block, propertyCases, tenant] = await Promise.all([
    property.blockId ? getDoc<BlockDoc>(collections.blocks, property.blockId) : null,
    getDocs<CaseDoc>(collections.cases, [{ field: 'propertyId', op: '==', value: propertyId }]),
    property.currentTenancyId
      ? getDoc<TenantDoc>(collections.tenants, property.currentTenancyId)
      : null,
  ]);

  // Calculate all factors
  const [weatherFactor, buildingFactor, historyFactor, sensorFactor, occupancyFactor] = await Promise.all([
    calculateWeatherFactor(property.lat, property.lng),
    Promise.resolve(calculateBuildingFactor(property, block)),
    Promise.resolve(calculateHistoryFactor(propertyCases)),
    Promise.resolve(calculateSensorFactor(property)),
    Promise.resolve(calculateOccupancyFactor(property, tenant)),
  ]);

  const factors = [weatherFactor, buildingFactor, historyFactor, sensorFactor, occupancyFactor];
  const overallScore = Math.round(factors.reduce((sum, f) => sum + f.weightedScore, 0));
  const riskLevel = classifyRisk(overallScore);
  const recommendations = generateRecommendations(factors, riskLevel);

  // Check Awaab's Law relevance
  const hasAwaabs = propertyCases.some(c => c.type === 'damp-mould' && c.isAwaabsLaw);

  return {
    propertyId: property.id,
    address: property.address,
    overallScore,
    riskLevel,
    factors,
    recommendations,
    isAwaabsLaw: hasAwaabs || riskLevel === 'critical',
    predictedAt: new Date().toISOString(),
  };
}

// ── Estate-Level Prediction ──
export async function predictEstateDampRisk(estateId: string): Promise<{
  estateId: string;
  estateName: string;
  averageScore: number;
  riskLevel: RiskLevel;
  properties: { propertyId: string; address: string; score: number; riskLevel: RiskLevel }[];
  highRiskCount: number;
  criticalCount: number;
  predictedAt: string;
}> {
  const estate = await getDoc<EstateDoc>(collections.estates, estateId);
  if (!estate) throw new Error(`Estate ${estateId} not found`);

  const estateProperties = await getDocs<PropertyDoc>(collections.properties, [
    { field: 'estateId', op: '==', value: estateId },
  ]);

  const predictions = await Promise.all(
    estateProperties.map(async (p) => {
      try {
        const pred = await predictDampRisk(p.id);
        return { propertyId: p.id, address: p.address, score: pred.overallScore, riskLevel: pred.riskLevel };
      } catch {
        return { propertyId: p.id, address: p.address, score: p.dampRisk ?? 30, riskLevel: classifyRisk(p.dampRisk ?? 30) };
      }
    }),
  );

  const avgScore = predictions.length > 0
    ? Math.round(predictions.reduce((s, p) => s + p.score, 0) / predictions.length)
    : 0;

  return {
    estateId: estate.id,
    estateName: estate.name,
    averageScore: avgScore,
    riskLevel: classifyRisk(avgScore),
    properties: predictions.sort((a, b) => b.score - a.score),
    highRiskCount: predictions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length,
    criticalCount: predictions.filter(p => p.riskLevel === 'critical').length,
    predictedAt: new Date().toISOString(),
  };
}
