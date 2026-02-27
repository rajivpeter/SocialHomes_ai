// ============================================================
// SocialHomes.Ai — AI-Powered Repair Intake Service
// Task 5.2.14: Free-text analysis, SOR code suggestion,
// priority assignment, trade identification, Awaab's Law flag
// ============================================================

import { collections, getDocs } from './firestore.js';
import type { CaseDoc, PropertyDoc } from '../models/firestore-schemas.js';

// ---- Types ----

export interface RepairIntakeResult {
  suggestedSorCode: string;
  suggestedSorDescription: string;
  suggestedPriority: 'emergency' | 'urgent' | 'routine' | 'planned';
  suggestedTrade: string;
  isAwaabsLaw: boolean;
  awaabsLawCategory?: string;
  asbestosRisk: boolean;
  recurringPattern: boolean;
  recurringDetails?: string;
  estimatedCost: { min: number; max: number };
  confidence: number;
  reasoning: string;
  additionalFlags: string[];
}

// ---- SOR Code Database (Schedule of Rates) ----

interface SorEntry {
  code: string;
  description: string;
  trade: string;
  keywords: string[];
  avgCostMin: number;
  avgCostMax: number;
  defaultPriority: 'emergency' | 'urgent' | 'routine' | 'planned';
}

const SOR_DATABASE: SorEntry[] = [
  // Plumbing
  { code: 'PL001', description: 'Burst pipe — make safe and repair', trade: 'Plumber', keywords: ['burst', 'pipe', 'flooding', 'water leak', 'leak'], avgCostMin: 80, avgCostMax: 250, defaultPriority: 'emergency' },
  { code: 'PL002', description: 'Toilet repair or replacement', trade: 'Plumber', keywords: ['toilet', 'cistern', 'flush', 'wc', 'lavatory'], avgCostMin: 50, avgCostMax: 200, defaultPriority: 'urgent' },
  { code: 'PL003', description: 'Tap repair or replacement', trade: 'Plumber', keywords: ['tap', 'dripping', 'faucet', 'washer'], avgCostMin: 30, avgCostMax: 100, defaultPriority: 'routine' },
  { code: 'PL004', description: 'Blocked drain clearance', trade: 'Plumber', keywords: ['drain', 'blocked', 'clogged', 'slow drain', 'overflow'], avgCostMin: 60, avgCostMax: 180, defaultPriority: 'urgent' },
  { code: 'PL005', description: 'Shower repair or replacement', trade: 'Plumber', keywords: ['shower', 'mixer', 'shower head'], avgCostMin: 50, avgCostMax: 300, defaultPriority: 'routine' },

  // Heating
  { code: 'HT001', description: 'Total loss of heating — emergency repair', trade: 'Gas Engineer', keywords: ['no heating', 'boiler broken', 'no hot water', 'boiler fault'], avgCostMin: 100, avgCostMax: 400, defaultPriority: 'emergency' },
  { code: 'HT002', description: 'Boiler service and repair', trade: 'Gas Engineer', keywords: ['boiler', 'service', 'thermostat', 'pilot', 'ignition'], avgCostMin: 80, avgCostMax: 300, defaultPriority: 'urgent' },
  { code: 'HT003', description: 'Radiator repair or replacement', trade: 'Gas Engineer', keywords: ['radiator', 'cold radiator', 'leaking radiator', 'bleeding'], avgCostMin: 40, avgCostMax: 200, defaultPriority: 'routine' },
  { code: 'HT004', description: 'Gas smell investigation', trade: 'Gas Engineer', keywords: ['gas smell', 'gas leak', 'smell gas'], avgCostMin: 0, avgCostMax: 0, defaultPriority: 'emergency' },

  // Electrical
  { code: 'EL001', description: 'Total loss of power — emergency', trade: 'Electrician', keywords: ['no power', 'no electricity', 'power cut', 'tripping'], avgCostMin: 80, avgCostMax: 250, defaultPriority: 'emergency' },
  { code: 'EL002', description: 'Socket or switch repair', trade: 'Electrician', keywords: ['socket', 'switch', 'plug', 'outlet', 'light switch'], avgCostMin: 30, avgCostMax: 100, defaultPriority: 'routine' },
  { code: 'EL003', description: 'Lighting repair or replacement', trade: 'Electrician', keywords: ['light', 'bulb', 'fitting', 'fluorescent', 'strip light'], avgCostMin: 20, avgCostMax: 80, defaultPriority: 'routine' },
  { code: 'EL004', description: 'Smoke/CO alarm repair', trade: 'Electrician', keywords: ['smoke alarm', 'smoke detector', 'carbon monoxide', 'co alarm', 'beeping'], avgCostMin: 20, avgCostMax: 60, defaultPriority: 'urgent' },

  // Carpentry
  { code: 'CA001', description: 'Door repair or replacement', trade: 'Carpenter', keywords: ['door', 'lock', 'handle', 'hinge', 'broken door'], avgCostMin: 40, avgCostMax: 200, defaultPriority: 'routine' },
  { code: 'CA002', description: 'Window repair (non-security)', trade: 'Carpenter', keywords: ['window', 'glass', 'broken window', 'draught'], avgCostMin: 60, avgCostMax: 250, defaultPriority: 'routine' },
  { code: 'CA003', description: 'Window boarding — security', trade: 'Carpenter', keywords: ['broken window security', 'boarding', 'insecure'], avgCostMin: 50, avgCostMax: 120, defaultPriority: 'emergency' },
  { code: 'CA004', description: 'Kitchen unit repair', trade: 'Carpenter', keywords: ['kitchen', 'cupboard', 'drawer', 'worktop', 'unit'], avgCostMin: 30, avgCostMax: 150, defaultPriority: 'routine' },
  { code: 'CA005', description: 'Floor repair', trade: 'Carpenter', keywords: ['floor', 'floorboard', 'vinyl', 'laminate', 'tile', 'loose floor'], avgCostMin: 40, avgCostMax: 200, defaultPriority: 'routine' },

  // Damp & Mould
  { code: 'DM001', description: 'Damp and mould investigation', trade: 'Damp Specialist', keywords: ['damp', 'mould', 'mold', 'condensation', 'mushrooms', 'black spots'], avgCostMin: 0, avgCostMax: 150, defaultPriority: 'urgent' },
  { code: 'DM002', description: 'Damp treatment and repair', trade: 'Damp Specialist', keywords: ['rising damp', 'penetrating damp', 'damp course', 'tanking'], avgCostMin: 200, avgCostMax: 2000, defaultPriority: 'urgent' },
  { code: 'DM003', description: 'Mould removal and prevention', trade: 'Damp Specialist', keywords: ['mould removal', 'anti-mould', 'black mould', 'mould treatment'], avgCostMin: 100, avgCostMax: 500, defaultPriority: 'urgent' },
  { code: 'DM004', description: 'Ventilation improvement', trade: 'General', keywords: ['ventilation', 'extractor', 'fan', 'airflow', 'humidity'], avgCostMin: 50, avgCostMax: 300, defaultPriority: 'routine' },

  // Roofing
  { code: 'RF001', description: 'Roof leak repair', trade: 'Roofer', keywords: ['roof leak', 'water coming in', 'ceiling leak', 'leak from above'], avgCostMin: 100, avgCostMax: 500, defaultPriority: 'urgent' },
  { code: 'RF002', description: 'Gutter repair or clearance', trade: 'Roofer', keywords: ['gutter', 'downpipe', 'overflowing', 'blocked gutter'], avgCostMin: 40, avgCostMax: 150, defaultPriority: 'routine' },

  // General
  { code: 'GN001', description: 'Pest control treatment', trade: 'Pest Control', keywords: ['mice', 'rats', 'cockroach', 'bed bugs', 'ants', 'pest', 'infestation'], avgCostMin: 80, avgCostMax: 200, defaultPriority: 'urgent' },
  { code: 'GN002', description: 'Communal area repair', trade: 'General', keywords: ['communal', 'hallway', 'stairwell', 'common area', 'entrance'], avgCostMin: 50, avgCostMax: 300, defaultPriority: 'routine' },
];

// ---- Analysis Engine ----

export function analyseRepairDescription(description: string, propertyId?: string): RepairIntakeResult {
  const desc = description.toLowerCase();
  const words = desc.split(/\s+/);

  // Score each SOR code against the description
  const scores: { entry: SorEntry; score: number }[] = [];

  for (const entry of SOR_DATABASE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (desc.includes(keyword)) {
        score += keyword.split(' ').length * 10; // Multi-word matches score higher
      }
    }
    if (score > 0) {
      scores.push({ entry, score });
    }
  }

  // Sort by score (best match first)
  scores.sort((a, b) => b.score - a.score);

  const bestMatch = scores[0]?.entry;
  const confidence = scores.length > 0 ? Math.min(0.95, scores[0].score / 30) : 0.3;

  // Check for Awaab's Law trigger (damp/mould keywords)
  const dampKeywords = ['damp', 'mould', 'mold', 'condensation', 'mushroom', 'black spots', 'fungus', 'wet wall'];
  const isAwaabsLaw = dampKeywords.some(kw => desc.includes(kw));
  const awaabsLawCategory = isAwaabsLaw
    ? (desc.includes('emergency') || desc.includes('severe') || desc.includes('child') ? 'category-1' : 'category-2')
    : undefined;

  // Check for asbestos risk (properties built before 2000)
  const asbestosKeywords = ['asbestos', 'artex', 'textured ceiling', 'insulation board', 'pipe lagging'];
  const asbestosRisk = asbestosKeywords.some(kw => desc.includes(kw));

  // Check priority override
  let priority = bestMatch?.defaultPriority || 'routine';
  const emergencyKeywords = ['flood', 'gas leak', 'no heating winter', 'no hot water', 'dangerous', 'unsafe', 'fire', 'electrocution', 'exposed wires'];
  if (emergencyKeywords.some(kw => desc.includes(kw))) {
    priority = 'emergency';
  }

  // Check for vulnerable tenant keywords
  const vulnerableKeywords = ['elderly', 'disabled', 'child', 'baby', 'pregnant', 'wheelchair'];
  const hasVulnerableOccupant = vulnerableKeywords.some(kw => desc.includes(kw));
  if (hasVulnerableOccupant && priority === 'routine') {
    priority = 'urgent';
  }

  // Additional flags
  const additionalFlags: string[] = [];
  if (hasVulnerableOccupant) additionalFlags.push('Vulnerable occupant mentioned');
  if (asbestosRisk) additionalFlags.push('Potential asbestos risk — do not disturb materials');
  if (isAwaabsLaw) additionalFlags.push('Awaab\'s Law applies — strict timelines');
  if (desc.includes('recurring') || desc.includes('again') || desc.includes('third time') || desc.includes('keeps happening')) {
    additionalFlags.push('Tenant reports recurring issue');
  }
  if (desc.includes('communal') || desc.includes('shared') || desc.includes('hallway')) {
    additionalFlags.push('Communal area — may affect multiple households');
  }

  // Build reasoning
  const reasoning = bestMatch
    ? `Matched SOR code ${bestMatch.code} (${bestMatch.description}) with ${(confidence * 100).toFixed(0)}% confidence based on keyword analysis. Trade: ${bestMatch.trade}. ${isAwaabsLaw ? 'Awaab\'s Law timelines apply.' : ''}`
    : `Unable to match specific SOR code. Description may require manual classification. Defaulting to general repair code.`;

  return {
    suggestedSorCode: bestMatch?.code || 'GN999',
    suggestedSorDescription: bestMatch?.description || 'General repair — requires classification',
    suggestedPriority: priority as RepairIntakeResult['suggestedPriority'],
    suggestedTrade: bestMatch?.trade || 'General',
    isAwaabsLaw,
    awaabsLawCategory,
    asbestosRisk,
    recurringPattern: desc.includes('recurring') || desc.includes('again') || desc.includes('keeps'),
    recurringDetails: undefined,
    estimatedCost: {
      min: bestMatch?.avgCostMin || 50,
      max: bestMatch?.avgCostMax || 200,
    },
    confidence,
    reasoning,
    additionalFlags,
  };
}

/**
 * Check if a property has recurring repair patterns.
 */
export async function checkRecurringPatterns(
  propertyId: string,
  suggestedSorCode: string,
): Promise<{ isRecurring: boolean; previousCases: number; details: string }> {
  const cases = await getDocs<CaseDoc>(collections.cases, [
    { field: 'propertyId', op: '==', value: propertyId },
    { field: 'type', op: '==', value: 'repair' },
  ]);

  const sixMonths = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const recentSimilar = cases.filter(c =>
    c.sorCode === suggestedSorCode &&
    new Date(c.createdDate) > sixMonths,
  );

  if (recentSimilar.length >= 2) {
    return {
      isRecurring: true,
      previousCases: recentSimilar.length,
      details: `${recentSimilar.length} similar repairs (SOR: ${suggestedSorCode}) in the last 6 months. Consider root cause investigation.`,
    };
  }

  // Also check by trade (broader match)
  const tradeMatch = SOR_DATABASE.find(s => s.code === suggestedSorCode)?.trade;
  if (tradeMatch) {
    const tradeCases = cases.filter(c =>
      c.trade === tradeMatch &&
      new Date(c.createdDate) > sixMonths,
    );

    if (tradeCases.length >= 3) {
      return {
        isRecurring: true,
        previousCases: tradeCases.length,
        details: `${tradeCases.length} ${tradeMatch} repairs in 6 months. Investigate underlying property issue.`,
      };
    }
  }

  return { isRecurring: false, previousCases: 0, details: '' };
}
