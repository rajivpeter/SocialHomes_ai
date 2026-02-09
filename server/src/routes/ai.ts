import { Router } from 'express';
import { collections, getDocs, serializeFirestoreData } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { CaseDoc, TenantDoc, PropertyDoc } from '../models/firestore-schemas.js';

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
