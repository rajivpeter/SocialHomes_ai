import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { tenants, properties, allRepairs as repairs, allComplaints as complaints, allAsbCases as asbCases, allDampCases as dampMouldCases, allFinancialCases as financialCases, allCases, estates, regions, localAuthorities } from '@/data';
import type { Persona } from '@/types';

// Define persona scopes - which data each persona sees
const personaConfig: Record<Persona, {
  regionIds?: string[];
  estateIds?: string[];
  tenantIds?: string[];
  officerName?: string;
  teamName?: string;
  teamMembers?: string[];
  showAllData?: boolean;
}> = {
  'coo': { showAllData: true },
  'head-of-service': { showAllData: true }, // Sees all but grouped by service area
  'manager': { teamName: 'Southwark & Lewisham Team', teamMembers: ['Sarah Mitchell', 'James Okoye', 'Lisa Wong'] },
  'housing-officer': { officerName: 'Sarah Mitchell' },
  'operative': { officerName: 'Mark Stevens' },
};

export function usePersonaScope() {
  const { state } = useApp();
  const persona = state.persona;
  const config = personaConfig[persona];

  const scopedTenants = useMemo(() => {
    if (config.showAllData) return tenants;
    if (config.teamMembers) {
      return tenants.filter(t => config.teamMembers!.includes(t.assignedOfficer));
    }
    if (config.officerName) {
      return tenants.filter(t => t.assignedOfficer === config.officerName);
    }
    return tenants;
  }, [persona]);

  const scopedProperties = useMemo(() => {
    if (config.showAllData) return properties;
    const tenantPropertyIds = new Set(scopedTenants.map(t => t.propertyId));
    return properties.filter(p => tenantPropertyIds.has(p.id));
  }, [persona, scopedTenants]);

  const scopedRepairs = useMemo(() => {
    if (config.showAllData) return repairs;
    if (persona === 'operative') {
      return repairs.filter(r => r.operative === config.officerName && r.status !== 'completed');
    }
    if (config.officerName) {
      return repairs.filter(r => r.handler === config.officerName);
    }
    return repairs;
  }, [persona]);

  const scopedComplaints = useMemo(() => {
    if (config.showAllData) return complaints;
    if (config.teamMembers) {
      return complaints.filter(c => config.teamMembers!.includes(c.handler));
    }
    if (config.officerName) {
      return complaints.filter(c => c.handler === config.officerName);
    }
    return complaints;
  }, [persona]);

  const scopedCases = useMemo(() => {
    if (config.showAllData) return allCases;
    if (config.teamMembers) {
      return allCases.filter(c => config.teamMembers!.includes(c.handler));
    }
    if (config.officerName) {
      return allCases.filter(c => c.handler === config.officerName);
    }
    return allCases;
  }, [persona]);

  const scopedAsbCases = useMemo(() => {
    if (config.showAllData) return asbCases;
    if (config.teamMembers) {
      return asbCases.filter(c => config.teamMembers!.includes(c.handler));
    }
    if (config.officerName) {
      return asbCases.filter(c => c.handler === config.officerName);
    }
    return asbCases;
  }, [persona]);

  const scopedDampCases = useMemo(() => {
    if (config.showAllData) return dampMouldCases;
    if (config.teamMembers) {
      return dampMouldCases.filter(c => config.teamMembers!.includes(c.handler));
    }
    if (config.officerName) {
      return dampMouldCases.filter(c => c.handler === config.officerName);
    }
    return dampMouldCases;
  }, [persona]);

  // Compute persona-specific KPIs
  const kpis = useMemo(() => {
    const totalUnits = scopedProperties.length;
    const totalTenancies = scopedTenants.length;
    const activeRepairs = scopedRepairs.filter(r => r.status !== 'completed').length;
    const totalArrears = scopedTenants.reduce((sum, t) => sum + (t.rentBalance < 0 ? Math.abs(t.rentBalance) : 0), 0);
    const openComplaints = scopedComplaints.filter(c => c.status !== 'closed').length;
    const complianceIssues = scopedProperties.filter(p => p.compliance?.overall === 'non-compliant' || p.compliance?.overall === 'expiring').length;
    const complianceRate = totalUnits > 0 ? ((totalUnits - complianceIssues) / totalUnits * 100) : 100;

    return {
      totalUnits,
      totalTenancies,
      activeRepairs,
      totalArrears,
      openComplaints,
      complianceRate,
      scopeLabel: persona === 'coo' ? 'Organisation' :
                  persona === 'head-of-service' ? 'All Service Areas' :
                  persona === 'manager' ? config.teamName || 'Team' :
                  persona === 'housing-officer' ? 'Your Patch' :
                  "Today's Jobs",
    };
  }, [persona, scopedProperties, scopedTenants, scopedRepairs, scopedComplaints]);

  // Generate persona-specific tasks from actual data
  const tasks = useMemo(() => {
    const items: { id: string; text: string; urgent: boolean; entityType: string; entityId: string; route: string }[] = [];

    // Overdue repairs
    scopedRepairs
      .filter(r => r.status !== 'completed' && r.daysOpen > 14)
      .slice(0, 3)
      .forEach(r => {
        items.push({
          id: r.id,
          text: `Follow up on ${r.reference} - ${r.subject}`,
          urgent: r.priority === 'emergency' || r.priority === 'urgent',
          entityType: 'repair',
          entityId: r.id,
          route: `/repairs/${r.id}`,
        });
      });

    // Complaints needing response
    scopedComplaints
      .filter(c => c.status !== 'closed' && c.status !== 'completed')
      .slice(0, 2)
      .forEach(c => {
        items.push({
          id: c.id,
          text: `Respond to complaint ${c.reference} - ${c.subject}`,
          urgent: c.daysOpen > 5,
          entityType: 'complaint',
          entityId: c.id,
          route: `/complaints/${c.id}`,
        });
      });

    // Tenants in arrears
    scopedTenants
      .filter(t => t.rentBalance < -500)
      .sort((a, b) => a.rentBalance - b.rentBalance)
      .slice(0, 2)
      .forEach(t => {
        items.push({
          id: t.id,
          text: `Review arrears payment plan - ${t.title} ${t.lastName}`,
          urgent: t.rentBalance < -1000,
          entityType: 'tenant',
          entityId: t.id,
          route: `/tenancies/${t.id}`,
        });
      });

    // Damp cases needing action
    scopedDampCases
      .filter(d => d.status !== 'closed')
      .slice(0, 2)
      .forEach(d => {
        items.push({
          id: d.id,
          text: `Follow up on damp case ${d.reference}`,
          urgent: d.hazardClassification === 'emergency',
          entityType: 'case',
          entityId: d.id,
          route: `/compliance/awaabs-law`,
        });
      });

    return items.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)).slice(0, 8);
  }, [persona, scopedRepairs, scopedComplaints, scopedTenants, scopedDampCases]);

  // Persona-specific Yantra Assist insights
  const personaInsights = useMemo(() => {
    if (persona === 'coo') {
      return {
        urgent: [
          { title: 'Regulatory inspection risk increasing', description: 'Complaint response rate dropped to 88%. RSH consumer standard threshold is 90%.', action: 'View compliance dashboard' },
          { title: 'Board report due in 5 days', description: 'Q3 performance report for board meeting 12/02/2026. 3 sections incomplete.', action: 'Generate board pack' },
        ],
        attention: [
          { title: 'TSM scores trending down', description: 'TP02 (Repairs satisfaction) dropped from 4.1 to 3.8. First-time-fix rate is primary driver.', action: 'View TSM report' },
          { title: 'Staff turnover alert', description: '2 housing officers gave notice this month. Caseload redistribution needed.', action: 'Review team capacity' },
        ],
        info: [
          { title: 'Sector benchmark update', description: 'RCHA ranks 45th percentile for repair speed. Top quartile target: 85% within SLA.', action: 'View benchmark report' },
        ],
      };
    }
    if (persona === 'operative') {
      return {
        urgent: scopedRepairs.filter(r => r.priority === 'emergency').map(r => ({
          title: `Emergency: ${r.reference}`,
          description: r.subject,
          action: `View job details`,
        })),
        attention: scopedRepairs.filter(r => r.priority === 'urgent').slice(0, 3).map(r => ({
          title: r.reference,
          description: `${r.subject} - ${r.trade}`,
          action: 'View job',
        })),
        info: [{ title: `${scopedRepairs.length} jobs assigned today`, description: 'Check schedule for travel route optimisation.', action: 'View schedule' }],
      };
    }
    // Default for housing-officer/manager/head-of-service
    return null; // Will fall back to standard aiInsights
  }, [persona, scopedRepairs]);

  return {
    persona,
    config,
    scopedTenants,
    scopedProperties,
    scopedRepairs,
    scopedComplaints,
    scopedCases,
    scopedAsbCases,
    scopedDampCases,
    kpis,
    tasks,
    personaInsights,
  };
}
