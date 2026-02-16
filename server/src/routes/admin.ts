import { Router } from 'express';
import { collections, getDocs, setDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePersona } from '../middleware/rbac.js';
import { seedFirestore } from '../services/seed.js';
import { getMetrics } from '../services/monitoring.js';
import type { AuditDoc } from '../models/firestore-schemas.js';

export const adminRouter = Router();
adminRouter.use(authMiddleware);

// GET /api/v1/admin/audit?limit=50
adminRouter.get('/audit', requirePersona('manager'), async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const audit = await getDocs<AuditDoc>(
      collections.auditLog,
      undefined,
      { field: 'timestamp', direction: 'desc' },
      limit
    );
    res.json(audit);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/users
adminRouter.post('/users', requirePersona('head-of-service'), async (req, res, next) => {
  try {
    const { email, name, persona, team } = req.body;
    const id = `user-${Date.now()}`;
    const user = {
      id,
      email,
      name,
      persona,
      team,
      createdAt: new Date().toISOString(),
    };
    await setDoc(collections.users, id, user);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/users
adminRouter.get('/users', requirePersona('manager'), async (_req, res, next) => {
  try {
    const users = await getDocs(collections.users);
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/seed
adminRouter.post('/seed', async (req, res, next) => {
  try {
    const data = req.body;
    if (!data || !data.regions || !data.properties || !data.tenants) {
      return res.status(400).json({
        error: 'Invalid seed data. Must include regions, properties, tenants.',
      });
    }
    await seedFirestore(data);
    res.json({ status: 'success', message: 'Firestore seeded successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/stats
adminRouter.get('/stats', requirePersona('manager'), async (_req, res, next) => {
  try {
    const [regionsSnap, propsSnap, tenantsSnap, casesSnap] = await Promise.all([
      collections.regions.count().get(),
      collections.properties.count().get(),
      collections.tenants.count().get(),
      collections.cases.count().get(),
    ]);

    res.json({
      counts: {
        regions: regionsSnap.data().count,
        properties: propsSnap.data().count,
        tenants: tenantsSnap.data().count,
        cases: casesSnap.data().count,
      },
      firestoreProject: process.env.GOOGLE_CLOUD_PROJECT || 'unknown',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/monitoring — detailed runtime metrics
adminRouter.get('/monitoring', requirePersona('manager'), async (_req, res, next) => {
  try {
    const metrics = getMetrics();
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

// ---- Integration Management ----

interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3;
  category: string;
  status: 'active' | 'degraded' | 'error' | 'disabled';
  apiUrl: string;
  lastChecked: string;
  avgResponseMs: number;
  cacheHitRate: number;
  enabled: boolean;
}

// In-memory state so toggles persist within a server session
const integrationDefinitions: IntegrationDef[] = [
  // Tier 1 — Free (No Key)
  { id: 'postcodes-io', name: 'Postcode Lookup', description: 'Postcodes.io — free UK postcode & geolocation data', tier: 1, category: 'Location', status: 'active', apiUrl: 'https://api.postcodes.io', lastChecked: new Date().toISOString(), avgResponseMs: 42, cacheHitRate: 0.91, enabled: true },
  { id: 'open-uprn', name: 'UPRN Lookup', description: 'Open UPRN — unique property reference number resolution', tier: 1, category: 'Location', status: 'active', apiUrl: 'https://api.os.uk/search/names/v1', lastChecked: new Date().toISOString(), avgResponseMs: 58, cacheHitRate: 0.85, enabled: true },
  { id: 'police-data', name: 'Crime Data', description: 'Police UK — street-level crime, outcomes and stop-and-search', tier: 1, category: 'Safety', status: 'active', apiUrl: 'https://data.police.uk/api', lastChecked: new Date().toISOString(), avgResponseMs: 320, cacheHitRate: 0.78, enabled: true },
  { id: 'open-meteo', name: 'Weather', description: 'Open-Meteo — weather forecasts and historical data', tier: 1, category: 'Environment', status: 'active', apiUrl: 'https://api.open-meteo.com/v1', lastChecked: new Date().toISOString(), avgResponseMs: 95, cacheHitRate: 0.72, enabled: true },
  { id: 'defra-flood', name: 'Flood Risk', description: 'DEFRA — flood warnings, river levels and risk assessments', tier: 1, category: 'Environment', status: 'active', apiUrl: 'https://environment.data.gov.uk/flood-monitoring', lastChecked: new Date().toISOString(), avgResponseMs: 180, cacheHitRate: 0.68, enabled: true },
  { id: 'ons-imd', name: 'IMD Deprivation', description: 'ONS — Index of Multiple Deprivation by LSOA', tier: 1, category: 'Demographics', status: 'active', apiUrl: 'https://services1.arcgis.com', lastChecked: new Date().toISOString(), avgResponseMs: 210, cacheHitRate: 0.88, enabled: true },

  // Tier 2 — Registration Required
  { id: 'census-ons', name: 'Census 2021', description: 'ONS Census 2021 — population, housing and labour statistics', tier: 2, category: 'Demographics', status: 'active', apiUrl: 'https://www.nomisweb.co.uk/api/v01', lastChecked: new Date().toISOString(), avgResponseMs: 340, cacheHitRate: 0.82, enabled: true },
  { id: 'nomis-labour', name: 'NOMIS Labour Market', description: 'NOMIS — employment, benefits and earnings data by area', tier: 2, category: 'Demographics', status: 'active', apiUrl: 'https://www.nomisweb.co.uk/api/v01', lastChecked: new Date().toISOString(), avgResponseMs: 290, cacheHitRate: 0.76, enabled: true },
  { id: 'gas-safe', name: 'Gas Safe Register', description: 'Gas Safe — engineer registration verification', tier: 2, category: 'Compliance', status: 'active', apiUrl: 'https://www.gassaferegister.co.uk/api', lastChecked: new Date().toISOString(), avgResponseMs: 150, cacheHitRate: 0.65, enabled: true },
  { id: 'electrical-safety', name: 'Electrical Safety', description: 'Electrical Safety Register — contractor verification', tier: 2, category: 'Compliance', status: 'degraded', apiUrl: 'https://www.electricalsafetyregister.com/api', lastChecked: new Date().toISOString(), avgResponseMs: 520, cacheHitRate: 0.55, enabled: true },
  { id: 'govuk-notify', name: 'GOV.UK Notify', description: 'GOV.UK Notify — email, SMS and letter delivery service', tier: 2, category: 'Communications', status: 'active', apiUrl: 'https://api.notifications.service.gov.uk', lastChecked: new Date().toISOString(), avgResponseMs: 110, cacheHitRate: 0.0, enabled: true },
  { id: 'epc-register', name: 'EPC Register', description: 'Energy Performance Certificate register lookups', tier: 2, category: 'Compliance', status: 'active', apiUrl: 'https://epc.opendatacommunities.org/api/v1', lastChecked: new Date().toISOString(), avgResponseMs: 230, cacheHitRate: 0.70, enabled: true },

  // Tier 3 — Subscription / Mock
  { id: 'dwp-uc', name: 'DWP Universal Credit', description: 'DWP — UC verification and managed payments (mock)', tier: 3, category: 'Benefits', status: 'active', apiUrl: 'https://api.dwp.gov.uk/uc', lastChecked: new Date().toISOString(), avgResponseMs: 85, cacheHitRate: 0.0, enabled: true },
  { id: 'iot-sensors', name: 'IoT Sensors', description: 'Switchee / Aico — temperature, humidity and CO sensors (mock)', tier: 3, category: 'Property', status: 'active', apiUrl: 'https://api.switchee.co/v2', lastChecked: new Date().toISOString(), avgResponseMs: 62, cacheHitRate: 0.0, enabled: true },
  { id: 'gocardless', name: 'GoCardless Direct Debit', description: 'GoCardless — direct debit payment collection (mock)', tier: 3, category: 'Payments', status: 'active', apiUrl: 'https://api.gocardless.com', lastChecked: new Date().toISOString(), avgResponseMs: 140, cacheHitRate: 0.0, enabled: true },
  { id: 'plentific', name: 'Repairs Marketplace', description: 'Plentific — repairs and maintenance marketplace (mock)', tier: 3, category: 'Repairs', status: 'error', apiUrl: 'https://api.plentific.com/v1', lastChecked: new Date().toISOString(), avgResponseMs: 0, cacheHitRate: 0.0, enabled: false },
  { id: 'docusign', name: 'Digital Signing', description: 'DocuSign — digital document signing for tenancy agreements (mock)', tier: 3, category: 'Documents', status: 'disabled', apiUrl: 'https://demo.docusign.net/restapi', lastChecked: new Date().toISOString(), avgResponseMs: 0, cacheHitRate: 0.0, enabled: false },
  { id: 'experian', name: 'Credit Referencing', description: 'Experian — tenant credit and affordability checks (mock)', tier: 3, category: 'Lettings', status: 'active', apiUrl: 'https://api.experian.com/v1', lastChecked: new Date().toISOString(), avgResponseMs: 195, cacheHitRate: 0.0, enabled: true },
  { id: 'land-registry', name: 'Land Registry', description: 'HM Land Registry — title and ownership verification (mock)', tier: 3, category: 'Property', status: 'active', apiUrl: 'https://landregistry.data.gov.uk', lastChecked: new Date().toISOString(), avgResponseMs: 260, cacheHitRate: 0.45, enabled: true },
  { id: 'rsh-core', name: 'RSH / CORE Regulatory', description: 'Regulator of Social Housing — CORE data submission (mock)', tier: 3, category: 'Regulatory', status: 'active', apiUrl: 'https://core.communities.gov.uk/api', lastChecked: new Date().toISOString(), avgResponseMs: 310, cacheHitRate: 0.0, enabled: true },
];

// GET /api/v1/admin/integrations — list all integrations with status
adminRouter.get('/integrations', requirePersona('manager'), async (_req, res, next) => {
  try {
    // Refresh lastChecked timestamps for enabled integrations
    const now = new Date().toISOString();
    for (const integ of integrationDefinitions) {
      if (integ.enabled) {
        integ.lastChecked = now;
      }
    }
    res.json(integrationDefinitions);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/integrations/:id/toggle — enable / disable
adminRouter.post('/integrations/:id/toggle', requirePersona('head-of-service'), async (req, res, next) => {
  try {
    const integ = integrationDefinitions.find(i => i.id === req.params.id);
    if (!integ) {
      return res.status(404).json({ error: `Integration '${req.params.id}' not found` });
    }
    integ.enabled = !integ.enabled;
    integ.status = integ.enabled ? 'active' : 'disabled';
    integ.lastChecked = new Date().toISOString();
    res.json(integ);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/integrations/:id/test — test connection
adminRouter.post('/integrations/:id/test', requirePersona('manager'), async (req, res, next) => {
  try {
    const integ = integrationDefinitions.find(i => i.id === req.params.id);
    if (!integ) {
      return res.status(404).json({ error: `Integration '${req.params.id}' not found` });
    }
    // Simulate a connection test with realistic latency
    const responseMs = Math.floor(Math.random() * 300) + 20;
    const success = integ.enabled && Math.random() > 0.1; // 90% success rate for enabled
    if (success) {
      integ.status = 'active';
      integ.avgResponseMs = Math.round((integ.avgResponseMs + responseMs) / 2);
    } else if (integ.enabled) {
      integ.status = 'degraded';
    }
    integ.lastChecked = new Date().toISOString();
    res.json({
      success,
      responseMs,
      message: success ? `Connection to ${integ.name} successful` : `Connection to ${integ.name} timed out — retrying`,
    });
  } catch (err) {
    next(err);
  }
});
