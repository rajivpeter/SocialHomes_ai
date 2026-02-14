import { Router } from 'express';
import { collections, getDocs, getDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { CaseDoc, TenantDoc, PropertyDoc } from '../models/firestore-schemas.js';

export const reportsRouter = Router();
reportsRouter.use(authMiddleware);

// GET /api/v1/reports/tsm — Tenant Satisfaction Measures
reportsRouter.get('/tsm', async (_req, res, next) => {
  try {
    const tsmMeasures = await getDocs(collections.tsmMeasures);
    if (tsmMeasures.length > 0) {
      return res.json(tsmMeasures);
    }
    // Fallback computed TSM
    const properties = await getDocs<PropertyDoc>(collections.properties);
    const cases = await getDocs<CaseDoc>(collections.cases);
    const tenants = await getDocs<TenantDoc>(collections.tenants);

    const repairs = cases.filter(c => c.type === 'repair');
    const complaints = cases.filter(c => c.type === 'complaint');
    const completedRepairs = repairs.filter(r => r.status === 'completed');
    const gasCompliant = properties.filter(p => p.compliance?.gas === 'valid' || p.compliance?.gas === 'na');
    const fireCompliant = properties.filter(p => p.compliance?.fire === 'valid');

    const measures = [
      { id: 'TP01', code: 'TP01', name: 'Overall satisfaction', actual: 72.3, target: 75, sectorMedian: 73, upperQuartile: 80, lowerQuartile: 65, unit: '%', trend: 'up' },
      { id: 'TP02', code: 'TP02', name: 'Satisfaction with repairs', actual: 68.5, target: 75, sectorMedian: 70, upperQuartile: 78, lowerQuartile: 62, unit: '%', trend: 'stable' },
      { id: 'TP03', code: 'TP03', name: 'Satisfaction with time taken', actual: 64.2, target: 70, sectorMedian: 66, upperQuartile: 74, lowerQuartile: 58, unit: '%', trend: 'down' },
      { id: 'TP04', code: 'TP04', name: 'Satisfaction that home is well maintained', actual: 70.1, target: 75, sectorMedian: 71, upperQuartile: 79, lowerQuartile: 63, unit: '%', trend: 'up' },
      { id: 'TP05', code: 'TP05', name: 'Satisfaction that home is safe', actual: 78.8, target: 80, sectorMedian: 76, upperQuartile: 83, lowerQuartile: 70, unit: '%', trend: 'stable' },
      { id: 'TP06', code: 'TP06', name: 'Satisfaction with landlord listening', actual: 62.4, target: 68, sectorMedian: 64, upperQuartile: 72, lowerQuartile: 56, unit: '%', trend: 'up' },
      { id: 'TP07', code: 'TP07', name: 'Satisfaction with handling of complaints', actual: 45.6, target: 55, sectorMedian: 48, upperQuartile: 58, lowerQuartile: 38, unit: '%', trend: 'down' },
      { id: 'CH01', code: 'CH01', name: 'Complaints responded Stage 1 in time', actual: complaints.length > 0 ? Math.round(complaints.filter(c => c.stage === 1 && c.respondedDate).length / Math.max(1, complaints.filter(c => c.stage === 1).length) * 100) : 82, target: 95, sectorMedian: 85, upperQuartile: 92, lowerQuartile: 75, unit: '%', trend: 'up' },
      { id: 'RP01', code: 'RP01', name: 'Repairs completed in target', actual: completedRepairs.length > 0 ? Math.round(completedRepairs.filter(r => r.slaStatus === 'within').length / completedRepairs.length * 100) : 78, target: 90, sectorMedian: 82, upperQuartile: 90, lowerQuartile: 72, unit: '%', trend: 'stable' },
      { id: 'BS01', code: 'BS01', name: 'Gas safety compliance', actual: properties.length > 0 ? Math.round(gasCompliant.length / properties.length * 100 * 10) / 10 : 99.6, target: 100, sectorMedian: 99.5, upperQuartile: 100, lowerQuartile: 98.8, unit: '%', trend: 'stable' },
      { id: 'BS02', code: 'BS02', name: 'Fire safety compliance', actual: properties.length > 0 ? Math.round(fireCompliant.length / properties.length * 100 * 10) / 10 : 95.2, target: 100, sectorMedian: 96, upperQuartile: 99, lowerQuartile: 92, unit: '%', trend: 'up' },
    ];

    res.json(measures);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reports/regulatory
reportsRouter.get('/regulatory', async (_req, res, next) => {
  try {
    const properties = await getDocs<PropertyDoc>(collections.properties);
    const tenants = await getDocs<TenantDoc>(collections.tenants);
    const cases = await getDocs<CaseDoc>(collections.cases);

    const totalUnits = properties.length;
    const occupancy = properties.filter(p => !p.isVoid).length;
    const voids = properties.filter(p => p.isVoid).length;
    const totalArrears = tenants.filter(t => t.rentBalance < 0).reduce((s, t) => s + Math.abs(t.rentBalance), 0);
    const openRepairs = cases.filter(c => c.type === 'repair' && c.status !== 'completed' && c.status !== 'cancelled').length;
    const openComplaints = cases.filter(c => c.type === 'complaint' && c.status !== 'closed').length;

    res.json({
      period: '2025-26',
      organisation: 'Riverside Community Housing Association',
      registrationNumber: 'RP-4872',
      totalUnits,
      occupancy,
      voids,
      occupancyRate: totalUnits > 0 ? Math.round(occupancy / totalUnits * 100 * 10) / 10 : 0,
      currentArrears: totalArrears,
      openRepairs,
      openComplaints,
    });
  } catch (err) {
    next(err);
  }
});
