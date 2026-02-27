// ============================================================
// SocialHomes.Ai — AI Prompt Engineering Layer
// Task 5.2.2: Context-aware system prompts, few-shot examples,
// safety guardrails, persona-scoped formatting
// ============================================================

import type { EntityType, ConversationContext } from '../types/vertex-ai.js';
import type { PropertyDoc, TenantDoc, CaseDoc } from '../models/firestore-schemas.js';

// ---- System Prompts by Entity Type ----

const ENTITY_SYSTEM_PROMPTS: Record<EntityType, string> = {
  property: `You are analysing a social housing property. Focus on:
- Physical condition (damp risk, EPC rating, heating type)
- Compliance status (gas safety, EICR, fire risk, asbestos, legionella)
- Current and historical repairs
- Tenancy status (occupied/void, rent level)
- Location context (deprivation indices, crime rates)

When the property has compliance issues approaching expiry, flag them prominently.
When damp risk score > 50, reference Awaab's Law requirements.`,

  tenant: `You are reviewing a tenant's housing situation. Focus on:
- Tenancy details (start date, type, rent balance)
- Vulnerability factors (7-factor scoring)
- Case history (open repairs, complaints, ASB)
- Household composition (dependents, joint tenants)
- Benefits entitlement (UC status, eligible benefits)
- Communication preferences

Be especially sensitive when discussing:
- Arrears (offer support first, enforcement last)
- Vulnerability (use person-first language)
- Health conditions (keep confidential, reference only when relevant)`,

  case: `You are reviewing a housing case. Focus on:
- Case type and current status
- SLA compliance (days to target, breach risk)
- Priority and escalation status
- Handler and response timeline
- Tenant impact and vulnerability

For repairs: check Awaab's Law applicability, SOR codes, first-time fix potential
For complaints: check Housing Ombudsman Code compliance, stage, escalation risk
For ASB: check evidence gathering, multi-agency involvement, community trigger threshold
For damp-mould: check hazard classification, linked repairs, investigation timeline`,

  estate: `You are reviewing an estate overview. Focus on:
- Occupancy rates and void turnaround
- Compliance rates across the estate
- Active casework volume and trends
- Community safety (ASB, crime data)
- Environmental factors (damp risk, weather alerts)
- Officer workload and caseload balance

Provide estate-level trends and comparisons where possible.`,

  compliance: `You are reviewing compliance data. Focus on:
- Certificate validity dates and expiry countdowns
- Non-compliant properties requiring immediate action
- Upcoming expiries in the next 30/60/90 days
- Contractor scheduling requirements
- Regulatory reporting obligations (IDA returns)

Always highlight life-safety compliance (gas, fire, electrical) over administrative compliance.`,

  rent: `You are reviewing rent and financial data. Focus on:
- Current arrears levels and trends
- Payment arrangement compliance
- Universal Credit managed payments
- Discretionary housing payment eligibility
- Pre-action protocol requirements before legal proceedings
- Tenant vulnerability before recommending enforcement

Always recommend support and intervention before legal action.`,

  general: `You are a general-purpose housing management assistant. Provide helpful, accurate information about:
- UK social housing regulations and legislation
- Housing association best practices
- Data analysis and reporting
- Workflow optimisation
- Team management and caseload balancing

Adapt your detail level to the user's persona role.`,
};

// ---- Persona-Scoped Response Formatting ----

interface PersonaConfig {
  detailLevel: 'executive' | 'operational' | 'detailed';
  focusAreas: string[];
  tone: string;
  maxResponseLength: number;
}

const PERSONA_CONFIGS: Record<string, PersonaConfig> = {
  'coo': {
    detailLevel: 'executive',
    focusAreas: ['KPIs', 'strategic risks', 'regulatory compliance', 'performance trends'],
    tone: 'concise, data-driven, strategic',
    maxResponseLength: 500,
  },
  'head-of-housing': {
    detailLevel: 'executive',
    focusAreas: ['regional performance', 'team metrics', 'escalations', 'resource planning'],
    tone: 'analytical, action-oriented',
    maxResponseLength: 800,
  },
  'manager': {
    detailLevel: 'operational',
    focusAreas: ['estate performance', 'caseload', 'officer workload', 'compliance deadlines'],
    tone: 'practical, solution-focused',
    maxResponseLength: 1000,
  },
  'housing-officer': {
    detailLevel: 'detailed',
    focusAreas: ['individual cases', 'tenant interactions', 'repair scheduling', 'patch management'],
    tone: 'supportive, thorough, action-step oriented',
    maxResponseLength: 1500,
  },
  'operative': {
    detailLevel: 'detailed',
    focusAreas: ['repair details', 'SOR codes', 'safety requirements', 'scheduling'],
    tone: 'technical, clear, safety-aware',
    maxResponseLength: 800,
  },
};

// ---- Few-Shot Examples ----

const FEW_SHOT_EXAMPLES: Record<string, { query: string; response: string }[]> = {
  'arrears': [
    {
      query: 'Show me tenants at risk of legal action for arrears',
      response: `**High-Risk Arrears Tenants** (>8 weeks in arrears):

| Tenant | Property | Arrears | Weeks | UC Status | Action Needed |
|--------|----------|---------|-------|-----------|---------------|
| Mrs Smith | 12 Oak Road | £1,240 | 10 | Active | Pre-action review |
| Mr Jones | 4 Elm Court | £980 | 8 | Transitioning | Welfare visit |

**Pre-Action Protocol Checklist:**
1. ✅ All arrears letters sent (stages 1-3)
2. ⚠️ Check vulnerability assessment before proceeding
3. ⚠️ Verify no outstanding repair issues at property
4. ❌ Obtain management authorisation for NOSP

*Note: Mr Jones is transitioning to UC — consider DHP application before legal action.*`,
    },
  ],
  'damp': [
    {
      query: 'Which properties need damp inspections this week?',
      response: `**Priority Damp Inspections** (Awaab's Law compliance):

🔴 **Emergency** (within 24 hours):
- 7 Cedar Close — Tenant reported black mould in bedroom, child under 2 in household. Risk score: 85/100.

🟡 **Urgent** (within 7 days):
- 15 Birch Lane — Recurring condensation, 3rd report in 6 months. Risk score: 72/100.
- 22 Pine Court — Rising damp identified by IoT sensor, humidity >80% for 5 consecutive days.

📋 **Scheduled** (within 28 days):
- 3 Ash Drive — Annual reinspection due, previous Category 2 hazard.

*Action: Emergency case at 7 Cedar Close requires same-day visit due to Awaab's Law obligations and vulnerable household.*`,
    },
  ],
  'complaint': [
    {
      query: 'What complaints are at risk of breaching SLA?',
      response: `**SLA Breach Risk Analysis**:

🔴 **Breaching Today** (0 days remaining):
- COMP-2024-0156 — Stage 1, repair quality complaint. Assigned to Sarah Mitchell. **Immediate response required.**

🟡 **Breaching This Week** (1-5 days):
- COMP-2024-0162 — Stage 2, ASB noise complaint escalation. 3 days remaining.
- COMP-2024-0171 — Stage 1, communication failure. 4 days remaining.

📊 **Summary**: 3 of 12 open complaints at risk. Current on-time response rate: 83% (target: 95%).

*Recommendation: Prioritise COMP-2024-0156 immediately. Consider requesting a Stage 1 extension for COMP-2024-0162 under exceptional circumstances provision.*`,
    },
  ],
};

// ---- Prompt Construction ----

export function buildSystemPrompt(
  entityType: EntityType,
  persona: string,
): string {
  const entityPrompt = ENTITY_SYSTEM_PROMPTS[entityType] || ENTITY_SYSTEM_PROMPTS.general;
  const personaConfig = PERSONA_CONFIGS[persona] || PERSONA_CONFIGS['housing-officer'];

  return `${entityPrompt}

Response formatting guidelines for ${persona} persona:
- Detail level: ${personaConfig.detailLevel}
- Focus areas: ${personaConfig.focusAreas.join(', ')}
- Tone: ${personaConfig.tone}
- Maximum response length: approximately ${personaConfig.maxResponseLength} words
- Use Markdown formatting (headers, tables, bullet points) for readability
- Use UK date format (DD/MM/YYYY) and GBP (£) for currency
- Include actionable next steps where appropriate`;
}

export function buildPromptWithFewShot(
  query: string,
  entityType: EntityType,
  persona: string,
  contextData?: string,
): string {
  const systemPrompt = buildSystemPrompt(entityType, persona);
  const parts: string[] = [systemPrompt];

  // Add relevant few-shot examples
  const q = query.toLowerCase();
  for (const [topic, examples] of Object.entries(FEW_SHOT_EXAMPLES)) {
    if (q.includes(topic)) {
      parts.push('\n--- Example Interaction ---');
      for (const example of examples) {
        parts.push(`User: ${example.query}`);
        parts.push(`Assistant: ${example.response}`);
      }
      parts.push('--- End Examples ---\n');
      break; // Only add one set of examples
    }
  }

  // Add context data
  if (contextData) {
    parts.push(`\nCurrent data context:\n${contextData}`);
  }

  parts.push(`\nUser query: ${query}`);

  return parts.join('\n');
}

// ---- Communication Drafting Prompts ----

export type CommunicationTone = 'supportive' | 'formal' | 'urgent' | 'legal';

interface DraftingContext {
  tenant: TenantDoc;
  property?: PropertyDoc;
  caseData?: CaseDoc;
  communicationType: string;
  tone: CommunicationTone;
  persona: string;
}

export function buildDraftingPrompt(ctx: DraftingContext): string {
  const isVulnerable = (ctx.tenant.vulnerabilityFlags?.length || 0) > 0;
  const toneGuidance = getDraftingToneGuidance(ctx.tone, isVulnerable);

  return `Draft a formal communication letter for a UK social housing tenant.

Tenant details:
- Name: ${ctx.tenant.title} ${ctx.tenant.firstName} ${ctx.tenant.lastName}
- Address: ${ctx.property?.address || 'their property'}
- Tenancy type: ${ctx.tenant.tenancyType}
- Vulnerability flags: ${isVulnerable ? ctx.tenant.vulnerabilityFlags.map((f: any) => f.type || f).join(', ') : 'None'}
- UC status: ${ctx.tenant.ucStatus || 'N/A'}
- Rent balance: £${Math.abs(ctx.tenant.rentBalance || 0).toFixed(2)} ${(ctx.tenant.rentBalance || 0) < 0 ? 'in arrears' : 'in credit'}

${ctx.caseData ? `Case details:
- Reference: ${ctx.caseData.reference}
- Type: ${ctx.caseData.type}
- Subject: ${ctx.caseData.subject}
- Status: ${ctx.caseData.status}
- Handler: ${ctx.caseData.handler}
- Days open: ${ctx.caseData.daysOpen}` : ''}

Communication type: ${ctx.communicationType}
${toneGuidance}

Requirements:
1. Use the organisation name "Riverside Community Housing Association"
2. Include the date in UK format
3. Include any legally required information for this communication type
4. If the tenant is vulnerable, use particularly sensitive language
5. Include contact details (phone: 0800 XXX XXXX)
6. End with a clear call-to-action or next step
7. Appropriate sign-off matching the tone

Do not include any personally identifiable information beyond what is provided.
Format as a complete letter ready to send.`;
}

function getDraftingToneGuidance(tone: CommunicationTone, isVulnerable: boolean): string {
  const vulnNote = isVulnerable ? '\nIMPORTANT: This tenant has vulnerability flags. Use especially sensitive, supportive language. Offer additional support services.' : '';

  switch (tone) {
    case 'supportive':
      return `Tone: Warm, empathetic, and supportive. Focus on help available rather than obligations.${vulnNote}`;
    case 'formal':
      return `Tone: Professional and formal but still respectful. Use standard business letter conventions.${vulnNote}`;
    case 'urgent':
      return `Tone: Clear and direct about urgency while remaining respectful. Emphasise time-sensitivity and consequences of inaction.${vulnNote}`;
    case 'legal':
      return `Tone: Formal legal language. Include all statutory requirements and timescales. Reference relevant legislation.${vulnNote}
Note: Even in legal communications, the Housing Ombudsman expects a reasonable and professional tone.`;
    default:
      return `Tone: Professional and clear.${vulnNote}`;
  }
}

// ---- Legal Compliance Check ----

export interface LegalComplianceResult {
  passed: boolean;
  warnings: string[];
}

export function checkLegalCompliance(draft: string, communicationType: string): LegalComplianceResult {
  const warnings: string[] = [];

  // Check for required elements based on communication type
  if (communicationType === 'arrears-support' || communicationType === 'arrears-warning') {
    if (!draft.toLowerCase().includes('support') && !draft.toLowerCase().includes('help')) {
      warnings.push('Arrears communications should offer support options before enforcement action');
    }
    if (!draft.toLowerCase().includes('contact') && !draft.toLowerCase().includes('call')) {
      warnings.push('Must include contact details for the tenant to reach their officer');
    }
  }

  if (communicationType === 'complaint-acknowledgement') {
    if (!draft.includes('5 working days') && !draft.includes('five working days')) {
      warnings.push('Complaint acknowledgement should reference the 5 working day acknowledgement window');
    }
    if (!draft.includes('10 working days') && !draft.includes('20 working days') && !draft.includes('ten working days')) {
      warnings.push('Complaint response should reference the response deadline (10 or 20 working days)');
    }
  }

  if (communicationType === 'section-21' || communicationType === 'nosp') {
    if (!draft.toLowerCase().includes('legal advice') && !draft.toLowerCase().includes('solicitor')) {
      warnings.push('Notice of seeking possession must advise tenant to seek legal advice');
    }
  }

  // General checks
  if (draft.toLowerCase().includes('evict') && !communicationType.includes('legal')) {
    warnings.push('Avoid using the word "evict" in non-legal communications — use "possession proceedings" instead');
  }

  if (draft.length > 3000 && communicationType !== 'section-21') {
    warnings.push('Communication is unusually long. Consider making it more concise for tenant accessibility');
  }

  return {
    passed: warnings.length === 0,
    warnings,
  };
}
