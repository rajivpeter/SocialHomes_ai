// ============================================================
// Consolidated Seed Data for SocialHomes.Ai Firestore
// All mock data for RCHA (Riverside Crescent Housing Association)
//
// Imports data from the app's existing data files rather than
// duplicating. The `import type` lines in those files (from @/types)
// are erased by tsx/esbuild at transpile time, so no alias needed.
// ============================================================

// --- Imports from app data files ---
// Note: .js extensions required by NodeNext resolution (tsx resolves .js → .ts).
// The `import type` lines in those files (from @/types) are erased by esbuild.
import { properties as baseProperties } from '../../../app/src/data/properties.js';
import { tenants as baseTenants } from '../../../app/src/data/tenants.js';
import { expandedProperties, expandedTenants } from '../../../app/src/data/expanded-regions.js';
import { allCases } from '../../../app/src/data/cases.js';
import {
  notifications as notificationsData,
  activities as activitiesData,
  tsmMeasures as tsmMeasuresData,
  voidProperties as voidPropertiesData,
  applicants as applicantsData,
  communications as communicationsData,
  rentTransactionsSample as rentTransactionsData,
} from '../../../app/src/data/supplementary.js';

export interface SeedData {
  organisation: any;
  regions: any[];
  localAuthorities: any[];
  estates: any[];
  blocks: any[];
  properties: any[];
  tenants: any[];
  cases: any[];
  activities: any[];
  communications: any[];
  notifications: any[];
  tsmMeasures: any[];
  voidProperties: any[];
  applicants: any[];
  rentTransactions: any[];
}

// ============================================================
// Organisation
// ============================================================

const organisation = {
  name: 'Riverside Crescent Housing Association',
  shortName: 'RCHA',
  rpNumber: 'RP 4567',
  regulatoryGrade: 'G1/V1',
  hqAddress: '45 Borough High Street, Southwark, London SE1 1NB',
  charityNumber: '1234567',
  companyNumber: '09876543',
  totalUnits: 12847,
  totalTenancies: 12103,
  activeRepairs: 487,
  rentCollected: 1840000,
  rentTarget: 1920000,
  collectionRate: 95.8,
  totalArrears: 847293,
  complianceRate: 98.7,
  openComplaints: 34,
  aiAlerts: 12,
  occupancyRate: 96.1,
  voidRate: 3.9,
  avgReletDays: 22,
  tsmScore: 78.4,
  financialYear: '2025/26',
};

// ============================================================
// Regions
// ============================================================

const regions = [
  { id: 'london', name: 'London', lat: 51.509, lng: -0.08, localAuthorities: ['southwark', 'lewisham', 'lambeth'], totalUnits: 11500, compliance: 98.9, arrears: 720000, voids: 38 },
  { id: 'south-east', name: 'South East', lat: 51.3, lng: 0.5, localAuthorities: ['kent-coastal'], totalUnits: 847, compliance: 97.8, arrears: 89000, voids: 7 },
  { id: 'east-midlands', name: 'East Midlands', lat: 52.63, lng: -1.13, localAuthorities: ['leicester'], totalUnits: 500, compliance: 98.2, arrears: 38293, voids: 5 },
];

// ============================================================
// Local Authorities
// ============================================================

const localAuthorities = [
  { id: 'southwark', name: 'London Borough of Southwark', regionId: 'london', lat: 51.473, lng: -0.078, estates: ['oak-park', 'riverside-crescent'], totalUnits: 5200, compliance: 99.1, lhaRates: { '1bed': 302.33, '2bed': 362.25, '3bed': 423.29, '4bed': 517.50 } },
  { id: 'lewisham', name: 'London Borough of Lewisham', regionId: 'london', lat: 51.441, lng: -0.012, estates: ['elm-gardens', 'birch-court'], totalUnits: 3800, compliance: 98.7, lhaRates: { '1bed': 276.16, '2bed': 333.49, '3bed': 389.31, '4bed': 482.56 } },
  { id: 'lambeth', name: 'London Borough of Lambeth', regionId: 'london', lat: 51.457, lng: -0.106, estates: ['maple-lane'], totalUnits: 2500, compliance: 98.8, lhaRates: { '1bed': 302.33, '2bed': 362.25, '3bed': 423.29, '4bed': 517.50 } },
  { id: 'kent-coastal', name: 'Folkestone & Hythe District Council', regionId: 'south-east', lat: 51.0812, lng: 1.1681, estates: ['harbour-view', 'channel-gardens'], totalUnits: 60, compliance: 97.8, lhaRates: { '1bed': 163.85, '2bed': 207.12, '3bed': 248.22, '4bed': 310.27 } },
  { id: 'leicester', name: 'Leicester City Council', regionId: 'east-midlands', lat: 52.6369, lng: -1.1398, estates: ['victoria-park', 'abbey-meadows'], totalUnits: 40, compliance: 98.2, lhaRates: { '1bed': 126.58, '2bed': 155.34, '3bed': 184.11, '4bed': 230.14 } },
];

// ============================================================
// Estates
// ============================================================

const estates = [
  { id: 'oak-park', name: 'Oak Park Estate', localAuthorityId: 'southwark', postcode: 'SE15 4QN', lat: 51.472, lng: -0.065, constructionEra: '1960s concrete panel', totalUnits: 96, blocks: ['oak-tower', 'oak-house', 'oak-court'], schemeType: 'general-needs', managingOfficer: 'Sarah Mitchell', occupancy: 94.8, compliance: 97.9, dampCases: 5, arrears: 34500, asbCases: 3, repairsBacklog: 28 },
  { id: 'riverside-crescent', name: 'Riverside Crescent', localAuthorityId: 'southwark', postcode: 'SE1 7PB', lat: 51.501, lng: -0.087, constructionEra: '2005 new build', totalUnits: 48, blocks: ['riverside-north', 'riverside-south'], schemeType: 'general-needs', managingOfficer: 'James Okafor', occupancy: 97.9, compliance: 99.6, dampCases: 1, arrears: 12800, asbCases: 1, repairsBacklog: 8 },
  { id: 'elm-gardens', name: 'Elm Gardens', localAuthorityId: 'lewisham', postcode: 'SE13 6TH', lat: 51.452, lng: -0.018, constructionEra: '1930s terraces', totalUnits: 35, blocks: ['elm-street'], schemeType: 'general-needs', managingOfficer: 'Sarah Mitchell', occupancy: 97.1, compliance: 98.6, dampCases: 2, arrears: 8700, asbCases: 2, repairsBacklog: 12 },
  { id: 'birch-court', name: 'Birch Court', localAuthorityId: 'lewisham', postcode: 'SE6 3AD', lat: 51.431, lng: -0.007, constructionEra: '1970s', totalUnits: 32, blocks: ['birch-block', 'birch-bungalows'], schemeType: 'sheltered', managingOfficer: 'Priya Sharma', occupancy: 93.8, compliance: 99.0, dampCases: 0, arrears: 4200, asbCases: 0, repairsBacklog: 5 },
  { id: 'maple-lane', name: 'Maple Lane', localAuthorityId: 'lambeth', postcode: 'SE24 0JB', lat: 51.454, lng: -0.098, constructionEra: '1980s-90s mixed', totalUnits: 32, blocks: ['maple-tower', 'maple-houses'], schemeType: 'mixed', managingOfficer: 'David Mensah', occupancy: 96.9, compliance: 98.4, dampCases: 0, arrears: 6100, asbCases: 1, repairsBacklog: 9 },
  { id: 'harbour-view', name: 'Harbour View Estate', localAuthorityId: 'kent-coastal', postcode: 'CT20 1QA', lat: 51.0785, lng: 1.1655, constructionEra: '1960s concrete panel', totalUnits: 40, blocks: ['harbour-tower', 'harbour-house'], schemeType: 'general-needs', managingOfficer: 'Claire Barton', occupancy: 95.0, compliance: 96.5, dampCases: 4, arrears: 18400, asbCases: 2, repairsBacklog: 15 },
  { id: 'channel-gardens', name: 'Channel Gardens', localAuthorityId: 'kent-coastal', postcode: 'CT19 5RH', lat: 51.0893, lng: 1.1540, constructionEra: '1980s brick', totalUnits: 20, blocks: ['channel-block'], schemeType: 'sheltered', managingOfficer: 'Claire Barton', occupancy: 100.0, compliance: 100.0, dampCases: 1, arrears: 5200, asbCases: 0, repairsBacklog: 6 },
  { id: 'victoria-park', name: 'Victoria Park Estate', localAuthorityId: 'leicester', postcode: 'LE2 1XQ', lat: 52.6195, lng: -1.1230, constructionEra: '1970s mixed concrete/brick', totalUnits: 28, blocks: ['victoria-tower', 'victoria-houses'], schemeType: 'general-needs', managingOfficer: 'Darren Kapoor', occupancy: 96.4, compliance: 97.1, dampCases: 3, arrears: 12800, asbCases: 1, repairsBacklog: 11 },
  { id: 'abbey-meadows', name: 'Abbey Meadows', localAuthorityId: 'leicester', postcode: 'LE4 5HN', lat: 52.6525, lng: -1.1385, constructionEra: '1990s brick', totalUnits: 12, blocks: ['abbey-court'], schemeType: 'general-needs', managingOfficer: 'Darren Kapoor', occupancy: 91.7, compliance: 100.0, dampCases: 0, arrears: 3400, asbCases: 0, repairsBacklog: 3 },
];

// ============================================================
// Blocks
// ============================================================

const blocks = [
  {
    id: 'oak-tower', name: 'Oak Tower', estateId: 'oak-park', address: '1-48 Oak Tower, Oak Park Estate, London SE15 4QN', uprn: '100023456789', lat: 51.4725, lng: -0.0645, constructionType: 'Concrete panel system-built', constructionYear: 1964, storeys: 12, totalUnits: 48, units: [], higherRisk: true,
    fireRiskAssessment: { date: '15/03/2025', riskLevel: 'substantial', actionItems: [{ description: 'Replace fire doors floors 8-12', status: 'in-progress' }, { description: 'Upgrade emergency lighting stairwell B', status: 'complete' }, { description: 'Install additional smoke detectors communal areas', status: 'overdue' }] },
    asbestosManagement: { surveyDate: '22/01/2024', acmCount: 14, locations: ['Soffits', 'Pipe lagging floors 1-6', 'Floor tiles communal hallways', 'Textured coatings stairwells'] },
    legionellaAssessment: { date: '10/06/2025', waterSystem: 'Cold water storage tanks (roof), TMVs in sheltered flats', riskLevel: 'medium' },
    communalFire: { detectionType: 'L3 Addressable', zones: 4, serviceDate: '01/09/2025', emergencyLighting: true, compartmentation: 'fair', fireDoors: { total: 96, compliant: 84 } },
    lifts: [{ id: 'OT-L1', lolerDate: '15/08/2025', status: 'compliant' }, { id: 'OT-L2', lolerDate: '15/08/2025', status: 'compliant' }],
  },
  {
    id: 'oak-house', name: 'Oak House', estateId: 'oak-park', address: '49-78 Oak House, Oak Park Estate, London SE15 4QP', uprn: '100023456790', lat: 51.4722, lng: -0.0655, constructionType: 'Concrete panel system-built', constructionYear: 1965, storeys: 6, totalUnits: 30, units: [], higherRisk: false,
    fireRiskAssessment: { date: '20/03/2025', riskLevel: 'medium', actionItems: [{ description: 'Service dry riser', status: 'complete' }] },
    asbestosManagement: { surveyDate: '22/01/2024', acmCount: 8, locations: ['Pipe lagging', 'Floor tiles'] },
    legionellaAssessment: { date: '10/06/2025', waterSystem: 'Mains fed', riskLevel: 'low' },
    communalFire: { detectionType: 'L3 Conventional', zones: 2, serviceDate: '01/09/2025', emergencyLighting: true, compartmentation: 'good', fireDoors: { total: 60, compliant: 58 } },
  },
  {
    id: 'oak-court', name: 'Oak Court', estateId: 'oak-park', address: '79-96 Oak Court, Oak Park Estate, London SE15 4QR', uprn: '100023456791', lat: 51.4718, lng: -0.0660, constructionType: 'Concrete panel system-built', constructionYear: 1966, storeys: 4, totalUnits: 18, units: [], higherRisk: false,
    fireRiskAssessment: { date: '25/03/2025', riskLevel: 'medium', actionItems: [] },
    asbestosManagement: { surveyDate: '22/01/2024', acmCount: 5, locations: ['Textured coatings'] },
    legionellaAssessment: { date: '10/06/2025', waterSystem: 'Mains fed', riskLevel: 'low' },
    communalFire: { detectionType: 'L3 Conventional', zones: 1, serviceDate: '01/09/2025', emergencyLighting: true, compartmentation: 'good', fireDoors: { total: 36, compliant: 35 } },
  },
  {
    id: 'riverside-north', name: 'Riverside North', estateId: 'riverside-crescent', address: '1-24 Riverside North, Riverside Crescent, London SE1 7PB', uprn: '100023456800', lat: 51.5015, lng: -0.0865, constructionType: 'Steel frame with brick cladding', constructionYear: 2005, storeys: 8, totalUnits: 24, units: [], higherRisk: true,
    fireRiskAssessment: { date: '10/01/2025', riskLevel: 'medium', actionItems: [{ description: 'Cladding inspection report follow-up', status: 'in-progress' }] },
    asbestosManagement: { surveyDate: '15/02/2024', acmCount: 0, locations: [] },
    legionellaAssessment: { date: '05/07/2025', waterSystem: 'Mains fed with TMVs', riskLevel: 'low' },
    communalFire: { detectionType: 'L2 Addressable', zones: 3, serviceDate: '15/09/2025', emergencyLighting: true, compartmentation: 'good', fireDoors: { total: 48, compliant: 47 } },
    lifts: [{ id: 'RN-L1', lolerDate: '20/07/2025', status: 'compliant' }],
  },
  {
    id: 'riverside-south', name: 'Riverside South', estateId: 'riverside-crescent', address: '25-48 Riverside South, Riverside Crescent, London SE1 7PC', uprn: '100023456801', lat: 51.5010, lng: -0.0875, constructionType: 'Steel frame with brick cladding', constructionYear: 2005, storeys: 8, totalUnits: 24, units: [], higherRisk: true,
    fireRiskAssessment: { date: '10/01/2025', riskLevel: 'low', actionItems: [] },
    asbestosManagement: { surveyDate: '15/02/2024', acmCount: 0, locations: [] },
    legionellaAssessment: { date: '05/07/2025', waterSystem: 'Mains fed with TMVs', riskLevel: 'low' },
    communalFire: { detectionType: 'L2 Addressable', zones: 3, serviceDate: '15/09/2025', emergencyLighting: true, compartmentation: 'good', fireDoors: { total: 48, compliant: 48 } },
    lifts: [{ id: 'RS-L1', lolerDate: '20/07/2025', status: 'compliant' }],
  },
  {
    id: 'elm-street', name: 'Elm Gardens Street Properties', estateId: 'elm-gardens', address: '1-35 Elm Gardens, London SE13 6TH', uprn: '100023456810', lat: 51.452, lng: -0.018, constructionType: 'Traditional brick terraces', constructionYear: 1935, storeys: 2, totalUnits: 35, units: [], higherRisk: false,
    fireRiskAssessment: { date: '01/04/2025', riskLevel: 'low', actionItems: [] },
    asbestosManagement: { surveyDate: '10/03/2024', acmCount: 22, locations: ['Artex ceilings', 'Pipe lagging', 'Boiler flues'] },
    legionellaAssessment: { date: '01/08/2025', waterSystem: 'Individual mains fed', riskLevel: 'low' },
    communalFire: { detectionType: 'LD2 Domestic', zones: 0, serviceDate: '01/08/2025', emergencyLighting: false, compartmentation: 'good', fireDoors: { total: 35, compliant: 33 } },
  },
  {
    id: 'birch-block', name: 'Birch Court', estateId: 'birch-court', address: '1-24 Birch Court, London SE6 3AD', uprn: '100023456820', lat: 51.431, lng: -0.007, constructionType: 'Brick with concrete floors', constructionYear: 1974, storeys: 4, totalUnits: 24, units: [], higherRisk: false,
    fireRiskAssessment: { date: '15/05/2025', riskLevel: 'medium', actionItems: [{ description: 'Replace communal carpet with non-combustible flooring', status: 'in-progress' }] },
    asbestosManagement: { surveyDate: '05/04/2024', acmCount: 6, locations: ['Floor tiles', 'Pipe lagging'] },
    legionellaAssessment: { date: '15/07/2025', waterSystem: 'Cold water storage tank', riskLevel: 'medium' },
    communalFire: { detectionType: 'L3 Conventional', zones: 2, serviceDate: '01/10/2025', emergencyLighting: true, compartmentation: 'fair', fireDoors: { total: 48, compliant: 44 } },
  },
  {
    id: 'birch-bungalows', name: 'Birch Court Bungalows', estateId: 'birch-court', address: '25-32 Birch Court Bungalows, London SE6 3AE', uprn: '100023456821', lat: 51.4305, lng: -0.0065, constructionType: 'Brick bungalows', constructionYear: 1975, storeys: 1, totalUnits: 8, units: [], higherRisk: false,
    fireRiskAssessment: { date: '15/05/2025', riskLevel: 'low', actionItems: [] },
    asbestosManagement: { surveyDate: '05/04/2024', acmCount: 3, locations: ['Artex ceilings'] },
    legionellaAssessment: { date: '15/07/2025', waterSystem: 'Mains fed', riskLevel: 'low' },
    communalFire: { detectionType: 'LD2 Domestic', zones: 0, serviceDate: '01/10/2025', emergencyLighting: false, compartmentation: 'good', fireDoors: { total: 8, compliant: 8 } },
  },
  {
    id: 'maple-tower', name: 'Maple Tower', estateId: 'maple-lane', address: '1-20 Maple Tower, Maple Lane, London SE24 0JB', uprn: '100023456830', lat: 51.454, lng: -0.098, constructionType: 'Brick with concrete frame', constructionYear: 1988, storeys: 5, totalUnits: 20, units: [], higherRisk: false,
    fireRiskAssessment: { date: '20/02/2025', riskLevel: 'medium', actionItems: [{ description: 'Install bin store sprinkler', status: 'in-progress' }] },
    asbestosManagement: { surveyDate: '20/05/2024', acmCount: 4, locations: ['Floor tiles lobby'] },
    legionellaAssessment: { date: '01/09/2025', waterSystem: 'Mains fed', riskLevel: 'low' },
    communalFire: { detectionType: 'L3 Conventional', zones: 2, serviceDate: '15/10/2025', emergencyLighting: true, compartmentation: 'good', fireDoors: { total: 40, compliant: 39 } },
  },
  {
    id: 'maple-houses', name: 'Maple Lane Houses', estateId: 'maple-lane', address: '21-32 Maple Lane, London SE24 0JC', uprn: '100023456831', lat: 51.4535, lng: -0.0975, constructionType: 'Brick terraces', constructionYear: 1992, storeys: 2, totalUnits: 12, units: [], higherRisk: false,
    fireRiskAssessment: { date: '20/02/2025', riskLevel: 'low', actionItems: [] },
    asbestosManagement: { surveyDate: '20/05/2024', acmCount: 0, locations: [] },
    legionellaAssessment: { date: '01/09/2025', waterSystem: 'Mains fed', riskLevel: 'low' },
    communalFire: { detectionType: 'LD2 Domestic', zones: 0, serviceDate: '15/10/2025', emergencyLighting: false, compartmentation: 'good', fireDoors: { total: 12, compliant: 12 } },
  },
  {
    id: 'harbour-tower', name: 'Harbour Tower', estateId: 'harbour-view', address: '1-24 Harbour Tower, Harbour View Estate, Folkestone CT20 1QA', uprn: '100023460001', lat: 51.0786, lng: 1.1652, constructionType: 'Concrete panel system-built', constructionYear: 1965, storeys: 8, totalUnits: 24, units: [], higherRisk: true,
    fireRiskAssessment: { date: '20/06/2025', riskLevel: 'substantial', actionItems: [{ description: 'Replace fire doors floors 5-8 — non-compliant seals', status: 'overdue' }, { description: 'Upgrade emergency lighting in stairwells A and B', status: 'overdue' }, { description: 'Install compartmentation breaches repair programme', status: 'in-progress' }, { description: 'Service dry riser system', status: 'complete' }] },
    asbestosManagement: { surveyDate: '15/03/2024', acmCount: 11, locations: ['Soffits floors 1-4', 'Pipe lagging risers', 'Floor tiles communal lobbies', 'Textured coatings stairwells'] },
    legionellaAssessment: { date: '01/08/2025', waterSystem: 'Cold water storage tanks (roof), TMVs in upper floors', riskLevel: 'medium' },
    communalFire: { detectionType: 'L3 Addressable', zones: 3, serviceDate: '15/07/2025', emergencyLighting: true, compartmentation: 'poor', fireDoors: { total: 48, compliant: 32 } },
    lifts: [{ id: 'HT-L1', lolerDate: '10/09/2025', status: 'compliant' }],
  },
  {
    id: 'harbour-house', name: 'Harbour House', estateId: 'harbour-view', address: '25-40 Harbour House, Harbour View Estate, Folkestone CT20 1QB', uprn: '100023460002', lat: 51.0783, lng: 1.1658, constructionType: 'Brick with concrete floors', constructionYear: 1968, storeys: 4, totalUnits: 16, units: [], higherRisk: false,
    fireRiskAssessment: { date: '25/06/2025', riskLevel: 'medium', actionItems: [{ description: 'Replace communal entrance door closers', status: 'complete' }] },
    asbestosManagement: { surveyDate: '15/03/2024', acmCount: 5, locations: ['Pipe lagging', 'Floor tiles ground floor lobby'] },
    legionellaAssessment: { date: '01/08/2025', waterSystem: 'Mains fed', riskLevel: 'low' },
    communalFire: { detectionType: 'L3 Conventional', zones: 2, serviceDate: '15/07/2025', emergencyLighting: true, compartmentation: 'good', fireDoors: { total: 32, compliant: 30 } },
  },
  {
    id: 'channel-block', name: 'Channel House', estateId: 'channel-gardens', address: '1-20 Channel House, Channel Gardens, Folkestone CT19 5RH', uprn: '100023460003', lat: 51.0894, lng: 1.1538, constructionType: 'Brick with pitched roof', constructionYear: 1984, storeys: 3, totalUnits: 20, units: [], higherRisk: false,
    fireRiskAssessment: { date: '10/07/2025', riskLevel: 'low', actionItems: [] },
    asbestosManagement: { surveyDate: '20/04/2024', acmCount: 2, locations: ['Artex ceilings communal hallway'] },
    legionellaAssessment: { date: '15/08/2025', waterSystem: 'Mains fed', riskLevel: 'low' },
    communalFire: { detectionType: 'LD2 Domestic', zones: 1, serviceDate: '01/08/2025', emergencyLighting: true, compartmentation: 'good', fireDoors: { total: 20, compliant: 20 } },
  },
  {
    id: 'victoria-tower', name: 'Victoria Tower', estateId: 'victoria-park', address: '1-18 Victoria Tower, Victoria Park Estate, Leicester LE2 1XQ', uprn: '100023460010', lat: 52.6196, lng: -1.1228, constructionType: 'Concrete frame with brick infill', constructionYear: 1972, storeys: 6, totalUnits: 18, units: [], higherRisk: false,
    fireRiskAssessment: { date: '05/05/2025', riskLevel: 'medium', actionItems: [{ description: 'Install additional smoke detectors on floors 4-6', status: 'in-progress' }, { description: 'Upgrade bin store fire suppression', status: 'complete' }] },
    asbestosManagement: { surveyDate: '10/02/2024', acmCount: 9, locations: ['Pipe lagging in risers', 'Floor tiles communal areas', 'Textured coatings stairwells'] },
    legionellaAssessment: { date: '20/07/2025', waterSystem: 'Cold water storage tanks (roof)', riskLevel: 'medium' },
    communalFire: { detectionType: 'L3 Conventional', zones: 2, serviceDate: '01/09/2025', emergencyLighting: true, compartmentation: 'fair', fireDoors: { total: 36, compliant: 33 } },
  },
  {
    id: 'victoria-houses', name: 'Victoria Park Terraces', estateId: 'victoria-park', address: '19-28 Victoria Park Terraces, Leicester LE2 1XR', uprn: '100023460011', lat: 52.6192, lng: -1.1235, constructionType: 'Traditional brick terraces', constructionYear: 1975, storeys: 2, totalUnits: 10, units: [], higherRisk: false,
    fireRiskAssessment: { date: '10/05/2025', riskLevel: 'low', actionItems: [] },
    asbestosManagement: { surveyDate: '10/02/2024', acmCount: 4, locations: ['Artex ceilings', 'Boiler flues'] },
    legionellaAssessment: { date: '20/07/2025', waterSystem: 'Individual mains fed', riskLevel: 'low' },
    communalFire: { detectionType: 'LD2 Domestic', zones: 0, serviceDate: '01/09/2025', emergencyLighting: false, compartmentation: 'good', fireDoors: { total: 10, compliant: 10 } },
  },
  {
    id: 'abbey-court', name: 'Abbey Court', estateId: 'abbey-meadows', address: '1-12 Abbey Court, Abbey Meadows, Leicester LE4 5HN', uprn: '100023460012', lat: 52.6526, lng: -1.1383, constructionType: 'Brick with timber roof', constructionYear: 1994, storeys: 3, totalUnits: 12, units: [], higherRisk: false,
    fireRiskAssessment: { date: '15/06/2025', riskLevel: 'low', actionItems: [] },
    asbestosManagement: { surveyDate: '01/05/2024', acmCount: 0, locations: [] },
    legionellaAssessment: { date: '01/09/2025', waterSystem: 'Mains fed', riskLevel: 'low' },
    communalFire: { detectionType: 'L3 Conventional', zones: 1, serviceDate: '15/09/2025', emergencyLighting: true, compartmentation: 'good', fireDoors: { total: 24, compliant: 24 } },
  },
];

// ============================================================
// Combined Properties & Tenants (base + expanded regions)
// ============================================================

const allProperties = [...(baseProperties as any[]), ...(expandedProperties as any[])];
const allTenants = [...(baseTenants as any[]), ...(expandedTenants as any[])];

// ============================================================
// Export: getSeedData()
// ============================================================

export function getSeedData(): SeedData {
  return {
    organisation,
    regions,
    localAuthorities,
    estates,
    blocks,
    properties: allProperties,
    tenants: allTenants,
    cases: allCases as any[],
    activities: activitiesData as any[],
    communications: communicationsData as any[],
    notifications: notificationsData as any[],
    tsmMeasures: tsmMeasuresData as any[],
    voidProperties: voidPropertiesData as any[],
    applicants: applicantsData as any[],
    rentTransactions: rentTransactionsData as any[],
  };
}
