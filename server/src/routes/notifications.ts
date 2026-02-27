// ============================================================
// SocialHomes.Ai — Notification Routes
// Endpoints for notification preferences, history, WebSocket status
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  setUserPreferences,
  getNotificationHistory,
  getUnreadCount,
  markAllRead,
  getQueueStatus,
} from '../services/notification-dispatch.js';
import { getWebSocketStatus } from '../services/websocket.js';

export const notificationsRouter = Router();
notificationsRouter.use(authMiddleware);

// GET /api/v1/notifications — get notification history
notificationsRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.user?.uid || 'demo';
    const limit = parseInt(req.query.limit as string) || 50;
    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await getNotificationHistory(userId, limit, unreadOnly);
    res.json({ items: notifications, total: notifications.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/notifications/unread-count — get unread count
notificationsRouter.get('/unread-count', async (req, res, next) => {
  try {
    const userId = req.user?.uid || 'demo';
    const count = await getUnreadCount(userId);
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/notifications/mark-all-read — mark all as read
notificationsRouter.post('/mark-all-read', async (req, res, next) => {
  try {
    const userId = req.user?.uid || 'demo';
    const marked = await markAllRead(userId);
    res.json({ marked });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/notifications/preferences — get user preferences
notificationsRouter.get('/preferences', async (req, res) => {
  // Return defaults for demo
  res.json({
    channels: { 'in-app': true, email: true, sms: false, portal: false },
    frequency: 'immediate',
    categories: {
      'case-update': true,
      'compliance-alert': true,
      'arrears-alert': true,
      'damp-alert': true,
      system: true,
      chat: false,
      task: true,
      'sla-breach': true,
    },
    quietHours: { enabled: false, start: '22:00', end: '07:00', timezone: 'Europe/London' },
  });
});

// PUT /api/v1/notifications/preferences — update preferences
notificationsRouter.put('/preferences', async (req, res, next) => {
  try {
    const userId = req.user?.uid || 'demo';
    await setUserPreferences(userId, req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/notifications/queue-status — admin: queue status
notificationsRouter.get('/queue-status', async (_req, res, next) => {
  try {
    const status = await getQueueStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/notifications/websocket-status — admin: WebSocket status
notificationsRouter.get('/websocket-status', async (_req, res) => {
  res.json(getWebSocketStatus());
});
