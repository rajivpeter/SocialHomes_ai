// ============================================================
// SocialHomes.Ai — Request Metrics Middleware
// Records request count, response time, and status codes
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { recordRequest } from '../services/monitoring.js';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.route?.path || req.path;
    recordRequest(path, res.statusCode, duration);
  });
  next();
}
