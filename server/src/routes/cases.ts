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
    const limit = limitStr ? parseInt(limitStr as string, 10) : 200;

    // Fetch all cases (no composite index needed), then filter + sort in memory.
    // With ~300 cases this is fast and avoids Firestore composite index requirements.
    let cases = await getDocs<CaseDoc>(collections.cases, undefined, undefined, 1000);

    // Apply filters in memory
    if (type) cases = cases.filter(c => c.type === type);
    if (status) cases = cases.filter(c => c.status === status);
    if (handler) cases = cases.filter(c => c.handler === handler);
    if (priority) cases = cases.filter(c => c.priority === priority);
    if (propertyId) cases = cases.filter(c => c.propertyId === propertyId);
    if (tenantId) cases = cases.filter(c => c.tenantId === tenantId);

    // Sort by createdDate descending
    cases.sort((a, b) => {
      const dateA = a.createdDate || '';
      const dateB = b.createdDate || '';
      return dateB.localeCompare(dateA);
    });

    // Apply limit
    if (cases.length > limit) cases = cases.slice(0, limit);

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

    // Fetch related activities (filter in memory to avoid composite index)
    const allActivities = await getDocs<ActivityDoc>(collections.activities);
    const activities = allActivities
      .filter(a => a.caseId === req.params.id)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

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
    const caseId = req.params.id;
    // Filter in memory to avoid composite index requirement
    const allActivities = await getDocs<ActivityDoc>(collections.activities);
    const activities = allActivities
      .filter(a => a.caseId === caseId)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.json(activities);
  } catch (err) {
    next(err);
  }
});
