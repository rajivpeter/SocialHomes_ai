// ============================================================
// SocialHomes.Ai — Notification Dispatch Service
// Task 5.2.4: Orchestrate GOV.UK Notify email/SMS, in-app
// WebSocket push, notification queue, delivery tracking, retry
// ============================================================

import { db, collections, FieldValue } from './firestore.js';
import { sendToUser, sendToRole, sendToEstate, broadcast } from './websocket.js';
import { renderTemplate, getTemplateById } from './govuk-notify.js';
import type { WebSocketMessage, NotificationCategory, NotificationPriority, NotificationChannel, NotificationPreference } from '../types/websocket.js';

// ---- Notification Queue Collection ----

const notificationQueueCollection = db.collection('notificationQueue');
const notificationPrefsCollection = db.collection('notificationPreferences');

// ---- Types ----

export interface NotificationPayload {
  recipientUserId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientRole?: string;
  estateId?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  templateId?: string;
  personalisation?: Record<string, string>;
  channels?: NotificationChannel[];
  metadata?: Record<string, unknown>;
}

interface QueuedNotification {
  id: string;
  payload: NotificationPayload;
  status: 'queued' | 'processing' | 'sent' | 'failed' | 'cancelled';
  channels: NotificationChannel[];
  deliveryResults: Record<string, { sent: boolean; sentAt?: string; error?: string }>;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  processedAt?: string;
  nextRetryAt?: string;
}

// ---- Public API ----

/**
 * Dispatch a notification through all applicable channels.
 * Respects user notification preferences.
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<string> {
  const queueId = await queueNotification(payload);

  // Process immediately (async, don't block the caller)
  processNotification(queueId, payload).catch(err => {
    console.error(`[notification-dispatch] Error processing ${queueId}:`, err.message);
  });

  return queueId;
}

/**
 * Send a bulk notification to multiple users.
 */
export async function dispatchBulkNotification(
  userIds: string[],
  payload: Omit<NotificationPayload, 'recipientUserId'>,
): Promise<string[]> {
  const queueIds: string[] = [];
  for (const userId of userIds) {
    const id = await dispatchNotification({ ...payload, recipientUserId: userId });
    queueIds.push(id);
  }
  return queueIds;
}

/**
 * Send a role-based notification.
 */
export async function dispatchRoleNotification(
  role: string,
  payload: Omit<NotificationPayload, 'recipientRole'>,
): Promise<string> {
  return dispatchNotification({ ...payload, recipientRole: role });
}

/**
 * Send an estate-wide notification.
 */
export async function dispatchEstateNotification(
  estateId: string,
  payload: Omit<NotificationPayload, 'estateId'>,
): Promise<string> {
  return dispatchNotification({ ...payload, estateId });
}

// ---- Queue Management ----

async function queueNotification(payload: NotificationPayload): Promise<string> {
  const ref = await notificationQueueCollection.add({
    payload,
    status: 'queued',
    channels: payload.channels || ['in-app'],
    deliveryResults: {},
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

// ---- Processing ----

async function processNotification(queueId: string, payload: NotificationPayload): Promise<void> {
  try {
    // Update status to processing
    await notificationQueueCollection.doc(queueId).update({
      status: 'processing',
      processedAt: new Date().toISOString(),
    });

    // Get user preferences if we have a specific recipient
    let prefs: NotificationPreference | null = null;
    if (payload.recipientUserId) {
      prefs = await getUserPreferences(payload.recipientUserId);
    }

    // Determine active channels
    const channels = resolveChannels(payload, prefs);
    const deliveryResults: Record<string, { sent: boolean; sentAt?: string; error?: string }> = {};

    // Process each channel
    for (const channel of channels) {
      try {
        await deliverToChannel(channel, payload);
        deliveryResults[channel] = { sent: true, sentAt: new Date().toISOString() };
      } catch (err: any) {
        deliveryResults[channel] = { sent: false, error: err.message };
      }
    }

    // Check if all channels succeeded
    const allSent = Object.values(deliveryResults).every(r => r.sent);
    const anySent = Object.values(deliveryResults).some(r => r.sent);

    await notificationQueueCollection.doc(queueId).update({
      status: allSent ? 'sent' : (anySent ? 'sent' : 'failed'),
      deliveryResults,
      channels,
    });
  } catch (err: any) {
    // Handle retry
    const doc = await notificationQueueCollection.doc(queueId).get();
    const data = doc.data();
    const retryCount = (data?.retryCount || 0) + 1;
    const maxRetries = data?.maxRetries || 3;

    if (retryCount < maxRetries) {
      const nextRetryAt = new Date(Date.now() + retryCount * 5000).toISOString(); // exponential backoff
      await notificationQueueCollection.doc(queueId).update({
        status: 'queued',
        retryCount,
        nextRetryAt,
      });
    } else {
      await notificationQueueCollection.doc(queueId).update({
        status: 'failed',
        retryCount,
      });
    }
  }
}

// ---- Channel Delivery ----

function resolveChannels(payload: NotificationPayload, prefs: NotificationPreference | null): NotificationChannel[] {
  // If explicit channels are specified, use those
  if (payload.channels && payload.channels.length > 0) {
    return payload.channels;
  }

  // If user has preferences, respect them
  if (prefs) {
    const activeChannels: NotificationChannel[] = [];
    for (const [channel, enabled] of Object.entries(prefs.channels)) {
      if (enabled) {
        activeChannels.push(channel as NotificationChannel);
      }
    }

    // Check if this category is enabled
    if (prefs.categories && payload.category in prefs.categories) {
      if (!prefs.categories[payload.category as NotificationCategory]) {
        return ['in-app']; // Minimum: always deliver in-app for critical
      }
    }

    // Check quiet hours
    if (prefs.quietHours?.enabled && payload.priority !== 'critical') {
      const now = new Date();
      const hours = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (hours >= prefs.quietHours.start && hours <= prefs.quietHours.end) {
        return ['in-app']; // Queue for later, deliver in-app only
      }
    }

    return activeChannels.length > 0 ? activeChannels : ['in-app'];
  }

  // Default: in-app notification
  // For critical priority, also attempt email
  if (payload.priority === 'critical') {
    return ['in-app', 'email'];
  }

  return ['in-app'];
}

async function deliverToChannel(channel: NotificationChannel, payload: NotificationPayload): Promise<void> {
  switch (channel) {
    case 'in-app':
      return deliverInApp(payload);
    case 'email':
      return deliverEmail(payload);
    case 'sms':
      return deliverSms(payload);
    case 'portal':
      return deliverPortal(payload);
  }
}

async function deliverInApp(payload: NotificationPayload): Promise<void> {
  const message: WebSocketMessage = {
    type: payload.category,
    priority: payload.priority,
    title: payload.title,
    body: payload.body,
    entityType: payload.entityType,
    entityId: payload.entityId,
    actionUrl: payload.actionUrl,
    timestamp: new Date().toISOString(),
    metadata: payload.metadata,
  };

  if (payload.recipientUserId) {
    sendToUser(payload.recipientUserId, message);
  } else if (payload.recipientRole) {
    sendToRole(payload.recipientRole, message);
  } else if (payload.estateId) {
    sendToEstate(payload.estateId, message);
  } else {
    broadcast(message);
  }
}

async function deliverEmail(payload: NotificationPayload): Promise<void> {
  // GOV.UK Notify email integration
  // In demo mode, we log the email instead of sending
  if (payload.templateId && payload.personalisation) {
    try {
      const rendered = renderTemplate(payload.templateId, payload.personalisation);
      console.log(`[notification-dispatch] Email rendered for ${payload.recipientEmail || payload.recipientUserId}:`, rendered.subject);
    } catch {
      console.log(`[notification-dispatch] Email (template fallback): To=${payload.recipientEmail || payload.recipientUserId}, Subject=${payload.title}, Body=${payload.body.substring(0, 100)}...`);
    }
  } else {
    console.log(`[notification-dispatch] Email: To=${payload.recipientEmail || payload.recipientUserId}, Subject=${payload.title}`);
  }

  // In production, this would call GOV.UK Notify API:
  // const notifyClient = new NotifyClient(apiKey);
  // await notifyClient.sendEmail(templateId, emailAddress, { personalisation });
}

async function deliverSms(payload: NotificationPayload): Promise<void> {
  // GOV.UK Notify SMS integration
  console.log(`[notification-dispatch] SMS: To=${payload.recipientPhone || payload.recipientUserId}, Body=${payload.body.substring(0, 160)}`);
}

async function deliverPortal(payload: NotificationPayload): Promise<void> {
  // Tenant portal notification — stored in Firestore for tenant to view
  if (payload.recipientUserId) {
    await db.collection('portalNotifications').add({
      tenantId: payload.recipientUserId,
      title: payload.title,
      body: payload.body,
      category: payload.category,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}

// ---- User Preferences ----

async function getUserPreferences(userId: string): Promise<NotificationPreference | null> {
  try {
    const doc = await notificationPrefsCollection.doc(userId).get();
    if (!doc.exists) return null;
    return doc.data() as NotificationPreference;
  } catch {
    return null;
  }
}

export async function setUserPreferences(userId: string, prefs: Partial<NotificationPreference>): Promise<void> {
  await notificationPrefsCollection.doc(userId).set(
    { userId, ...prefs, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export async function getNotificationHistory(
  userId: string,
  limit = 50,
  unreadOnly = false,
): Promise<any[]> {
  let query: FirebaseFirestore.Query = db.collection('notifications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (unreadOnly) {
    query = db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const snapshot = await db.collection('notifications')
    .where('userId', '==', userId)
    .where('read', '==', false)
    .count()
    .get();
  return snapshot.data().count;
}

export async function markAllRead(userId: string): Promise<number> {
  const snapshot = await db.collection('notifications')
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get();

  const batch = db.batch();
  for (const doc of snapshot.docs) {
    batch.update(doc.ref, { read: true, readAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
  return snapshot.size;
}

// ---- Queue Status ----

export async function getQueueStatus(): Promise<{
  queued: number;
  processing: number;
  sent: number;
  failed: number;
}> {
  const [queued, processing, sent, failed] = await Promise.all([
    notificationQueueCollection.where('status', '==', 'queued').count().get(),
    notificationQueueCollection.where('status', '==', 'processing').count().get(),
    notificationQueueCollection.where('status', '==', 'sent').count().get(),
    notificationQueueCollection.where('status', '==', 'failed').count().get(),
  ]);

  return {
    queued: queued.data().count,
    processing: processing.data().count,
    sent: sent.data().count,
    failed: failed.data().count,
  };
}
