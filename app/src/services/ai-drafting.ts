import type { Tenant, Property, Repair, Complaint, Persona } from '@/types';
import { formatCurrency } from '@/utils/format';
import { allCases, allRepairs, allComplaints, allDampCases, tenants as allTenants, properties as allProperties } from '@/data';

type CommunicationType = 'holding-update' | 'arrears-support' | 'complaint-response' | 'appointment' | 'welfare-check' | 'damp-prevention' | 'complaint-acknowledgement';
type Tone = 'supportive' | 'formal' | 'urgent' | 'legal';

interface DraftParams {
  tenant: Tenant;
  property?: Property;
  repair?: Repair;
  complaint?: Complaint;
  communicationType: CommunicationType;
  tone?: Tone;
  persona?: Persona;
}

function getToneGuidance(tenant: Tenant, tone?: Tone): string {
  // If tenant has vulnerability flags, always use supportive tone
  const hasVulnerability = tenant.vulnerabilityFlags.length > 0;
  const hasMentalHealth = tenant.vulnerabilityFlags.some(f => f.type.toLowerCase().includes('mental'));
  const hasChildren = tenant.household.some(m => m.isDependent);

  if (hasMentalHealth || hasVulnerability) return 'supportive';
  if (tone === 'legal') return 'legal';
  return tone || 'formal';
}

function getOpenRepairsList(tenant: Tenant): string[] {
  return allCases
    .filter(c => c.tenantId === tenant.id && c.type === 'repair' && c.status !== 'completed')
    .map(c => `${c.reference} - ${c.subject}`);
}

export function generateCommunicationDraft(params: DraftParams): string {
  const { tenant, property, repair, complaint, communicationType } = params;
  const effectiveTone = getToneGuidance(tenant, params.tone);
  const salutation = `Dear ${tenant.title} ${tenant.lastName}`;
  const signOff = effectiveTone === 'supportive'
    ? 'Please don\'t hesitate to contact us if you need any support.\n\nWith kind regards'
    : effectiveTone === 'legal'
    ? 'Yours sincerely'
    : 'Kind regards';
  const teamName = 'Riverside Crescent Housing Association';

  switch (communicationType) {
    case 'holding-update': {
      const openRepairs = getOpenRepairsList(tenant);
      const repairRef = repair ? repair.reference : (openRepairs.length > 0 ? openRepairs[0].split(' - ')[0] : 'your repair');
      const repairSubject = repair ? repair.subject.toLowerCase() : 'your reported issue';
      const daysWaiting = repair ? repair.daysOpen : 'several';
      const nextAction = repair?.appointmentDate
        ? `We have scheduled an appointment for ${repair.appointmentDate}${repair.appointmentSlot ? ` (${repair.appointmentSlot})` : ''}.`
        : 'We are actively working to arrange the next available appointment and will contact you with a date as soon as possible.';

      return `${salutation},

I am writing to update you on the progress of ${repairRef} regarding ${repairSubject}.

We sincerely apologise that this repair has taken ${daysWaiting} days to resolve. We understand this has been frustrating and we take full responsibility for the delay.

${nextAction}

${repair?.status === 'awaiting-parts' ? 'We are currently waiting for specialist parts to arrive. We expect these within 3-5 working days and will contact you immediately once they are available to arrange completion.\n\n' : ''}${tenant.vulnerabilityFlags.length > 0 ? 'We are aware of your circumstances and want to ensure you are fully supported throughout this process. If you need any additional assistance or adjustments, please let us know.\n\n' : ''}${openRepairs.length > 1 ? `We also note you have ${openRepairs.length - 1} other open repair${openRepairs.length > 2 ? 's' : ''} and we are working to resolve ${openRepairs.length > 2 ? 'these' : 'this'} as quickly as possible.\n\n` : ''}If you have any questions or concerns, please contact your housing officer ${tenant.assignedOfficer} on 020 7123 4567 or email housing@rcha.org.uk.

${signOff},
${tenant.assignedOfficer}
${teamName}`;
    }

    case 'arrears-support': {
      const balance = formatCurrency(Math.abs(tenant.rentBalance));
      const paymentMethod = tenant.paymentMethod === 'uc' ? 'Universal Credit' : tenant.paymentMethod === 'dd' ? 'Direct Debit' : 'your current payment method';

      return `${salutation},

I am writing to you about your rent account, which currently shows a balance of ${balance}.

${effectiveTone === 'supportive' ? 'We understand that managing finances can be challenging, especially with the current cost of living pressures. We are here to help and support you.' : 'We need to discuss this balance with you to agree a plan to bring your account up to date.'}

${tenant.ucStatus === 'claiming' || tenant.ucStatus === 'transitioning' ? `We understand you are ${tenant.ucStatus === 'transitioning' ? 'transitioning to' : 'currently receiving'} Universal Credit. We can request an Alternative Payment Arrangement (APA) to have your rent paid directly from your UC — would you like us to arrange this?\n\n` : ''}We would also like to offer you a free, confidential benefits check to make sure you are receiving all the financial support you are entitled to. Many tenants find they are eligible for additional help they didn't know about.

Please contact ${tenant.assignedOfficer} on 020 7123 4567 to discuss your options. ${effectiveTone === 'supportive' ? 'We can arrange a home visit if that would be easier for you.' : ''}

${effectiveTone === 'legal' ? 'Please note that if we do not hear from you within 14 days, we may need to take further action in accordance with the Pre-Action Protocol for Possession Claims.\n\n' : ''}${signOff},
${tenant.assignedOfficer}
${teamName}`;
    }

    case 'complaint-acknowledgement': {
      const ref = complaint?.reference || 'your complaint';
      return `${salutation},

Thank you for raising your concerns with us. I am writing to acknowledge receipt of ${ref}.

We take all complaints seriously and I want to assure you that your concerns will be fully investigated. Under our complaints procedure:

- **Stage 1**: We will provide a full written response within 10 working days
- If you remain dissatisfied, you can request escalation to **Stage 2**, where a senior manager will review your case within 20 working days
- You also have the right to contact the Housing Ombudsman Service at any time

Your complaint has been assigned to ${complaint?.handler || tenant.assignedOfficer} who will be investigating your concerns. They may contact you to discuss the issues in more detail.

${tenant.vulnerabilityFlags.length > 0 ? 'We want to ensure our communication is accessible and appropriate for you. If you need any adjustments to how we handle this complaint, please let us know.\n\n' : ''}${signOff},
Complaints Team
${teamName}`;
    }

    case 'welfare-check': {
      return `${salutation},

We hope this letter finds you well. As part of our commitment to supporting all our tenants, we would like to arrange a welfare check visit.

${tenant.vulnerabilityFlags.length > 0 ? `We want to ensure you are receiving all the support you need` : 'We like to check in with all our tenants regularly to ensure everything is going well with your home'} and to see if there is anything we can help with.

We would like to arrange a convenient time to visit you at home. This is an informal visit — we simply want to make sure you are comfortable and to discuss any concerns you may have about your home or tenancy.

Please contact ${tenant.assignedOfficer} on 020 7123 4567 to arrange a convenient time, or reply to this letter with your preferred dates and times.

${signOff},
${tenant.assignedOfficer}
${teamName}`;
    }

    case 'damp-prevention': {
      return `${salutation},

We are writing to you because weather forecasts indicate heavy rainfall is expected in your area over the coming days. Based on our property records, your home may be at increased risk of damp or condensation during this period.

Here are some steps you can take to help prevent damp and mould:

1. **Ventilation**: Open windows briefly each morning, even in cold weather, to let moisture escape
2. **Heating**: Try to maintain a consistent temperature of at least 18°C throughout your home
3. **Moisture**: Use extractor fans when cooking or bathing, and dry clothes outside or in a well-ventilated room
4. **Furniture**: Keep furniture slightly away from external walls to allow air circulation
5. **Report quickly**: If you notice any new damp patches, condensation, or mould growth, please report it immediately

If you notice any signs of damp or mould, please report it immediately by calling 020 7123 4567 or emailing repairs@rcha.org.uk. Under Awaab's Law, we are required to respond to damp and mould reports within strict timescales.

${signOff},
${tenant.assignedOfficer}
${teamName}`;
    }

    default:
      return `${salutation},\n\nThank you for contacting us. We will respond to your enquiry as soon as possible.\n\n${signOff},\n${teamName}`;
  }
}

// Compute real-time stats from actual data arrays
function computeStats() {
  const openRepairs = allRepairs.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
  const emergency = openRepairs.filter(r => r.priority === 'emergency');
  const urgent = openRepairs.filter(r => r.priority === 'urgent');
  const routine = openRepairs.filter(r => r.priority === 'routine');
  const planned = openRepairs.filter(r => r.priority === 'planned');
  const slaBreach = openRepairs.filter(r => r.slaStatus === 'breached');
  const completedRepairs = allRepairs.filter(r => r.status === 'completed');
  const avgDays = completedRepairs.length > 0
    ? Math.round(completedRepairs.reduce((s, r) => s + r.daysOpen, 0) / completedRepairs.length * 10) / 10
    : 0;
  const ftfRate = completedRepairs.length > 0
    ? Math.round(completedRepairs.filter(r => r.firstTimeFix).length / completedRepairs.length * 1000) / 10
    : 0;

  const tenantsInArrears = allTenants.filter(t => t.rentBalance < 0);
  const totalArrears = tenantsInArrears.reduce((s, t) => s + Math.abs(t.rentBalance), 0);
  const highRiskTenants = allTenants.filter(t => t.arrearsRisk > 70);
  const ucTransitioning = allTenants.filter(t => t.ucStatus === 'transitioning');

  const openComplaints = allComplaints.filter(c => c.status !== 'closed');
  const stage1 = openComplaints.filter(c => c.stage === 1);
  const stage2 = openComplaints.filter(c => c.stage === 2);
  const highEscalation = openComplaints.filter(c => c.escalationRisk >= 80);
  const ombudsmanEscalated = allComplaints.filter(c => c.ombudsmanEscalation);

  const openDamp = allDampCases.filter(d => d.status !== 'closed');
  const emergencyDamp = openDamp.filter(d => d.hazardClassification === 'emergency');
  const dampRiskProperties = allProperties.filter(p => p.dampRisk > 50);

  return {
    openRepairs, emergency, urgent, routine, planned, slaBreach, avgDays, ftfRate,
    tenantsInArrears, totalArrears, highRiskTenants, ucTransitioning,
    openComplaints, stage1, stage2, highEscalation, ombudsmanEscalated,
    openDamp, emergencyDamp, dampRiskProperties,
  };
}

// Generate context-aware AI chat responses based on the data
export function generateAiChatResponse(query: string, persona: Persona): string {
  const q = query.toLowerCase();
  const s = computeStats();

  if (q.includes('arrears') || q.includes('rent') || q.includes('balance')) {
    const pct = allTenants.length > 0 ? (s.tenantsInArrears.length / allTenants.length * 100).toFixed(1) : '0';
    const ucImpact = formatCurrency(s.ucTransitioning.reduce((sum, t) => sum + Math.abs(Math.min(0, t.rentBalance)), 0));
    return `Based on our current data:\n\n- **Total arrears**: ${formatCurrency(s.totalArrears)} across the organisation\n- **Tenants in arrears**: ${s.tenantsInArrears.length} (${pct}% of active tenancies)\n- **High-risk tenants** (AI score >70): ${s.highRiskTenants.length} tenants requiring immediate attention\n- **UC transitions** in progress: ${s.ucTransitioning.length} tenants (current arrears impact: ${ucImpact})\n\nThe top 5 highest-risk tenants are flagged in the Rent & Income worklist. Would you like me to generate a targeted intervention plan for the high-risk group?`;
  }

  if (q.includes('repair') || q.includes('maintenance')) {
    const total = s.openRepairs.length;
    const breachLinkedComplaintRisk = s.slaBreach.filter(r => {
      const tenant = allTenants.find(t => t.id === r.tenantId);
      return tenant && (tenant.contactCount30Days || 0) >= 3;
    }).length;
    return `Current repair statistics:\n\n- **Open repairs**: ${total} total\n  - Emergency: ${s.emergency.length} (${total > 0 ? Math.round(s.emergency.length / total * 100) : 0}%)\n  - Urgent: ${s.urgent.length} (${total > 0 ? Math.round(s.urgent.length / total * 100) : 0}%)\n  - Routine: ${s.routine.length} (${total > 0 ? Math.round(s.routine.length / total * 100) : 0}%)\n  - Planned: ${s.planned.length} (${total > 0 ? Math.round(s.planned.length / total * 100) : 0}%)\n- **SLA breached**: ${s.slaBreach.length} repairs (${total > 0 ? (s.slaBreach.length / total * 100).toFixed(1) : 0}%)\n- **Average completion time**: ${s.avgDays} days (target: 12)\n- **First-time-fix rate**: ${s.ftfRate}% (target: 85%)\n\nThe most concerning is the ${s.slaBreach.length} breached SLAs — ${breachLinkedComplaintRisk} of these are linked to tenants who have also called 3+ times, creating a high complaint risk. Want me to prioritise these for escalation?`;
  }

  if (q.includes('complaint') || q.includes('ombudsman')) {
    const highestRisk = s.highEscalation.sort((a, b) => b.escalationRisk - a.escalationRisk)[0];
    const avgDaysOpen = s.openComplaints.length > 0 ? Math.round(s.openComplaints.reduce((sum, c) => sum + c.daysOpen, 0) / s.openComplaints.length) : 0;
    return `Complaint summary:\n\n- **Open complaints**: ${s.openComplaints.length} (${s.stage1.length} Stage 1, ${s.stage2.length} Stage 2)\n- **Average days open**: ${avgDaysOpen} working days\n- **Ombudsman escalations**: ${s.ombudsmanEscalated.length}\n- **High escalation risk** (>80%): ${s.highEscalation.length} complaints${highestRisk ? `\n- **Highest risk**: ${highestRisk.reference} (${highestRisk.escalationRisk}% risk) — ${highestRisk.subject}` : ''}\n\nI've identified ${s.highEscalation.length} complaints at >80% escalation risk. Proactive resolution of these could prevent significant compensation. Shall I draft responses for the highest-risk cases?`;
  }

  if (q.includes('damp') || q.includes('mould') || q.includes('awaab')) {
    const emergencyRef = s.emergencyDamp[0];
    const emergencyTenant = emergencyRef ? allTenants.find(t => t.id === emergencyRef.tenantId) : null;
    return `Damp & Mould status:\n\n- **Active cases**: ${s.openDamp.length} (${s.emergencyDamp.length} emergency, ${s.openDamp.length - s.emergencyDamp.length} significant)${emergencyRef && emergencyTenant ? `\n- **Emergency case ${emergencyRef.reference}**: ${emergencyTenant.title} ${emergencyTenant.lastName}` : ''}\n- **Properties at elevated damp risk** (>50%): ${s.dampRiskProperties.length}\n- **Awaab's Law compliance**: ${s.openDamp.filter(d => d.status !== 'closed').length} active cases under statutory timescales\n\n${s.emergencyDamp.length > 0 ? 'Immediate action needed on emergency cases. Shall I escalate to emergency contractors and draft holding updates?' : 'No emergency cases. Monitor significant cases for timeline compliance.'}`;
  }

  if (q.includes('contact') || q.includes('silent') || q.includes('6 month') || q.includes('welfare')) {
    const now = new Date(2026, 1, 7);
    const silentTenants = allTenants.filter(t => {
      if (!t.lastContact) return true;
      const parts = t.lastContact.split('/');
      const lastDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) > 180;
    });
    const silentList = silentTenants.slice(0, 5).map((t, i) => {
      const vuln = t.vulnerabilityFlags.length > 0 ? ` — ${t.vulnerabilityFlags.map(f => f.type).join(', ')}` : '';
      return `  ${i + 1}. ${t.title} ${t.firstName} ${t.lastName}${vuln}`;
    }).join('\n');
    return `Silent tenant analysis:\n\n- **No contact >6 months**: ${silentTenants.length} tenants identified\n${silentList}\n\n${silentTenants.filter(t => t.vulnerabilityFlags.length > 0).length} have vulnerability markers. I recommend scheduling welfare check visits this week. Shall I generate welfare check letters and create diary appointments?`;
  }

  if (q.includes('draft') || q.includes('letter') || q.includes('write')) {
    return `I can draft contextual communications for any tenant. To generate a draft, navigate to the tenant's page and use the AI Dynamic Actions panel.\n\nI can create:\n- Holding updates (repair delays)\n- Arrears support letters\n- Complaint acknowledgements and responses\n- Welfare check invitations\n- Damp prevention advice\n- Appointment confirmations\n\nEach draft is personalised with the tenant's name, specific case details, vulnerability-appropriate language, and legally required wording. Which would you like to start with?`;
  }

  return `I've analysed the current data across your housing portfolio. Here's what I found relevant to "${query}":\n\n**Quick overview**: ${allTenants.length} tenancies, ${s.openRepairs.length} open repairs, ${s.openComplaints.length} open complaints, ${formatCurrency(s.totalArrears)} total arrears.\n\nI can help with detailed analysis of:\n- **Tenant data**: Arrears risk, contact history, vulnerability flags\n- **Property data**: Compliance status, damp risk, repair history\n- **Case management**: Repairs, complaints, ASB, damp/mould\n- **Regulatory**: TSM measures, complaint handling, Awaab's Law compliance\n- **Predictions**: Arrears risk, complaint probability, damp risk from weather\n\nCould you be more specific about what you'd like to know? For example: "Which tenants haven't been contacted in 6 months?" or "Show me properties with expired EICRs."`;
}
