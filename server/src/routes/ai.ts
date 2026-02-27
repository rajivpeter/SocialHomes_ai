import { Router } from 'express';
import { collections, getDocs, serializeFirestoreData } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { CaseDoc, TenantDoc, PropertyDoc } from '../models/firestore-schemas.js';

// Phase 5 services
import { generateAiResponse, streamAiResponse } from '../services/vertex-ai.js';
import { buildDraftingPrompt, checkLegalCompliance } from '../services/ai-prompts.js';
import type { CommunicationTone } from '../services/ai-prompts.js';
import { calculateTenantActivityScore, scanAllTenantActivity } from '../services/tenant-activity-scoring.js';
import { assessAwaabsLawCase, scanAwaabsLawCases } from '../services/awaabs-law.js';
import { analyseRepairDescription, checkRecurringPatterns } from '../services/repair-intake.js';

// Differentiator services
import { predictDampRisk, predictEstateDampRisk } from '../services/damp-prediction.js';
import { getEstateCrimeContext, getAsbCaseContext } from '../services/crime-context.js';
import { assessVulnerability, scanAllTenants } from '../services/vulnerability-detection.js';
import { checkBenefitsEntitlement } from '../services/benefits-engine.js';
import { generateNeighbourhoodBriefing } from '../services/neighbourhood-briefing.js';
import { generatePropertyPassport } from '../services/property-passport.js';
import {
  mockUcVerification,
  mockIoTSensorData,
  mockGoCardlessMandate,
  mockNomisData,
  mockRepairsMarketplace,
  mockRegulatorySubmission,
  mockSigningEnvelope,
  mockReferencingResult,
  mockLandRegistryTitle,
} from '../services/mock-services.js';

// GOV.UK Notify template library
import {
  getAllTemplates,
  getTemplateById,
  getTemplatesByCategory,
  renderTemplate,
} from '../services/govuk-notify.js';
import type { TemplateCategory } from '../services/govuk-notify.js';

export const aiRouter = Router();
aiRouter.use(authMiddleware);

function generateDraft(tenant: any, property: any, caseData: any, type: string, tone: string, _persona: string): string {
  const salutation = `Dear ${tenant.title} ${tenant.lastName}`;
  const address = property ? property.address : 'your home';
  const date = new Date().toLocaleDateString('en-GB');
  const vuln = tenant.vulnerabilityFlags?.length > 0;
  const toneAdj = vuln ? 'We understand this may be difficult, and we are here to support you. ' : '';

  switch (type) {
    case 'holding-update':
      return `${salutation},\n\nRe: ${caseData?.reference || 'Your recent enquiry'}\n\nThank you for contacting us regarding ${caseData?.subject || 'your recent enquiry'}. ${toneAdj}We wanted to let you know that we have received your request and it is being actively progressed.\n\nYour case has been assigned to ${caseData?.handler || 'a member of our team'} who will be in touch within the next 2 working days to discuss next steps.\n\nIf your situation changes or you need to contact us urgently, please call us on 0800 XXX XXXX.\n\nKind regards,\nRiverside Community Housing Association\n${date}`;

    case 'arrears-support':
      return `${salutation},\n\nRe: Your Rent Account at ${address}\n\nWe are writing to you about your rent account, which currently shows a balance of ${Math.abs(tenant.rentBalance || 0).toFixed(2)} pounds.\n\n${toneAdj}We understand that managing household finances can be challenging, and we want to work with you to find a solution. We have a range of support available including:\n\n- Setting up a manageable payment plan\n- Checking your entitlement to benefits including Universal Credit\n- Referral to our Money Advice Service\n- Support with energy costs and other household bills\n\nPlease contact your Housing Officer, ${tenant.assignedOfficer}, on 0800 XXX XXXX to discuss your options.\n\nKind regards,\nRiverside Community Housing Association\n${date}`;

    case 'complaint-acknowledgement':
      return `${salutation},\n\nRe: ${caseData?.reference || 'Your Complaint'}\n\nThank you for raising your concerns with us. We take all complaints seriously and are committed to resolving them fairly and promptly.\n\nYour complaint has been registered at Stage ${caseData?.stage || 1} of our complaints process.\n\nUnder our complaints policy:\n- We will acknowledge your complaint within 5 working days\n- We will provide a full response within ${caseData?.stage === 2 ? '20' : '10'} working days\n\nYour complaint has been assigned to ${caseData?.handler || 'a senior member of our team'}.\n\nKind regards,\nRiverside Community Housing Association\n${date}`;

    default:
      return `${salutation},\n\nThank you for your recent contact. ${toneAdj}We are writing to update you on the progress of your enquiry.\n\nIf you have any questions, please do not hesitate to contact your Housing Officer, ${tenant.assignedOfficer}.\n\nKind regards,\nRiverside Community Housing Association\n${date}`;
  }
}

function generateChatResponse(query: string, _persona: string, cases: CaseDoc[], tenants: TenantDoc[], properties: PropertyDoc[]): string {
  const q = query.toLowerCase();
  const openRepairs = cases.filter(c => c.type === 'repair' && c.status !== 'completed' && c.status !== 'cancelled');
  const openComplaints = cases.filter(c => c.type === 'complaint' && c.status !== 'closed');
  const openDamp = cases.filter(c => c.type === 'damp-mould' && c.status !== 'closed');
  const tenantsInArrears = tenants.filter(t => t.rentBalance < 0);
  const totalArrears = tenantsInArrears.reduce((s, t) => s + Math.abs(t.rentBalance), 0);

  if (q.includes('arrears') || q.includes('rent')) {
    return `Based on current data:\n\n- **Total arrears**: GBP ${totalArrears.toFixed(2)}\n- **Tenants in arrears**: ${tenantsInArrears.length}\n- **High-risk tenants**: ${tenants.filter(t => t.arrearsRisk > 70).length}\n- **UC transitioning**: ${tenants.filter(t => t.ucStatus === 'transitioning').length}\n\nWould you like me to generate a targeted intervention plan?`;
  }
  if (q.includes('repair') || q.includes('maintenance')) {
    const emergency = openRepairs.filter(r => r.priority === 'emergency');
    const breached = openRepairs.filter(r => r.slaStatus === 'breached');
    return `Current repair statistics:\n\n- **Open repairs**: ${openRepairs.length}\n- **Emergency**: ${emergency.length}\n- **SLA breached**: ${breached.length}\n\nShall I prioritise the breached SLAs for escalation?`;
  }
  if (q.includes('complaint')) {
    return `Complaint summary:\n\n- **Open complaints**: ${openComplaints.length}\n- **Stage 1**: ${openComplaints.filter(c => c.stage === 1).length}\n- **Stage 2**: ${openComplaints.filter(c => c.stage === 2).length}\n\nShall I draft responses for high-risk cases?`;
  }
  if (q.includes('damp') || q.includes('mould')) {
    return `Damp and Mould status:\n\n- **Active cases**: ${openDamp.length}\n- **Emergency**: ${openDamp.filter(c => c.hazardClassification === 'emergency').length}\n- **High-risk properties**: ${properties.filter(p => p.dampRisk > 50).length}`;
  }
  return `Quick overview: ${tenants.length} tenancies, ${openRepairs.length} open repairs, ${openComplaints.length} open complaints, GBP ${totalArrears.toFixed(2)} total arrears.\n\nI can help with detailed analysis. What would you like to know?`;
}

// POST /api/v1/ai/draft-communication
aiRouter.post('/draft-communication', async (req, res, next) => {
  try {
    const { tenantId, communicationType, tone, caseRef, persona } = req.body;
    const tenantDoc = await collections.tenants.doc(tenantId).get();
    if (!tenantDoc.exists) return res.status(404).json({ error: 'Tenant not found' });
    const tenant = serializeFirestoreData(tenantDoc.data()) as any;

    let caseData = null;
    if (caseRef) {
      const caseSnapshot = await collections.cases.where('reference', '==', caseRef).limit(1).get();
      if (!caseSnapshot.empty) {
        caseData = serializeFirestoreData(caseSnapshot.docs[0].data());
      }
    }

    const propDoc = await collections.properties.doc(tenant.propertyId).get();
    const property = propDoc.exists ? serializeFirestoreData(propDoc.data()) as any : null;

    const draft = generateDraft(tenant, property, caseData, communicationType, tone || 'empathetic', persona || 'housing-officer');

    res.json({
      draft,
      metadata: {
        tenantId,
        tenantName: `${tenant.title} ${tenant.firstName} ${tenant.lastName}`,
        communicationType,
        tone,
        generatedAt: new Date().toISOString(),
        confidence: 0.92,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/chat
aiRouter.post('/chat', async (req, res, next) => {
  try {
    const { query, persona } = req.body;
    const p = persona || req.user?.persona || 'housing-officer';
    const [cases, tenants, properties] = await Promise.all([
      getDocs<CaseDoc>(collections.cases),
      getDocs<TenantDoc>(collections.tenants),
      getDocs<PropertyDoc>(collections.properties),
    ]);
    const response = generateChatResponse(query, p, cases, tenants, properties);
    res.json({ response, persona: p, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// ================================================================
// DIFFERENTIATOR 1: Predictive Damp Intelligence
// ================================================================

// GET /api/v1/ai/damp-risk/:propertyId
aiRouter.get('/damp-risk/:propertyId', async (req, res, next) => {
  try {
    const prediction = await predictDampRisk(req.params.propertyId);
    res.json(prediction);
  } catch (err: any) {
    if (err.message?.includes('not found')) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// GET /api/v1/ai/damp-risk/estate/:estateId
aiRouter.get('/damp-risk/estate/:estateId', async (req, res, next) => {
  try {
    const result = await predictEstateDampRisk(req.params.estateId);
    res.json(result);
  } catch (err: any) {
    if (err.message?.includes('not found')) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// ================================================================
// DIFFERENTIATOR 2: Live Crime Context for ASB
// ================================================================

// GET /api/v1/ai/crime-context/:estateId
aiRouter.get('/crime-context/:estateId', async (req, res, next) => {
  try {
    const months = parseInt(req.query.months as string) || 3;
    const context = await getEstateCrimeContext(req.params.estateId, months);
    res.json(context);
  } catch (err: any) {
    if (err.message?.includes('not found')) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// GET /api/v1/ai/crime-context/case/:caseId
aiRouter.get('/crime-context/case/:caseId', async (req, res, next) => {
  try {
    const context = await getAsbCaseContext(req.params.caseId);
    res.json(context);
  } catch (err: any) {
    if (err.message?.includes('not found') || err.message?.includes('not an ASB'))
      return res.status(404).json({ error: err.message });
    next(err);
  }
});

// ================================================================
// DIFFERENTIATOR 3: Automatic Vulnerability Detection
// ================================================================

// GET /api/v1/ai/vulnerability/:tenantId
aiRouter.get('/vulnerability/:tenantId', async (req, res, next) => {
  try {
    const assessment = await assessVulnerability(req.params.tenantId);
    res.json(assessment);
  } catch (err: any) {
    if (err.message?.includes('not found')) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// POST /api/v1/ai/vulnerability/scan
aiRouter.post('/vulnerability/scan', async (_req, res, next) => {
  try {
    const scan = await scanAllTenants();
    res.json(scan);
  } catch (err) {
    next(err);
  }
});

// ================================================================
// DIFFERENTIATOR 4: Benefits Entitlement Engine
// ================================================================

// GET /api/v1/ai/benefits-check/:tenantId
aiRouter.get('/benefits-check/:tenantId', async (req, res, next) => {
  try {
    const assessment = await checkBenefitsEntitlement(req.params.tenantId);
    res.json(assessment);
  } catch (err: any) {
    if (err.message?.includes('not found')) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// ================================================================
// DIFFERENTIATOR 5: Property Passport
// ================================================================

// GET /api/v1/ai/property-passport/:propertyId
aiRouter.get('/property-passport/:propertyId', async (req, res, next) => {
  try {
    const passport = await generatePropertyPassport(req.params.propertyId);
    res.json(passport);
  } catch (err: any) {
    if (err.message?.includes('not found')) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// ================================================================
// DIFFERENTIATOR 6: AI Neighbourhood Briefing
// ================================================================

// GET /api/v1/ai/briefing/:estateId
aiRouter.get('/briefing/:estateId', async (req, res, next) => {
  try {
    const briefing = await generateNeighbourhoodBriefing(req.params.estateId);
    res.json(briefing);
  } catch (err: any) {
    if (err.message?.includes('not found')) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// ================================================================
// MOCK SERVICES (Tier 3 — DWP UC, IoT, GoCardless, NOMIS)
// ================================================================

// GET /api/v1/ai/mock/uc-verification/:tenantId
aiRouter.get('/mock/uc-verification/:tenantId', (req, res) => {
  res.json(mockUcVerification(req.params.tenantId));
});

// GET /api/v1/ai/mock/iot-sensors/:propertyId
aiRouter.get('/mock/iot-sensors/:propertyId', (req, res) => {
  res.json(mockIoTSensorData(req.params.propertyId));
});

// GET /api/v1/ai/mock/direct-debit/:tenantId
aiRouter.get('/mock/direct-debit/:tenantId', async (req, res, next) => {
  try {
    const tenant = await collections.tenants.doc(req.params.tenantId).get();
    const weeklyRent = tenant.exists ? (tenant.data()?.weeklyCharge ?? 150) : 150;
    res.json(mockGoCardlessMandate(req.params.tenantId, weeklyRent));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/ai/mock/labour-market/:lsoaCode
aiRouter.get('/mock/labour-market/:lsoaCode', (req, res) => {
  res.json(mockNomisData(req.params.lsoaCode));
});

// GET /api/v1/ai/mock/repairs-marketplace/:caseId
aiRouter.get('/mock/repairs-marketplace/:caseId', (req, res) => {
  res.json(mockRepairsMarketplace(req.params.caseId));
});

// GET /api/v1/ai/mock/regulatory/:type/:refId
aiRouter.get('/mock/regulatory/:type/:refId', (req, res) => {
  const validTypes = ['rsh-ida', 'core-lettings', 'core-sales', 'ombudsman'] as const;
  const type = req.params.type as typeof validTypes[number];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: `Invalid regulatory type: ${req.params.type}. Valid types are: ${validTypes.join(', ')}`,
    });
  }
  res.json(mockRegulatorySubmission(type, req.params.refId));
});

// GET /api/v1/ai/mock/signing/:documentType/:tenantId
aiRouter.get('/mock/signing/:documentType/:tenantId', (req, res) => {
  res.json(mockSigningEnvelope(req.params.documentType, req.params.tenantId));
});

// GET /api/v1/ai/mock/referencing/:applicantId
aiRouter.get('/mock/referencing/:applicantId', (req, res) => {
  res.json(mockReferencingResult(req.params.applicantId));
});

// GET /api/v1/ai/mock/land-registry/:propertyId
aiRouter.get('/mock/land-registry/:propertyId', (req, res) => {
  res.json(mockLandRegistryTitle(req.params.propertyId));
});

// ================================================================
// GOV.UK Notify Template Library
// ================================================================

// GET /api/v1/ai/notify/templates — list all templates
aiRouter.get('/notify/templates', (_req, res) => {
  const templates = getAllTemplates();
  res.json({ templates, total: templates.length });
});

// GET /api/v1/ai/notify/templates/:category — list templates by category
aiRouter.get('/notify/templates/:category', (req, res) => {
  const category = req.params.category as TemplateCategory;
  const validCategories: TemplateCategory[] = [
    'rent-arrears', 'repairs', 'asb', 'compliance', 'tenancy', 'damp-mould', 'general',
  ];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      error: `Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}`,
    });
  }
  const templates = getTemplatesByCategory(category);
  res.json({ category, templates, total: templates.length });
});

// GET /api/v1/ai/notify/template/:id — get a single template
aiRouter.get('/notify/template/:id', (req, res) => {
  const template = getTemplateById(req.params.id);
  if (!template) {
    return res.status(404).json({ error: `Template not found: ${req.params.id}` });
  }
  res.json(template);
});

// POST /api/v1/ai/notify/render — render a template with personalisation data
aiRouter.post('/notify/render', (req, res) => {
  const { templateId, personalisation } = req.body;
  if (!templateId) {
    return res.status(400).json({ error: 'templateId is required' });
  }
  if (!personalisation || typeof personalisation !== 'object') {
    return res.status(400).json({ error: 'personalisation must be an object' });
  }
  try {
    const rendered = renderTemplate(templateId, personalisation);
    res.json(rendered);
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to render template' });
  }
});

// ================================================================
// PHASE 5: AI-Enhanced Chat (Vertex AI)
// ================================================================

// POST /api/v1/ai/chat/v2 — Vertex AI enhanced chat
aiRouter.post('/chat/v2', async (req, res, next) => {
  try {
    const { query, conversationId, entityType, entityId } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });
    const persona = req.user?.persona || 'housing-officer';

    // Build context from entity if provided
    let entityData: Record<string, unknown> | undefined;
    if (entityType && entityId) {
      const collectionMap: Record<string, FirebaseFirestore.CollectionReference> = {
        property: collections.properties,
        tenant: collections.tenants,
        case: collections.cases,
        estate: collections.estates,
      };
      const col = collectionMap[entityType];
      if (col) {
        const doc = await col.doc(entityId).get();
        if (doc.exists) entityData = serializeFirestoreData(doc.data()) as Record<string, unknown>;
      }
    }

    const response = await generateAiResponse(query, {
      entityType: entityType || 'general',
      entityId,
      entityData,
      persona,
    }, conversationId);

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/ai/chat/stream — SSE streaming endpoint
aiRouter.get('/chat/stream', async (req, res, next) => {
  try {
    const query = req.query.query as string;
    const conversationId = req.query.conversationId as string;
    const entityType = (req.query.entityType as string) || 'general';
    const persona = req.user?.persona || 'housing-officer';

    if (!query) return res.status(400).json({ error: 'query parameter is required' });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = streamAiResponse(query, {
      entityType: entityType as any,
      persona,
    }, conversationId);

    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    next(err);
  }
});

// ================================================================
// PHASE 5: AI Communication Drafting (Task 5.2.11)
// ================================================================

// POST /api/v1/ai/draft-communication/v2 — AI-enhanced drafting
aiRouter.post('/draft-communication/v2', async (req, res, next) => {
  try {
    const { tenantId, communicationType, tone, caseRef } = req.body;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const tenantDoc = await collections.tenants.doc(tenantId).get();
    if (!tenantDoc.exists) return res.status(404).json({ error: 'Tenant not found' });
    const tenant = serializeFirestoreData(tenantDoc.data()) as TenantDoc;

    let caseData: CaseDoc | undefined;
    if (caseRef) {
      const caseSnapshot = await collections.cases.where('reference', '==', caseRef).limit(1).get();
      if (!caseSnapshot.empty) caseData = serializeFirestoreData(caseSnapshot.docs[0].data()) as CaseDoc;
    }

    const propDoc = await collections.properties.doc(tenant.propertyId).get();
    const property = propDoc.exists ? serializeFirestoreData(propDoc.data()) as PropertyDoc : undefined;

    // Build prompt and generate via Vertex AI
    const persona = req.user?.persona || 'housing-officer';
    const draftTone: CommunicationTone = tone || 'formal';

    const prompt = buildDraftingPrompt({
      tenant,
      property,
      caseData,
      communicationType: communicationType || 'general-update',
      tone: draftTone,
      persona,
    });

    const aiResponse = await generateAiResponse(prompt, {
      entityType: 'tenant',
      entityId: tenantId,
      persona,
    }, undefined, 'drafting');

    // Legal compliance check
    const complianceCheck = checkLegalCompliance(aiResponse.response, communicationType);

    res.json({
      draft: aiResponse.response,
      metadata: {
        tenantId,
        tenantName: `${tenant.title} ${tenant.firstName} ${tenant.lastName}`,
        communicationType,
        tone: draftTone,
        model: aiResponse.metadata.model,
        confidence: 0.88,
        generatedAt: new Date().toISOString(),
        legalComplianceCheck: complianceCheck,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ================================================================
// PHASE 5: Tenant Activity Scoring (Task 5.2.12)
// ================================================================

// GET /api/v1/ai/activity-score/:tenantId
aiRouter.get('/activity-score/:tenantId', async (req, res, next) => {
  try {
    const score = await calculateTenantActivityScore(req.params.tenantId);
    res.json(score);
  } catch (err: any) {
    if (err.message?.includes('not found')) return res.status(404).json({ error: err.message });
    next(err);
  }
});

// POST /api/v1/ai/activity-score/scan
aiRouter.post('/activity-score/scan', async (_req, res, next) => {
  try {
    const result = await scanAllTenantActivity();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ================================================================
// PHASE 5: Awaab's Law Compliance Engine (Task 5.2.13)
// ================================================================

// GET /api/v1/ai/awaabs-law/:caseId
aiRouter.get('/awaabs-law/:caseId', async (req, res, next) => {
  try {
    const assessment = await assessAwaabsLawCase(req.params.caseId);
    res.json(assessment);
  } catch (err: any) {
    if (err.message?.includes('not found') || err.message?.includes('not a damp')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

// GET /api/v1/ai/awaabs-law — scan all Awaab's Law cases
aiRouter.get('/awaabs-law', async (_req, res, next) => {
  try {
    const scan = await scanAwaabsLawCases();
    res.json(scan);
  } catch (err) {
    next(err);
  }
});

// ================================================================
// PHASE 5: AI Repair Intake (Task 5.2.14)
// ================================================================

// POST /api/v1/ai/repair-intake — analyse repair description
aiRouter.post('/repair-intake', async (req, res, next) => {
  try {
    const { description, propertyId } = req.body;
    if (!description) return res.status(400).json({ error: 'description is required' });

    const analysis = analyseRepairDescription(description, propertyId);

    // Check for recurring patterns if property ID is provided
    if (propertyId && analysis.suggestedSorCode !== 'GN999') {
      const recurring = await checkRecurringPatterns(propertyId, analysis.suggestedSorCode);
      analysis.recurringPattern = recurring.isRecurring;
      analysis.recurringDetails = recurring.details;
    }

    res.json(analysis);
  } catch (err) {
    next(err);
  }
});
