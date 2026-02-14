import type { Notification, AiInsight, Activity, TsmMeasure, VoidProperty, Applicant, Communication, RentTransaction } from '@/types';

export const notifications: Notification[] = [
  { id: 'n1', type: 'urgent', title: 'Emergency damp case', message: 'DAM-2026-00003 - Emergency deadline breached. Children at risk.', date: '07/02/2026', read: false, entityType: 'case', entityId: 'dam-001' },
  { id: 'n2', type: 'urgent', title: 'Gas safety expired', message: 'Flat 12, Oak Tower - CP12 expired 04/01/2025. No access x2.', date: '07/02/2026', read: false, entityType: 'property', entityId: 'prop-039' },
  { id: 'n3', type: 'warning', title: 'Complaint deadline approaching', message: 'CMP-2026-00008 Stage 1 response due 13/02/2026 (6 days).', date: '07/02/2026', read: false, entityType: 'case', entityId: 'cmp-002' },
  { id: 'n4', type: 'warning', title: 'Repair SLA breached', message: 'REP-2025-04521 - 47 days overdue. Complaint risk HIGH.', date: '07/02/2026', read: true, entityType: 'case', entityId: 'rep-001' },
  { id: 'n5', type: 'ai', title: 'AI prediction: 4 damp risks', message: 'Heavy rain forecast Thursday. 4 properties at high damp risk.', date: '07/02/2026', read: false },
  { id: 'n6', type: 'info', title: 'CORE return deadline', message: 'Q3 CORE lettings log due 15/02/2026.', date: '06/02/2026', read: true },
  { id: 'n7', type: 'warning', title: 'Silent tenant alert', message: '3 elderly tenants with no contact in 6+ months identified.', date: '06/02/2026', read: false },
  { id: 'n8', type: 'ai', title: 'Arrears prediction', message: '5 tenancies predicted to enter arrears within 30 days.', date: '05/02/2026', read: true },
];

export const aiInsights: AiInsight[] = [
  { id: 'ai-1', type: 'prediction', severity: 'urgent', title: 'Complaint prediction: Mrs Chen (72%)', description: 'Mrs Chen has been waiting 47 days for REP-2025-04521. Called 5 times in 30 days. 72% probability of formal complaint within 14 days. Estimated compensation liability: £150-£300.', confidence: 72, affectedEntities: [{ type: 'tenant', id: 'ten-001', name: 'Mrs Mei Chen' }], action: 'Send holding update + escalate repair', date: '07/02/2026', model: 'Complaint Escalation' },
  { id: 'ai-2', type: 'alert', severity: 'urgent', title: 'Awaab\'s Law breach: DAM-2026-00003', description: 'Emergency damp case for Ms Hassan\'s household. 3 children present. Emergency 24hr deadline breached. Immediate action required.', confidence: 99, affectedEntities: [{ type: 'tenant', id: 'ten-003', name: 'Ms Fatima Hassan' }], action: 'Immediate specialist attendance', date: '07/02/2026' },
  { id: 'ai-3', type: 'prediction', severity: 'attention', title: 'Weather impact: 4 properties at damp risk', description: 'Met Office heavy rain forecast Thursday-Friday. Combined with building profiles (1960s concrete, north-facing), 4 properties at high risk of new damp reports. Proactive contact recommended.', confidence: 68, affectedEntities: [{ type: 'property', id: 'prop-001', name: 'Flat 1, Oak Tower' }, { type: 'property', id: 'prop-003', name: 'Flat 3, Oak Tower' }, { type: 'property', id: 'prop-006', name: 'Flat 6, Oak Tower' }, { type: 'property', id: 'prop-038', name: 'Flat 11, Oak Tower' }], action: 'Send preventive advice letters', date: '07/02/2026', model: 'Damp & Mould' },
  { id: 'ai-4', type: 'recommendation', severity: 'attention', title: 'Silent tenants: 3 welfare checks needed', description: 'Mrs Edith Brown (25 Birch Bungalow), Mr Harold Baker (27 Birch Bungalow), and Mrs Irene Hall (Flat 4, Birch Court) have had no contact in 6+ months. All elderly with vulnerability flags.', confidence: 85, affectedEntities: [{ type: 'tenant', id: 'ten-027', name: 'Mrs Edith Brown' }, { type: 'tenant', id: 'ten-046', name: 'Mr Harold Baker' }, { type: 'tenant', id: 'ten-045', name: 'Mrs Irene Hall' }], action: 'Schedule welfare check visits', date: '06/02/2026', model: 'Vulnerability' },
  { id: 'ai-5', type: 'prediction', severity: 'attention', title: 'Arrears risk: 5 tenancies at risk', description: '5 tenancies predicted to enter or increase arrears within 30 days. Primary factors: UC transitions (3), seasonal pattern (1), employment change indicator (1).', confidence: 74, affectedEntities: [{ type: 'tenant', id: 'ten-002', name: 'Mr James Adeyemi' }, { type: 'tenant', id: 'ten-037', name: 'Ms Naomi Jackson' }], action: 'Proactive income support contact', date: '05/02/2026', model: 'Arrears Risk' },
  { id: 'ai-6', type: 'analysis', severity: 'info', title: 'Recurring repair pattern: Oak Tower plumbing', description: 'Oak Tower has had 12 plumbing repairs in 12 months across 8 units. Pattern suggests ageing copper pipework. Proactive replacement cost: £18,000. Continued responsive cost: projected £32,000/year.', confidence: 82, affectedEntities: [{ type: 'block', id: 'oak-tower', name: 'Oak Tower' }], action: 'Create capital works programme', date: '04/02/2026', model: 'Repair Recurrence' },
  { id: 'ai-7', type: 'recommendation', severity: 'info', title: 'TSM improvement opportunity', description: 'Current TP02 (Satisfaction with repairs) at 3.8/5. Analysis shows first-time-fix rate (78%) is primary driver. Improving to 85% would lift TP02 to estimated 4.1/5.', confidence: 71, affectedEntities: [], action: 'Review first-time-fix processes', date: '03/02/2026', model: 'Performance Analysis' },
  { id: 'ai-8', type: 'prediction', severity: 'attention', title: 'EICRs at risk: TSM deadline impact', description: '12 overdue EICRs. If not completed before 31/03/2026, BS03 drops from 97.8% to 97.6%. Contractor has Thursday availability.', confidence: 90, affectedEntities: [{ type: 'property', id: 'prop-003', name: 'Flat 3, Oak Tower' }, { type: 'property', id: 'prop-020', name: '5 Elm Gardens' }], action: 'Book contractor for Thursday', date: '07/02/2026', model: 'Compliance Failure' },
];

export const activities: Activity[] = [
  { id: 'act-001', tenantId: 'ten-001', caseId: 'rep-001', type: 'call', direction: 'inbound', subject: 'Chasing radiator repair', description: 'Tenant called to chase repair. Very frustrated - 5th call. Carpet still wet. Wants compensation.', date: '05/02/2026', officer: 'Sarah Mitchell', linkedCaseRef: 'REP-2025-04521' },
  { id: 'act-002', tenantId: 'ten-001', caseId: 'cmp-001', type: 'system', subject: 'Complaint created', description: 'Stage 1 complaint auto-created from repeated contact about REP-2025-04521.', date: '05/02/2026', officer: 'System', linkedCaseRef: 'CMP-2026-00012' },
  { id: 'act-003', tenantId: 'ten-003', caseId: 'dam-001', type: 'visit', direction: 'outbound', subject: 'Emergency damp inspection', description: 'Attended property. Severe mould in bathroom ceiling and bedroom window. Children showing symptoms. Immediate treatment arranged.', date: '02/02/2026', officer: 'Sarah Mitchell', linkedCaseRef: 'DAM-2026-00003' },
  { id: 'act-004', tenantId: 'ten-003', type: 'email', direction: 'inbound', subject: 'GP letter - health concerns', description: 'GP letter received confirming respiratory symptoms in 2 children linked to damp/mould exposure.', date: '30/01/2026', officer: 'Sarah Mitchell' },
  { id: 'act-005', tenantId: 'ten-039', caseId: 'rep-014', type: 'call', direction: 'inbound', subject: 'No hot water still', description: 'Tenant called - still no hot water. Very distressed. Vulnerability noted - referred to support.', date: '04/02/2026', officer: 'Sarah Mitchell', linkedCaseRef: 'REP-2026-00078' },
  { id: 'act-006', tenantId: 'ten-020', caseId: 'cmp-004', type: 'letter', direction: 'outbound', subject: 'Stage 2 acknowledgement', description: 'Formal Stage 2 acknowledgement letter sent. Investigation extended due to complexity.', date: '22/01/2026', officer: 'Sarah Mitchell', linkedCaseRef: 'CMP-2025-00078' },
  { id: 'act-007', tenantId: 'ten-007', caseId: 'asb-001', type: 'visit', direction: 'outbound', subject: 'ABC discussion', description: 'Visited tenant to discuss noise complaints and issue Acceptable Behaviour Contract.', date: '01/02/2026', officer: 'Sarah Mitchell', linkedCaseRef: 'ASB-2025-00034' },
  { id: 'act-008', tenantId: 'ten-019', type: 'call', direction: 'inbound', subject: 'Reporting loose handrail', description: 'Tenant called to report loose handrail on stairs. Worried about falling. Repair raised.', date: '06/02/2026', officer: 'Sarah Mitchell', linkedCaseRef: 'REP-2026-00185' },
];

export const tsmMeasures: TsmMeasure[] = [
  { id: 'tsm-1', code: 'TP01', name: 'Overall satisfaction', actual: 72.4, target: 80, sectorMedian: 74.2, upperQuartile: 80.1, lowerQuartile: 65.8, unit: '%', trend: 'stable' },
  { id: 'tsm-2', code: 'TP02', name: 'Satisfaction with repairs', actual: 76.0, target: 82, sectorMedian: 75.5, upperQuartile: 82.3, lowerQuartile: 68.2, unit: '%', trend: 'down' },
  { id: 'tsm-3', code: 'TP03', name: 'Satisfaction with time taken for repairs', actual: 68.5, target: 75, sectorMedian: 69.8, upperQuartile: 77.4, lowerQuartile: 60.1, unit: '%', trend: 'down' },
  { id: 'tsm-4', code: 'TP04', name: 'Satisfaction home is well maintained', actual: 71.2, target: 78, sectorMedian: 72.1, upperQuartile: 79.5, lowerQuartile: 63.4, unit: '%', trend: 'stable' },
  { id: 'tsm-5', code: 'TP05', name: 'Satisfaction home is safe', actual: 78.8, target: 85, sectorMedian: 79.2, upperQuartile: 85.6, lowerQuartile: 72.3, unit: '%', trend: 'up' },
  { id: 'tsm-6', code: 'TP06', name: 'Satisfaction landlord listens and acts', actual: 65.3, target: 72, sectorMedian: 66.8, upperQuartile: 74.2, lowerQuartile: 58.5, unit: '%', trend: 'down' },
  { id: 'tsm-7', code: 'TP07', name: 'Satisfaction landlord keeps you informed', actual: 67.1, target: 74, sectorMedian: 68.5, upperQuartile: 75.8, lowerQuartile: 60.2, unit: '%', trend: 'stable' },
  { id: 'tsm-8', code: 'TP08', name: 'Agreement treated fairly and with respect', actual: 80.2, target: 85, sectorMedian: 81.4, upperQuartile: 87.2, lowerQuartile: 74.6, unit: '%', trend: 'up' },
  { id: 'tsm-9', code: 'TP09', name: 'Satisfaction with approach to complaints', actual: 52.1, target: 65, sectorMedian: 54.8, upperQuartile: 62.3, lowerQuartile: 42.5, unit: '%', trend: 'down' },
  { id: 'tsm-10', code: 'TP10', name: 'Satisfaction communal areas kept clean', actual: 70.5, target: 78, sectorMedian: 71.2, upperQuartile: 78.9, lowerQuartile: 62.8, unit: '%', trend: 'stable' },
  { id: 'tsm-11', code: 'TP11', name: 'Satisfaction contribution to neighbourhood', actual: 62.8, target: 70, sectorMedian: 64.1, upperQuartile: 71.5, lowerQuartile: 55.3, unit: '%', trend: 'stable' },
  { id: 'tsm-12', code: 'TP12', name: 'Satisfaction anti-social behaviour handling', actual: 58.4, target: 68, sectorMedian: 60.2, upperQuartile: 68.7, lowerQuartile: 50.1, unit: '%', trend: 'down' },
  { id: 'tsm-13', code: 'RP01', name: 'Repairs completed within target', actual: 85.2, target: 92, sectorMedian: 87.5, upperQuartile: 93.1, lowerQuartile: 80.4, unit: '%', trend: 'down' },
  { id: 'tsm-14', code: 'RP02', name: 'Gas safety compliance', actual: 99.4, target: 100, sectorMedian: 99.8, upperQuartile: 100, lowerQuartile: 99.2, unit: '%', trend: 'stable' },
  { id: 'tsm-15', code: 'BS01', name: 'Fire safety compliance', actual: 99.1, target: 100, sectorMedian: 99.5, upperQuartile: 100, lowerQuartile: 98.8, unit: '%', trend: 'up' },
  { id: 'tsm-16', code: 'BS02', name: 'Asbestos compliance', actual: 98.5, target: 100, sectorMedian: 99.2, upperQuartile: 100, lowerQuartile: 98.0, unit: '%', trend: 'stable' },
  { id: 'tsm-17', code: 'BS03', name: 'Electrical safety compliance', actual: 97.8, target: 100, sectorMedian: 98.5, upperQuartile: 99.8, lowerQuartile: 97.0, unit: '%', trend: 'down' },
  { id: 'tsm-18', code: 'BS04', name: 'Water safety compliance', actual: 99.0, target: 100, sectorMedian: 99.4, upperQuartile: 100, lowerQuartile: 98.5, unit: '%', trend: 'stable' },
  { id: 'tsm-19', code: 'BS05', name: 'Lift safety compliance', actual: 100, target: 100, sectorMedian: 99.6, upperQuartile: 100, lowerQuartile: 99.0, unit: '%', trend: 'stable' },
  { id: 'tsm-20', code: 'CH01', name: 'Complaints relative to stock size', actual: 2.8, target: 2.0, sectorMedian: 3.2, upperQuartile: 2.1, lowerQuartile: 4.5, unit: 'per 1000', trend: 'up' },
  { id: 'tsm-21', code: 'CH02', name: 'Complaints responded within timescale', actual: 91.2, target: 95, sectorMedian: 88.5, upperQuartile: 95.2, lowerQuartile: 82.1, unit: '%', trend: 'stable' },
  { id: 'tsm-22', code: 'NM01', name: 'Anti-social behaviour cases relative to stock', actual: 1.0, target: 0.8, sectorMedian: 1.2, upperQuartile: 0.7, lowerQuartile: 1.8, unit: 'per 1000', trend: 'stable' },
];

export const voidProperties: VoidProperty[] = [
  { id: 'void-001', propertyId: 'prop-005', stage: 'works', voidDate: '15/12/2025', daysVoid: 54, estimatedCost: 4500, weeklyRentLoss: 95.40, contractor: 'Mears Group', targetLetDate: '28/02/2026' },
  { id: 'void-002', propertyId: 'prop-017', stage: 'offer', voidDate: '01/01/2026', daysVoid: 37, estimatedCost: 1200, weeklyRentLoss: 172.00, targetLetDate: '14/02/2026' },
  { id: 'void-003', propertyId: 'prop-023', stage: 'inspection', voidDate: '20/11/2025', daysVoid: 79, estimatedCost: 8500, weeklyRentLoss: 125.00, contractor: 'Wates Living Space', targetLetDate: '15/03/2026' },
  { id: 'void-004', propertyId: 'prop-028', stage: 'keys', voidDate: '10/01/2026', daysVoid: 28, estimatedCost: 2800, weeklyRentLoss: 110.40, targetLetDate: '21/02/2026' },
  { id: 'void-005', propertyId: 'prop-035', stage: 'quality', voidDate: '05/12/2025', daysVoid: 64, estimatedCost: 3200, weeklyRentLoss: 132.00, contractor: 'Mears Group', targetLetDate: '21/02/2026' },
];

export const applicants: Applicant[] = [
  { id: 'app-001', name: 'Amira Osman', band: 'A', bedroomNeed: 2, medicalPriority: true, registrationDate: '15/06/2025', localConnection: 'Southwark', status: 'active' },
  { id: 'app-002', name: 'Kevin McCarthy', band: 'B', bedroomNeed: 1, medicalPriority: false, registrationDate: '20/03/2025', localConnection: 'Lewisham', status: 'active' },
  { id: 'app-003', name: 'Blessing Okafor', band: 'A', bedroomNeed: 3, medicalPriority: false, registrationDate: '10/09/2025', localConnection: 'Southwark', status: 'active' },
  { id: 'app-004', name: 'Maria Gonzalez', band: 'B', bedroomNeed: 2, medicalPriority: true, registrationDate: '05/01/2026', localConnection: 'Lambeth', status: 'active' },
  { id: 'app-005', name: 'Dean Walker', band: 'C', bedroomNeed: 1, medicalPriority: false, registrationDate: '22/11/2024', localConnection: 'Lewisham', status: 'active' },
  { id: 'app-006', name: 'Yemi Adekoya', band: 'B', bedroomNeed: 4, medicalPriority: false, registrationDate: '18/07/2025', localConnection: 'Southwark', status: 'active' },
  { id: 'app-007', name: 'Sarah Hughes', band: 'C', bedroomNeed: 2, medicalPriority: false, registrationDate: '03/05/2025', localConnection: 'Lambeth', status: 'active' },
  { id: 'app-008', name: 'Tariq Mohammed', band: 'A', bedroomNeed: 3, medicalPriority: true, registrationDate: '28/12/2025', localConnection: 'Southwark', status: 'active' },
];

export const communications: Communication[] = [
  { id: 'comm-001', tenantId: 'ten-001', caseRef: 'REP-2025-04521', channel: 'email', direction: 'inbound', subject: 'RE: Repair update needed', content: 'I have been waiting over 6 weeks for this repair. Nobody has called me back. This is unacceptable.', date: '05/02/2026', status: 'new', sentiment: 'negative', aiCategory: 'Repair Chase', aiPriority: 'high' },
  { id: 'comm-002', tenantId: 'ten-003', channel: 'email', direction: 'inbound', subject: 'GP letter - damp affecting my children', content: 'Please find attached the letter from our GP confirming the damp and mould is making my children sick.', date: '30/01/2026', status: 'actioned', sentiment: 'urgent', aiCategory: 'Health & Safety', aiPriority: 'high' },
  { id: 'comm-003', tenantId: 'ten-019', channel: 'phone', direction: 'inbound', subject: 'Reporting loose handrail', content: 'Called to report loose handrail on stairs. Worried about falling.', date: '06/02/2026', status: 'actioned', sentiment: 'neutral', aiCategory: 'Repair Request', aiPriority: 'medium' },
  { id: 'comm-004', tenantId: 'ten-013', channel: 'portal', direction: 'inbound', subject: 'Thank you for fixing the toilet', content: 'Just wanted to say thank you for the quick repair. The plumber was very professional.', date: '04/02/2026', status: 'read', sentiment: 'positive', aiCategory: 'Positive Feedback', aiPriority: 'low' },
  { id: 'comm-005', tenantId: 'ten-039', channel: 'phone', direction: 'inbound', subject: 'Still no hot water', content: 'Tenant very distressed. Still no hot water since 23/01. Feels neglected.', date: '04/02/2026', status: 'new', sentiment: 'negative', aiCategory: 'Repair Chase', aiPriority: 'high' },
];

export const complianceStats = {
  gas: { total: 45, compliant: 44, expiring: 0, expired: 1, percentage: 99.4, trend: 'stable' as const },
  electrical: { total: 50, compliant: 47, expiring: 1, expired: 2, percentage: 97.8, trend: 'down' as const },
  fire: { total: 10, compliant: 10, expiring: 0, expired: 0, percentage: 99.1, trend: 'up' as const },
  asbestos: { total: 50, compliant: 49, expiring: 1, expired: 0, percentage: 98.5, trend: 'stable' as const },
  legionella: { total: 10, compliant: 10, expiring: 0, expired: 0, percentage: 99.0, trend: 'stable' as const },
  lifts: { total: 4, compliant: 4, expiring: 0, expired: 0, percentage: 100, trend: 'stable' as const },
};

export const rentTransactionsSample: RentTransaction[] = [
  { id: 'rt-001', tenantId: 'ten-001', date: '06/02/2026', week: 44, type: 'charge', description: 'Rent charge', debit: 118.50, credit: 0, balance: -487.20 },
  { id: 'rt-002', tenantId: 'ten-001', date: '06/02/2026', week: 44, type: 'charge', description: 'Service charge', debit: 22.40, credit: 0, balance: -346.30 },
  { id: 'rt-003', tenantId: 'ten-001', date: '03/02/2026', week: 43, type: 'payment', description: 'Direct Debit payment', debit: 0, credit: 140.90, balance: -205.40 },
  { id: 'rt-004', tenantId: 'ten-001', date: '30/01/2026', week: 43, type: 'charge', description: 'Rent charge', debit: 118.50, credit: 0, balance: -346.30 },
  { id: 'rt-005', tenantId: 'ten-001', date: '30/01/2026', week: 43, type: 'charge', description: 'Service charge', debit: 22.40, credit: 0, balance: -227.80 },
  { id: 'rt-006', tenantId: 'ten-001', date: '27/01/2026', week: 42, type: 'payment', description: 'Direct Debit payment', debit: 0, credit: 140.90, balance: -205.40 },
  { id: 'rt-007', tenantId: 'ten-001', date: '23/01/2026', week: 42, type: 'charge', description: 'Rent charge', debit: 118.50, credit: 0, balance: -346.30 },
  { id: 'rt-008', tenantId: 'ten-001', date: '23/01/2026', week: 42, type: 'charge', description: 'Service charge', debit: 22.40, credit: 0, balance: -227.80 },
];
