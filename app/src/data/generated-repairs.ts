import type { Repair } from '@/types';

// Generate 185 additional repairs to reach 200 total
const sorCodes = [
  { code: '520105', desc: 'Repair/renew radiator valve', trade: 'Plumbing' },
  { code: '520201', desc: 'Repair/renew tap/washer', trade: 'Plumbing' },
  { code: '520301', desc: 'Repair/renew WC mechanism', trade: 'Plumbing' },
  { code: '520401', desc: 'Clear blocked drain', trade: 'Plumbing' },
  { code: '430101', desc: 'Repair/ease/adjust door', trade: 'Carpentry' },
  { code: '430201', desc: 'Repair/renew window furniture', trade: 'Carpentry' },
  { code: '430301', desc: 'Repair/renew handrail/balustrade', trade: 'Carpentry' },
  { code: '430401', desc: 'Repair/renew kitchen unit', trade: 'Carpentry' },
  { code: '620401', desc: 'Repair door entry system', trade: 'Electrical' },
  { code: '620101', desc: 'Repair/renew light fitting', trade: 'Electrical' },
  { code: '620201', desc: 'Repair/renew socket outlet', trade: 'Electrical' },
  { code: '350101', desc: 'Repair/renew extractor fan', trade: 'Electrical' },
  { code: '530101', desc: 'Repair/service boiler', trade: 'Gas' },
  { code: '530201', desc: 'Repair/renew diverter valve', trade: 'Gas' },
  { code: '530301', desc: 'Repair/renew thermostat', trade: 'Gas' },
  { code: '400101', desc: 'Clear/repair guttering', trade: 'Roofing' },
  { code: '400201', desc: 'Repair roof tiles', trade: 'Roofing' },
  { code: '360101', desc: 'Investigate damp/condensation', trade: 'Specialist' },
  { code: '360901', desc: 'Treat/remove mould growth', trade: 'Specialist' },
  { code: '710101', desc: 'Repair/make good plaster', trade: 'General' },
  { code: '710201', desc: 'Redecorate after repair', trade: 'Painting' },
];

const subjects: Record<string, string[]> = {
  Plumbing: ['Leaking pipe under kitchen sink', 'Toilet not flushing properly', 'Bath tap dripping', 'Low water pressure throughout', 'Shower mixer valve faulty', 'Overflow running', 'Blocked waste pipe', 'Radiator not heating'],
  Electrical: ['Light switch not working', 'Power socket loose', 'Smoke alarm beeping', 'Extractor fan noisy', 'Door entry buzzer fault', 'No power to bedroom', 'Dimmer switch faulty', 'Outside light broken'],
  Carpentry: ['Kitchen cupboard door fallen off', 'Bedroom door not closing', 'Window handle broken', 'Skirting board loose', 'Banister wobbly', 'Floorboard creaking', 'Loft hatch stuck', 'Wardrobe door off track'],
  Gas: ['Boiler not firing', 'No hot water', 'Radiators cold', 'Boiler making banging noise', 'Thermostat not responding', 'Gas smell reported', 'Pilot light going out', 'Central heating timer fault'],
  Roofing: ['Roof tile missing', 'Guttering overflowing', 'Downpipe broken', 'Flat roof leaking', 'Ridge tile loose', 'Fascia board rotten', 'Valley gutter blocked'],
  Specialist: ['Damp patch on wall', 'Mould in bathroom', 'Rising damp ground floor', 'Condensation on windows', 'Penetrating damp chimney'],
  General: ['Plaster cracking on ceiling', 'Wall needs replastering', 'Path uneven outside', 'Fence panel blown down', 'Garage door stuck'],
  Painting: ['Decorating after leak repair', 'Redecorate hallway', 'Touch up external paintwork'],
};

const operatives = ['Mark Stevens', 'Dave Wilson', 'Tony Brown', 'Gary Palmer', 'Lee Johnson', 'Chris Thomas', 'Andy Roberts'];
const handlers = ['Sarah Mitchell', 'James Okafor', 'David Mensah', 'Rachel Wright', 'Lisa Chen'];
const statuses: Array<'open' | 'in-progress' | 'awaiting-parts' | 'completed'> = ['open', 'in-progress', 'awaiting-parts', 'completed'];
const priorities: Array<'emergency' | 'urgent' | 'routine' | 'planned'> = ['emergency', 'urgent', 'routine', 'planned'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

const rand = seededRandom(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function generateDate(daysAgo: number): string {
  const d = new Date(2026, 1, 7);
  d.setDate(d.getDate() - daysAgo);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export const generatedRepairs: Repair[] = [];

for (let i = 0; i < 185; i++) {
  const id = `rep-gen-${String(i + 1).padStart(3, '0')}`;
  const refNum = 200 + i;
  const reference = `REP-2026-${String(refNum).padStart(5, '0')}`;
  
  // Priority distribution: 5% emergency, 15% urgent, 70% routine, 10% planned
  const pRand = rand();
  const priority = pRand < 0.05 ? 'emergency' : pRand < 0.20 ? 'urgent' : pRand < 0.90 ? 'routine' : 'planned';
  
  const sor = pick(sorCodes);
  const trade = sor.trade;
  const subjectList = subjects[trade] || subjects['General'];
  const subject = pick(subjectList);
  
  const propNum = Math.floor(rand() * 50) + 1;
  const tenNum = Math.floor(rand() * 45) + 1;
  const propertyId = `prop-${String(propNum).padStart(3, '0')}`;
  const tenantId = `ten-${String(tenNum).padStart(3, '0')}`;
  
  const daysAgo = Math.floor(rand() * 90);
  const createdDate = generateDate(daysAgo);
  
  // Status - older repairs more likely completed
  const sRand = rand();
  const status = daysAgo > 60 ? (sRand < 0.7 ? 'completed' : pick(statuses)) :
                 daysAgo > 30 ? (sRand < 0.4 ? 'completed' : sRand < 0.7 ? 'in-progress' : pick(statuses)) :
                 sRand < 0.1 ? 'completed' : sRand < 0.4 ? 'in-progress' : sRand < 0.6 ? 'open' : pick(statuses);
  
  const daysOpen = status === 'completed' ? Math.floor(rand() * daysAgo) + 1 : daysAgo;
  const targetDaysFromCreation = priority === 'emergency' ? 1 : priority === 'urgent' ? 5 : priority === 'routine' ? 28 : 90;
  const targetDate = generateDate(Math.max(0, daysAgo - targetDaysFromCreation));
  
  const slaStatus = status === 'completed' ? 'within' :
    daysOpen > targetDaysFromCreation ? 'breached' :
    daysOpen > targetDaysFromCreation * 0.8 ? 'approaching' : 'within';
  
  const handler = pick(handlers);
  const operative = status === 'open' ? undefined : pick(operatives);
  const cost = Math.floor(rand() * 800) + 40;
  const recurrenceRisk = Math.floor(rand() * 100);
  const firstTimeFix = rand() > 0.22;
  const satisfaction = status === 'completed' ? Math.floor(rand() * 3) + 3 : undefined;
  
  generatedRepairs.push({
    id,
    reference,
    type: 'repair',
    tenantId,
    propertyId,
    subject,
    description: `Tenant reported: ${subject.toLowerCase()}. ${trade} inspection required.`,
    status,
    priority,
    handler,
    createdDate,
    targetDate,
    daysOpen,
    slaStatus,
    activities: [],
    tasks: [],
    sorCode: sor.code,
    sorDescription: sor.desc,
    trade,
    operative,
    firstTimeFix,
    isAwaabsLaw: false,
    recurrenceRisk,
    cost,
    ...(status === 'completed' ? { completionDate: generateDate(Math.floor(rand() * daysAgo)), satisfaction, closedDate: generateDate(Math.floor(rand() * daysAgo)) } : {}),
    ...(operative && status !== 'completed' ? { appointmentDate: generateDate(Math.max(0, daysAgo - 3)), appointmentSlot: rand() > 0.5 ? 'AM' : 'PM' } : {}),
  });
}
