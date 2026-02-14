import type { Complaint, AsbCase, DampMouldCase, FinancialCase } from '@/types';

// Generate 28 additional complaints (existing: 6, target: 34)
const complaintCategories = ['Repairs & Maintenance', 'Property Condition', 'Estate Services', 'Staff Conduct', 'Communication', 'Neighbour Issues', 'Anti-Social Behaviour', 'Service Charges'];
const complaintHandlers = ['Sarah Mitchell', 'James Okafor', 'David Mensah', 'Rachel Wright', 'Lisa Chen'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}
const rand = seededRandom(123);
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function genDate(daysAgo: number): string {
  const d = new Date(2026, 1, 7);
  d.setDate(d.getDate() - daysAgo);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
function addWorkingDays(dateStr: string, days: number): string {
  const parts = dateStr.split('/');
  const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  let added = 0;
  while (added < days) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) added++; }
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const complaintSubjects = [
  'Delay in completing repair', 'Poor quality of repair work', 'Failed to respond to enquiry',
  'Pest infestation not addressed', 'Communal area not cleaned', 'Heating system failure',
  'Water ingress from roof', 'Staff member was rude', 'Missed appointment',
  'Rent account error', 'Service charge query unresolved', 'ASB not being investigated',
  'Damp and mould not treated', 'Window replacement delayed', 'Garden maintenance issue',
  'Parking dispute unresolved', 'Lift out of service for weeks', 'Fire door not repaired',
  'Letterbox broken for months', 'Entry phone not working', 'Bin store overflowing',
  'Leak from flat above not fixed', 'Kitchen replacement delayed', 'Bathroom in poor condition',
  'Noise from building works', 'Scaffolding left too long', 'Insurance claim not processed',
  'Decant request ignored',
];

export const generatedComplaints: Complaint[] = [];
for (let i = 0; i < 28; i++) {
  const id = `cmp-gen-${String(i + 1).padStart(3, '0')}`;
  const refNum = 20 + i;
  const reference = `CMP-2026-${String(refNum).padStart(5, '0')}`;
  const daysAgo = Math.floor(rand() * 60) + 1;
  const createdDate = genDate(daysAgo);
  const stage = i < 22 ? 1 : 2; // 22 stage 1 + 6 existing = 28 stage 1, 6 stage 2
  const handler = pick(complaintHandlers);
  const propNum = Math.floor(rand() * 50) + 1;
  const tenNum = Math.floor(rand() * 45) + 1;
  const category = pick(complaintCategories);
  const subject = complaintSubjects[i] || pick(complaintSubjects);
  const ackDeadline = addWorkingDays(createdDate, 5);
  const respDeadline = addWorkingDays(createdDate, stage === 1 ? 10 : 20);
  const sRand = rand();
  const status = sRand < 0.3 ? 'open' : sRand < 0.55 ? 'investigation' : sRand < 0.7 ? 'response-due' : sRand < 0.85 ? 'closed' : 'open';
  const isAcked = status !== 'open' || rand() > 0.5;
  const escalationRisk = Math.floor(rand() * 80) + 10;

  generatedComplaints.push({
    id, reference, type: 'complaint', tenantId: `ten-${String(tenNum).padStart(3, '0')}`,
    propertyId: `prop-${String(propNum).padStart(3, '0')}`, subject,
    description: `Tenant has raised a Stage ${stage} complaint regarding ${subject.toLowerCase()}. ${category} category.`,
    status, priority: escalationRisk > 70 ? 'urgent' : 'routine', handler, createdDate,
    daysOpen: daysAgo, slaStatus: daysAgo > (stage === 1 ? 10 : 20) ? 'breached' : 'within',
    activities: [], tasks: [], stage, category, acknowledgeDeadline: ackDeadline,
    responseDeadline: respDeadline, ombudsmanEscalation: rand() < 0.1, escalationRisk,
    ...(isAcked ? { acknowledgedDate: genDate(daysAgo - 1) } : {}),
    ...(status === 'closed' ? { respondedDate: genDate(Math.floor(daysAgo / 2)), closedDate: genDate(Math.floor(daysAgo / 3)), finding: rand() > 0.5 ? 'upheld' : 'partially-upheld', compensation: Math.floor(rand() * 300) + 50, remedy: 'Repair completed and compensation offered.', learningActions: ['Review response timescales', 'Improve communication procedures'] } : {}),
  });
}

// Generate 8 additional ASB cases (existing: 4, target: 12)
const asbCategories = ['Noise', 'Criminal', 'Harassment', 'Environmental', 'Domestic Abuse', 'Vandalism', 'Drug Activity', 'Pet Nuisance'];
export const generatedAsbCases: AsbCase[] = [];
for (let i = 0; i < 8; i++) {
  const id = `asb-gen-${String(i + 1).padStart(3, '0')}`;
  const refNum = 10 + i;
  const reference = `ASB-2026-${String(refNum).padStart(5, '0')}`;
  const daysAgo = Math.floor(rand() * 90) + 5;
  const category = pick(asbCategories);
  const propNum = Math.floor(rand() * 50) + 1;
  const tenNum = Math.floor(rand() * 45) + 1;
  const severity = rand() < 0.3 ? 'cat-1' : rand() < 0.6 ? 'cat-2' : 'cat-3';
  generatedAsbCases.push({
    id, reference, type: 'asb', tenantId: `ten-${String(tenNum).padStart(3, '0')}`,
    propertyId: `prop-${String(propNum).padStart(3, '0')}`,
    subject: `${category} issue reported`, description: `Reported ${category.toLowerCase()} case. Under investigation.`,
    status: pick(['open', 'investigation', 'monitoring']), priority: severity === 'cat-1' ? 'urgent' : 'routine',
    handler: pick(complaintHandlers), createdDate: genDate(daysAgo), daysOpen: daysAgo,
    slaStatus: 'within', activities: [], tasks: [], category, severity: severity as any,
    escalationStage: pick(['abc', 'warning', 'cpw', 'injunction']) as any,
    evidenceCount: Math.floor(rand() * 20) + 1, multiAgencyPanel: rand() < 0.3,
    communityTrigger: false, legalActionProbability: Math.floor(rand() * 80),
  });
}

// Generate 3 additional damp cases (existing: 5, target: 8)
export const generatedDampCases: DampMouldCase[] = [];
for (let i = 0; i < 3; i++) {
  const id = `dam-gen-${String(i + 1).padStart(3, '0')}`;
  const refNum = 10 + i;
  const reference = `DAM-2026-${String(refNum).padStart(5, '0')}`;
  const daysAgo = Math.floor(rand() * 45) + 3;
  const createdDate = genDate(daysAgo);
  const hazard = i === 0 ? 'emergency' : 'significant';
  const propNum = Math.floor(rand() * 50) + 1;
  const tenNum = Math.floor(rand() * 45) + 1;
  generatedDampCases.push({
    id, reference, type: 'damp-mould', tenantId: `ten-${String(tenNum).padStart(3, '0')}`,
    propertyId: `prop-${String(propNum).padStart(3, '0')}`,
    subject: hazard === 'emergency' ? 'Emergency mould affecting health' : 'Significant damp - external wall',
    description: `${hazard === 'emergency' ? 'Severe' : 'Moderate'} damp/mould reported. Investigation underway.`,
    status: 'in-progress', priority: hazard === 'emergency' ? 'emergency' : 'urgent',
    handler: pick(complaintHandlers), createdDate, daysOpen: daysAgo, slaStatus: daysAgo > 10 ? 'breached' : 'within',
    activities: [], tasks: [], hazardClassification: hazard as any,
    dampRiskScore: Math.floor(rand() * 40) + 55,
    awaabsLawTimers: hazard === 'emergency'
      ? { category: 'emergency' as const, startDate: createdDate, emergencyDeadline: genDate(daysAgo - 1) }
      : { category: 'significant' as const, startDate: createdDate, investigateDeadline: addWorkingDays(createdDate, 10), summaryDeadline: addWorkingDays(createdDate, 13), safetyWorksDeadline: addWorkingDays(createdDate, 18), fullRepairDeadline: addWorkingDays(createdDate, 60) },
    environmentalData: { humidity: Math.floor(rand() * 20) + 65, temperature: Math.floor(rand() * 6) + 13, moisture: Math.floor(rand() * 25) + 60 },
    linkedRepairs: [],
  });
}

// Generate 22 additional financial cases (existing: 3, target: 25)
export const generatedFinancialCases: FinancialCase[] = [];
const arrearsReasons = ['UC transition', 'Employment change', 'Benefit sanction', 'Complex needs', 'Relationship breakdown', 'Overcrowding', 'UC claim pending', 'Temporary reduction'];
for (let i = 0; i < 22; i++) {
  const id = `fin-gen-${String(i + 1).padStart(3, '0')}`;
  const refNum = 30 + i;
  const reference = `FIN-2026-${String(refNum).padStart(5, '0')}`;
  const daysAgo = Math.floor(rand() * 120) + 5;
  const tenNum = Math.floor(rand() * 45) + 1;
  const propNum = Math.floor(rand() * 50) + 1;
  const arrearsAmount = Math.floor(rand() * 3000) + 200;
  const reason = pick(arrearsReasons);
  const escalation = rand() < 0.2 ? 'nosp' : rand() < 0.5 ? 'pre-action' : 'monitoring';
  generatedFinancialCases.push({
    id, reference, type: 'financial', tenantId: `ten-${String(tenNum).padStart(3, '0')}`,
    propertyId: `prop-${String(propNum).padStart(3, '0')}`,
    subject: `Arrears - ${reason}`, description: `Arrears case. Reason: ${reason}. Amount: £${arrearsAmount.toFixed(2)}.`,
    status: rand() < 0.3 ? 'escalated' : 'open', priority: arrearsAmount > 1500 ? 'urgent' : 'routine',
    handler: pick(complaintHandlers), createdDate: genDate(daysAgo), daysOpen: daysAgo,
    slaStatus: 'within', activities: [], tasks: [], arrearsAmount,
    arrearsReason: reason, escalationStage: escalation as any,
    paymentArrangement: { amount: Math.floor(rand() * 20) + 5, frequency: 'weekly', compliance: Math.floor(rand() * 60) + 40, startDate: genDate(Math.min(daysAgo, 30)) },
    preActionChecklist: { 'UC claim verified': rand() > 0.3, 'APA requested': rand() > 0.5, 'Affordability assessment': rand() > 0.4, 'Income maximisation referral': rand() > 0.3 },
  });
}
