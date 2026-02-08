import { Router } from 'express';
import { collections, getDocs } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import type { TenantDoc } from '../models/firestore-schemas.js';

export const rentRouter = Router();
rentRouter.use(authMiddleware);

// GET /api/v1/rent/dashboard
rentRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const tenants = await getDocs<TenantDoc>(collections.tenants);

    const inArrears = tenants.filter(t => t.rentBalance < 0);
    const totalArrears = inArrears.reduce((s, t) => s + Math.abs(t.rentBalance), 0);
    const averageArrears = inArrears.length > 0 ? totalArrears / inArrears.length : 0;
    const highRisk = tenants.filter(t => t.arrearsRisk > 70);
    const mediumRisk = tenants.filter(t => t.arrearsRisk > 40 && t.arrearsRisk <= 70);
    const ucTransitioning = tenants.filter(t => t.ucStatus === 'transitioning');
    const ucClaiming = tenants.filter(t => t.ucStatus === 'claiming');

    // Collection rate (simulated)
    const totalCharged = tenants.reduce((s, t) => s + t.weeklyCharge * 52, 0);
    const totalCollected = totalCharged - totalArrears;
    const collectionRate = totalCharged > 0 ? (totalCollected / totalCharged) * 100 : 0;

    // Worklist: top arrears cases
    const worklist = inArrears
      .sort((a, b) => a.rentBalance - b.rentBalance) // Most negative first
      .slice(0, 20)
      .map(t => ({
        tenantId: t.id,
        name: `${t.title} ${t.firstName} ${t.lastName}`,
        propertyId: t.propertyId,
        balance: t.rentBalance,
        weeklyCharge: t.weeklyCharge,
        arrearsRisk: t.arrearsRisk,
        paymentMethod: t.paymentMethod,
        ucStatus: t.ucStatus,
        assignedOfficer: t.assignedOfficer,
      }));

    // Payment method breakdown
    const paymentMethodBreakdown: Record<string, number> = {};
    tenants.forEach(t => {
      paymentMethodBreakdown[t.paymentMethod] = (paymentMethodBreakdown[t.paymentMethod] || 0) + 1;
    });

    res.json({
      summary: {
        totalTenants: tenants.length,
        tenantsInArrears: inArrears.length,
        totalArrears,
        averageArrears: Math.round(averageArrears * 100) / 100,
        collectionRate: Math.round(collectionRate * 10) / 10,
        highRiskCount: highRisk.length,
        mediumRiskCount: mediumRisk.length,
      },
      universalCredit: {
        transitioning: ucTransitioning.length,
        claiming: ucClaiming.length,
        totalUcArrears: ucClaiming.reduce((s, t) => s + Math.abs(Math.min(0, t.rentBalance)), 0),
      },
      paymentMethods: paymentMethodBreakdown,
      worklist,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/rent/transactions/:tenantId
rentRouter.get('/transactions/:tenantId', async (req, res, next) => {
  try {
    const tenantId = req.params.tenantId;
    // Filter in memory to avoid composite index requirement
    const allTx = await getDocs(collections.rentTransactions);
    const transactions = allTx
      .filter((t: any) => t.tenantId === tenantId)
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});
