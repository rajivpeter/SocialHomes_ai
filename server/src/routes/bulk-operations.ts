// ============================================================
// SocialHomes.Ai — Bulk Operations Routes
// Endpoints for batch case updates, communications, compliance
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  bulkUpdateCaseStatus,
  bulkSendCommunication,
  bulkUploadCompliance,
  bulkArrearsAction,
  getOperationStatus,
  getAllActiveOperations,
} from '../services/bulk-operations.js';

export const bulkOperationsRouter = Router();
bulkOperationsRouter.use(authMiddleware);

// POST /api/v1/bulk/cases/status — bulk update case status
bulkOperationsRouter.post('/cases/status', async (req, res, next) => {
  try {
    const { caseIds, status, notes } = req.body;
    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return res.status(400).json({ error: 'caseIds must be a non-empty array' });
    }
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    const updatedBy = req.user?.displayName || req.user?.email || 'system';
    const result = await bulkUpdateCaseStatus(caseIds, status, updatedBy, notes);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/bulk/communications — bulk send communications
bulkOperationsRouter.post('/communications', async (req, res, next) => {
  try {
    const { tenantIds, templateId, subject, body, channels } = req.body;
    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({ error: 'tenantIds must be a non-empty array' });
    }
    if (!subject || !body) {
      return res.status(400).json({ error: 'subject and body are required' });
    }
    const senderId = req.user?.uid || 'system';
    const result = await bulkSendCommunication(tenantIds, templateId, subject, body, channels || ['in-app'], senderId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/bulk/compliance — bulk upload compliance certificates
bulkOperationsRouter.post('/compliance', async (req, res, next) => {
  try {
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'updates must be a non-empty array of {propertyId, certificateType, data}' });
    }
    const uploadedBy = req.user?.displayName || req.user?.email || 'system';
    const result = await bulkUploadCompliance(updates, uploadedBy);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/bulk/arrears-action — bulk arrears action
bulkOperationsRouter.post('/arrears-action', async (req, res, next) => {
  try {
    const { tenantIds, actionType, actionDetails } = req.body;
    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({ error: 'tenantIds must be a non-empty array' });
    }
    if (!actionType) {
      return res.status(400).json({ error: 'actionType is required (pap-letter, payment-plan, welfare-visit, referral)' });
    }
    const officer = req.user?.displayName || req.user?.email || 'system';
    const result = await bulkArrearsAction(tenantIds, actionType, actionDetails || {}, officer);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/bulk/operations/:id — get operation status
bulkOperationsRouter.get('/operations/:id', async (req, res) => {
  const status = getOperationStatus(req.params.id);
  if (!status) return res.status(404).json({ error: 'Operation not found' });
  res.json(status);
});

// GET /api/v1/bulk/operations — get all active operations
bulkOperationsRouter.get('/operations', async (_req, res) => {
  const operations = getAllActiveOperations();
  res.json({ operations, total: operations.length });
});
