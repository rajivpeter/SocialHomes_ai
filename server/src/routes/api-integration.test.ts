// ============================================================
// SocialHomes.Ai — API Integration Route Tests
// Tests route handlers for properties, tenants, cases,
// compliance, briefing, reports, and auth.
// Mocks Firestore, Firebase Admin, auth middleware, and global fetch.
// Uses raw HTTP requests against ephemeral Express test servers.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from 'http';

// ── Module-level mock state (declared before vi.mock for hoisting) ──

/** In-memory Firestore document store keyed by "collectionName/docId" */
const _docStore = new Map<string, any>();
/** Tracks which collection names have been queried */
const _collectionDocs = new Map<string, any[]>();

const _mockFetch = vi.fn();

// ── Helper: populate a collection in the mock store ──
// Deep-clones each doc to prevent cross-test mutation via shared references.
function seedCollection(collectionName: string, docs: any[]) {
  const cloned = docs.map(d => JSON.parse(JSON.stringify(d)));
  _collectionDocs.set(collectionName, cloned);
  for (const doc of cloned) {
    _docStore.set(`${collectionName}/${doc.id}`, doc);
  }
}

// ── Mock @google-cloud/firestore ──
vi.mock('@google-cloud/firestore', () => {
  class Timestamp {
    _seconds: number;
    _nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this._seconds = seconds;
      this._nanoseconds = nanoseconds;
    }
    toDate(): Date {
      return new Date(this._seconds * 1000);
    }
    static fromDate(date: Date): Timestamp {
      return new Timestamp(Math.floor(date.getTime() / 1000), 0);
    }
  }

  function makeQuery(collectionName: string, filters: any[] = []) {
    return {
      where(field: string, op: string, value: any) {
        return makeQuery(collectionName, [...filters, { field, op, value }]);
      },
      orderBy() { return makeQuery(collectionName, filters); },
      limit() { return makeQuery(collectionName, filters); },
      get: async () => {
        let docs = _collectionDocs.get(collectionName) || [];
        for (const f of filters) {
          docs = docs.filter((d: any) => {
            const val = f.field.split('.').reduce((o: any, k: string) => o?.[k], d);
            switch (f.op) {
              case '==': return val === f.value;
              case '>=': return val >= f.value;
              case '<=': return val <= f.value;
              case '>': return val > f.value;
              case '<': return val < f.value;
              case '!=': return val !== f.value;
              default: return true;
            }
          });
        }
        return {
          docs: docs.map((d: any) => ({
            id: d.id,
            exists: true,
            data: () => ({ ...d }),
          })),
          empty: docs.length === 0,
          size: docs.length,
        };
      },
    };
  }

  return {
    Firestore: class {
      collection(name: string) {
        return {
          doc: (id: string) => ({
            get: async () => {
              const entry = _docStore.get(`${name}/${id}`);
              return {
                exists: !!entry,
                id,
                data: () => entry ? { ...entry } : null,
              };
            },
            set: async (data: any) => {
              _docStore.set(`${name}/${id}`, { ...data, id });
              const existing = _collectionDocs.get(name) || [];
              const idx = existing.findIndex((d: any) => d.id === id);
              if (idx >= 0) existing[idx] = { ...data, id };
              else existing.push({ ...data, id });
              _collectionDocs.set(name, existing);
            },
            update: async (data: any) => {
              const existing = _docStore.get(`${name}/${id}`);
              if (existing) {
                const updated = { ...existing, ...data };
                _docStore.set(`${name}/${id}`, updated);
                const col = _collectionDocs.get(name) || [];
                const idx = col.findIndex((d: any) => d.id === id);
                if (idx >= 0) col[idx] = updated;
                _collectionDocs.set(name, col);
              }
            },
            delete: async () => {
              _docStore.delete(`${name}/${id}`);
              const col = _collectionDocs.get(name) || [];
              _collectionDocs.set(name, col.filter((d: any) => d.id !== id));
            },
          }),
          add: async (data: any) => {
            const newId = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            _docStore.set(`${name}/${newId}`, { ...data, id: newId });
            const existing = _collectionDocs.get(name) || [];
            existing.push({ ...data, id: newId });
            _collectionDocs.set(name, existing);
            return { id: newId };
          },
          // Support query chaining directly on the collection reference
          where(field: string, op: string, value: any) {
            return makeQuery(name, [{ field, op, value }]);
          },
          orderBy() { return makeQuery(name); },
          limit() { return makeQuery(name); },
          get: async () => {
            const docs = _collectionDocs.get(name) || [];
            return {
              docs: docs.map((d: any) => ({
                id: d.id,
                exists: true,
                data: () => ({ ...d }),
              })),
              empty: docs.length === 0,
              size: docs.length,
            };
          },
        };
      }
      batch() {
        const ops: (() => Promise<void>)[] = [];
        return {
          set: (ref: any, data: any) => { ops.push(() => ref.set(data)); },
          commit: async () => { for (const op of ops) await op(); },
        };
      }
    },
    FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
    Timestamp,
  };
});

// ── Mock auth middleware — always passes with a test user ──
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: any, _res: any, next: any) => {
    _req.user = {
      uid: 'test-user',
      email: 'test@rcha.org.uk',
      persona: 'housing-officer',
      displayName: 'Test User',
    };
    next();
  },
}));

// ── Mock firebase-admin services ──
vi.mock('../services/firebase-admin.js', () => ({
  verifyIdToken: async (token: string) => {
    if (token === 'invalid-token') {
      const err: any = new Error('Invalid token');
      err.code = 'auth/argument-error';
      throw err;
    }
    if (token === 'expired-token') {
      const err: any = new Error('Token expired');
      err.code = 'auth/id-token-expired';
      throw err;
    }
    return {
      uid: 'test-user',
      email: 'test@rcha.org.uk',
      name: 'Test User',
      persona: 'housing-officer',
    };
  },
  getFirebaseAdmin: () => ({
    app: {},
    auth: {
      verifyIdToken: async () => ({
        uid: 'test-user',
        email: 'test@rcha.org.uk',
        name: 'Test User',
      }),
    },
  }),
  createAuthUser: async (email: string, _pw: string, displayName: string) => ({
    uid: `uid-${email.split('@')[0]}`,
  }),
  setCustomClaims: async () => {},
  getUserByEmail: async (email: string) => {
    const entry = _docStore.get(`users/uid-${email.split('@')[0]}`);
    return entry ? { uid: entry.id } : null;
  },
}));

// ── Stub global fetch ──
vi.stubGlobal('fetch', _mockFetch);

// ── Import routers AFTER all mocks are declared ──
import express from 'express';
import { propertiesRouter } from './properties.js';
import { tenantsRouter } from './tenants.js';
import { casesRouter } from './cases.js';
import { complianceRouter } from './compliance.js';
import { briefingRouter } from './briefing.js';
import { reportsRouter } from './reports.js';
import { authRouter } from './auth.js';

// ── Test helpers ──

function makeApp(router: any, prefix: string) {
  const app = express();
  app.use(express.json());
  app.use(prefix, router);
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  });
  return app;
}

async function request(
  app: any,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: any,
  headers?: Record<string, string>,
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      const reqHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };
      const options: http.RequestOptions = {
        hostname: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: reqHeaders,
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          server.close();
          try { resolve({ status: res.statusCode!, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode!, body: data }); }
        });
      });

      req.on('error', (err) => { server.close(); reject(err); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

// ── Seed data ──

const MOCK_PROPERTIES = [
  {
    id: 'prop-001',
    uprn: '100023456001',
    address: '1 Oak Park Road',
    postcode: 'SE15 4QN',
    blockId: 'block-001',
    estateId: 'estate-001',
    localAuthorityId: 'la-southwark',
    regionId: 'london',
    lat: 51.47,
    lng: -0.06,
    type: 'flat',
    bedrooms: 2,
    floor: 1,
    floorArea: 65,
    heatingType: 'gas-central',
    tenureType: 'social-rent',
    currentTenancyId: 'ten-001',
    isVoid: false,
    compliance: { gas: 'valid', electrical: 'valid', fire: 'valid', asbestos: 'valid', legionella: 'na', lifts: 'na', overall: 'compliant' },
    epc: { rating: 'C', sapScore: 72 },
    dampRisk: 35,
    weeklyRent: 150,
    serviceCharge: 25,
  },
  {
    id: 'prop-002',
    uprn: '100023456002',
    address: '2 Oak Park Road',
    postcode: 'SE15 4QN',
    blockId: 'block-001',
    estateId: 'estate-001',
    localAuthorityId: 'la-southwark',
    regionId: 'london',
    lat: 51.471,
    lng: -0.061,
    type: 'house',
    bedrooms: 3,
    floorArea: 85,
    heatingType: 'gas-central',
    tenureType: 'social-rent',
    isVoid: true,
    voidSince: '2026-01-15',
    compliance: { gas: 'expired', electrical: 'valid', fire: 'expiring', asbestos: 'valid', legionella: 'valid', lifts: 'valid', overall: 'non-compliant' },
    epc: { rating: 'D', sapScore: 58 },
    dampRisk: 72,
    weeklyRent: 200,
    serviceCharge: 30,
  },
  {
    id: 'prop-003',
    uprn: '100023456003',
    address: '5 Elm Gardens',
    postcode: 'SE16 1AB',
    blockId: 'block-002',
    estateId: 'estate-002',
    localAuthorityId: 'la-southwark',
    regionId: 'london',
    lat: 51.48,
    lng: -0.05,
    type: 'flat',
    bedrooms: 1,
    floorArea: 45,
    heatingType: 'electric',
    tenureType: 'affordable-rent',
    currentTenancyId: 'ten-003',
    isVoid: false,
    compliance: { gas: 'na', electrical: 'expiring', fire: 'valid', asbestos: 'valid', legionella: 'na', lifts: 'na', overall: 'expiring' },
    epc: { rating: 'B', sapScore: 82 },
    dampRisk: 15,
    weeklyRent: 180,
    serviceCharge: 20,
  },
];

const MOCK_TENANTS = [
  {
    id: 'ten-001',
    title: 'Mrs',
    firstName: 'Jane',
    lastName: 'Smith',
    dob: '1985-03-15',
    email: 'jane.smith@email.com',
    phone: '020 7946 0001',
    propertyId: 'prop-001',
    tenancyId: 'tenancy-001',
    tenancyStartDate: '2020-06-01',
    tenancyType: 'secure',
    tenancyStatus: 'active',
    household: [{ name: 'Tom Smith', relationship: 'son', age: 12 }],
    emergencyContact: { name: 'John Smith', phone: '020 7946 0002' },
    assignedOfficer: 'Sarah Mitchell',
    vulnerabilityFlags: [],
    communicationPreference: 'email',
    paymentMethod: 'direct-debit',
    rentBalance: -250,
    weeklyCharge: 150,
    arrearsRisk: 45,
    contactCount30Days: 3,
  },
  {
    id: 'ten-002',
    title: 'Mr',
    firstName: 'David',
    lastName: 'Johnson',
    dob: '1972-11-22',
    email: 'david.johnson@email.com',
    phone: '020 7946 0003',
    propertyId: 'prop-002',
    tenancyId: 'tenancy-002',
    tenancyStartDate: '2018-01-15',
    tenancyType: 'secure',
    tenancyStatus: 'active',
    household: [],
    emergencyContact: { name: 'Mary Johnson', phone: '020 7946 0004' },
    assignedOfficer: 'James Okoye',
    vulnerabilityFlags: [{ type: 'elderly', notes: 'Over 65' }],
    communicationPreference: 'phone',
    paymentMethod: 'uc-direct',
    rentBalance: -1200,
    weeklyCharge: 200,
    arrearsRisk: 85,
    contactCount30Days: 1,
  },
  {
    id: 'ten-003',
    title: 'Ms',
    firstName: 'Emily',
    lastName: 'Davis',
    dob: '1990-07-10',
    email: 'emily.davis@email.com',
    phone: '020 7946 0005',
    propertyId: 'prop-003',
    tenancyId: 'tenancy-003',
    tenancyStartDate: '2023-09-01',
    tenancyType: 'assured-shorthold',
    tenancyStatus: 'active',
    household: [],
    emergencyContact: { name: 'Richard Davis', phone: '020 7946 0006' },
    assignedOfficer: 'Sarah Mitchell',
    vulnerabilityFlags: [],
    communicationPreference: 'sms',
    paymentMethod: 'standing-order',
    rentBalance: 0,
    weeklyCharge: 180,
    arrearsRisk: 10,
    contactCount30Days: 0,
  },
];

const MOCK_CASES = [
  {
    id: 'case-001',
    reference: 'REP-2026-001',
    type: 'repair',
    tenantId: 'ten-001',
    propertyId: 'prop-001',
    subject: 'Boiler not heating water',
    description: 'Hot water stopped working two days ago',
    status: 'in-progress',
    priority: 'emergency',
    handler: 'Sarah Mitchell',
    createdDate: '2026-02-20',
    targetDate: '2026-02-21',
    daysOpen: 7,
    slaStatus: 'breached',
    sorCode: '52-10-10',
    sorDescription: 'Boiler — repair/replace',
    trade: 'plumbing',
    operative: 'Mark Stevens',
    cost: 450,
    isAwaabsLaw: false,
  },
  {
    id: 'case-002',
    reference: 'CMP-2026-001',
    type: 'complaint',
    tenantId: 'ten-002',
    propertyId: 'prop-002',
    subject: 'Delay in repair response',
    description: 'Waited 3 weeks for a non-urgent repair',
    status: 'open',
    priority: 'medium',
    handler: 'James Okoye',
    createdDate: '2026-02-18',
    targetDate: '2026-03-04',
    daysOpen: 9,
    slaStatus: 'approaching',
    stage: 1,
    category: 'service-failure',
    acknowledgedDate: '2026-02-19',
  },
  {
    id: 'case-003',
    reference: 'DMP-2026-001',
    type: 'damp-mould',
    tenantId: 'ten-001',
    propertyId: 'prop-001',
    subject: 'Black mould in bathroom',
    description: 'Extensive mould growth on bathroom ceiling',
    status: 'open',
    priority: 'high',
    handler: 'Sarah Mitchell',
    createdDate: '2026-02-10',
    targetDate: '2026-02-28',
    daysOpen: 17,
    slaStatus: 'within',
    hazardClassification: 'significant',
    dampRiskScore: 65,
    cause: 'condensation',
  },
  {
    id: 'case-004',
    reference: 'REP-2026-002',
    type: 'repair',
    tenantId: 'ten-003',
    propertyId: 'prop-003',
    subject: 'Broken window latch',
    description: 'Window latch snapped off',
    status: 'completed',
    priority: 'routine',
    handler: 'Lisa Wong',
    createdDate: '2026-01-15',
    targetDate: '2026-02-10',
    closedDate: '2026-02-08',
    daysOpen: 24,
    slaStatus: 'within',
    completionDate: '2026-02-08',
    cost: 85,
    firstTimeFix: true,
    satisfaction: 4,
  },
];

const MOCK_ACTIVITIES = [
  {
    id: 'act-001',
    caseId: 'case-001',
    tenantId: 'ten-001',
    type: 'phone-call',
    direction: 'outbound',
    subject: 'Update on boiler repair',
    description: 'Called tenant to confirm appointment',
    date: '2026-02-21',
    officer: 'Sarah Mitchell',
  },
  {
    id: 'act-002',
    caseId: 'case-001',
    tenantId: 'ten-001',
    type: 'note',
    subject: 'Parts ordered',
    description: 'Boiler control board ordered from supplier',
    date: '2026-02-22',
    officer: 'Mark Stevens',
  },
  {
    id: 'act-003',
    caseId: 'case-002',
    tenantId: 'ten-002',
    type: 'letter',
    direction: 'outbound',
    subject: 'Complaint acknowledgement',
    description: 'Stage 1 acknowledgement letter sent',
    date: '2026-02-19',
    officer: 'James Okoye',
  },
];


// ════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════

describe('API Integration Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _mockFetch.mockReset();
    _docStore.clear();
    _collectionDocs.clear();

    // Seed standard test data
    seedCollection('properties', MOCK_PROPERTIES);
    seedCollection('tenants', MOCK_TENANTS);
    seedCollection('cases', MOCK_CASES);
    seedCollection('activities', MOCK_ACTIVITIES);
    seedCollection('tsmMeasures', []);
    seedCollection('users', []);
  });

  // ══════════════════════════════════════════════════════════════
  // 1. Properties Routes
  // ══════════════════════════════════════════════════════════════
  describe('Properties — GET /api/v1/properties', () => {
    const app = () => makeApp(propertiesRouter, '/api/v1/properties');

    it('returns all properties with items array and total count', async () => {
      const res = await request(app(), 'GET', '/api/v1/properties');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(3);
      expect(res.body.total).toBe(3);
    });

    it('filters properties by type query parameter', async () => {
      const res = await request(app(), 'GET', '/api/v1/properties?type=flat');
      expect(res.status).toBe(200);
      // The route filters via Firestore where clause; our mock supports this
      for (const item of res.body.items) {
        expect(item.type).toBe('flat');
      }
    });

    it('filters properties by isVoid=true', async () => {
      const res = await request(app(), 'GET', '/api/v1/properties?isVoid=true');
      expect(res.status).toBe(200);
      for (const item of res.body.items) {
        expect(item.isVoid).toBe(true);
      }
    });

    it('filters properties by estateId', async () => {
      const res = await request(app(), 'GET', '/api/v1/properties?estateId=estate-002');
      expect(res.status).toBe(200);
      for (const item of res.body.items) {
        expect(item.estateId).toBe('estate-002');
      }
    });

    it('returns empty items array when no properties match filter', async () => {
      const res = await request(app(), 'GET', '/api/v1/properties?type=bungalow');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });

  describe('Properties — GET /api/v1/properties/available', () => {
    const app = () => makeApp(propertiesRouter, '/api/v1/properties');

    it('returns only void properties', async () => {
      const res = await request(app(), 'GET', '/api/v1/properties/available');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      for (const item of res.body.items) {
        expect(item.isVoid).toBe(true);
      }
    });
  });

  describe('Properties — GET /api/v1/properties/:id', () => {
    const app = () => makeApp(propertiesRouter, '/api/v1/properties');

    it('returns a single property by ID', async () => {
      const res = await request(app(), 'GET', '/api/v1/properties/prop-001');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('prop-001');
      expect(res.body.address).toBe('1 Oak Park Road');
      expect(res.body.postcode).toBe('SE15 4QN');
    });

    it('returns 404 for non-existent property ID', async () => {
      const res = await request(app(), 'GET', '/api/v1/properties/prop-999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Property not found');
    });
  });

  describe('Properties — PATCH /api/v1/properties/:id', () => {
    const app = () => makeApp(propertiesRouter, '/api/v1/properties');

    it('updates a property and returns the updated document', async () => {
      const res = await request(app(), 'PATCH', '/api/v1/properties/prop-001', {
        weeklyRent: 160,
      });
      expect(res.status).toBe(200);
      expect(res.body.weeklyRent).toBe(160);
      expect(res.body.id).toBe('prop-001');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 2. Tenants Routes
  // ══════════════════════════════════════════════════════════════
  describe('Tenants — GET /api/v1/tenants', () => {
    const app = () => makeApp(tenantsRouter, '/api/v1/tenants');

    it('returns all tenants with items array and total', async () => {
      const res = await request(app(), 'GET', '/api/v1/tenants');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(3);
      expect(res.body.total).toBe(3);
    });

    it('filters tenants by assignedOfficer', async () => {
      const res = await request(app(), 'GET', '/api/v1/tenants?assignedOfficer=Sarah%20Mitchell');
      expect(res.status).toBe(200);
      for (const item of res.body.items) {
        expect(item.assignedOfficer).toBe('Sarah Mitchell');
      }
      expect(res.body.items.length).toBeGreaterThan(0);
    });

    it('filters tenants by tenancyStatus', async () => {
      const res = await request(app(), 'GET', '/api/v1/tenants?tenancyStatus=active');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      for (const item of res.body.items) {
        expect(item.tenancyStatus).toBe('active');
      }
    });

    it('returns empty items for non-matching filter', async () => {
      const res = await request(app(), 'GET', '/api/v1/tenants?assignedOfficer=Nobody');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(0);
    });
  });

  describe('Tenants — GET /api/v1/tenants/:id', () => {
    const app = () => makeApp(tenantsRouter, '/api/v1/tenants');

    it('returns a single tenant by ID', async () => {
      const res = await request(app(), 'GET', '/api/v1/tenants/ten-001');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('ten-001');
      expect(res.body.firstName).toBe('Jane');
      expect(res.body.lastName).toBe('Smith');
      expect(res.body.rentBalance).toBe(-250);
    });

    it('returns 404 for non-existent tenant', async () => {
      const res = await request(app(), 'GET', '/api/v1/tenants/ten-999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Tenant not found');
    });
  });

  describe('Tenants — GET /api/v1/tenants/:id/activities', () => {
    const app = () => makeApp(tenantsRouter, '/api/v1/tenants');

    it('returns activities for a specific tenant', async () => {
      const res = await request(app(), 'GET', '/api/v1/tenants/ten-001/activities');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      for (const act of res.body) {
        expect(act.tenantId).toBe('ten-001');
      }
    });

    it('returns empty array for tenant with no activities', async () => {
      const res = await request(app(), 'GET', '/api/v1/tenants/ten-003/activities');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('Tenants — GET /api/v1/tenants/:id/cases', () => {
    const app = () => makeApp(tenantsRouter, '/api/v1/tenants');

    it('returns cases for a specific tenant', async () => {
      const res = await request(app(), 'GET', '/api/v1/tenants/ten-001/cases');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      for (const c of res.body) {
        expect(c.tenantId).toBe('ten-001');
      }
    });
  });

  describe('Tenants — PATCH /api/v1/tenants/:id', () => {
    const app = () => makeApp(tenantsRouter, '/api/v1/tenants');

    it('updates a tenant and returns the updated document', async () => {
      const res = await request(app(), 'PATCH', '/api/v1/tenants/ten-001', {
        rentBalance: -100,
      });
      expect(res.status).toBe(200);
      expect(res.body.rentBalance).toBe(-100);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 3. Cases Routes
  // ══════════════════════════════════════════════════════════════
  describe('Cases — GET /api/v1/cases', () => {
    const app = () => makeApp(casesRouter, '/api/v1/cases');

    it('returns all cases with pagination metadata', async () => {
      const res = await request(app(), 'GET', '/api/v1/cases');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(4);
      expect(res.body.total).toBe(4);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBeDefined();
    });

    it('filters cases by type', async () => {
      const res = await request(app(), 'GET', '/api/v1/cases?type=repair');
      expect(res.status).toBe(200);
      for (const item of res.body.items) {
        expect(item.type).toBe('repair');
      }
    });

    it('filters cases by status', async () => {
      const res = await request(app(), 'GET', '/api/v1/cases?status=open');
      expect(res.status).toBe(200);
      for (const item of res.body.items) {
        expect(item.status).toBe('open');
      }
    });

    it('filters cases by priority', async () => {
      const res = await request(app(), 'GET', '/api/v1/cases?priority=emergency');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      for (const item of res.body.items) {
        expect(item.priority).toBe('emergency');
      }
    });

    it('supports pagination with limit and offset', async () => {
      const res = await request(app(), 'GET', '/api/v1/cases?limit=2&offset=0');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(4);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(2);
      expect(res.body.totalPages).toBe(2);
    });

    it('returns second page with offset', async () => {
      const res = await request(app(), 'GET', '/api/v1/cases?limit=2&offset=2');
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.page).toBe(2);
    });

    it('sorts cases by createdDate descending', async () => {
      const res = await request(app(), 'GET', '/api/v1/cases');
      expect(res.status).toBe(200);
      const dates = res.body.items.map((c: any) => c.createdDate);
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1] >= dates[i]).toBe(true);
      }
    });
  });

  describe('Cases — GET /api/v1/cases/:id', () => {
    const app = () => makeApp(casesRouter, '/api/v1/cases');

    it('returns a single case with related activities', async () => {
      const res = await request(app(), 'GET', '/api/v1/cases/case-001');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('case-001');
      expect(res.body.subject).toBe('Boiler not heating water');
      expect(res.body.activities).toBeDefined();
      expect(Array.isArray(res.body.activities)).toBe(true);
      expect(res.body.activities.length).toBeGreaterThan(0);
    });

    it('returns 404 for non-existent case', async () => {
      const res = await request(app(), 'GET', '/api/v1/cases/case-999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Case not found');
    });
  });

  describe('Cases — POST /api/v1/cases', () => {
    const app = () => makeApp(casesRouter, '/api/v1/cases');

    it('creates a new case and returns it with 201', async () => {
      const newCase = {
        type: 'repair',
        tenantId: 'ten-001',
        propertyId: 'prop-001',
        subject: 'Leaking tap',
        description: 'Kitchen tap dripping continuously',
        status: 'open',
        priority: 'routine',
        handler: 'Sarah Mitchell',
      };
      const res = await request(app(), 'POST', '/api/v1/cases', newCase);
      expect(res.status).toBe(201);
      expect(res.body.id).toMatch(/^case-/);
      expect(res.body.subject).toBe('Leaking tap');
      expect(res.body.daysOpen).toBe(0);
      expect(res.body.slaStatus).toBe('within');
      expect(res.body.createdDate).toBeDefined();
    });
  });

  describe('Cases — PATCH /api/v1/cases/:id', () => {
    const app = () => makeApp(casesRouter, '/api/v1/cases');

    it('updates a case and returns the updated document', async () => {
      const res = await request(app(), 'PATCH', '/api/v1/cases/case-001', {
        status: 'completed',
        completionDate: '2026-02-27',
      });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.completionDate).toBe('2026-02-27');
    });
  });

  describe('Cases — GET /api/v1/cases/:id/activities', () => {
    const app = () => makeApp(casesRouter, '/api/v1/cases');

    it('returns activities for a specific case', async () => {
      const res = await request(app(), 'GET', '/api/v1/cases/case-001/activities');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      for (const act of res.body) {
        expect(act.caseId).toBe('case-001');
      }
    });

    it('returns empty array for case with no activities', async () => {
      const res = await request(app(), 'GET', '/api/v1/cases/case-003/activities');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 4. Compliance Routes
  // ══════════════════════════════════════════════════════════════
  describe('Compliance — GET /api/v1/compliance/overview', () => {
    const app = () => makeApp(complianceRouter, '/api/v1/compliance');

    it('returns compliance overview with overall stats', async () => {
      const res = await request(app(), 'GET', '/api/v1/compliance/overview');
      expect(res.status).toBe(200);
      expect(res.body.overall).toBeDefined();
      expect(res.body.overall.totalProperties).toBe(3);
      expect(res.body.overall.compliant).toBeDefined();
      expect(res.body.overall.complianceRate).toBeDefined();
    });

    it('returns big6 compliance breakdown', async () => {
      const res = await request(app(), 'GET', '/api/v1/compliance/overview');
      expect(res.status).toBe(200);
      expect(res.body.big6).toBeDefined();
      expect(res.body.big6.gas).toBeDefined();
      expect(res.body.big6.electrical).toBeDefined();
      expect(res.body.big6.fire).toBeDefined();
      expect(res.body.big6.asbestos).toBeDefined();
      expect(res.body.big6.legionella).toBeDefined();
      expect(res.body.big6.lifts).toBeDefined();
    });

    it('includes gas compliance counts that add up to total properties', async () => {
      const res = await request(app(), 'GET', '/api/v1/compliance/overview');
      const gas = res.body.big6.gas;
      expect(gas.valid + gas.expiring + gas.expired + gas.na).toBe(gas.total);
    });

    it('returns damp and mould statistics', async () => {
      const res = await request(app(), 'GET', '/api/v1/compliance/overview');
      expect(res.body.dampMould).toBeDefined();
      expect(res.body.dampMould.activeCases).toBeDefined();
      expect(res.body.dampMould.highRiskProperties).toBeDefined();
      // prop-002 has dampRisk=72 > 50
      expect(res.body.dampMould.highRiskProperties).toBe(1);
    });

    it('correctly counts damp-mould case classifications', async () => {
      const res = await request(app(), 'GET', '/api/v1/compliance/overview');
      // We have one open damp-mould case with hazardClassification='significant'
      expect(res.body.dampMould.significantCases).toBe(1);
      expect(res.body.dampMould.emergencyCases).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 5. Briefing Routes
  // ══════════════════════════════════════════════════════════════
  describe('Briefing — GET /api/v1/briefing', () => {
    const app = () => makeApp(briefingRouter, '/api/v1/briefing');

    it('returns briefing with persona, kpis, urgentItems, and tasks', async () => {
      const res = await request(app(), 'GET', '/api/v1/briefing');
      expect(res.status).toBe(200);
      expect(res.body.persona).toBe('housing-officer');
      expect(res.body.date).toBeDefined();
      expect(res.body.kpis).toBeDefined();
      expect(res.body.urgentItems).toBeDefined();
      expect(res.body.tasks).toBeDefined();
    });

    it('returns correct KPI counts', async () => {
      const res = await request(app(), 'GET', '/api/v1/briefing');
      const kpis = res.body.kpis;
      // housing-officer persona scoped to Sarah Mitchell
      // Sarah Mitchell handles case-001 (repair, emergency, in-progress) and case-003 (damp-mould, open)
      expect(kpis.emergencyRepairs).toBeGreaterThanOrEqual(0);
      expect(kpis.openRepairs).toBeDefined();
      expect(kpis.openComplaints).toBeDefined();
      expect(kpis.openDampCases).toBeDefined();
      expect(kpis.totalArrears).toBeDefined();
      expect(kpis.dampRiskProperties).toBeDefined();
    });

    it('scopes data to housing-officer persona (Sarah Mitchell)', async () => {
      const res = await request(app(), 'GET', '/api/v1/briefing');
      // Sarah Mitchell has 2 cases: case-001 (emergency repair) and case-003 (damp-mould)
      // She also has tenants ten-001 and ten-003 assigned
      expect(res.body.kpis.totalTenants).toBe(2); // ten-001 and ten-003
    });

    it('includes emergency repairs in urgent items when present', async () => {
      const res = await request(app(), 'GET', '/api/v1/briefing');
      // case-001 is an emergency repair handled by Sarah Mitchell
      const emergencyItem = res.body.urgentItems.find((u: any) => u.type === 'emergency-repairs');
      expect(emergencyItem).toBeDefined();
      expect(emergencyItem.count).toBeGreaterThan(0);
    });

    it('includes SLA breach alerts in urgent items', async () => {
      const res = await request(app(), 'GET', '/api/v1/briefing');
      // case-001 has slaStatus='breached' and handler='Sarah Mitchell'
      const slaItem = res.body.urgentItems.find((u: any) => u.type === 'sla-breaches');
      expect(slaItem).toBeDefined();
      expect(slaItem.count).toBeGreaterThan(0);
    });

    it('calculates total arrears from scoped tenants', async () => {
      const res = await request(app(), 'GET', '/api/v1/briefing');
      // Sarah Mitchell's tenants: ten-001 (balance=-250), ten-003 (balance=0)
      // tenantsInArrears: ten-001 only
      expect(res.body.kpis.totalArrears).toBe(250);
      expect(res.body.kpis.tenantsInArrears).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 6. Reports Routes
  // ══════════════════════════════════════════════════════════════
  describe('Reports — GET /api/v1/reports/tsm', () => {
    const app = () => makeApp(reportsRouter, '/api/v1/reports');

    it('returns computed TSM measures when tsmMeasures collection is empty', async () => {
      const res = await request(app(), 'GET', '/api/v1/reports/tsm');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      // Check that standard TSM codes are present
      const codes = res.body.map((m: any) => m.code);
      expect(codes).toContain('TP01');
      expect(codes).toContain('BS01');
    });

    it('returns TSM measure schema with expected fields', async () => {
      const res = await request(app(), 'GET', '/api/v1/reports/tsm');
      const measure = res.body[0];
      expect(measure).toHaveProperty('id');
      expect(measure).toHaveProperty('code');
      expect(measure).toHaveProperty('name');
      expect(measure).toHaveProperty('actual');
      expect(measure).toHaveProperty('target');
      expect(measure).toHaveProperty('sectorMedian');
      expect(measure).toHaveProperty('unit');
    });

    it('returns pre-stored TSM measures when collection has data', async () => {
      const storedMeasures = [
        { id: 'TP01', code: 'TP01', name: 'Overall satisfaction', actual: 80, target: 75, sectorMedian: 73, unit: '%' },
      ];
      seedCollection('tsmMeasures', storedMeasures);

      const res = await request(app(), 'GET', '/api/v1/reports/tsm');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].actual).toBe(80);
    });

    it('computes gas safety compliance from property data', async () => {
      const res = await request(app(), 'GET', '/api/v1/reports/tsm');
      const bs01 = res.body.find((m: any) => m.code === 'BS01');
      expect(bs01).toBeDefined();
      // prop-001: gas=valid, prop-002: gas=expired, prop-003: gas=na
      // valid+na = 2 out of 3 = 66.7%
      expect(bs01.actual).toBeCloseTo(66.7, 0);
    });
  });

  describe('Reports — GET /api/v1/reports/regulatory', () => {
    const app = () => makeApp(reportsRouter, '/api/v1/reports');

    it('returns regulatory report with expected fields', async () => {
      const res = await request(app(), 'GET', '/api/v1/reports/regulatory');
      expect(res.status).toBe(200);
      expect(res.body.period).toBe('2025-26');
      expect(res.body.organisation).toBe('Riverside Community Housing Association');
      expect(res.body.registrationNumber).toBe('RP-4872');
      expect(res.body.totalUnits).toBe(3);
    });

    it('correctly calculates occupancy vs void counts', async () => {
      const res = await request(app(), 'GET', '/api/v1/reports/regulatory');
      // prop-001: not void, prop-002: void, prop-003: not void
      expect(res.body.occupancy).toBe(2);
      expect(res.body.voids).toBe(1);
      expect(res.body.occupancyRate).toBeCloseTo(66.7, 0);
    });

    it('sums total arrears from tenants with negative rent balance', async () => {
      const res = await request(app(), 'GET', '/api/v1/reports/regulatory');
      // ten-001: -250, ten-002: -1200, ten-003: 0
      expect(res.body.currentArrears).toBe(1450);
    });

    it('counts open repairs and complaints', async () => {
      const res = await request(app(), 'GET', '/api/v1/reports/regulatory');
      // case-001: repair, in-progress (open); case-004: repair, completed (not open)
      expect(res.body.openRepairs).toBe(1);
      // case-002: complaint, open
      expect(res.body.openComplaints).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // 7. Auth Routes
  // ══════════════════════════════════════════════════════════════
  describe('Auth — POST /api/v1/auth/profile', () => {
    const app = () => makeApp(authRouter, '/api/v1/auth');

    it('returns 401 when no authorization header is provided', async () => {
      const res = await request(app(), 'POST', '/api/v1/auth/profile', { name: 'Test' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('No authorization token provided');
    });

    it('creates a new user profile on first registration', async () => {
      const res = await request(app(), 'POST', '/api/v1/auth/profile', { name: 'New User' }, {
        'Authorization': 'Bearer valid-token',
      });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('created');
      expect(res.body.profile.email).toBe('test@rcha.org.uk');
      expect(res.body.profile.persona).toBe('housing-officer');
    });

    it('returns existing profile if user already has one', async () => {
      // Seed an existing user profile
      seedCollection('users', [{
        id: 'test-user',
        email: 'test@rcha.org.uk',
        displayName: 'Existing User',
        persona: 'manager',
      }]);

      const res = await request(app(), 'POST', '/api/v1/auth/profile', {}, {
        'Authorization': 'Bearer valid-token',
      });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('existing');
      expect(res.body.profile.displayName).toBe('Existing User');
    });

    it('returns 401 for an invalid token', async () => {
      const res = await request(app(), 'POST', '/api/v1/auth/profile', {}, {
        'Authorization': 'Bearer invalid-token',
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid or expired token');
    });

    it('returns 401 for an expired token', async () => {
      const res = await request(app(), 'POST', '/api/v1/auth/profile', {}, {
        'Authorization': 'Bearer expired-token',
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid or expired token');
    });
  });

  describe('Auth — GET /api/v1/auth/me', () => {
    const app = () => makeApp(authRouter, '/api/v1/auth');

    it('returns 401 when no authorization header is provided', async () => {
      const res = await request(app(), 'GET', '/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('No authorization token provided');
    });

    it('returns user profile for a valid token', async () => {
      // Seed a user profile
      seedCollection('users', [{
        id: 'test-user',
        email: 'test@rcha.org.uk',
        displayName: 'Test User',
        persona: 'housing-officer',
        teamId: 'southwark-lewisham',
        patchIds: ['oak-park'],
      }]);

      const res = await request(app(), 'GET', '/api/v1/auth/me', undefined, {
        'Authorization': 'Bearer valid-token',
      });
      expect(res.status).toBe(200);
      expect(res.body.uid).toBe('test-user');
      expect(res.body.email).toBe('test@rcha.org.uk');
      expect(res.body.persona).toBe('housing-officer');
      expect(res.body.teamId).toBe('southwark-lewisham');
      expect(res.body.patchIds).toContain('oak-park');
    });

    it('falls back to token claims when no Firestore profile exists', async () => {
      const res = await request(app(), 'GET', '/api/v1/auth/me', undefined, {
        'Authorization': 'Bearer valid-token',
      });
      expect(res.status).toBe(200);
      expect(res.body.uid).toBe('test-user');
      expect(res.body.email).toBe('test@rcha.org.uk');
      // Falls back to decoded token persona
      expect(res.body.persona).toBe('housing-officer');
    });

    it('returns 401 for an invalid token', async () => {
      const res = await request(app(), 'GET', '/api/v1/auth/me', undefined, {
        'Authorization': 'Bearer invalid-token',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Auth — POST /api/v1/auth/seed-users', () => {
    const app = () => makeApp(authRouter, '/api/v1/auth');

    it('seeds demo users and returns results', async () => {
      const res = await request(app(), 'POST', '/api/v1/auth/seed-users');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBe(5);
      // Each user should have email, uid, persona, status
      for (const user of res.body.users) {
        expect(user.email).toBeDefined();
        expect(user.uid).toBeDefined();
        expect(user.persona).toBeDefined();
        expect(user.status).toBeDefined();
      }
    });
  });
});
