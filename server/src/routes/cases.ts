import { Router } from 'express';
import { collections, getDocs, getDoc, setDoc, updateDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { CaseDoc, ActivityDoc } from '../models/firestore-schemas.js';

export const casesRouter = Router();
casesRouter.use(authMiddleware);

/** Parse date strings in DD/MM/YYYY or YYYY-MM-DD format to epoch ms for sorting */
function parseFlexDate(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  // DD/MM/YYYY format (UK)
  const ukMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ukMatch) {
    return new Date(`${ukMatch[3]}-${ukMatch[2]}-${ukMatch[1]}`).getTime() || 0;
  }
  // ISO YYYY-MM-DD or full ISO string
  const ts = new Date(dateStr).getTime();
  return isNaN(ts) ? 0 : ts;
}

// GET /api/v1/cases?type=repair&status=open&handler=Sarah+Mitchell&priority=emergency
casesRouter.get('/', async (req, res, next) => {
  try {
    const { type, status, handler, priority, propertyId, tenantId, limit: limitStr, offset: offsetStr } = req.query;
    const limit = limitStr ? parseInt(limitStr as string, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr as string, 10) : 0;

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

    // Sort by createdDate descending — handles both DD/MM/YYYY and YYYY-MM-DD formats
    cases.sort((a, b) => {
      const dateA = parseFlexDate(a.createdDate);
      const dateB = parseFlexDate(b.createdDate);
      return dateB - dateA;
    });

    const total = cases.length;
    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    // Apply pagination
    cases = cases.slice(offset, offset + limit);

    res.json({
      items: cases,
      total,
      page,
      pageSize: limit,
      totalPages,
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
    // Read old status before updating so we can log status transitions
    let oldStatus: string | undefined;
    if (req.body.status) {
      const existing = await getDoc<CaseDoc>(collections.cases, req.params.id);
      oldStatus = existing?.status;
    }

    await updateDoc(collections.cases, req.params.id, req.body);
    const updated = await getDoc<CaseDoc>(collections.cases, req.params.id);

    // Log activity when status changes
    if (req.body.status && oldStatus && req.body.status !== oldStatus && updated) {
      const activityId = `act-${Date.now()}`;
      await setDoc(collections.activities, activityId, {
        id: activityId,
        caseId: req.params.id,
        tenantId: updated.tenantId,
        type: 'system',
        subject: `Status changed to ${req.body.status}`,
        description: `Case ${updated.reference} status updated from ${oldStatus} to ${req.body.status}`,
        date: new Date().toISOString().split('T')[0],
        officer: 'System',
      });
    }

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
