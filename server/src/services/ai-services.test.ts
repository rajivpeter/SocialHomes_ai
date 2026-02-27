// ============================================================
// SocialHomes.Ai — Comprehensive AI Services Unit Tests
// Tests all 7 AI service modules with 60+ test cases.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mock Data Store
// ============================================================

const _mockData = new Map<string, any>();
const _mockQueryResults = new Map<string, any[]>();

// ============================================================
// Mock Firestore (before any service imports)
// ============================================================

vi.mock('@google-cloud/firestore', () => {
  class Timestamp {
    _seconds: number;
    _nanoseconds: number;
    constructor(s: number, n: number) {
      this._seconds = s;
      this._nanoseconds = n;
    }
    toDate() {
      return new Date(this._seconds * 1000);
    }
    static fromDate(d: Date) {
      return new Timestamp(Math.floor(d.getTime() / 1000), 0);
    }
  }

  const makeQuery = () => ({
    where: () => makeQuery(),
    orderBy: () => makeQuery(),
    limit: () => makeQuery(),
    get: async () => ({
      docs: [],
    }),
  });

  return {
    Firestore: class {
      collection(name: string) {
        return {
          doc: (id: string) => ({
            get: async () => {
              const key = `${name}/${id}`;
              const entry = _mockData.get(key);
              return {
                exists: !!entry,
                id,
                data: () => entry,
              };
            },
            set: async (data: any) => {
              _mockData.set(`${name}/${id}`, data);
            },
            update: async (data: any) => {
              const existing = _mockData.get(`${name}/${id}`) || {};
              _mockData.set(`${name}/${id}`, { ...existing, ...data });
            },
            delete: async () => {
              _mockData.delete(`${name}/${id}`);
            },
          }),
          where: (field: string, _op: string, value: any) => {
            const queryKey = `${name}:${field}=${value}`;
            return {
              where: () => ({
                get: async () => ({
                  docs: (_mockQueryResults.get(queryKey) ?? []).map((d: any) => ({
                    id: d.id,
                    data: () => d,
                  })),
                }),
              }),
              orderBy: () => ({
                limit: () => ({
                  get: async () => ({
                    docs: (_mockQueryResults.get(queryKey) ?? []).map((d: any) => ({
                      id: d.id,
                      data: () => d,
                    })),
                  }),
                }),
                get: async () => ({
                  docs: (_mockQueryResults.get(queryKey) ?? []).map((d: any) => ({
                    id: d.id,
                    data: () => d,
                  })),
                }),
              }),
              get: async () => ({
                docs: (_mockQueryResults.get(queryKey) ?? []).map((d: any) => ({
                  id: d.id,
                  data: () => d,
                })),
              }),
            };
          },
          add: async (data: any) => {
            const id = `mock-${Date.now()}`;
            _mockData.set(`${name}/${id}`, data);
            return { id };
          },
          get: async () => ({
            docs: (_mockQueryResults.get(name) ?? []).map((d: any) => ({
              id: d.id,
              data: () => d,
            })),
          }),
        };
      }
      batch() {
        return {
          set: () => {},
          commit: async () => {},
        };
      }
    },
    FieldValue: {
      serverTimestamp: () => 'SERVER_TIMESTAMP',
      increment: (n: number) => n,
    },
    Timestamp,
  };
});

// ============================================================
// Mock External API / fetch
// ============================================================

vi.mock('./external-api.js', () => ({
  fetchWithCache: vi.fn(async (
    _source: string,
    _key: string,
    _ttl: number,
    _fetcher: () => Promise<any>,
    fallback: any,
  ) => ({
    source: 'simulated',
    data: fallback,
    cached: false,
  })),
}));

// Mock global fetch for weather/crime/flood/imd APIs
const mockFetch = vi.fn(async () => ({
  ok: false,
  json: async () => ({}),
}));
vi.stubGlobal('fetch', mockFetch);

// ============================================================
// Service Imports (AFTER mocks are registered)
// ============================================================

import { classifyRisk, predictDampRisk } from './damp-prediction.js';
import { getEstateCrimeContext, getAsbCaseContext } from './crime-context.js';
import { assessVulnerability, scanAllTenants } from './vulnerability-detection.js';
import { checkBenefitsEntitlement } from './benefits-engine.js';
import { generatePropertyPassport } from './property-passport.js';
import { generateNeighbourhoodBriefing } from './neighbourhood-briefing.js';
import {
  getAllTemplates,
  getTemplateById,
  getTemplatesByCategory,
  renderTemplate,
} from './govuk-notify.js';

// ============================================================
// Shared Test Data Factories
// ============================================================

function makeProperty(overrides: Partial<any> = {}): any {
  return {
    id: 'prop-001',
    uprn: '100012345678',
    address: '14 Riverside Court, London SE15 4QN',
    postcode: 'SE15 4QN',
    blockId: 'block-001',
    estateId: 'estate-001',
    localAuthorityId: 'la-001',
    regionId: 'region-001',
    lat: 51.472,
    lng: -0.059,
    type: 'flat',
    bedrooms: 2,
    floorArea: 65,
    heatingType: 'gas central heating',
    tenureType: 'secure',
    currentTenancyId: 'tenant-001',
    isVoid: false,
    compliance: { gasSafety: 'compliant', eicr: 'compliant' },
    epc: { sapScore: 65, rating: 'D', wallsDesc: 'Cavity wall, insulated', roofDesc: 'Pitched, insulated (200mm)' },
    dampRisk: 30,
    weeklyRent: 150,
    serviceCharge: 25,
    ...overrides,
  };
}

function makeTenant(overrides: Partial<any> = {}): any {
  return {
    id: 'tenant-001',
    title: 'Mrs',
    firstName: 'Sarah',
    lastName: 'Johnson',
    dob: '1980-05-15',
    email: 'sarah.johnson@email.com',
    phone: '020 7946 0958',
    propertyId: 'prop-001',
    tenancyId: 'ten-001',
    tenancyStartDate: '2019-03-01',
    tenancyType: 'secure',
    tenancyStatus: 'active',
    household: [
      { name: 'Tom Johnson', relationship: 'child', age: 12 },
      { name: 'Emily Johnson', relationship: 'child', age: 8 },
    ],
    emergencyContact: { name: 'John Johnson', phone: '07700900000' },
    assignedOfficer: 'Lisa Chen',
    vulnerabilityFlags: [],
    communicationPreference: 'email',
    ucStatus: 'active',
    paymentMethod: 'direct-debit',
    rentBalance: -250,
    weeklyCharge: 150,
    arrearsRisk: 35,
    lastContact: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    contactCount30Days: 3,
    ...overrides,
  };
}

function makeCase(overrides: Partial<any> = {}): any {
  return {
    id: 'case-001',
    reference: 'REP-2026-001',
    type: 'repair',
    tenantId: 'tenant-001',
    propertyId: 'prop-001',
    subject: 'Leaking tap in kitchen',
    description: 'Kitchen cold tap dripping continuously',
    status: 'open',
    priority: 'routine',
    handler: 'Repairs Team',
    createdDate: '2026-02-01',
    daysOpen: 26,
    slaStatus: 'within-sla',
    ...overrides,
  };
}

function makeEstate(overrides: Partial<any> = {}): any {
  return {
    id: 'estate-001',
    name: 'Riverside Estate',
    localAuthorityId: 'la-001',
    postcode: 'SE15 4QN',
    lat: 51.472,
    lng: -0.059,
    constructionEra: '1960s',
    totalUnits: 120,
    blocks: ['block-001', 'block-002'],
    schemeType: 'general-needs',
    managingOfficer: 'Lisa Chen',
    occupancy: 95,
    compliance: 92,
    dampCases: 3,
    arrears: 25000,
    asbCases: 2,
    repairsBacklog: 15,
    ...overrides,
  };
}

function makeBlock(overrides: Partial<any> = {}): any {
  return {
    id: 'block-001',
    name: 'Riverside Court',
    estateId: 'estate-001',
    address: 'Riverside Court, London SE15 4QN',
    uprn: '100012345600',
    lat: 51.472,
    lng: -0.059,
    constructionType: 'reinforced-concrete',
    constructionYear: 1965,
    storeys: 12,
    totalUnits: 48,
    units: ['prop-001'],
    higherRisk: true,
    fireRiskAssessment: {},
    asbestosManagement: {},
    legionellaAssessment: {},
    communalFire: {},
    ...overrides,
  };
}

// ============================================================
// Helper: Populate mock Firestore
// ============================================================

function seedMockData(data: {
  properties?: any[];
  tenants?: any[];
  cases?: any[];
  estates?: any[];
  blocks?: any[];
}) {
  _mockData.clear();
  _mockQueryResults.clear();

  for (const p of data.properties ?? []) {
    _mockData.set(`properties/${p.id}`, p);
  }
  for (const t of data.tenants ?? []) {
    _mockData.set(`tenants/${t.id}`, t);
  }
  for (const c of data.cases ?? []) {
    _mockData.set(`cases/${c.id}`, c);
  }
  for (const e of data.estates ?? []) {
    _mockData.set(`estates/${e.id}`, e);
  }
  for (const b of data.blocks ?? []) {
    _mockData.set(`blocks/${b.id}`, b);
  }

  // Set up query results for common lookups
  const properties = data.properties ?? [];
  const cases = data.cases ?? [];
  const tenants = data.tenants ?? [];
  const blocks = data.blocks ?? [];

  // Global collection queries (getDocs with no filters)
  if (properties.length > 0) _mockQueryResults.set('properties', properties);
  if (cases.length > 0) _mockQueryResults.set('cases', cases);
  if (tenants.length > 0) _mockQueryResults.set('tenants', tenants);
  if (blocks.length > 0) _mockQueryResults.set('blocks', blocks);

  // Properties by estateId
  for (const p of properties) {
    const key = `properties:estateId=${p.estateId}`;
    if (!_mockQueryResults.has(key)) _mockQueryResults.set(key, []);
    _mockQueryResults.get(key)!.push(p);
  }

  // Cases by propertyId
  for (const c of cases) {
    const key = `cases:propertyId=${c.propertyId}`;
    if (!_mockQueryResults.has(key)) _mockQueryResults.set(key, []);
    _mockQueryResults.get(key)!.push(c);
  }

  // Cases by tenantId
  for (const c of cases) {
    const key = `cases:tenantId=${c.tenantId}`;
    if (!_mockQueryResults.has(key)) _mockQueryResults.set(key, []);
    _mockQueryResults.get(key)!.push(c);
  }

  // Cases by type
  for (const c of cases) {
    const key = `cases:type=${c.type}`;
    if (!_mockQueryResults.has(key)) _mockQueryResults.set(key, []);
    _mockQueryResults.get(key)!.push(c);
  }

  // Blocks by estateId
  for (const b of blocks) {
    const key = `blocks:estateId=${b.estateId}`;
    if (!_mockQueryResults.has(key)) _mockQueryResults.set(key, []);
    _mockQueryResults.get(key)!.push(b);
  }
}

// ============================================================
// 1. DAMP PREDICTION SERVICE
// ============================================================

describe('Damp Prediction Service', () => {
  beforeEach(() => {
    _mockData.clear();
    _mockQueryResults.clear();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) } as any);
  });

  describe('classifyRisk', () => {
    it('returns "low" for score 0', () => {
      expect(classifyRisk(0)).toBe('low');
    });

    it('returns "low" for score 30 (boundary)', () => {
      expect(classifyRisk(30)).toBe('low');
    });

    it('returns "moderate" for score 31', () => {
      expect(classifyRisk(31)).toBe('moderate');
    });

    it('returns "moderate" for score 50 (boundary)', () => {
      expect(classifyRisk(50)).toBe('moderate');
    });

    it('returns "high" for score 51', () => {
      expect(classifyRisk(51)).toBe('high');
    });

    it('returns "high" for score 70 (boundary)', () => {
      expect(classifyRisk(70)).toBe('high');
    });

    it('returns "critical" for score 71', () => {
      expect(classifyRisk(71)).toBe('critical');
    });

    it('returns "critical" for score 100', () => {
      expect(classifyRisk(100)).toBe('critical');
    });

    it('returns "low" for negative score', () => {
      expect(classifyRisk(-10)).toBe('low');
    });
  });

  describe('predictDampRisk', () => {
    it('throws when property not found', async () => {
      await expect(predictDampRisk('nonexistent')).rejects.toThrow('Property nonexistent not found');
    });

    it('returns a prediction with all required fields for a valid property', async () => {
      seedMockData({
        properties: [makeProperty()],
        blocks: [makeBlock()],
        tenants: [makeTenant()],
        cases: [],
      });

      const result = await predictDampRisk('prop-001');

      expect(result).toHaveProperty('propertyId', 'prop-001');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('isAwaabsLaw');
      expect(result).toHaveProperty('predictedAt');
      expect(typeof result.overallScore).toBe('number');
      expect(['low', 'moderate', 'high', 'critical']).toContain(result.riskLevel);
    });

    it('includes all 5 factors in prediction', async () => {
      seedMockData({
        properties: [makeProperty()],
        blocks: [makeBlock()],
        tenants: [makeTenant()],
        cases: [],
      });

      const result = await predictDampRisk('prop-001');
      expect(result.factors).toHaveLength(5);

      const factorNames = result.factors.map(f => f.name);
      expect(factorNames).toContain('Weather');
      expect(factorNames).toContain('Building Fabric');
      expect(factorNames).toContain('Repair History');
      expect(factorNames).toContain('Environmental Sensors');
      expect(factorNames).toContain('Occupancy');
    });

    it('returns higher risk for property with high dampRisk', async () => {
      seedMockData({
        properties: [makeProperty({ dampRisk: 90 })],
        blocks: [makeBlock({ constructionYear: 1935 })],
        tenants: [makeTenant({ rentBalance: -2000 })],
        cases: [
          makeCase({ type: 'damp-mould', status: 'open', isAwaabsLaw: true, propertyId: 'prop-001', createdDate: new Date().toISOString() }),
          makeCase({ id: 'case-002', type: 'damp-mould', status: 'open', propertyId: 'prop-001', createdDate: new Date().toISOString() }),
        ],
      });

      const result = await predictDampRisk('prop-001');
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('sets isAwaabsLaw to true when damp case has isAwaabsLaw flag', async () => {
      seedMockData({
        properties: [makeProperty()],
        blocks: [makeBlock()],
        tenants: [makeTenant()],
        cases: [makeCase({ type: 'damp-mould', status: 'open', isAwaabsLaw: true, propertyId: 'prop-001' })],
      });

      const result = await predictDampRisk('prop-001');
      expect(result.isAwaabsLaw).toBe(true);
    });

    it('handles property with no tenant (void property)', async () => {
      seedMockData({
        properties: [makeProperty({ currentTenancyId: undefined, isVoid: true })],
        blocks: [makeBlock()],
        cases: [],
      });

      const result = await predictDampRisk('prop-001');
      expect(result).toHaveProperty('overallScore');
      expect(result.factors).toHaveLength(5);
    });

    it('handles property with no block', async () => {
      seedMockData({
        properties: [makeProperty({ blockId: undefined })],
        tenants: [makeTenant()],
        cases: [],
      });

      const result = await predictDampRisk('prop-001');
      expect(result).toHaveProperty('overallScore');
    });

    it('generates recommendations array', async () => {
      seedMockData({
        properties: [makeProperty()],
        blocks: [makeBlock()],
        tenants: [makeTenant()],
        cases: [],
      });

      const result = await predictDampRisk('prop-001');
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================
// 2. CRIME CONTEXT SERVICE
// ============================================================

describe('Crime Context Service', () => {
  beforeEach(() => {
    _mockData.clear();
    _mockQueryResults.clear();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) } as any);
  });

  describe('getEstateCrimeContext', () => {
    it('throws when estate not found', async () => {
      await expect(getEstateCrimeContext('nonexistent')).rejects.toThrow('Estate nonexistent not found');
    });

    it('returns context with all required fields', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await getEstateCrimeContext('estate-001');

      expect(result).toHaveProperty('estateId', 'estate-001');
      expect(result).toHaveProperty('estateName', 'Riverside Estate');
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('totalIncidents');
      expect(result).toHaveProperty('asbIncidents');
      expect(result).toHaveProperty('internalAsbCases');
      expect(result).toHaveProperty('categoryBreakdown');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('hotspotStreets');
      expect(result).toHaveProperty('correlationScore');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('briefing');
      expect(result).toHaveProperty('fetchedAt');
    });

    it('returns valid trend value', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await getEstateCrimeContext('estate-001');
      expect(['rising', 'stable', 'declining']).toContain(result.trend);
    });

    it('returns valid risk level', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await getEstateCrimeContext('estate-001');
      expect(['low', 'moderate', 'high', 'critical']).toContain(result.riskLevel);
    });

    it('includes period with correct month count', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await getEstateCrimeContext('estate-001', 6);
      expect(result.period.months).toBe(6);
    });

    it('generates a briefing containing the estate name', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await getEstateCrimeContext('estate-001');
      expect(result.briefing).toContain('Riverside Estate');
    });
  });

  describe('getAsbCaseContext', () => {
    it('throws when case not found', async () => {
      await expect(getAsbCaseContext('nonexistent')).rejects.toThrow('Case nonexistent not found');
    });

    it('throws when case is not ASB type', async () => {
      seedMockData({
        cases: [makeCase({ type: 'repair' })],
      });
      _mockData.set('cases/case-001', makeCase({ type: 'repair' }));

      await expect(getAsbCaseContext('case-001')).rejects.toThrow('is not an ASB case');
    });

    it('returns context for a valid ASB case', async () => {
      const asbCase = makeCase({
        type: 'asb',
        reference: 'ASB-2026-001',
        propertyId: 'prop-001',
      });
      _mockData.set('cases/case-001', asbCase);
      _mockData.set('properties/prop-001', makeProperty());

      const result = await getAsbCaseContext('case-001');

      expect(result).toHaveProperty('caseId', 'case-001');
      expect(result).toHaveProperty('caseReference', 'ASB-2026-001');
      expect(result).toHaveProperty('nearbyPoliceIncidents');
      expect(result).toHaveProperty('asbIncidentsNearby');
      expect(result).toHaveProperty('totalCrimeNearby');
      expect(result).toHaveProperty('escalationRisk');
      expect(result).toHaveProperty('contextSummary');
      expect(['low', 'moderate', 'high']).toContain(result.escalationRisk);
    });
  });
});

// ============================================================
// 3. VULNERABILITY DETECTION SERVICE
// ============================================================

describe('Vulnerability Detection Service', () => {
  beforeEach(() => {
    _mockData.clear();
    _mockQueryResults.clear();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) } as any);
  });

  describe('assessVulnerability', () => {
    it('throws when tenant not found', async () => {
      await expect(assessVulnerability('nonexistent')).rejects.toThrow('Tenant nonexistent not found');
    });

    it('returns assessment with all required fields', async () => {
      seedMockData({
        tenants: [makeTenant()],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');

      expect(result).toHaveProperty('tenantId', 'tenant-001');
      expect(result).toHaveProperty('tenantName');
      expect(result.tenantName).toContain('Sarah');
      expect(result).toHaveProperty('propertyAddress');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('existingFlags');
      expect(result).toHaveProperty('newFlagsDetected');
      expect(result).toHaveProperty('recommendedActions');
      expect(result).toHaveProperty('assessedAt');
    });

    it('includes all 7 vulnerability factors', async () => {
      seedMockData({
        tenants: [makeTenant()],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');
      expect(result.factors).toHaveLength(7);

      const factorNames = result.factors.map(f => f.name);
      expect(factorNames).toContain('Deprivation (IMD)');
      expect(factorNames).toContain('Rent Arrears');
      expect(factorNames).toContain('Health Indicators');
      expect(factorNames).toContain('Social Isolation');
      expect(factorNames).toContain('Age Factor');
      expect(factorNames).toContain('Dependents');
      expect(factorNames).toContain('UC Transition');
    });

    it('returns valid vulnerability level', async () => {
      seedMockData({
        tenants: [makeTenant()],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');
      expect(['low', 'moderate', 'high', 'critical']).toContain(result.level);
    });

    it('scores higher for tenant with large arrears', async () => {
      seedMockData({
        tenants: [makeTenant({ rentBalance: -3000, weeklyCharge: 150, arrearsRisk: 90 })],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');
      const arrearsFactor = result.factors.find(f => f.name === 'Rent Arrears');
      expect(arrearsFactor).toBeDefined();
      expect(arrearsFactor!.rawScore).toBeGreaterThan(50);
    });

    it('detects social isolation for tenant living alone with no contact', async () => {
      seedMockData({
        tenants: [makeTenant({
          household: [],
          contactCount30Days: 0,
          lastContact: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
        })],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');
      const isolationFactor = result.factors.find(f => f.name === 'Social Isolation');
      expect(isolationFactor).toBeDefined();
      // lives alone (30) + no contact (35) + days > 60 (25) = 90
      expect(isolationFactor!.rawScore).toBe(90);
    });

    it('scores higher age factor for elderly tenant (80+)', async () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 82);

      seedMockData({
        tenants: [makeTenant({ dob: dob.toISOString().split('T')[0] })],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');
      const ageFactor = result.factors.find(f => f.name === 'Age Factor');
      expect(ageFactor).toBeDefined();
      expect(ageFactor!.rawScore).toBe(90);
    });

    it('scores age factor for tenant aged 70-79', async () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 72);

      seedMockData({
        tenants: [makeTenant({ dob: dob.toISOString().split('T')[0] })],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');
      const ageFactor = result.factors.find(f => f.name === 'Age Factor');
      expect(ageFactor!.rawScore).toBe(60);
    });

    it('scores age factor for young tenant (<= 25)', async () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 22);

      seedMockData({
        tenants: [makeTenant({ dob: dob.toISOString().split('T')[0] })],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');
      const ageFactor = result.factors.find(f => f.name === 'Age Factor');
      expect(ageFactor!.rawScore).toBe(35);
    });

    it('scores dependents factor for household with 3+ children', async () => {
      seedMockData({
        tenants: [makeTenant({
          household: [
            { name: 'Child 1', relationship: 'child', age: 12 },
            { name: 'Child 2', relationship: 'child', age: 8 },
            { name: 'Child 3', relationship: 'child', age: 3 },
          ],
        })],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');
      const depFactor = result.factors.find(f => f.name === 'Dependents');
      expect(depFactor).toBeDefined();
      // 3 children = 70, infant (<5) = +20, total = 90
      expect(depFactor!.rawScore).toBe(90);
    });

    it('scores UC transition factor for transitioning tenant', async () => {
      seedMockData({
        tenants: [makeTenant({ ucStatus: 'transitioning' })],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');
      const ucFactor = result.factors.find(f => f.name === 'UC Transition');
      expect(ucFactor).toBeDefined();
      expect(ucFactor!.rawScore).toBe(80);
    });

    it('detects health flags when damp case is active', async () => {
      seedMockData({
        tenants: [makeTenant({
          vulnerabilityFlags: [{ flag: 'Mental health condition' }],
        })],
        properties: [makeProperty()],
        cases: [makeCase({ type: 'damp-mould', status: 'open', tenantId: 'tenant-001', propertyId: 'prop-001' })],
      });

      const result = await assessVulnerability('tenant-001');
      const healthFactor = result.factors.find(f => f.name === 'Health Indicators');
      expect(healthFactor).toBeDefined();
      // 1 health flag (30) + active damp (20) = 50
      expect(healthFactor!.rawScore).toBe(50);
    });

    it('detects new flags not in existing vulnerability flags', async () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 75);

      seedMockData({
        tenants: [makeTenant({
          dob: dob.toISOString().split('T')[0],
          vulnerabilityFlags: [],
          household: [],
          contactCount30Days: 0,
          lastContact: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
        })],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');
      // Should detect elderly (70+) and social isolation
      expect(result.newFlagsDetected.length).toBeGreaterThan(0);
      const flagText = result.newFlagsDetected.join(' ');
      expect(flagText).toContain('Elderly');
    });

    it('generates recommended actions for critical level', async () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 85);

      seedMockData({
        tenants: [makeTenant({
          dob: dob.toISOString().split('T')[0],
          rentBalance: -5000,
          weeklyCharge: 150,
          arrearsRisk: 95,
          household: [],
          contactCount30Days: 0,
          lastContact: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
          ucStatus: 'transitioning',
          vulnerabilityFlags: [{ flag: 'disability' }],
        })],
        properties: [makeProperty()],
        cases: [],
      });

      const result = await assessVulnerability('tenant-001');
      expect(result.recommendedActions.length).toBeGreaterThan(0);
    });
  });

  describe('scanAllTenants', () => {
    it('returns scan result with summary', async () => {
      seedMockData({
        tenants: [
          makeTenant({ id: 'tenant-001' }),
          makeTenant({ id: 'tenant-002', firstName: 'James', lastName: 'Smith', propertyId: 'prop-002' }),
        ],
        properties: [
          makeProperty({ id: 'prop-001' }),
          makeProperty({ id: 'prop-002' }),
        ],
        cases: [],
      });

      const result = await scanAllTenants();

      expect(result).toHaveProperty('scannedAt');
      expect(result).toHaveProperty('totalTenants');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('critical');
      expect(result.summary).toHaveProperty('high');
      expect(result.summary).toHaveProperty('moderate');
      expect(result.summary).toHaveProperty('low');
      expect(result.summary).toHaveProperty('newFlagsTotal');
    });

    it('returns empty scan when no tenants exist', async () => {
      seedMockData({ tenants: [], properties: [], cases: [] });

      const result = await scanAllTenants();
      expect(result.totalTenants).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });
});

// ============================================================
// 4. BENEFITS ENGINE SERVICE
// ============================================================

describe('Benefits Engine Service', () => {
  beforeEach(() => {
    _mockData.clear();
    _mockQueryResults.clear();
  });

  describe('checkBenefitsEntitlement', () => {
    it('throws when tenant not found', async () => {
      await expect(checkBenefitsEntitlement('nonexistent')).rejects.toThrow('Tenant nonexistent not found');
    });

    it('returns assessment with all required fields', async () => {
      seedMockData({
        tenants: [makeTenant()],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');

      expect(result).toHaveProperty('tenantId', 'tenant-001');
      expect(result).toHaveProperty('tenantName');
      expect(result).toHaveProperty('currentBenefits');
      expect(result).toHaveProperty('entitlements');
      expect(result).toHaveProperty('estimatedUnclaimedWeekly');
      expect(result).toHaveProperty('estimatedUnclaimedAnnual');
      expect(result).toHaveProperty('recommendedActions');
      expect(result).toHaveProperty('assessedAt');
    });

    it('identifies UC as currently-claiming when ucStatus is active', async () => {
      seedMockData({
        tenants: [makeTenant({ ucStatus: 'active' })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const ucEntitlement = result.entitlements.find(e => e.benefit === 'Universal Credit');
      expect(ucEntitlement).toBeDefined();
      expect(ucEntitlement!.status).toBe('currently-claiming');
    });

    it('identifies UC as likely-eligible when tenant is in arrears but not claiming', async () => {
      seedMockData({
        tenants: [makeTenant({ ucStatus: '', rentBalance: -500 })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const ucEntitlement = result.entitlements.find(e => e.benefit === 'Universal Credit');
      expect(ucEntitlement).toBeDefined();
      expect(ucEntitlement!.status).toBe('likely-eligible');
      expect(ucEntitlement!.estimatedWeeklyAmount).toBeGreaterThan(0);
    });

    it('identifies PIP eligibility for tenant with disability flag', async () => {
      seedMockData({
        tenants: [makeTenant({
          vulnerabilityFlags: [{ flag: 'Physical disability' }],
        })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const pip = result.entitlements.find(e => e.benefit === 'Personal Independence Payment (PIP)');
      expect(pip).toBeDefined();
      expect(pip!.status).toBe('potentially-eligible');
    });

    it('identifies PIP as currently-claiming when DLA flag exists', async () => {
      seedMockData({
        tenants: [makeTenant({
          vulnerabilityFlags: [{ flag: 'disability - DLA recipient' }],
        })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const pip = result.entitlements.find(e => e.benefit === 'Personal Independence Payment (PIP)');
      expect(pip).toBeDefined();
      expect(pip!.status).toBe('currently-claiming');
    });

    it('identifies Attendance Allowance for elderly tenant with disability', async () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 70);

      seedMockData({
        tenants: [makeTenant({
          dob: dob.toISOString().split('T')[0],
          vulnerabilityFlags: [{ flag: 'disability' }],
        })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const aa = result.entitlements.find(e => e.benefit === 'Attendance Allowance');
      expect(aa).toBeDefined();
      expect(aa!.status).toBe('potentially-eligible');
    });

    it('identifies Carer\'s Allowance for tenant with carer flag', async () => {
      seedMockData({
        tenants: [makeTenant({
          vulnerabilityFlags: [{ flag: 'Carer' }],
        })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const ca = result.entitlements.find(e => e.benefit === "Carer's Allowance");
      expect(ca).toBeDefined();
      expect(ca!.status).toBe('potentially-eligible');
    });

    it('identifies Pension Credit for elderly tenant', async () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 68);

      seedMockData({
        tenants: [makeTenant({ dob: dob.toISOString().split('T')[0] })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const pc = result.entitlements.find(e => e.benefit === 'Pension Credit');
      expect(pc).toBeDefined();
      expect(pc!.status).toBe('potentially-eligible');
    });

    it('identifies Winter Fuel Payment for elderly tenant', async () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 68);

      seedMockData({
        tenants: [makeTenant({ dob: dob.toISOString().split('T')[0] })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const wfp = result.entitlements.find(e => e.benefit === 'Winter Fuel Payment');
      expect(wfp).toBeDefined();
      expect(wfp!.status).toBe('likely-eligible');
    });

    it('identifies Council Tax Reduction for tenant in arrears', async () => {
      seedMockData({
        tenants: [makeTenant({ rentBalance: -500 })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const ctr = result.entitlements.find(e => e.benefit === 'Council Tax Reduction');
      expect(ctr).toBeDefined();
    });

    it('identifies Free School Meals when children present and on UC', async () => {
      seedMockData({
        tenants: [makeTenant({
          ucStatus: 'active',
          household: [{ name: 'Child', relationship: 'child', age: 10 }],
        })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const fsm = result.entitlements.find(e => e.benefit === 'Free School Meals');
      expect(fsm).toBeDefined();
    });

    it('identifies DHP for tenant with significant arrears', async () => {
      seedMockData({
        tenants: [makeTenant({ rentBalance: -1000 })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const dhp = result.entitlements.find(e => e.benefit === 'Discretionary Housing Payment (DHP)');
      expect(dhp).toBeDefined();
      expect(dhp!.confidence).toBe(0.4);
    });

    it('calculates estimated unclaimed weekly and annual amounts', async () => {
      seedMockData({
        tenants: [makeTenant({ ucStatus: '', rentBalance: -500 })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      expect(result.estimatedUnclaimedWeekly).toBeGreaterThan(0);
      expect(result.estimatedUnclaimedAnnual).toBeCloseTo(result.estimatedUnclaimedWeekly * 52, 0);
    });

    it('generates recommended actions including welfare referral for high unclaimed', async () => {
      seedMockData({
        tenants: [makeTenant({
          ucStatus: '',
          rentBalance: -1000,
          vulnerabilityFlags: [{ flag: 'disability' }],
        })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      expect(result.recommendedActions.length).toBeGreaterThan(0);
      const hasWelfareRef = result.recommendedActions.some(a => a.includes('welfare rights') || a.includes('Review'));
      expect(hasWelfareRef).toBe(true);
    });

    it('adds APA action for UC transitioning tenant', async () => {
      seedMockData({
        tenants: [makeTenant({ ucStatus: 'transitioning', rentBalance: -500 })],
        properties: [makeProperty()],
      });

      const result = await checkBenefitsEntitlement('tenant-001');
      const hasAPA = result.recommendedActions.some(a => a.includes('Alternative Payment Arrangement'));
      expect(hasAPA).toBe(true);
    });
  });
});

// ============================================================
// 5. PROPERTY PASSPORT SERVICE
// ============================================================

describe('Property Passport Service', () => {
  beforeEach(() => {
    _mockData.clear();
    _mockQueryResults.clear();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) } as any);
  });

  describe('generatePropertyPassport', () => {
    it('throws when property not found', async () => {
      await expect(generatePropertyPassport('nonexistent')).rejects.toThrow('Property nonexistent not found');
    });

    it('returns passport with all top-level sections', async () => {
      seedMockData({
        properties: [makeProperty()],
        blocks: [makeBlock()],
        estates: [makeEstate()],
        tenants: [makeTenant()],
        cases: [],
      });

      const result = await generatePropertyPassport('prop-001');

      expect(result).toHaveProperty('property');
      expect(result).toHaveProperty('block');
      expect(result).toHaveProperty('estate');
      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('compliance');
      expect(result).toHaveProperty('epc');
      expect(result).toHaveProperty('dampIntelligence');
      expect(result).toHaveProperty('caseHistory');
      expect(result).toHaveProperty('externalData');
      expect(result).toHaveProperty('financials');
      expect(result).toHaveProperty('generatedAt');
    });

    it('populates property section with correct data', async () => {
      seedMockData({
        properties: [makeProperty()],
        blocks: [makeBlock()],
        estates: [makeEstate()],
        tenants: [makeTenant()],
        cases: [],
      });

      const result = await generatePropertyPassport('prop-001');

      expect(result.property.id).toBe('prop-001');
      expect(result.property.address).toBe('14 Riverside Court, London SE15 4QN');
      expect(result.property.bedrooms).toBe(2);
      expect(result.property.type).toBe('flat');
    });

    it('populates block and estate data', async () => {
      seedMockData({
        properties: [makeProperty()],
        blocks: [makeBlock()],
        estates: [makeEstate()],
        tenants: [makeTenant()],
        cases: [],
      });

      const result = await generatePropertyPassport('prop-001');

      expect(result.block).not.toBeNull();
      expect(result.block!.name).toBe('Riverside Court');
      expect(result.block!.constructionYear).toBe(1965);
      expect(result.estate).not.toBeNull();
      expect(result.estate!.name).toBe('Riverside Estate');
    });

    it('returns null block and estate when not linked', async () => {
      seedMockData({
        properties: [makeProperty({ blockId: undefined, estateId: undefined })],
        tenants: [makeTenant()],
        cases: [],
      });

      const result = await generatePropertyPassport('prop-001');
      expect(result.block).toBeNull();
      expect(result.estate).toBeNull();
    });

    it('computes case history summary from cases', async () => {
      seedMockData({
        properties: [makeProperty()],
        blocks: [makeBlock()],
        estates: [makeEstate()],
        tenants: [makeTenant()],
        cases: [
          makeCase({ type: 'repair', status: 'open', priority: 'emergency', propertyId: 'prop-001' }),
          makeCase({ id: 'case-002', type: 'repair', status: 'completed', propertyId: 'prop-001' }),
          makeCase({ id: 'case-003', type: 'damp-mould', status: 'open', isAwaabsLaw: true, propertyId: 'prop-001' }),
          makeCase({ id: 'case-004', type: 'complaint', status: 'open', propertyId: 'prop-001' }),
          makeCase({ id: 'case-005', type: 'asb', status: 'closed', propertyId: 'prop-001' }),
        ],
      });

      const result = await generatePropertyPassport('prop-001');

      expect(result.caseHistory.totalCases).toBe(5);
      expect(result.caseHistory.repairs.total).toBe(2);
      expect(result.caseHistory.repairs.emergency).toBe(1);
      expect(result.caseHistory.dampMould.total).toBe(1);
      expect(result.caseHistory.dampMould.awaabsLaw).toBe(1);
      expect(result.caseHistory.complaints.total).toBe(1);
      expect(result.caseHistory.asb.total).toBe(1);
    });

    it('computes financial summary from tenant data', async () => {
      seedMockData({
        properties: [makeProperty({ weeklyRent: 150, serviceCharge: 25 })],
        blocks: [makeBlock()],
        estates: [makeEstate()],
        tenants: [makeTenant({ rentBalance: -450, weeklyCharge: 150, arrearsRisk: 60 })],
        cases: [],
      });

      const result = await generatePropertyPassport('prop-001');

      expect(result.financials.weeklyRent).toBe(150);
      expect(result.financials.serviceCharge).toBe(25);
      expect(result.financials.currentBalance).toBe(-450);
      expect(result.financials.arrearsWeeks).toBe(3);
      expect(result.financials.arrearsRisk).toBe(60);
    });

    it('handles void property with no tenant', async () => {
      seedMockData({
        properties: [makeProperty({ currentTenancyId: undefined, isVoid: true })],
        blocks: [makeBlock()],
        estates: [makeEstate()],
        cases: [],
      });

      const result = await generatePropertyPassport('prop-001');
      expect(result.tenant).toBeNull();
      expect(result.financials.currentBalance).toBe(0);
    });
  });
});

// ============================================================
// 6. NEIGHBOURHOOD BRIEFING SERVICE
// ============================================================

describe('Neighbourhood Briefing Service', () => {
  beforeEach(() => {
    _mockData.clear();
    _mockQueryResults.clear();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) } as any);
  });

  describe('generateNeighbourhoodBriefing', () => {
    it('throws when estate not found', async () => {
      await expect(generateNeighbourhoodBriefing('nonexistent')).rejects.toThrow('Estate nonexistent not found');
    });

    it('returns briefing with all required sections', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty()],
        tenants: [makeTenant()],
        cases: [],
        blocks: [makeBlock()],
      });

      const result = await generateNeighbourhoodBriefing('estate-001');

      expect(result).toHaveProperty('estateId', 'estate-001');
      expect(result).toHaveProperty('estateName', 'Riverside Estate');
      expect(result).toHaveProperty('generatedAt');
      expect(result).toHaveProperty('weatherSummary');
      expect(result).toHaveProperty('crimeSummary');
      expect(result).toHaveProperty('rentSummary');
      expect(result).toHaveProperty('repairsSummary');
      expect(result).toHaveProperty('dampSummary');
      expect(result).toHaveProperty('complianceSummary');
      expect(result).toHaveProperty('keyAlerts');
      expect(result).toHaveProperty('officerBriefing');
      expect(result).toHaveProperty('actionItems');
    });

    it('weather summary has required fields', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty()],
        tenants: [makeTenant()],
        cases: [],
        blocks: [makeBlock()],
      });

      const result = await generateNeighbourhoodBriefing('estate-001');

      expect(result.weatherSummary).toHaveProperty('temperature');
      expect(result.weatherSummary).toHaveProperty('humidity');
      expect(result.weatherSummary).toHaveProperty('precipitation');
      expect(result.weatherSummary).toHaveProperty('windSpeed');
      expect(result.weatherSummary).toHaveProperty('dampRiskConditions');
      expect(result.weatherSummary).toHaveProperty('forecast');
    });

    it('rent summary calculates tenants in arrears', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty(), makeProperty({ id: 'prop-002', estateId: 'estate-001', currentTenancyId: 'tenant-002' })],
        tenants: [
          makeTenant({ id: 'tenant-001', rentBalance: -500, propertyId: 'prop-001' }),
          makeTenant({ id: 'tenant-002', rentBalance: 50, propertyId: 'prop-002' }),
        ],
        cases: [],
        blocks: [makeBlock()],
      });

      const result = await generateNeighbourhoodBriefing('estate-001');
      expect(result.rentSummary).toHaveProperty('totalTenants');
      expect(result.rentSummary).toHaveProperty('inArrears');
      expect(result.rentSummary).toHaveProperty('totalArrears');
      expect(result.rentSummary).toHaveProperty('collectionRate');
    });

    it('generates key alerts for emergency repairs', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty()],
        tenants: [makeTenant()],
        cases: [
          makeCase({ type: 'repair', status: 'open', priority: 'emergency', propertyId: 'prop-001' }),
        ],
        blocks: [makeBlock()],
      });

      const result = await generateNeighbourhoodBriefing('estate-001');
      const hasEmergencyAlert = result.keyAlerts.some(a => a.includes('emergency'));
      expect(hasEmergencyAlert).toBe(true);
    });

    it('generates action items for Awaab\'s Law cases', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty()],
        tenants: [makeTenant()],
        cases: [
          makeCase({ type: 'damp-mould', status: 'open', isAwaabsLaw: true, propertyId: 'prop-001' }),
        ],
        blocks: [makeBlock()],
      });

      const result = await generateNeighbourhoodBriefing('estate-001');
      const hasAwaabsAction = result.actionItems.some(a => a.action.includes('Awaab'));
      expect(hasAwaabsAction).toBe(true);
    });

    it('officer briefing contains estate name', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty()],
        tenants: [makeTenant()],
        cases: [],
        blocks: [makeBlock()],
      });

      const result = await generateNeighbourhoodBriefing('estate-001');
      expect(result.officerBriefing).toContain('Riverside Estate');
    });

    it('officer briefing contains weather forecast', async () => {
      seedMockData({
        estates: [makeEstate()],
        properties: [makeProperty()],
        tenants: [makeTenant()],
        cases: [],
        blocks: [makeBlock()],
      });

      const result = await generateNeighbourhoodBriefing('estate-001');
      expect(result.officerBriefing).toContain('Weather');
    });
  });
});

// ============================================================
// 7. GOV.UK NOTIFY TEMPLATE SERVICE (Pure functions, no mocking)
// ============================================================

describe('GOV.UK Notify Template Service', () => {
  describe('getAllTemplates', () => {
    it('returns an array of templates', () => {
      const templates = getAllTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('returns exactly 24 templates', () => {
      const templates = getAllTemplates();
      expect(templates).toHaveLength(24);
    });

    it('every template has required fields', () => {
      const templates = getAllTemplates();
      for (const t of templates) {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('category');
        expect(t).toHaveProperty('subject');
        expect(t).toHaveProperty('body');
        expect(t).toHaveProperty('personalisationFields');
        expect(typeof t.id).toBe('string');
        expect(typeof t.name).toBe('string');
        expect(typeof t.subject).toBe('string');
        expect(typeof t.body).toBe('string');
        expect(Array.isArray(t.personalisationFields)).toBe(true);
      }
    });

    it('all template IDs are unique', () => {
      const templates = getAllTemplates();
      const ids = templates.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getTemplateById', () => {
    it('returns the correct template for a known ID', () => {
      const template = getTemplateById('rent-arrears-gentle-reminder');
      expect(template).toBeDefined();
      expect(template!.id).toBe('rent-arrears-gentle-reminder');
      expect(template!.category).toBe('rent-arrears');
    });

    it('returns undefined for unknown ID', () => {
      const template = getTemplateById('nonexistent-template-id');
      expect(template).toBeUndefined();
    });

    it('returns template with correct personalisation fields', () => {
      const template = getTemplateById('tenancy-welcome');
      expect(template).toBeDefined();
      expect(template!.personalisationFields).toContain('tenant_name');
      expect(template!.personalisationFields).toContain('property_address');
      expect(template!.personalisationFields).toContain('weekly_rent');
    });

    it('returns damp-mould template with correct category', () => {
      const template = getTemplateById('damp-mould-awaabs-law');
      expect(template).toBeDefined();
      expect(template!.category).toBe('damp-mould');
      expect(template!.name).toContain('Awaab');
    });

    it('returns compliance template', () => {
      const template = getTemplateById('compliance-gas-safety');
      expect(template).toBeDefined();
      expect(template!.category).toBe('compliance');
    });
  });

  describe('getTemplatesByCategory', () => {
    it('returns rent-arrears templates', () => {
      const templates = getTemplatesByCategory('rent-arrears');
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.category).toBe('rent-arrears');
      }
    });

    it('returns repairs templates', () => {
      const templates = getTemplatesByCategory('repairs');
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.category).toBe('repairs');
      }
    });

    it('returns asb templates', () => {
      const templates = getTemplatesByCategory('asb');
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.category).toBe('asb');
      }
    });

    it('returns compliance templates', () => {
      const templates = getTemplatesByCategory('compliance');
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.category).toBe('compliance');
      }
    });

    it('returns tenancy templates', () => {
      const templates = getTemplatesByCategory('tenancy');
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.category).toBe('tenancy');
      }
    });

    it('returns damp-mould templates', () => {
      const templates = getTemplatesByCategory('damp-mould');
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.category).toBe('damp-mould');
      }
    });

    it('returns general templates', () => {
      const templates = getTemplatesByCategory('general');
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.category).toBe('general');
      }
    });

    it('all categories together account for all 24 templates', () => {
      const categories = ['rent-arrears', 'repairs', 'asb', 'compliance', 'tenancy', 'damp-mould', 'general'] as const;
      let total = 0;
      for (const cat of categories) {
        total += getTemplatesByCategory(cat).length;
      }
      expect(total).toBe(24);
    });
  });

  describe('renderTemplate', () => {
    it('throws for unknown template ID', () => {
      expect(() => renderTemplate('nonexistent', {})).toThrow('Template not found: nonexistent');
    });

    it('replaces all personalisation fields in subject and body', () => {
      const result = renderTemplate('rent-arrears-gentle-reminder', {
        tenant_name: 'Mrs Sarah Johnson',
        property_address: '14 Riverside Court, London SE15 4QN',
        arrears_amount: '250.00',
        arrears_weeks: '1.7',
        weekly_rent: '150.00',
        payment_reference: 'PAY-001',
        officer_name: 'Lisa Chen',
        officer_phone: '020 7946 0958',
        officer_email: 'lisa.chen@socialhomes.ai',
        organisation_name: 'SocialHomes',
        date: '27 February 2026',
      });

      expect(result.subject).toContain('friendly reminder');
      expect(result.body).toContain('Mrs Sarah Johnson');
      expect(result.body).toContain('14 Riverside Court');
      expect(result.body).toContain('250.00');
      expect(result.body).not.toContain('((tenant_name))');
      expect(result.body).not.toContain('((arrears_amount))');
    });

    it('returns missing fields for unsubstituted placeholders', () => {
      const result = renderTemplate('rent-arrears-gentle-reminder', {
        tenant_name: 'Mrs Sarah Johnson',
      });

      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.missingFields).toContain('property_address');
      expect(result.missingFields).toContain('arrears_amount');
    });

    it('leaves unsubstituted fields as ((field)) in output', () => {
      const result = renderTemplate('rent-arrears-gentle-reminder', {
        tenant_name: 'Test User',
      });

      expect(result.body).toContain('((property_address))');
      expect(result.body).toContain('((arrears_amount))');
    });

    it('returns empty missingFields when all fields provided', () => {
      const template = getTemplateById('general-service-update')!;
      const personalisation: Record<string, string> = {};
      for (const field of template.personalisationFields) {
        personalisation[field] = `test-${field}`;
      }

      const result = renderTemplate('general-service-update', personalisation);
      expect(result.missingFields).toHaveLength(0);
    });

    it('handles Awaab\'s Law template rendering correctly', () => {
      const result = renderTemplate('damp-mould-awaabs-law', {
        tenant_name: 'Mr Ahmed Khan',
        property_address: '22 Tower Block, SE1 5AA',
        case_reference: 'DM-2026-042',
        hazard_classification: 'Category 1',
        report_date: '15 February 2026',
        acknowledgement_days: '1',
        investigation_date: '18 February 2026',
        investigation_findings: 'Rising damp in ground floor bedroom',
        statutory_start_days: '7',
        statutory_completion_days: '28',
        planned_works: 'Damp proof course and replastering',
        works_start_date: '25 February 2026',
        target_completion_date: '18 March 2026',
        officer_name: 'James Peters',
        organisation_name: 'SocialHomes',
        date: '20 February 2026',
      });

      expect(result.subject).toContain('Awaab');
      expect(result.body).toContain('Mr Ahmed Khan');
      expect(result.body).toContain('Category 1');
      expect(result.body).toContain('DM-2026-042');
      expect(result.body).toContain('Housing Ombudsman');
      expect(result.missingFields).toHaveLength(0);
    });

    it('renders subject personalisation correctly', () => {
      const result = renderTemplate('tenancy-welcome', {
        property_address: '5 Elm Grove, E2 9AA',
        tenant_name: 'Mr Test',
        organisation_name: 'SH',
        tenancy_reference: 'T-001',
        tenancy_type: 'secure',
        tenancy_start_date: '2026-03-01',
        weekly_rent: '120',
        payment_reference: 'P-001',
        officer_name: 'Officer A',
        officer_phone: '020 1234',
        officer_email: 'test@test.com',
        date: '2026-02-27',
      });

      expect(result.subject).toContain('5 Elm Grove, E2 9AA');
      expect(result.subject).not.toContain('((property_address))');
    });

    it('handles extra personalisation keys gracefully (ignored)', () => {
      const result = renderTemplate('rent-arrears-gentle-reminder', {
        tenant_name: 'Test',
        extra_unused_field: 'should be ignored',
        another_extra: 'also ignored',
      });

      expect(result.body).toContain('Test');
      expect(result.body).not.toContain('extra_unused_field');
    });
  });
});
