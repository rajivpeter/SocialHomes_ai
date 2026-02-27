// ============================================================
// SocialHomes.Ai — Scheduled Tasks Routes
// Endpoints for task management, execution, and status
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getScheduledTasks,
  runScheduledTask,
  toggleTask,
} from '../services/scheduled-tasks.js';
import { runCacheWarming, getLastWarmingStatus } from '../services/cache-warming.js';
import { getAllCircuitBreakerStatuses, resetCircuitBreaker } from '../services/circuit-breaker.js';
import { getListenerStatus } from '../services/firestore-listeners.js';

export const scheduledTasksRouter = Router();
scheduledTasksRouter.use(authMiddleware);

// GET /api/v1/scheduled-tasks — list all tasks
scheduledTasksRouter.get('/', async (_req, res) => {
  const tasks = getScheduledTasks();
  res.json({ tasks, total: tasks.length });
});

// POST /api/v1/scheduled-tasks/:taskId/run — run a specific task
scheduledTasksRouter.post('/:taskId/run', async (req, res, next) => {
  try {
    const result = await runScheduledTask(req.params.taskId);
    res.json(result);
  } catch (err: any) {
    if (err.message?.includes('Unknown task') || err.message?.includes('disabled')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// PATCH /api/v1/scheduled-tasks/:taskId/toggle — enable/disable task
scheduledTasksRouter.patch('/:taskId/toggle', async (req, res) => {
  const { enabled } = req.body;
  const success = toggleTask(req.params.taskId, enabled);
  if (!success) return res.status(404).json({ error: 'Task not found' });
  res.json({ taskId: req.params.taskId, enabled });
});

// POST /api/v1/scheduled-tasks/cache-warming — trigger cache warming
scheduledTasksRouter.post('/cache-warming', async (req, res, next) => {
  try {
    const type = req.body.type || 'all';
    const result = await runCacheWarming(type);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/scheduled-tasks/cache-warming/status — cache warming status
scheduledTasksRouter.get('/cache-warming/status', async (_req, res, next) => {
  try {
    const status = await getLastWarmingStatus();
    res.json(status || { message: 'No warming jobs have run yet' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/scheduled-tasks/circuit-breakers — circuit breaker statuses
scheduledTasksRouter.get('/circuit-breakers', async (_req, res) => {
  const statuses = getAllCircuitBreakerStatuses();
  res.json({ circuitBreakers: statuses, total: statuses.length });
});

// POST /api/v1/scheduled-tasks/circuit-breakers/:name/reset — reset a circuit
scheduledTasksRouter.post('/circuit-breakers/:name/reset', async (req, res) => {
  const success = resetCircuitBreaker(req.params.name);
  if (!success) return res.status(404).json({ error: 'Circuit breaker not found' });
  res.json({ name: req.params.name, state: 'closed' });
});

// GET /api/v1/scheduled-tasks/listeners — Firestore listener status
scheduledTasksRouter.get('/listeners', async (_req, res) => {
  const listeners = getListenerStatus();
  res.json({ listeners });
});
