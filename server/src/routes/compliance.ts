import { Router } from 'express';
import { collections, getDocs } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { PropertyDoc, CaseDoc } from '../models/firestore-schemas.js';

export const complianceRouter = Router();
complianceRouter.use(authMiddleware);

// GET /api/v1/compliance/overview
complianceRouter.get('/overview', async (_req, res, next) => {
  try {
    const properties = await getDocs<PropertyDoc>(collections.properties);

    const gasCompliance = {
      valid: properties.filter(p => p.compliance?.gas === 'valid').length,
      expiring: properties.filter(p => p.compliance?.gas === 'expiring').length,
      expired: properties.filter(p => p.compliance?.gas === 'expired').length,
      na: properties.filter(p => p.compliance?.gas === 'na').length,
      total: properties.length,
    };

    const electricalCompliance = {
      valid: properties.filter(p => p.compliance?.electrical === 'valid').length,
      expiring: properties.filter(p => p.compliance?.electrical === 'expiring').length,
      expired: properties.filter(p => p.compliance?.electrical === 'expired').length,
      total: properties.length,
    };

    const fireCompliance = {
      valid: properties.filter(p => p.compliance?.fire === 'valid').length,
      expiring: properties.filter(p => p.compliance?.fire === 'expiring').length,
      expired: properties.filter(p => p.compliance?.fire === 'expired').length,
      total: properties.length,
    };

    const asbestosCompliance = {
      valid: properties.filter(p => p.compliance?.asbestos === 'valid').length,
      expiring: properties.filter(p => p.compliance?.asbestos === 'expiring').length,
      expired: properties.filter(p => p.compliance?.asbestos === 'expired').length,
      total: properties.length,
    };

    const legionellaCompliance = {
      valid: properties.filter(p => p.compliance?.legionella === 'valid').length,
      expiring: properties.filter(p => p.compliance?.legionella === 'expiring').length,
      expired: properties.filter(p => p.compliance?.legionella === 'expired').length,
      na: properties.filter(p => p.compliance?.legionella === 'na').length,
      total: properties.length,
    };

    const liftCompliance = {
      valid: properties.filter(p => p.compliance?.lifts === 'valid').length,
      expiring: properties.filter(p => p.compliance?.lifts === 'expiring').length,
      expired: properties.filter(p => p.compliance?.lifts === 'expired').length,
      na: properties.filter(p => p.compliance?.lifts === 'na').length,
      total: properties.length,
    };

    const overallCompliant = properties.filter(p => p.compliance?.overall === 'compliant').length;
    const overallExpiring = properties.filter(p => p.compliance?.overall === 'expiring').length;
    const overallNonCompliant = properties.filter(p => p.compliance?.overall === 'non-compliant').length;

    // Damp & Mould cases
    const dampCases = await getDocs<CaseDoc>(collections.cases, [
      { field: 'type', op: '==', value: 'damp-mould' },
    ]);
    const openDampCases = dampCases.filter(c => c.status !== 'closed');

    res.json({
      overall: {
        compliant: overallCompliant,
        expiring: overallExpiring,
        nonCompliant: overallNonCompliant,
        complianceRate: properties.length > 0 ? Math.round(overallCompliant / properties.length * 100) : 0,
        totalProperties: properties.length,
      },
      big6: {
        gas: gasCompliance,
        electrical: electricalCompliance,
        fire: fireCompliance,
        asbestos: asbestosCompliance,
        legionella: legionellaCompliance,
        lifts: liftCompliance,
      },
      dampMould: {
        activeCases: openDampCases.length,
        emergencyCases: openDampCases.filter(c => c.hazardClassification === 'emergency').length,
        significantCases: openDampCases.filter(c => c.hazardClassification === 'significant').length,
        highRiskProperties: properties.filter(p => p.dampRisk > 50).length,
      },
    });
  } catch (err) {
    next(err);
  }
});
