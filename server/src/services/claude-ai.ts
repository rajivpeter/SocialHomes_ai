// ============================================================
// SocialHomes.Ai — Claude AI Service
// Wraps the Anthropic SDK for housing-domain AI capabilities:
// chat, communication drafting, repair photo analysis,
// vulnerability assessment.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';

// ---- Configuration ----

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_ENABLED = !!ANTHROPIC_API_KEY;

let client: Anthropic | null = null;
if (CLAUDE_ENABLED) {
  client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

// ---- Models ----

/** Haiku for fast, low-cost queries; Sonnet for complex reasoning/drafting */
const MODEL_FAST = 'claude-haiku-4-5-20251001';
const MODEL_COMPLEX = 'claude-sonnet-4-20250514';

// ---- System Prompt ----

const HOUSING_SYSTEM_PROMPT = `You are Yantra Assist, an AI assistant for UK social housing management.
You help housing officers, managers, and executives with:
- Tenant enquiries and case management
- Repair diagnosis and prioritisation
- Compliance tracking (Awaab's Law, Big 6, TSMs)
- Arrears management and UC support
- Complaint handling (Housing Ombudsman Code)
- Report generation and data analysis

Key regulations:
- Awaab's Law: Strict timelines for damp/mould response (acknowledge within 14 days, fix within 7-56 days depending on hazard level)
- Housing Ombudsman Complaint Handling Code: Stage 1 response in 10 working days, Stage 2 in 20 working days
- Tenant Satisfaction Measures (TSM): 22 measures reported to Regulator of Social Housing
- Right to Repair: Emergency repairs within 24 hours, urgent within 7 days

Always be professional, empathetic, and focused on tenant welfare.
Reference UK housing regulations where relevant.
Use GBP for currency. Use UK date format (DD/MM/YYYY).
Use UK English spelling and terminology.
Format responses in Markdown for readability.`;

// ---- Helpers ----

/** Decide whether a query needs Sonnet (complex) or Haiku (simple). */
function selectModel(query: string): string {
  const q = query.toLowerCase();
  const complexIndicators = [
    'analyse', 'analyze', 'draft', 'write', 'compose', 'recommend',
    'plan', 'strategy', 'assess', 'evaluate', 'compare', 'explain why',
    'legal', 'compliance', 'section 21', 'ombudsman',
  ];
  const isComplex = complexIndicators.some(ind => q.includes(ind));
  return isComplex ? MODEL_COMPLEX : MODEL_FAST;
}

/** Build a context block from optional entity data. */
function buildContextBlock(context?: {
  persona?: string;
  tenantData?: any;
  propertyData?: any;
  caseData?: any;
}): string {
  if (!context) return '';

  const parts: string[] = [];

  if (context.persona) {
    parts.push(`User persona: ${context.persona}`);
  }

  if (context.tenantData) {
    const t = context.tenantData;
    parts.push(`\nTenant context:`);
    if (t.title || t.firstName || t.lastName) {
      parts.push(`- Name: ${t.title || ''} ${t.firstName || ''} ${t.lastName || ''}`);
    }
    if (t.rentBalance !== undefined) {
      parts.push(`- Rent balance: GBP ${Math.abs(t.rentBalance).toFixed(2)} ${t.rentBalance < 0 ? 'in arrears' : 'in credit'}`);
    }
    if (t.ucStatus) parts.push(`- UC status: ${t.ucStatus}`);
    if (t.vulnerabilityFlags?.length > 0) {
      parts.push(`- Vulnerability flags: ${t.vulnerabilityFlags.map((f: any) => f.type || f).join(', ')}`);
    }
    if (t.tenancyType) parts.push(`- Tenancy type: ${t.tenancyType}`);
  }

  if (context.propertyData) {
    const p = context.propertyData;
    parts.push(`\nProperty context:`);
    if (p.address) parts.push(`- Address: ${p.address}`);
    if (p.propertyType) parts.push(`- Type: ${p.propertyType}`);
    if (p.dampRisk !== undefined) parts.push(`- Damp risk score: ${p.dampRisk}/100`);
    if (p.epcRating) parts.push(`- EPC rating: ${p.epcRating}`);
  }

  if (context.caseData) {
    const c = context.caseData;
    parts.push(`\nCase context:`);
    if (c.reference) parts.push(`- Reference: ${c.reference}`);
    if (c.type) parts.push(`- Type: ${c.type}`);
    if (c.status) parts.push(`- Status: ${c.status}`);
    if (c.subject) parts.push(`- Subject: ${c.subject}`);
    if (c.priority) parts.push(`- Priority: ${c.priority}`);
    if (c.handler) parts.push(`- Handler: ${c.handler}`);
    if (c.daysOpen !== undefined) parts.push(`- Days open: ${c.daysOpen}`);
  }

  return parts.length > 0 ? parts.join('\n') : '';
}

// ---- Fallback Responses ----

function fallbackChatResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('arrears') || q.includes('rent')) {
    return `**Arrears Management Guidance:**\n\n- Review payment plans for tenants 4+ weeks in arrears\n- Check Universal Credit status for transitioning tenants\n- Consider discretionary housing payment referrals\n- Schedule welfare visits for vulnerable tenants in arrears\n\nWould you like me to analyse a specific tenant's arrears situation?\n\n*Note: AI-powered responses require an API key to be configured. Contact your administrator.*`;
  }
  if (q.includes('damp') || q.includes('mould') || q.includes('mold')) {
    return `**Damp & Mould Management** (Awaab's Law compliant):\n\n- **Emergency**: Category 1 hazards — investigate within **24 hours**\n- **Urgent**: Initial response within **7 calendar days**\n- **Standard**: Works to commence within **28 calendar days**\n\n*Note: AI-powered responses require an API key to be configured.*`;
  }
  if (q.includes('complaint')) {
    return `**Complaint Handling** (Housing Ombudsman Code):\n\n- **Stage 1**: Acknowledge within **5 working days**, respond within **10 working days**\n- **Stage 2**: Response within **20 working days**\n\n*Note: AI-powered responses require an API key to be configured.*`;
  }
  if (q.includes('repair') || q.includes('maintenance')) {
    return `**Repairs Management**:\n\n- **Emergency** (P1): Make safe within **24 hours**\n- **Urgent** (P2): Complete within **7 calendar days**\n- **Routine** (P3): Complete within **28 calendar days**\n\n*Note: AI-powered responses require an API key to be configured.*`;
  }

  return `I'm Yantra Assist, your AI housing management assistant. I can help with arrears, repairs, damp & mould, complaints, compliance, vulnerability, and benefits.\n\nWhat would you like to know more about?\n\n*Note: AI-powered responses require an API key to be configured.*`;
}

// ---- Public API ----

/**
 * Generate a conversational chat response using Claude.
 * Falls back to rule-based responses when the API key is missing.
 */
export async function generateChatResponse(query: string, context?: {
  persona?: string;
  tenantData?: any;
  propertyData?: any;
  caseData?: any;
}): Promise<string> {
  if (!client) {
    console.warn('[claude-ai] ANTHROPIC_API_KEY not set — using fallback response');
    return fallbackChatResponse(query);
  }

  const model = selectModel(query);
  const contextBlock = buildContextBlock(context);

  const userMessage = contextBlock
    ? `${contextBlock}\n\n---\n\nQuery: ${query}`
    : query;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: model === MODEL_COMPLEX ? 2048 : 1024,
      system: HOUSING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    return textBlock ? textBlock.text : 'I was unable to generate a response. Please try again.';
  } catch (err: any) {
    console.error('[claude-ai] Chat error:', err.message);
    return fallbackChatResponse(query);
  }
}

/**
 * Draft a housing communication using Claude.
 * Returns a structured { subject, body } response.
 */
export async function draftCommunication(params: {
  tenantName: string;
  communicationType: string;
  tone: string;
  context: string;
  caseRef?: string;
}): Promise<{ subject: string; body: string }> {
  const fallbackSubject = `Re: ${params.communicationType.replace(/-/g, ' ')}`;
  const fallbackBody = `Dear ${params.tenantName},\n\nThank you for contacting us. We are writing to update you regarding your ${params.communicationType.replace(/-/g, ' ')}.\n\nIf you have any questions, please contact your Housing Officer on 0800 XXX XXXX.\n\nKind regards,\nRiverside Community Housing Association\n${new Date().toLocaleDateString('en-GB')}`;

  if (!client) {
    console.warn('[claude-ai] ANTHROPIC_API_KEY not set — using fallback draft');
    return { subject: fallbackSubject, body: fallbackBody };
  }

  const prompt = `Draft a formal communication for a UK social housing tenant.

Tenant name: ${params.tenantName}
Communication type: ${params.communicationType}
Tone: ${params.tone}
${params.caseRef ? `Case reference: ${params.caseRef}` : ''}

Context:
${params.context}

Requirements:
1. Use the organisation name "Riverside Community Housing Association"
2. Include today's date in UK format (DD/MM/YYYY)
3. Include legally required information for this communication type
4. Use sensitive, supportive language for vulnerable tenants
5. Include contact details (phone: 0800 XXX XXXX)
6. End with a clear call-to-action or next step
7. Sign off appropriately for the tone

Respond in JSON format:
{"subject": "...", "body": "..."}

The body should be the complete letter text. Do not include any text outside the JSON.`;

  try {
    const response = await client.messages.create({
      model: MODEL_COMPLEX,
      max_tokens: 2048,
      system: HOUSING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock) {
      return { subject: fallbackSubject, body: fallbackBody };
    }

    // Parse the JSON response — Claude may wrap it in markdown code fences
    const raw = textBlock.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(raw);
    return {
      subject: parsed.subject || fallbackSubject,
      body: parsed.body || fallbackBody,
    };
  } catch (err: any) {
    console.error('[claude-ai] Draft communication error:', err.message);
    return { subject: fallbackSubject, body: fallbackBody };
  }
}

/**
 * Analyse a repair photo using Claude Vision.
 * Returns structured defect analysis data.
 */
export async function analyseRepairPhoto(imageBase64: string): Promise<{
  suggestedCategory: string;
  suggestedPriority: string;
  possibleIssues: string[];
  description: string;
  confidence: number;
}> {
  const fallback = {
    suggestedCategory: 'general-repair',
    suggestedPriority: 'routine',
    possibleIssues: ['Unable to analyse — manual inspection required'],
    description: 'Photo analysis unavailable. Please describe the issue manually.',
    confidence: 0,
  };

  if (!client) {
    console.warn('[claude-ai] ANTHROPIC_API_KEY not set — cannot analyse photo');
    return fallback;
  }

  const prompt = `Analyse this photo of a housing repair issue. Provide a structured assessment.

Respond in JSON format only:
{
  "suggestedCategory": "one of: plumbing, electrical, damp-mould, structural, roofing, heating, windows-doors, flooring, painting, pest-control, general-repair",
  "suggestedPriority": "one of: emergency, urgent, routine, planned",
  "possibleIssues": ["list of possible issues visible"],
  "description": "Brief description of the defect visible in the photo",
  "confidence": 0.0 to 1.0
}

Priority guidance:
- emergency: Immediate safety risk (gas, flooding, structural collapse, electrical hazard)
- urgent: Significant habitability impact (no heating, major leak, broken lock)
- routine: Needs fixing but not safety-critical (dripping tap, cracked tile)
- planned: Cosmetic or scheduled maintenance

Do not include any text outside the JSON.`;

  try {
    // Detect media type — default to JPEG
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
    if (imageBase64.startsWith('iVBOR')) mediaType = 'image/png';
    else if (imageBase64.startsWith('R0lG')) mediaType = 'image/gif';
    else if (imageBase64.startsWith('UklG')) mediaType = 'image/webp';

    const response = await client.messages.create({
      model: MODEL_FAST,
      max_tokens: 1024,
      system: HOUSING_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          { type: 'text', text: prompt },
        ],
      }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock) return fallback;

    const raw = textBlock.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(raw);
    return {
      suggestedCategory: parsed.suggestedCategory || 'general-repair',
      suggestedPriority: parsed.suggestedPriority || 'routine',
      possibleIssues: Array.isArray(parsed.possibleIssues) ? parsed.possibleIssues : [],
      description: parsed.description || 'Unable to parse description.',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
  } catch (err: any) {
    console.error('[claude-ai] Photo analysis error:', err.message);
    return fallback;
  }
}

/**
 * Assess tenant vulnerability using Claude analysis.
 * Returns a risk score with contributing factors and recommended actions.
 */
export async function assessClaudeVulnerability(tenantData: any): Promise<{
  riskScore: number;
  factors: string[];
  recommendedActions: string[];
}> {
  const fallback = {
    riskScore: 0,
    factors: ['Unable to assess — manual review required'],
    recommendedActions: ['Conduct in-person welfare check'],
  };

  if (!client) {
    console.warn('[claude-ai] ANTHROPIC_API_KEY not set — cannot assess vulnerability');
    return fallback;
  }

  // Build a safe summary — avoid sending raw PII
  const summary: Record<string, any> = {};
  if (tenantData.age !== undefined) summary.age = tenantData.age;
  if (tenantData.rentBalance !== undefined) summary.rentBalance = tenantData.rentBalance;
  if (tenantData.ucStatus) summary.ucStatus = tenantData.ucStatus;
  if (tenantData.tenancyType) summary.tenancyType = tenantData.tenancyType;
  if (tenantData.vulnerabilityFlags) summary.existingFlags = tenantData.vulnerabilityFlags;
  if (tenantData.householdSize !== undefined) summary.householdSize = tenantData.householdSize;
  if (tenantData.dependents !== undefined) summary.dependents = tenantData.dependents;
  if (tenantData.communicationPreferences) summary.communicationPrefs = tenantData.communicationPreferences;
  if (tenantData.contactFrequency !== undefined) summary.contactFrequency = tenantData.contactFrequency;
  if (tenantData.arrearsRisk !== undefined) summary.arrearsRisk = tenantData.arrearsRisk;

  const prompt = `Assess the vulnerability of this social housing tenant based on the following data.

Tenant data:
${JSON.stringify(summary, null, 2)}

Consider these factors:
1. Financial vulnerability (arrears, UC status, payment history)
2. Health and wellbeing (disability, mental health, age-related)
3. Social isolation (contact frequency, household size)
4. Housing stability (tenancy type, length of tenancy)
5. Safeguarding concerns (dependents, known risks)

Respond in JSON format only:
{
  "riskScore": 0 to 100,
  "factors": ["list of contributing risk factors identified"],
  "recommendedActions": ["list of recommended interventions"]
}

Scoring guide:
- 0-20: Low risk — standard service
- 21-40: Moderate — monitor and periodic check-in
- 41-60: Elevated — proactive engagement required
- 61-80: High — dedicated support plan needed
- 81-100: Critical — immediate intervention required

Do not include any text outside the JSON.`;

  try {
    const response = await client.messages.create({
      model: MODEL_FAST,
      max_tokens: 1024,
      system: HOUSING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock) return fallback;

    const raw = textBlock.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(raw);
    return {
      riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : 0,
      factors: Array.isArray(parsed.factors) ? parsed.factors : [],
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
    };
  } catch (err: any) {
    console.error('[claude-ai] Vulnerability assessment error:', err.message);
    return fallback;
  }
}
