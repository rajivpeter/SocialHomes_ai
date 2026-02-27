// ============================================================
// SocialHomes.Ai — WebSocket (Socket.io) Type Definitions
// Task 5.1.4: WebSocket architecture for real-time notifications
// ============================================================

// ---- Connection & Authentication ----

export interface SocketAuthPayload {
  token: string;       // Firebase JWT
  persona: string;
  userId: string;
}

export interface AuthenticatedSocket {
  userId: string;
  persona: string;
  email: string;
  displayName?: string;
  teamId?: string;
  patchIds?: string[];
  connectedAt: string;
}

// ---- Room Subscriptions ----

/**
 * Room naming convention:
 * - user:{userId}         — per-user notifications
 * - estate:{estateId}     — estate-level updates
 * - org:{orgId}           — organisation-wide broadcasts
 * - case:{caseId}         — case-specific updates
 * - role:{persona}        — role-based broadcasts
 */
export type RoomType = 'user' | 'estate' | 'org' | 'case' | 'role';

export interface RoomSubscription {
  roomType: RoomType;
  roomId: string;
  fullRoomName: string; // e.g. "user:demo-ho"
}

// ---- Message Types ----

export type NotificationCategory =
  | 'case-update'
  | 'compliance-alert'
  | 'arrears-alert'
  | 'damp-alert'
  | 'system'
  | 'chat'
  | 'task'
  | 'sla-breach';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WebSocketMessage {
  type: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  timestamp: string;
  senderId?: string;
  metadata?: Record<string, unknown>;
}

// ---- Notification Preferences ----

export type NotificationChannel = 'in-app' | 'email' | 'sms' | 'portal';

export type NotificationFrequency = 'immediate' | 'daily-digest' | 'weekly-summary';

export interface NotificationPreference {
  userId: string;
  channels: Record<NotificationChannel, boolean>;
  frequency: NotificationFrequency;
  categories: Record<NotificationCategory, boolean>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
  };
}

// ---- Connection Management ----

export interface ConnectionInfo {
  socketId: string;
  userId: string;
  persona: string;
  connectedAt: string;
  lastHeartbeat: string;
  rooms: string[];
  ip: string;
  userAgent: string;
}

export interface ReconnectionConfig {
  maxAttempts: number;
  initialDelay: number;     // ms
  maxDelay: number;          // ms
  backoffMultiplier: number;
}

export const DEFAULT_RECONNECTION: ReconnectionConfig = {
  maxAttempts: 10,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

// ---- Server Events ----

export interface ServerToClientEvents {
  notification: (message: WebSocketMessage) => void;
  'case-updated': (data: { caseId: string; field: string; oldValue: unknown; newValue: unknown; updatedBy: string }) => void;
  'case-locked': (data: { caseId: string; lockedBy: string; lockedAt: string }) => void;
  'case-unlocked': (data: { caseId: string }) => void;
  'compliance-alert': (data: { propertyId: string; type: string; daysRemaining: number }) => void;
  'sla-breach': (data: { caseId: string; reference: string; type: string; breachedAt: string }) => void;
  heartbeat: (data: { timestamp: string }) => void;
  error: (data: { message: string; code: string }) => void;
}

export interface ClientToServerEvents {
  authenticate: (payload: SocketAuthPayload, callback: (result: { success: boolean; error?: string }) => void) => void;
  subscribe: (rooms: string[]) => void;
  unsubscribe: (rooms: string[]) => void;
  'mark-read': (notificationId: string) => void;
  heartbeat: () => void;
}
