// ============================================================
// SocialHomes.Ai — Event-Driven Architecture Type Definitions
// Task 5.1.5: Cloud Pub/Sub event design
// Task 5.1.8: Firestore data migration strategy
// Task 5.1.9: AI model versioning and A/B testing
// ============================================================

// ---- Cloud Pub/Sub Topics ----

export type PubSubTopic =
  | 'case-created'
  | 'case-updated'
  | 'case-closed'
  | 'compliance-expiring'
  | 'arrears-threshold'
  | 'damp-alert'
  | 'sla-approaching'
  | 'sla-breached'
  | 'vulnerability-detected'
  | 'payment-received'
  | 'tenant-created'
  | 'briefing-generated';

export interface PubSubMessage<T = Record<string, unknown>> {
  topic: PubSubTopic;
  data: T;
  attributes: {
    entityType: string;
    entityId: string;
    action: string;
    timestamp: string;
    correlationId: string;
    source: string; // originating service
  };
  publishedAt: string;
}

// ---- Event Payloads ----

export interface CaseCreatedEvent {
  caseId: string;
  reference: string;
  type: string;
  priority: string;
  tenantId: string;
  propertyId: string;
  handler: string;
  isAwaabsLaw: boolean;
}

export interface CaseUpdatedEvent {
  caseId: string;
  reference: string;
  type: string;
  changes: { field: string; oldValue: unknown; newValue: unknown }[];
  updatedBy: string;
}

export interface ComplianceExpiringEvent {
  propertyId: string;
  address: string;
  certificateType: string; // gas, eicr, epc, fire-risk, asbestos, legionella
  expiryDate: string;
  daysRemaining: number;
  currentStatus: string;
}

export interface ArrearsThresholdEvent {
  tenantId: string;
  tenantName: string;
  propertyId: string;
  arrearsAmount: number;
  weeklyCharge: number;
  weeksInArrears: number;
  thresholdBreached: 'warning' | 'action' | 'legal';
}

export interface DampAlertEvent {
  propertyId: string;
  address: string;
  dampRiskScore: number;
  previousScore: number;
  factors: Record<string, number>;
  recommendedAction: string;
}

export interface SlaBreachEvent {
  caseId: string;
  reference: string;
  type: string;
  priority: string;
  targetDate: string;
  breachedAt: string;
  daysOverdue: number;
  handler: string;
  isAwaabsLaw: boolean;
}

// ---- Dead Letter Queue ----

export interface DeadLetterEntry {
  originalTopic: PubSubTopic;
  message: PubSubMessage;
  error: string;
  failedAt: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
}

// ---- Subscription Config ----

export interface SubscriptionConfig {
  topic: PubSubTopic;
  subscriptionName: string;
  handler: string; // service function name
  ackDeadline: number; // seconds
  retryPolicy: {
    maxRetries: number;
    minBackoff: number; // seconds
    maxBackoff: number; // seconds
  };
  deadLetterTopic?: string;
  filter?: string; // Pub/Sub message filter expression
}

// ---- Multi-Tenant (Task 5.1.6) ----

export interface TenantContext {
  organisationId: string;
  organisationName: string;
  region?: string;
  branding?: {
    primaryColour: string;
    logoUrl?: string;
    appName: string;
  };
  features: Record<string, boolean>; // feature flags
  limits: {
    maxUsers: number;
    maxProperties: number;
    aiQueriesPerDay: number;
    storageGb: number;
  };
  billing: {
    plan: 'starter' | 'professional' | 'enterprise';
    propertiesIncluded: number;
    additionalPropertyCost: number;
    billingCycle: 'monthly' | 'annual';
  };
}

export interface OrganisationConfig {
  id: string;
  name: string;
  slug: string; // URL-safe identifier
  firestorePrefix: string; // collection prefix for data isolation
  createdAt: string;
  isActive: boolean;
  config: TenantContext;
}

// ---- Data Migration (Task 5.1.8) ----

export interface MigrationScript {
  id: string;
  version: string; // semver
  description: string;
  direction: 'up' | 'down';
  collections: string[];
  createdAt: string;
  executedAt?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back';
  checksum: string;
}

export interface MigrationRegistry {
  currentVersion: string;
  appliedMigrations: MigrationScript[];
  lastMigrationAt: string;
}

export interface MigrationOperation {
  collection: string;
  operation: 'add-field' | 'remove-field' | 'rename-field' | 'transform-field' | 'add-collection' | 'delete-collection';
  field?: string;
  newField?: string;
  defaultValue?: unknown;
  transformFn?: string; // serialised function reference
}

// ---- AI Model Versioning (Task 5.1.9) ----

export interface AiModelVersion {
  id: string;
  name: string; // e.g. "yantra-assist-v1.2"
  model: string; // Gemini model name
  promptVersion: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  createdAt: string;
  isActive: boolean;
  isDefault: boolean;
  performance: {
    avgLatencyMs: number;
    avgTokensUsed: number;
    userSatisfaction: number; // 0-5 scale
    errorRate: number;
    totalRequests: number;
  };
}

export interface AbTestConfig {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  variants: AbTestVariant[];
  targetMetric: string; // e.g. "userSatisfaction", "taskCompletion"
  minSampleSize: number;
  confidenceLevel: number; // e.g. 0.95
}

export interface AbTestVariant {
  id: string;
  name: string; // e.g. "control", "variant-a"
  modelVersionId: string;
  trafficPercentage: number; // 0-100, all variants must sum to 100
  results: {
    impressions: number;
    conversions: number;
    avgMetricValue: number;
  };
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number; // 0-100
  targetPersonas?: string[];
  targetOrganisations?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AiModelFeedback {
  id: string;
  conversationId: string;
  modelVersionId: string;
  userId: string;
  rating: number; // 1-5
  feedback?: string;
  responseQuality: 'helpful' | 'partially-helpful' | 'not-helpful' | 'harmful';
  timestamp: string;
}
