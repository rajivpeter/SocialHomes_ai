import { Router } from 'express';
import { collections, getDocs, getDoc, updateDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { TenantDoc, ActivityDoc, CaseDoc } from '../models/firestore-schemas.js';

export const tenantsRouter = Router();
tenantsRouter.use(authMiddleware);

// GET /api/v1/tenants?assignedOfficer=Sarah+Mitchell&tenancyStatus=active&limit=100
tenantsRouter.get('/', async (req, res, next) => {
  try {
    const { assignedOfficer, tenancyStatus, propertyId, arrearsRiskMin, limit: limitStr } = req.query;
    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];

    if (assignedOfficer) filters.push({ field: 'assignedOfficer', op: '==', value: assignedOfficer });
    if (tenancyStatus) filters.push({ field: 'tenancyStatus', op: '==', value: tenancyStatus });
    if (propertyId) filters.push({ field: 'propertyId', op: '==', value: propertyId });
    if (arrearsRiskMin) filters.push({ field: 'arrearsRisk', op: '>=', value: parseInt(arrearsRiskMin as string, 10) });

    const limit = limitStr ? parseInt(limitStr as string, 10) : 200;
    const tenants = await getDocs<TenantDoc>(collections.tenants, filters, undefined, limit);

    res.json({
      items: tenants,
      total: tenants.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tenants/:id
tenantsRouter.get('/:id', async (req, res, next) => {
  try {
    const tenant = await getDoc<TenantDoc>(collections.tenants, req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tenants/:id/activities
tenantsRouter.get('/:id/activities', async (req, res, next) => {
  try {
    const activities = await getDocs<ActivityDoc>(collections.activities, [
      { field: 'tenantId', op: '==', value: req.params.id },
    ], { field: 'date', direction: 'desc' });
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tenants/:id/cases
tenantsRouter.get('/:id/cases', async (req, res, next) => {
  try {
    const cases = await getDocs<CaseDoc>(collections.cases, [
      { field: 'tenantId', op: '==', value: req.params.id },
    ], { field: 'createdDate', direction: 'desc' });
    res.json(cases);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/tenants/:id
tenantsRouter.patch('/:id', async (req, res, next) => {
  try {
    await updateDoc(collections.tenants, req.params.id, req.body);
    const updated = await getDoc<TenantDoc>(collections.tenants, req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
