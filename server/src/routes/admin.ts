import { Router } from 'express';
import { collections, getDocs, setDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePersona } from '../middleware/rbac.js';
import { seedFirestore } from '../services/seed.js';
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
