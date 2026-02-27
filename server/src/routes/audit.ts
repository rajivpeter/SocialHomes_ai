// ============================================================
// SocialHomes.Ai — Audit Log Routes
// Endpoints for querying, aggregating, and exporting audit data
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  queryAuditLog,
  aggregateAuditLog,
  exportAuditLogCsv,
  enforceRetentionPolicy,
} from '../services/audit-log.js';

export const auditRouter = Router();
auditRouter.use(authMiddleware);

// GET /api/v1/audit — query audit log
auditRouter.get('/', async (req, res, next) => {
  try {
    const params = {
      entity: req.query.entity as string,
      entityId: req.query.entityId as string,
      user: req.query.user as string,
      action: req.query.action as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      search: req.query.search as string,
      offset: parseInt(req.query.offset as string) || 0,
      limit: parseInt(req.query.limit as string) || 50,
    };
    const result = await queryAuditLog(params);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/audit/aggregate — aggregate audit data
auditRouter.get('/aggregate', async (req, res, next) => {
  try {
    const dateFrom = req.query.dateFrom as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = req.query.dateTo as string || new Date().toISOString();
    const user = req.query.user as string;
    const result = await aggregateAuditLog(dateFrom, dateTo, user);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/audit/export — export as CSV
auditRouter.get('/export', async (req, res, next) => {
  try {
    const params = {
      entity: req.query.entity as string,
      entityId: req.query.entityId as string,
      user: req.query.user as string,
      action: req.query.action as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    };
    const csv = await exportAuditLogCsv(params);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/audit/retention-cleanup — enforce retention policy (admin only)
auditRouter.post('/retention-cleanup', async (req, res, next) => {
  try {
    const years = parseInt(req.body.retentionYears as string) || 7;
    const result = await enforceRetentionPolicy(years);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
