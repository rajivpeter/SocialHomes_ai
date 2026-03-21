import { Router } from 'express';
import { collections, serializeFirestoreData } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { CaseDoc, TenantDoc, PropertyDoc } from '../models/firestore-schemas.js';

// Phase 5 services
import { generateAiResponse, streamAiResponse, analyseRepairPhotoVertex } from '../services/vertex-ai.js';
import { buildDraftingPrompt, checkLegalCompliance } from '../services/ai-prompts.js';
import type { CommunicationTone } from '../services/ai-prompts.js';

// Claude AI service
import {
  generateChatResponse as claudeChat,
  draftCommunication as claudeDraft,
  analyseRepairPhoto,
} from '../services/claude-ai.js';
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

// Note: Old hardcoded generateDraft() and generateChatResponse() functions removed.
// Chat and drafting now powered by Claude AI service (claude-ai.ts).

// POST /api/v1/ai/draft-communication
aiRouter.post('/draft-communication', async (req, res, next) => {
  try {
    const { tenantId, communicationType, tone, caseRef, persona } = req.body;
    const tenantDoc = await collections.tenants.doc(tenantId).get();
    if (!tenantDoc.exists) return res.status(404).json({ error: 'Tenant not found' });
    const tenant = serializeFirestoreData(tenantDoc.data()) as any;

    let caseData: any = null;
    if (caseRef) {
      const caseSnapshot = await collections.cases.where('reference', '==', caseRef).limit(1).get();
      if (!caseSnapshot.empty) {
        caseData = serializeFirestoreData(caseSnapshot.docs[0].data());
      }
    }

    const propDoc = await collections.properties.doc(tenant.propertyId).get();
    const property = propDoc.exists ? serializeFirestoreData(propDoc.data()) as any : null;

    // Build context string for Claude
    const contextParts: string[] = [];
    contextParts.push(`Tenant: ${tenant.title} ${tenant.firstName} ${tenant.lastName}`);
    contextParts.push(`Address: ${property?.address || 'Unknown'}`);
    contextParts.push(`Tenancy type: ${tenant.tenancyType || 'N/A'}`);
    contextParts.push(`Rent balance: GBP ${Math.abs(tenant.rentBalance || 0).toFixed(2)} ${(tenant.rentBalance || 0) < 0 ? 'in arrears' : 'in credit'}`);
    contextParts.push(`UC status: ${tenant.ucStatus || 'N/A'}`);
    if (tenant.vulnerabilityFlags?.length > 0) {
      contextParts.push(`Vulnerability flags: ${tenant.vulnerabilityFlags.map((f: any) => f.type || f).join(', ')}`);
    }
    if (caseData) {
      contextParts.push(`Case reference: ${caseData.reference}`);
      contextParts.push(`Case type: ${caseData.type}`);
      contextParts.push(`Case subject: ${caseData.subject}`);
      contextParts.push(`Case status: ${caseData.status}`);
      contextParts.push(`Handler: ${caseData.handler}`);
    }

    const tenantName = `${tenant.title} ${tenant.firstName} ${tenant.lastName}`;

    const result = await claudeDraft({
      tenantName,
      communicationType: communicationType || 'general-update',
      tone: tone || 'empathetic',
      context: contextParts.join('\n'),
      caseRef,
    });

    res.json({
      draft: result.body,
      subject: result.subject,
      metadata: {
        tenantId,
        tenantName,
        communicationType,
        tone,
        generatedAt: new Date().toISOString(),
        confidence: 0.92,
        aiPowered: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/chat
aiRouter.post('/chat', async (req, res, next) => {
  try {
    const { query, persona, tenantId, propertyId, caseRef } = req.body;
    const p = persona || req.user?.persona || 'housing-officer';

    // Gather context data if entity IDs are provided
    let tenantData: any = undefined;
    let propertyData: any = undefined;
    let caseData: any = undefined;

    const contextFetches: Promise<void>[] = [];

    if (tenantId) {
      contextFetches.push(
        collections.tenants.doc(tenantId).get().then(doc => {
          if (doc.exists) tenantData = serializeFirestoreData(doc.data());
        }),
      );
    }
    if (propertyId) {
      contextFetches.push(
        collections.properties.doc(propertyId).get().then(doc => {
          if (doc.exists) propertyData = serializeFirestoreData(doc.data());
        }),
      );
    }
    if (caseRef) {
      contextFetches.push(
        collections.cases.where('reference', '==', caseRef).limit(1).get().then(snap => {
          if (!snap.empty) caseData = serializeFirestoreData(snap.docs[0].data());
        }),
      );
    }

    if (contextFetches.length > 0) {
      await Promise.all(contextFetches);
    }

    const response = await claudeChat(query, {
      persona: p,
      tenantData,
      propertyData,
      caseData,
    });

    res.json({ response, persona: p, timestamp: new Date().toISOString(), aiPowered: true });
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

// POST /api/v1/ai/analyse-repair-photo — analyse repair photo using Vertex AI (Gemini Vision)
// Falls back to Claude Vision if Vertex AI is unavailable
aiRouter.post('/analyse-repair-photo', async (req, res, next) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

    // Primary: Vertex AI Gemini Vision (keeps data within GCP)
    const analysis = await analyseRepairPhotoVertex(imageBase64, mimeType);

    // If Vertex returned a zero-confidence fallback, try Claude as backup
    if (analysis.confidence === 0) {
      try {
        const claudeAnalysis = await analyseRepairPhoto(imageBase64);
        if (claudeAnalysis.confidence > 0) {
          return res.json(claudeAnalysis);
        }
      } catch {
        // Claude fallback failed too — return Vertex fallback
      }
    }

    res.json(analysis);
  } catch (err) {
    next(err);
  }
});
