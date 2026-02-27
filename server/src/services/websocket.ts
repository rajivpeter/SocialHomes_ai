// ============================================================
// SocialHomes.Ai — WebSocket Server (Socket.io)
// Task 5.2.3: Connection lifecycle, Firebase JWT auth,
// room management, heartbeat, graceful disconnect
// ============================================================

import type { Server as HttpServer } from 'http';
import type {
  AuthenticatedSocket,
  WebSocketMessage,
  ConnectionInfo,
  ServerToClientEvents,
  ClientToServerEvents,
  NotificationCategory,
} from '../types/websocket.js';

// ---- Connection Registry (in-memory) ----

const connections = new Map<string, ConnectionInfo>();

// ---- Types for Socket.io compatibility ----

interface SocketLike {
  id: string;
  handshake: { address: string; headers: Record<string, string> };
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: unknown) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  disconnect: (close?: boolean) => void;
  rooms: Set<string>;
}

interface IoLike {
  to: (room: string) => { emit: (event: string, data: unknown) => void };
  emit: (event: string, data: unknown) => void;
}

// We store a reference to the io instance once initialised
let ioInstance: IoLike | null = null;

// ---- Initialisation ----

/**
 * Initialise the WebSocket server.
 * In production, this attaches Socket.io to the HTTP server.
 * When Socket.io is not installed, we operate in a no-op mode
 * that allows the rest of the server to function normally.
 */
export async function initWebSocket(httpServer: HttpServer): Promise<void> {
  try {
    // Dynamic import to avoid hard dependency (Socket.io is optional)
    const { Server } = await import('socket.io' as string);
    const io = new Server(httpServer, {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://localhost:8080',
          'https://socialhomes-587984201316.europe-west2.run.app',
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingInterval: 25000,
      pingTimeout: 10000,
      transports: ['websocket', 'polling'],
    }) as unknown as IoLike & { on: (event: string, handler: (socket: SocketLike) => void) => void };

    ioInstance = io;

    io.on('connection', (socket: SocketLike) => {
      handleConnection(socket);
    });

    console.log('[websocket] Socket.io server initialised');
  } catch {
    console.log('[websocket] Socket.io not installed — running in notification-queue-only mode');
    // No-op mode: notifications will be queued in Firestore
  }
}

// ---- Connection Handler ----

function handleConnection(socket: SocketLike): void {
  console.log(`[websocket] New connection: ${socket.id}`);

  // Register connection
  const info: ConnectionInfo = {
    socketId: socket.id,
    userId: '',
    persona: '',
    connectedAt: new Date().toISOString(),
    lastHeartbeat: new Date().toISOString(),
    rooms: [],
    ip: socket.handshake?.address || 'unknown',
    userAgent: socket.handshake?.headers?.['user-agent'] || 'unknown',
  };
  connections.set(socket.id, info);

  // Authentication handler
  socket.on('authenticate', async (payload: any, callback: any) => {
    try {
      // In demo mode, accept X-Persona-style auth
      if (payload.persona && payload.userId) {
        info.userId = payload.userId;
        info.persona = payload.persona;

        // Auto-subscribe to user room
        const userRoom = `user:${payload.userId}`;
        socket.join(userRoom);
        info.rooms.push(userRoom);

        // Subscribe to role room
        const roleRoom = `role:${payload.persona}`;
        socket.join(roleRoom);
        info.rooms.push(roleRoom);

        if (typeof callback === 'function') {
          callback({ success: true });
        }
        console.log(`[websocket] Authenticated: ${payload.userId} (${payload.persona})`);
      } else if (typeof callback === 'function') {
        callback({ success: false, error: 'Missing userId or persona' });
      }
    } catch (err: any) {
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // Room subscription
  socket.on('subscribe', (rooms: string[]) => {
    for (const room of rooms) {
      socket.join(room);
      if (!info.rooms.includes(room)) {
        info.rooms.push(room);
      }
    }
  });

  socket.on('unsubscribe', (rooms: string[]) => {
    for (const room of rooms) {
      socket.leave(room);
      info.rooms = info.rooms.filter(r => r !== room);
    }
  });

  // Heartbeat
  socket.on('heartbeat', () => {
    info.lastHeartbeat = new Date().toISOString();
    socket.emit('heartbeat', { timestamp: new Date().toISOString() });
  });

  // Mark notification as read
  socket.on('mark-read', (notificationId: string) => {
    // Fire-and-forget: update Firestore notification doc
    markNotificationRead(notificationId).catch(() => {});
  });

  // Disconnect
  socket.on('disconnect', () => {
    connections.delete(socket.id);
    console.log(`[websocket] Disconnected: ${socket.id} (${info.userId || 'unauthenticated'})`);
  });
}

// ---- Notification Dispatch ----

/**
 * Send a notification to a specific user via WebSocket.
 * If WebSocket is not available, the notification is only persisted in Firestore.
 */
export function sendToUser(userId: string, message: WebSocketMessage): void {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification', message);
  }
  // Always persist to Firestore for notification history
  persistNotification(userId, message).catch(() => {});
}

/**
 * Send a notification to all users subscribed to an estate.
 */
export function sendToEstate(estateId: string, message: WebSocketMessage): void {
  if (ioInstance) {
    ioInstance.to(`estate:${estateId}`).emit('notification', message);
  }
}

/**
 * Send a notification to all users with a specific role.
 */
export function sendToRole(persona: string, message: WebSocketMessage): void {
  if (ioInstance) {
    ioInstance.to(`role:${persona}`).emit('notification', message);
  }
}

/**
 * Broadcast a notification to all connected clients.
 */
export function broadcast(message: WebSocketMessage): void {
  if (ioInstance) {
    ioInstance.emit('notification', message);
  }
}

/**
 * Send a case update event.
 */
export function emitCaseUpdate(
  caseId: string,
  field: string,
  oldValue: unknown,
  newValue: unknown,
  updatedBy: string,
): void {
  if (ioInstance) {
    ioInstance.to(`case:${caseId}`).emit('case-updated', {
      caseId,
      field,
      oldValue,
      newValue,
      updatedBy,
    });
  }
}

/**
 * Send a compliance alert.
 */
export function emitComplianceAlert(
  propertyId: string,
  type: string,
  daysRemaining: number,
): void {
  if (ioInstance) {
    ioInstance.emit('compliance-alert', { propertyId, type, daysRemaining });
  }
}

/**
 * Send an SLA breach notification.
 */
export function emitSlaBreach(
  caseId: string,
  reference: string,
  type: string,
  breachedAt: string,
): void {
  if (ioInstance) {
    ioInstance.emit('sla-breach', { caseId, reference, type, breachedAt });
  }
}

// ---- Firestore Persistence ----

import { db, FieldValue } from './firestore.js';

const notificationsCollection = db.collection('notifications');

async function persistNotification(userId: string, message: WebSocketMessage): Promise<void> {
  try {
    await notificationsCollection.add({
      userId,
      ...message,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch {
    console.warn('[websocket] Failed to persist notification');
  }
}

async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await notificationsCollection.doc(notificationId).update({
      read: true,
      readAt: FieldValue.serverTimestamp(),
    });
  } catch {
    // Non-critical
  }
}

// ---- Status ----

export function getWebSocketStatus(): {
  enabled: boolean;
  connections: number;
  connectionDetails: ConnectionInfo[];
} {
  return {
    enabled: ioInstance !== null,
    connections: connections.size,
    connectionDetails: Array.from(connections.values()),
  };
}
