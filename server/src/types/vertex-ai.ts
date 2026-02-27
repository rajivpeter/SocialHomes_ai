// ============================================================
// SocialHomes.Ai — Vertex AI / Gemini Type Definitions
// Task 5.1.3: Architecture for Vertex AI integration
// ============================================================

// ---- Model Configuration ----

export type GeminiModel = 'gemini-2.0-flash' | 'gemini-1.5-pro' | 'gemini-1.5-flash';

export interface ModelConfig {
  model: GeminiModel;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
  safetyThreshold: 'BLOCK_NONE' | 'BLOCK_LOW_AND_ABOVE' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_ONLY_HIGH';
}

/** Model presets for different use cases */
export const MODEL_PRESETS: Record<string, ModelConfig> = {
  /** Conversational Yantra Assist queries — fast, balanced */
  chat: {
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    maxOutputTokens: 2048,
    topP: 0.9,
    topK: 40,
    safetyThreshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  /** Communication drafting — precise, formal */
  drafting: {
    model: 'gemini-1.5-pro',
    temperature: 0.4,
    maxOutputTokens: 4096,
    topP: 0.85,
    topK: 30,
    safetyThreshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  /** Repair intake analysis — structured output */
  analysis: {
    model: 'gemini-2.0-flash',
    temperature: 0.2,
    maxOutputTokens: 2048,
    topP: 0.8,
    topK: 20,
    safetyThreshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  /** Summary generation — concise */
  summary: {
    model: 'gemini-2.0-flash',
    temperature: 0.3,
    maxOutputTokens: 1024,
    topP: 0.85,
    topK: 30,
    safetyThreshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
};

// ---- Context Injection ----

export type EntityType = 'property' | 'tenant' | 'case' | 'estate' | 'compliance' | 'rent' | 'general';

export interface ConversationContext {
  entityType: EntityType;
  entityId?: string;
  entityData?: Record<string, unknown>;
  relatedEntities?: Record<string, unknown>[];
  persona: string;
  organisationId?: string;
}

// ---- Conversation History ----

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ConversationDoc {
  id: string;
  userId: string;
  persona: string;
  entityType: EntityType;
  entityId?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  tokenCount: number;
  maxTokens: number;
}

// ---- Streaming ----

export interface StreamEvent {
  type: 'token' | 'done' | 'error' | 'metadata';
  data: string;
  timestamp: string;
}

// ---- Token Management ----

export interface TokenBudget {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxConversationTokens: number;
  warningThreshold: number; // percentage (0-1)
}

export const TOKEN_BUDGETS: Record<string, TokenBudget> = {
  chat: {
    maxInputTokens: 30000,
    maxOutputTokens: 2048,
    maxConversationTokens: 50000,
    warningThreshold: 0.8,
  },
  drafting: {
    maxInputTokens: 50000,
    maxOutputTokens: 4096,
    maxConversationTokens: 60000,
    warningThreshold: 0.85,
  },
  analysis: {
    maxInputTokens: 20000,
    maxOutputTokens: 2048,
    maxConversationTokens: 30000,
    warningThreshold: 0.8,
  },
};

// ---- Response Types ----

export interface AiChatResponse {
  response: string;
  conversationId: string;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    remainingBudget: number;
  };
  metadata: {
    model: GeminiModel;
    latencyMs: number;
    persona: string;
    entityType: EntityType;
    entityId?: string;
    groundedSources?: string[];
  };
}

export interface AiDraftResponse {
  draft: string;
  subject?: string;
  tone: string;
  metadata: {
    tenantId: string;
    tenantName: string;
    communicationType: string;
    model: GeminiModel;
    confidence: number;
    generatedAt: string;
    legalComplianceCheck: {
      passed: boolean;
      warnings: string[];
    };
  };
}

export interface RepairIntakeResult {
  suggestedSorCode: string;
  suggestedSorDescription: string;
  suggestedPriority: 'emergency' | 'urgent' | 'routine' | 'planned';
  suggestedTrade: string;
  isAwaabsLaw: boolean;
  awaabsLawCategory?: string;
  asbestosRisk: boolean;
  recurringPattern: boolean;
  estimatedCost: { min: number; max: number };
  confidence: number;
  reasoning: string;
}

// ---- Safety ----

export interface PiiMaskingConfig {
  maskNames: boolean;
  maskAddresses: boolean;
  maskPhoneNumbers: boolean;
  maskEmails: boolean;
  maskNino: boolean;
  maskDob: boolean;
}

export const DEFAULT_PII_MASKING: PiiMaskingConfig = {
  maskNames: false,     // Needed for personalised drafts
  maskAddresses: false, // Needed for property context
  maskPhoneNumbers: true,
  maskEmails: true,
  maskNino: true,
  maskDob: true,
};
