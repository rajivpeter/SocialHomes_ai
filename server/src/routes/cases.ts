import { Router } from 'express';
import { collections, getDocs, getDoc, setDoc, updateDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { CaseDoc, ActivityDoc } from '../models/firestore-schemas.js';

export const casesRouter = Router();
casesRouter.use(authMiddleware);

// GET /api/v1/cases?type=repair&status=open&handler=Sarah+Mitchell&priority=emergency
casesRouter.get('/', async (req, res, next) => {
  try {
    const { type, status, handler, priority, propertyId, tenantId, limit: limitStr } = req.query;
    const filters: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];

    if (type) filters.push({ field: 'type', op: '==', value: type });
    if (status) filters.push({ field: 'status', op: '==', value: status });
    if (handler) filters.push({ field: 'handler', op: '==', value: handler });
    if (priority) filters.push({ field: 'priority', op: '==', value: priority });
    if (propertyId) filters.push({ field: 'propertyId', op: '==', value: propertyId });
    if (tenantId) filters.push({ field: 'tenantId', op: '==', value: tenantId });

    const limit = limitStr ? parseInt(limitStr as string, 10) : 200;
    const cases = await getDocs<CaseDoc>(collections.cases, filters, { field: 'createdDate', direction: 'desc' }, limit);

    res.json({
      items: cases,
      total: cases.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/cases/:id
casesRouter.get('/:id', async (req, res, next) => {
  try {
    const caseDoc = await getDoc<CaseDoc>(collections.cases, req.params.id);
    if (!caseDoc) return res.status(404).json({ error: 'Case not found' });

    // Fetch related activities
    const activities = await getDocs<ActivityDoc>(collections.activities, [
      { field: 'caseId', op: '==', value: req.params.id },
    ], { field: 'date', direction: 'desc' });

    res.json({ ...caseDoc, activities });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/cases
casesRouter.post('/', async (req, res, next) => {
  try {
    const id = `case-${Date.now()}`;
    const caseData = {
      ...req.body,
      id,
      createdDate: new Date().toISOString().split('T')[0],
      daysOpen: 0,
      slaStatus: 'within',
    };
    await setDoc(collections.cases, id, caseData);
    res.status(201).json(caseData);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/cases/:id
casesRouter.patch('/:id', async (req, res, next) => {
  try {
    await updateDoc(collections.cases, req.params.id, req.body);
    const updated = await getDoc<CaseDoc>(collections.cases, req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/cases/:id/activities
casesRouter.get('/:id/activities', async (req, res, next) => {
  try {
    const activities = await getDocs<ActivityDoc>(collections.activities, [
      { field: 'caseId', op: '==', value: req.params.id },
    ], { field: 'date', direction: 'desc' });
    res.json(activities);
  } catch (err) {
    next(err);
  }
});
