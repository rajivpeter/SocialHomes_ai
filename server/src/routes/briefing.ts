import { Router } from 'express';
import { collections, getDocs } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { CaseDoc, TenantDoc, PropertyDoc } from '../models/firestore-schemas.js';

export const briefingRouter = Router();
briefingRouter.use(authMiddleware);

const personaConfig: Record<string, {
  showAllData?: boolean;
  officerName?: string;
  teamMembers?: string[];
}> = {
  'coo': { showAllData: true },
  'head-of-service': { showAllData: true },
  'manager': { teamMembers: ['Sarah Mitchell', 'James Okoye', 'Lisa Wong'] },
  'housing-officer': { officerName: 'Sarah Mitchell' },
  'operative': { officerName: 'Mark Stevens' },
};

// GET /api/v1/briefing
briefingRouter.get('/', async (req, res, next) => {
  try {
    const persona = req.user?.persona || 'housing-officer';
    const config = personaConfig[persona] || personaConfig['housing-officer'];

    // Fetch all cases
    const allCases = await getDocs<CaseDoc>(collections.cases);
    const allTenants = await getDocs<TenantDoc>(collections.tenants);
    const allProperties = await getDocs<PropertyDoc>(collections.properties);

    // Scope by persona
    let scopedCases = allCases;
    let scopedTenants = allTenants;

    if (!config.showAllData) {
      if (config.teamMembers) {
        scopedCases = allCases.filter(c => config.teamMembers!.includes(c.handler));
        scopedTenants = allTenants.filter(t => config.teamMembers!.includes(t.assignedOfficer));
      } else if (config.officerName) {
        scopedCases = allCases.filter(c => c.handler === config.officerName);
        scopedTenants = allTenants.filter(t => t.assignedOfficer === config.officerName);
      }
    }

    const openRepairs = scopedCases.filter(c => c.type === 'repair' && c.status !== 'completed' && c.status !== 'cancelled');
    const openComplaints = scopedCases.filter(c => c.type === 'complaint' && c.status !== 'closed');
    const openDamp = scopedCases.filter(c => c.type === 'damp-mould' && c.status !== 'closed');
    const emergencyRepairs = openRepairs.filter(r => r.priority === 'emergency');
    const breachedSla = scopedCases.filter(c => c.slaStatus === 'breached');
    const tenantsInArrears = scopedTenants.filter(t => t.rentBalance < 0);
    const totalArrears = tenantsInArrears.reduce((s, t) => s + Math.abs(t.rentBalance), 0);
    const highRiskTenants = scopedTenants.filter(t => t.arrearsRisk > 70);

    const dampRiskProperties = allProperties.filter(p => p.dampRisk > 50);

    // Compute urgent items
    const urgentItems = [];
    if (emergencyRepairs.length > 0) {
      urgentItems.push({ type: 'emergency-repairs', count: emergencyRepairs.length, label: `${emergencyRepairs.length} emergency repairs need attention` });
    }
    if (breachedSla.length > 0) {
      urgentItems.push({ type: 'sla-breaches', count: breachedSla.length, label: `${breachedSla.length} SLA breaches detected` });
    }
    if (highRiskTenants.length > 0) {
      urgentItems.push({ type: 'high-risk-arrears', count: highRiskTenants.length, label: `${highRiskTenants.length} high-risk arrears cases` });
    }

    const briefing = {
      persona,
      date: new Date().toISOString().split('T')[0],
      urgentItems,
      kpis: {
        totalTenants: scopedTenants.length,
        openRepairs: openRepairs.length,
        openComplaints: openComplaints.length,
        openDampCases: openDamp.length,
        totalArrears,
        tenantsInArrears: tenantsInArrears.length,
        dampRiskProperties: dampRiskProperties.length,
        emergencyRepairs: emergencyRepairs.length,
        breachedSla: breachedSla.length,
      },
      tasks: [
        ...emergencyRepairs.slice(0, 5).map(r => ({
          id: r.id,
          description: `Emergency repair: ${r.subject}`,
          priority: 'high' as const,
          dueDate: r.targetDate || 'Today',
          type: 'repair',
        })),
        ...openComplaints.filter(c => c.slaStatus === 'approaching' || c.slaStatus === 'breached').slice(0, 5).map(c => ({
          id: c.id,
          description: `Complaint deadline approaching: ${c.subject}`,
          priority: 'high' as const,
          dueDate: c.targetDate || 'This week',
          type: 'complaint',
        })),
      ],
    };

    res.json(briefing);
  } catch (err) {
    next(err);
  }
});
