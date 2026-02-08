import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requirePersona } from '../middleware/rbac.js';
import { exportPropertyAsHact, exportTenantAsHact, exportCaseAsHact } from '../services/hact-export.js';

export const exportRouter = Router();
exportRouter.use(authMiddleware);

// GET /api/v1/export/hact/property/:id
exportRouter.get('/hact/property/:id', requirePersona('manager'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const exported = await exportPropertyAsHact(id);
    if (!exported) return res.status(404).json({ error: 'Property not found' });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=property-${id}-hact.json`);
    res.json(exported);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/export/hact/tenant/:id
exportRouter.get('/hact/tenant/:id', requirePersona('manager'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const exported = await exportTenantAsHact(id);
    if (!exported) return res.status(404).json({ error: 'Tenant not found' });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=tenant-${id}-hact.json`);
    res.json(exported);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/export/hact/case/:id
exportRouter.get('/hact/case/:id', requirePersona('manager'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const exported = await exportCaseAsHact(id);
    if (!exported) return res.status(404).json({ error: 'Case not found' });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=case-${req.params.id}-hact.json`);
    res.json(exported);
  } catch (err) {
    next(err);
  }
});
