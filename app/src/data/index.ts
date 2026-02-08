export { organisation } from './organisation';
export { regions } from './regions';
export { repairs, complaints, asbCases, dampMouldCases, financialCases, allCases, allRepairs, allComplaints, allAsbCases, allDampCases, allFinancialCases } from './cases';
export { notifications, aiInsights, activities, tsmMeasures, voidProperties, applicants, communications, complianceStats, rentTransactionsSample } from './supplementary';

// Merge expanded region data (South East + East Midlands) with existing London data
import { localAuthorities as baseLAs } from './regions';
import { estates as baseEstates, blocks as baseBlocks } from './estates';
import { properties as baseProperties } from './properties';
import { tenants as baseTenants } from './tenants';
import { expandedLocalAuthorities, expandedEstates, expandedBlocks, expandedProperties, expandedTenants } from './expanded-regions';

export const localAuthorities = [...baseLAs, ...expandedLocalAuthorities];
export const estates = [...baseEstates, ...expandedEstates];
export const blocks = [...baseBlocks, ...expandedBlocks];
export const properties = [...baseProperties, ...expandedProperties];
export const tenants = [...baseTenants, ...expandedTenants];
