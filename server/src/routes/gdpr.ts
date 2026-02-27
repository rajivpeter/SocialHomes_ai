// ============================================================
// SocialHomes.Ai — GDPR Routes
// SAR requests, data export, right-to-erasure, retention policies
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createSarRequest,
  updateSarStatus,
  getSarRequests,
  exportTenantData,
  processErasureRequest,
  getRetentionPolicies,
} from '../services/gdpr-export.js';

export const gdprRouter = Router();
gdprRouter.use(authMiddleware);

// GET /api/v1/gdpr/sar — list SAR requests
gdprRouter.get('/sar', async (req, res, next) => {
  try {
    const status = req.query.status as string;
    const requests = await getSarRequests(status);
    res.json({ items: requests, total: requests.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/gdpr/sar — create a new SAR request
gdprRouter.post('/sar', async (req, res, next) => {
  try {
    const { tenantId, requestType } = req.body;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    if (!requestType) return res.status(400).json({ error: 'requestType is required (subject-access, right-to-erasure, rectification, portability)' });
    const requestedBy = req.user?.displayName || req.user?.email || 'system';
    const request = await createSarRequest(tenantId, requestType, requestedBy);
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/gdpr/sar/:id — update SAR status
gdprRouter.patch('/sar/:id', async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    await updateSarStatus(req.params.id, status, notes);
    res.json({ success: true, requestId: req.params.id, status });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/gdpr/export/:tenantId — export all tenant data
gdprRouter.get('/export/:tenantId', async (req, res, next) => {
  try {
    const export_ = await exportTenantData(req.params.tenantId);
    res.json(export_);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/gdpr/erasure/:tenantId — process right-to-erasure
gdprRouter.post('/erasure/:tenantId', async (req, res, next) => {
  try {
    const requestedBy = req.user?.displayName || req.user?.email || 'system';
    const result = await processErasureRequest(req.params.tenantId, requestedBy);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/gdpr/retention-policies — view retention policies
gdprRouter.get('/retention-policies', async (_req, res) => {
  const policies = getRetentionPolicies();
  res.json({ policies, total: policies.length });
});
