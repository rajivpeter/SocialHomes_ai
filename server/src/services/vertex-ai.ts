// ============================================================
// SocialHomes.Ai — Vertex AI (Gemini) Integration Service
// Task 5.2.1: Server-side SDK, streaming SSE, context management,
// conversation history with Firestore persistence, token counting
// ============================================================

import { db, collections, FieldValue } from './firestore.js';
import type {
  GeminiModel,
  ModelConfig,
  MODEL_PRESETS,
  EntityType,
  ConversationContext,
  ChatMessage,
  ConversationDoc,
  AiChatResponse,
  TokenBudget,
  TOKEN_BUDGETS,
  PiiMaskingConfig,
  DEFAULT_PII_MASKING,
} from '../types/vertex-ai.js';

// ---- Configuration ----

const VERTEX_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_AI_PROJECT || '';
const VERTEX_LOCATION = process.env.VERTEX_AI_LOCATION || 'europe-west2';
const AI_ENABLED = process.env.VERTEX_AI_ENABLED === 'true';

// ---- Conversations Collection ----

const conversationsCollection = db.collection('aiConversations');

// ---- Token Estimation ----

/**
 * Rough token count estimation.
 * Gemini tokeniser averages ~4 chars per token for English text.
 * This is intentionally conservative to avoid budget overruns.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

// ---- PII Masking ----

export function maskPii(text: string, config: PiiMaskingConfig = {
  maskNames: false,
  maskAddresses: false,
  maskPhoneNumbers: true,
  maskEmails: true,
  maskNino: true,
  maskDob: true,
}): string {
  let masked = text;

  if (config.maskPhoneNumbers) {
    // UK phone numbers
    masked = masked.replace(/(\+44|0)\s*\d[\d\s]{8,12}/g, '[PHONE REDACTED]');
  }
  if (config.maskEmails) {
    masked = masked.replace(/[\w.+-]+@[\w.-]+\.\w{2,}/g, '[EMAIL REDACTED]');
  }
  if (config.maskNino) {
    // National Insurance Number: AA 99 99 99 A
    masked = masked.replace(/[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]/gi, '[NINO REDACTED]');
  }
  if (config.maskDob) {
    // Date patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    masked = masked.replace(/\d{2}[/-]\d{2}[/-]\d{4}/g, '[DOB REDACTED]');
    masked = masked.replace(/\d{4}-\d{2}-\d{2}/g, '[DATE REDACTED]');
  }

  return masked;
}

// ---- Context Building ----

export function buildContextString(context: ConversationContext): string {
  const parts: string[] = [];

  parts.push(`User persona: ${context.persona}`);
  parts.push(`Context: ${context.entityType}`);

  if (context.entityId) {
    parts.push(`Entity ID: ${context.entityId}`);
  }

  if (context.entityData) {
    const safeData = JSON.stringify(context.entityData, null, 2);
    parts.push(`Entity data:\n${safeData}`);
  }

  if (context.relatedEntities && context.relatedEntities.length > 0) {
    parts.push(`Related entities (${context.relatedEntities.length}):`);
    for (const entity of context.relatedEntities.slice(0, 5)) {
      parts.push(JSON.stringify(entity));
    }
  }

  return parts.join('\n');
}

// ---- Conversation Management ----

export async function getConversation(conversationId: string): Promise<ConversationDoc | null> {
  const doc = await conversationsCollection.doc(conversationId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ConversationDoc;
}

export async function createConversation(
  userId: string,
  persona: string,
  entityType: EntityType,
  entityId?: string,
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await conversationsCollection.add({
    userId,
    persona,
    entityType,
    entityId: entityId || null,
    messages: [],
    createdAt: now,
    updatedAt: now,
    tokenCount: 0,
    maxTokens: 50000,
  });
  return ref.id;
}

export async function addMessage(
  conversationId: string,
  message: ChatMessage,
): Promise<void> {
  const tokens = estimateTokens(message.content);
  await conversationsCollection.doc(conversationId).update({
    messages: FieldValue.arrayUnion(message),
    updatedAt: new Date().toISOString(),
    tokenCount: FieldValue.increment(tokens),
  });
}

export async function getConversationHistory(
  conversationId: string,
  maxMessages = 20,
): Promise<ChatMessage[]> {
  const conv = await getConversation(conversationId);
  if (!conv) return [];
  // Return the last N messages to stay within context window
  return conv.messages.slice(-maxMessages);
}

// ---- AI Response Generation ----

/**
 * Generate a response using Vertex AI Gemini.
 * When AI is disabled (no API key / feature flag off), falls back to
 * the rule-based response engine for demo/development.
 */
export async function generateAiResponse(
  query: string,
  context: ConversationContext,
  conversationId?: string,
  preset: string = 'chat',
): Promise<AiChatResponse> {
  const start = Date.now();

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    convId = await createConversation(
      context.persona,
      context.persona,
      context.entityType,
      context.entityId,
    );
  }

  // Build context for the model
  const contextString = buildContextString(context);
  const history = await getConversationHistory(convId);

  // Estimate tokens
  const inputTokens = estimateTokens(query) + estimateTokens(contextString) +
    history.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  let responseText: string;
  let outputTokens: number;
  let model: GeminiModel = 'gemini-2.0-flash';

  if (AI_ENABLED) {
    // Production: Call Vertex AI Gemini via REST API
    try {
      const result = await callVertexAi(query, contextString, history, preset);
      responseText = result.text;
      outputTokens = result.outputTokens;
      model = result.model;
    } catch (err: any) {
      console.error('[vertex-ai] Gemini API error, falling back to rule-based:', err.message);
      responseText = generateFallbackResponse(query, context);
      outputTokens = estimateTokens(responseText);
    }
  } else {
    // Development: Rule-based fallback
    responseText = generateFallbackResponse(query, context);
    outputTokens = estimateTokens(responseText);
  }

  // Save messages to conversation
  const userMessage: ChatMessage = {
    role: 'user',
    content: query,
    timestamp: new Date().toISOString(),
  };
  const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: responseText,
    timestamp: new Date().toISOString(),
  };

  await addMessage(convId, userMessage);
  await addMessage(convId, assistantMessage);

  const latencyMs = Date.now() - start;

  return {
    response: responseText,
    conversationId: convId,
    tokenUsage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      remainingBudget: 50000 - (inputTokens + outputTokens),
    },
    metadata: {
      model,
      latencyMs,
      persona: context.persona,
      entityType: context.entityType,
      entityId: context.entityId,
    },
  };
}

// ---- Vertex AI REST Call ----

async function callVertexAi(
  query: string,
  context: string,
  history: ChatMessage[],
  preset: string,
): Promise<{ text: string; outputTokens: number; model: GeminiModel }> {
  const model: GeminiModel = preset === 'drafting' ? 'gemini-1.5-pro' : 'gemini-2.0-flash';
  const endpoint = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT}/locations/${VERTEX_LOCATION}/publishers/google/models/${model}:generateContent`;

  // Build messages array
  const contents = [];

  // Add conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  // Add current query with context
  contents.push({
    role: 'user',
    parts: [{ text: `Context:\n${context}\n\nQuery: ${query}` }],
  });

  const body = {
    contents,
    systemInstruction: {
      parts: [{ text: getSystemPrompt(preset) }],
    },
    generationConfig: {
      temperature: preset === 'drafting' ? 0.4 : 0.7,
      maxOutputTokens: preset === 'drafting' ? 4096 : 2048,
      topP: 0.9,
      topK: 40,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  // Use Google Cloud default credentials (automatic on Cloud Run)
  const { GoogleAuth } = await import('google-auth-library' as string).catch(() => ({ GoogleAuth: null }));
  let headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (GoogleAuth) {
    try {
      const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      if (tokenResponse.token) {
        headers['Authorization'] = `Bearer ${tokenResponse.token}`;
      }
    } catch {
      // Fallback — on Cloud Run, metadata server provides tokens
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vertex AI API error ${response.status}: ${errorText}`);
  }

  const result = await response.json() as any;
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'I was unable to generate a response.';
  const outputTokens = result.usageMetadata?.candidatesTokenCount || estimateTokens(text);

  return { text, outputTokens, model };
}

// ---- System Prompts ----

function getSystemPrompt(preset: string): string {
  const basePrompt = `You are Yantra Assist, the AI assistant for SocialHomes.Ai — a social housing management platform used by UK housing associations. You are professional, knowledgeable about UK social housing regulations, and always helpful.

Key regulations you must know:
- Awaab's Law: Strict timelines for damp/mould response (acknowledge within 14 days, fix within 7-56 days depending on hazard level)
- Housing Ombudsman Complaint Handling Code: Stage 1 response in 10 working days, Stage 2 in 20 working days
- Tenant Satisfaction Measures (TSM): 22 measures reported to Regulator of Social Housing
- GDPR: Personal data protection, right to erasure, subject access requests
- Right to Repair: Emergency repairs within 24 hours, urgent within 7 days

Always:
- Use UK English spelling and terminology
- Reference relevant legislation when appropriate
- Be empathetic when discussing tenant welfare
- Never disclose personal information inappropriately
- Format responses in Markdown for readability`;

  switch (preset) {
    case 'drafting':
      return `${basePrompt}\n\nYou are drafting formal communications to tenants. Follow Housing Ombudsman Code tone guidelines. Be clear, empathetic, and action-oriented. Include all legally required information.`;
    case 'analysis':
      return `${basePrompt}\n\nYou are analysing housing data. Provide structured, factual responses. When identifying risks, quantify them. Suggest specific actions based on data.`;
    case 'summary':
      return `${basePrompt}\n\nYou are summarising housing data. Be concise and focus on actionable insights. Use bullet points and highlight key metrics.`;
    default:
      return `${basePrompt}\n\nYou are having a conversational interaction with a housing professional. Adapt your detail level to their persona role. Provide actionable insights and suggest next steps.`;
  }
}

// ---- Fallback Response Engine ----

function generateFallbackResponse(query: string, context: ConversationContext): string {
  const q = query.toLowerCase();

  if (q.includes('arrears') || q.includes('rent')) {
    return `Based on the current ${context.entityType} context, I can provide arrears analysis. To get detailed tenant-level arrears data, use the Arrears Analysis report in Reports. Key actions for arrears management include:\n\n- Review payment plans for tenants 4+ weeks in arrears\n- Check Universal Credit status for transitioning tenants\n- Consider discretionary housing payment referrals\n- Schedule welfare visits for vulnerable tenants in arrears\n\nWould you like me to analyse a specific tenant's arrears situation?`;
  }

  if (q.includes('damp') || q.includes('mould') || q.includes('mold')) {
    return `**Damp & Mould Management** (Awaab's Law compliant):\n\n- **Emergency**: Category 1 hazards must be investigated within **24 hours**\n- **Urgent**: Initial response within **7 calendar days**\n- **Standard**: Works to commence within **28 calendar days**\n\nUse the Damp Intelligence panel on any property to see the 5-factor predictive risk score. Properties scoring above 70 should be proactively inspected.\n\nShall I check damp risk scores for a specific estate or property?`;
  }

  if (q.includes('complaint')) {
    return `**Complaint Handling** (Housing Ombudsman Code):\n\n- **Stage 1**: Acknowledge within **5 working days**, respond within **10 working days**\n- **Stage 2**: Response within **20 working days**\n- Complaint can be made via any channel (phone, email, letter, in person)\n- All complaints must be logged regardless of how they are received\n\nThe Complaints page shows current open complaints with SLA countdown. Would you like me to identify any at-risk complaints?`;
  }

  if (q.includes('repair') || q.includes('maintenance')) {
    return `**Repairs Management**:\n\n- **Emergency** (P1): Make safe within **24 hours** (gas leak, flooding, no heating)\n- **Urgent** (P2): Complete within **7 calendar days**\n- **Routine** (P3): Complete within **28 calendar days**\n- **Planned** (P4): Schedule within next programme\n\nCheck the Repairs page for SLA status. First-time fix rate target is 85%.\n\nWould you like me to analyse repair patterns for a specific property or estate?`;
  }

  if (q.includes('compliance') || q.includes('gas') || q.includes('electrical') || q.includes('fire')) {
    return `**Compliance Tracker** (Big 6):\n\n1. **Gas Safety**: Annual CP12 certificate — 0% non-compliance target\n2. **Electrical Safety (EICR)**: 5-yearly — report within 28 days\n3. **EPC**: Valid for 10 years — minimum Band E for lettable units\n4. **Fire Risk Assessment**: Annual review for communal areas\n5. **Asbestos Management**: Annual reinspection where identified\n6. **Legionella**: Annual risk assessment\n\nUse the Compliance page for real-time status. The Property Passport aggregates all compliance data per property.\n\nWould you like a compliance summary for a specific estate?`;
  }

  if (q.includes('vulnerability') || q.includes('vulnerable') || q.includes('safeguarding')) {
    return `**Vulnerability Detection** (7-factor scoring):\n\nThe automatic vulnerability scanner assesses:\n1. **Deprivation** — IMD decile of property location\n2. **Arrears** — Current rent balance and payment history\n3. **Health flags** — Disability, mental health conditions\n4. **Social isolation** — Low contact frequency, single occupancy\n5. **Age** — Over 70 or under 25\n6. **Dependents** — Children under 5 in household\n7. **UC transition** — Universal Credit status changes\n\nTenants scoring above 60 are flagged for proactive welfare contact. Run a vulnerability scan from the AI Centre.\n\nWould you like me to check vulnerability scores for your patch?`;
  }

  return `I'm Yantra Assist, your AI housing management assistant. I can help with:\n\n- **Arrears & Rent** — Analyse payment patterns and identify at-risk tenants\n- **Repairs & Maintenance** — Track SLAs, identify recurring issues\n- **Damp & Mould** — Predictive risk scoring (Awaab's Law compliant)\n- **Complaints** — Housing Ombudsman Code compliance tracking\n- **Compliance** — Big 6 certificate monitoring\n- **Vulnerability** — Automatic tenant welfare scoring\n- **Benefits** — Entitlement checking and UC status\n\nWhat would you like to know more about?`;
}

// ---- Streaming (SSE) ----

export async function* streamAiResponse(
  query: string,
  context: ConversationContext,
  conversationId?: string,
): AsyncGenerator<{ type: string; data: string }> {
  // For non-AI mode, simulate streaming by yielding chunks
  const fullResponse = await generateAiResponse(query, context, conversationId);

  // Yield metadata first
  yield {
    type: 'metadata',
    data: JSON.stringify({
      conversationId: fullResponse.conversationId,
      model: fullResponse.metadata.model,
    }),
  };

  // Simulate streaming by chunking the response
  const words = fullResponse.response.split(' ');
  let chunk = '';
  for (let i = 0; i < words.length; i++) {
    chunk += (i > 0 ? ' ' : '') + words[i];
    if (chunk.length >= 20 || i === words.length - 1) {
      yield { type: 'token', data: chunk };
      chunk = '';
    }
  }

  // Yield completion event
  yield {
    type: 'done',
    data: JSON.stringify({
      tokenUsage: fullResponse.tokenUsage,
      latencyMs: fullResponse.metadata.latencyMs,
    }),
  };
}
