import type { LocalAuthority, Estate, Block, Property, Tenant } from '@/types';

const makeCompliance = (gas: string, elec: string, overall?: string) => ({
  overall: (overall || (gas === 'valid' && elec === 'valid' ? 'compliant' : gas === 'expired' || elec === 'expired' ? 'non-compliant' : 'expiring')) as 'compliant' | 'expiring' | 'non-compliant',
  gas: gas as 'valid' | 'expiring' | 'expired' | 'na',
  electrical: elec as 'valid' | 'expiring' | 'expired',
  fire: 'valid' as const,
  asbestos: 'valid' as const,
  legionella: 'na' as const,
  lifts: 'na' as const,
});

// ============================================================
// LOCAL AUTHORITIES
// ============================================================

export const expandedLocalAuthorities: LocalAuthority[] = [
  {
    id: 'kent-coastal',
    name: 'Folkestone & Hythe District Council',
    regionId: 'south-east',
    lat: 51.0812,
    lng: 1.1681,
    estates: ['harbour-view', 'channel-gardens'],
    totalUnits: 60,
    compliance: 97.8,
    lhaRates: { '1bed': 163.85, '2bed': 207.12, '3bed': 248.22, '4bed': 310.27 },
  },
  {
    id: 'leicester',
    name: 'Leicester City Council',
    regionId: 'east-midlands',
    lat: 52.6369,
    lng: -1.1398,
    estates: ['victoria-park', 'abbey-meadows'],
    totalUnits: 40,
    compliance: 98.2,
    lhaRates: { '1bed': 126.58, '2bed': 155.34, '3bed': 184.11, '4bed': 230.14 },
  },
];

// ============================================================
// ESTATES
// ============================================================

export const expandedEstates: Estate[] = [
  // --- Kent Coastal ---
  {
    id: 'harbour-view',
    name: 'Harbour View Estate',
    localAuthorityId: 'kent-coastal',
    postcode: 'CT20 1QA',
    lat: 51.0785,
    lng: 1.1655,
    constructionEra: '1960s concrete panel',
    totalUnits: 40,
    blocks: ['harbour-tower', 'harbour-house'],
    schemeType: 'general-needs',
    managingOfficer: 'Claire Barton',
    occupancy: 95.0,
    compliance: 96.5,
    dampCases: 4,
    arrears: 18400,
    asbCases: 2,
    repairsBacklog: 15,
  },
  {
    id: 'channel-gardens',
    name: 'Channel Gardens',
    localAuthorityId: 'kent-coastal',
    postcode: 'CT19 5RH',
    lat: 51.0893,
    lng: 1.1540,
    constructionEra: '1980s brick',
    totalUnits: 20,
    blocks: ['channel-block'],
    schemeType: 'sheltered',
    managingOfficer: 'Claire Barton',
    occupancy: 100.0,
    compliance: 100.0,
    dampCases: 1,
    arrears: 5200,
    asbCases: 0,
    repairsBacklog: 6,
  },

  // --- Leicester ---
  {
    id: 'victoria-park',
    name: 'Victoria Park Estate',
    localAuthorityId: 'leicester',
    postcode: 'LE2 1XQ',
    lat: 52.6195,
    lng: -1.1230,
    constructionEra: '1970s mixed concrete/brick',
    totalUnits: 28,
    blocks: ['victoria-tower', 'victoria-houses'],
    schemeType: 'general-needs',
    managingOfficer: 'Darren Kapoor',
    occupancy: 96.4,
    compliance: 97.1,
    dampCases: 3,
    arrears: 12800,
    asbCases: 1,
    repairsBacklog: 11,
  },
  {
    id: 'abbey-meadows',
    name: 'Abbey Meadows',
    localAuthorityId: 'leicester',
    postcode: 'LE4 5HN',
    lat: 52.6525,
    lng: -1.1385,
    constructionEra: '1990s brick',
    totalUnits: 12,
    blocks: ['abbey-court'],
    schemeType: 'general-needs',
    managingOfficer: 'Darren Kapoor',
    occupancy: 91.7,
    compliance: 100.0,
    dampCases: 0,
    arrears: 3400,
    asbCases: 0,
    repairsBacklog: 3,
  },
];

// ============================================================
// BLOCKS
// ============================================================

export const expandedBlocks: Block[] = [
  // --- Harbour View Estate ---
  {
    id: 'harbour-tower',
    name: 'Harbour Tower',
    estateId: 'harbour-view',
    address: '1-24 Harbour Tower, Harbour View Estate, Folkestone CT20 1QA',
    uprn: '100023460001',
    lat: 51.0786,
    lng: 1.1652,
    constructionType: 'Concrete panel system-built',
    constructionYear: 1965,
    storeys: 8,
    totalUnits: 24,
    units: [],
    higherRisk: true,
    fireRiskAssessment: {
      date: '20/06/2025',
      riskLevel: 'substantial',
      actionItems: [
        { description: 'Replace fire doors floors 5-8 — non-compliant seals', status: 'overdue' },
        { description: 'Upgrade emergency lighting in stairwells A and B', status: 'overdue' },
        { description: 'Install compartmentation breaches repair programme', status: 'in-progress' },
        { description: 'Service dry riser system', status: 'complete' },
      ],
    },
    asbestosManagement: {
      surveyDate: '15/03/2024',
      acmCount: 11,
      locations: ['Soffits floors 1-4', 'Pipe lagging risers', 'Floor tiles communal lobbies', 'Textured coatings stairwells'],
    },
    legionellaAssessment: {
      date: '01/08/2025',
      waterSystem: 'Cold water storage tanks (roof), TMVs in upper floors',
      riskLevel: 'medium',
    },
    communalFire: {
      detectionType: 'L3 Addressable',
      zones: 3,
      serviceDate: '15/07/2025',
      emergencyLighting: true,
      compartmentation: 'poor',
      fireDoors: { total: 48, compliant: 32 },
    },
    lifts: [
      { id: 'HT-L1', lolerDate: '10/09/2025', status: 'compliant' },
    ],
  },
  {
    id: 'harbour-house',
    name: 'Harbour House',
    estateId: 'harbour-view',
    address: '25-40 Harbour House, Harbour View Estate, Folkestone CT20 1QB',
    uprn: '100023460002',
    lat: 51.0783,
    lng: 1.1658,
    constructionType: 'Brick with concrete floors',
    constructionYear: 1968,
    storeys: 4,
    totalUnits: 16,
    units: [],
    higherRisk: false,
    fireRiskAssessment: {
      date: '25/06/2025',
      riskLevel: 'medium',
      actionItems: [
        { description: 'Replace communal entrance door closers', status: 'complete' },
      ],
    },
    asbestosManagement: {
      surveyDate: '15/03/2024',
      acmCount: 5,
      locations: ['Pipe lagging', 'Floor tiles ground floor lobby'],
    },
    legionellaAssessment: {
      date: '01/08/2025',
      waterSystem: 'Mains fed',
      riskLevel: 'low',
    },
    communalFire: {
      detectionType: 'L3 Conventional',
      zones: 2,
      serviceDate: '15/07/2025',
      emergencyLighting: true,
      compartmentation: 'good',
      fireDoors: { total: 32, compliant: 30 },
    },
  },
  {
    id: 'channel-block',
    name: 'Channel House',
    estateId: 'channel-gardens',
    address: '1-20 Channel House, Channel Gardens, Folkestone CT19 5RH',
    uprn: '100023460003',
    lat: 51.0894,
    lng: 1.1538,
    constructionType: 'Brick with pitched roof',
    constructionYear: 1984,
    storeys: 3,
    totalUnits: 20,
    units: [],
    higherRisk: false,
    fireRiskAssessment: {
      date: '10/07/2025',
      riskLevel: 'low',
      actionItems: [],
    },
    asbestosManagement: {
      surveyDate: '20/04/2024',
      acmCount: 2,
      locations: ['Artex ceilings communal hallway'],
    },
    legionellaAssessment: {
      date: '15/08/2025',
      waterSystem: 'Mains fed',
      riskLevel: 'low',
    },
    communalFire: {
      detectionType: 'LD2 Domestic',
      zones: 1,
      serviceDate: '01/08/2025',
      emergencyLighting: true,
      compartmentation: 'good',
      fireDoors: { total: 20, compliant: 20 },
    },
  },

  // --- Victoria Park Estate ---
  {
    id: 'victoria-tower',
    name: 'Victoria Tower',
    estateId: 'victoria-park',
    address: '1-18 Victoria Tower, Victoria Park Estate, Leicester LE2 1XQ',
    uprn: '100023460010',
    lat: 52.6196,
    lng: -1.1228,
    constructionType: 'Concrete frame with brick infill',
    constructionYear: 1972,
    storeys: 6,
    totalUnits: 18,
    units: [],
    higherRisk: false,
    fireRiskAssessment: {
      date: '05/05/2025',
      riskLevel: 'medium',
      actionItems: [
        { description: 'Install additional smoke detectors on floors 4-6', status: 'in-progress' },
        { description: 'Upgrade bin store fire suppression', status: 'complete' },
      ],
    },
    asbestosManagement: {
      surveyDate: '10/02/2024',
      acmCount: 9,
      locations: ['Pipe lagging in risers', 'Floor tiles communal areas', 'Textured coatings stairwells'],
    },
    legionellaAssessment: {
      date: '20/07/2025',
      waterSystem: 'Cold water storage tanks (roof)',
      riskLevel: 'medium',
    },
    communalFire: {
      detectionType: 'L3 Conventional',
      zones: 2,
      serviceDate: '01/09/2025',
      emergencyLighting: true,
      compartmentation: 'fair',
      fireDoors: { total: 36, compliant: 33 },
    },
  },
  {
    id: 'victoria-houses',
    name: 'Victoria Park Terraces',
    estateId: 'victoria-park',
    address: '19-28 Victoria Park Terraces, Leicester LE2 1XR',
    uprn: '100023460011',
    lat: 52.6192,
    lng: -1.1235,
    constructionType: 'Traditional brick terraces',
    constructionYear: 1975,
    storeys: 2,
    totalUnits: 10,
    units: [],
    higherRisk: false,
    fireRiskAssessment: {
      date: '10/05/2025',
      riskLevel: 'low',
      actionItems: [],
    },
    asbestosManagement: {
      surveyDate: '10/02/2024',
      acmCount: 4,
      locations: ['Artex ceilings', 'Boiler flues'],
    },
    legionellaAssessment: {
      date: '20/07/2025',
      waterSystem: 'Individual mains fed',
      riskLevel: 'low',
    },
    communalFire: {
      detectionType: 'LD2 Domestic',
      zones: 0,
      serviceDate: '01/09/2025',
      emergencyLighting: false,
      compartmentation: 'good',
      fireDoors: { total: 10, compliant: 10 },
    },
  },
  {
    id: 'abbey-court',
    name: 'Abbey Court',
    estateId: 'abbey-meadows',
    address: '1-12 Abbey Court, Abbey Meadows, Leicester LE4 5HN',
    uprn: '100023460012',
    lat: 52.6526,
    lng: -1.1383,
    constructionType: 'Brick with timber roof',
    constructionYear: 1994,
    storeys: 3,
    totalUnits: 12,
    units: [],
    higherRisk: false,
    fireRiskAssessment: {
      date: '15/06/2025',
      riskLevel: 'low',
      actionItems: [],
    },
    asbestosManagement: {
      surveyDate: '01/05/2024',
      acmCount: 0,
      locations: [],
    },
    legionellaAssessment: {
      date: '01/09/2025',
      waterSystem: 'Mains fed',
      riskLevel: 'low',
    },
    communalFire: {
      detectionType: 'L3 Conventional',
      zones: 1,
      serviceDate: '15/09/2025',
      emergencyLighting: true,
      compartmentation: 'good',
      fireDoors: { total: 24, compliant: 24 },
    },
  },
];

// ============================================================
// PROPERTIES — Kent Coastal (prop-051 to prop-065)
// ============================================================

export const expandedProperties: Property[] = [
  // === HARBOUR TOWER (8 flats) ===
  { id: 'prop-051', uprn: '100023456051', address: 'Flat 1, Harbour Tower, Harbour View Estate', postcode: 'CT20 1QA', blockId: 'harbour-tower', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0786, lng: 1.1652, type: 'flat', bedrooms: 2, floor: 1, floorArea: 54, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-051', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 58, expiryDate: '20/04/2028' }, gasSafety: { date: '15/11/2025', expiryDate: '14/11/2026', status: 'valid', engineer: 'HomeServe' }, eicr: { date: '10/05/2023', expiryDate: '09/05/2028', status: 'valid', observations: 2 }, asbestos: { acms: 2, lastSurvey: '15/03/2024', riskLevel: 'low' }, smokeAlarms: { count: 3, lastTest: '15/11/2025', compliant: true }, coAlarms: { count: 1, lastTest: '15/11/2025', compliant: true }, boiler: { make: 'Worcester', model: 'Greenstar 30i', installYear: 2017, lastService: '15/11/2025', efficiency: 87 }, dampRisk: 62, weeklyRent: 102.40, serviceCharge: 18.20 },
  { id: 'prop-052', uprn: '100023456052', address: 'Flat 2, Harbour Tower, Harbour View Estate', postcode: 'CT20 1QA', blockId: 'harbour-tower', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0786, lng: 1.1652, type: 'flat', bedrooms: 1, floor: 2, floorArea: 40, heatingType: 'gas-central', tenureType: 'assured', currentTenancyId: 'ten-052', isVoid: false, compliance: makeCompliance('expired', 'valid', 'non-compliant'), epc: { rating: 'D', sapScore: 55, expiryDate: '10/06/2027' }, gasSafety: { date: '20/12/2024', expiryDate: '19/12/2025', status: 'expired', engineer: 'HomeServe' }, eicr: { date: '01/08/2022', expiryDate: '31/07/2027', status: 'valid', observations: 1 }, smokeAlarms: { count: 2, lastTest: '20/12/2024', compliant: true }, coAlarms: { count: 1, lastTest: '20/12/2024', compliant: true }, boiler: { make: 'Baxi', model: 'Duo-tec', installYear: 2014, lastService: '20/12/2024', efficiency: 80 }, dampRisk: 45, weeklyRent: 88.60, serviceCharge: 18.20 },
  { id: 'prop-053', uprn: '100023456053', address: 'Flat 3, Harbour Tower, Harbour View Estate', postcode: 'CT20 1QA', blockId: 'harbour-tower', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0786, lng: 1.1652, type: 'flat', bedrooms: 3, floor: 3, floorArea: 70, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-053', isVoid: false, compliance: makeCompliance('valid', 'expired', 'non-compliant'), epc: { rating: 'E', sapScore: 42, expiryDate: '15/01/2027' }, gasSafety: { date: '10/01/2026', expiryDate: '09/01/2027', status: 'valid', engineer: 'PH Jones' }, eicr: { date: '05/09/2019', expiryDate: '04/09/2024', status: 'expired', observations: 6 }, asbestos: { acms: 3, lastSurvey: '15/03/2024', riskLevel: 'medium' }, smokeAlarms: { count: 3, lastTest: '10/01/2026', compliant: true }, coAlarms: { count: 1, lastTest: '10/01/2026', compliant: true }, boiler: { make: 'Ideal', model: 'Logic Plus', installYear: 2012, lastService: '10/01/2026', efficiency: 78 }, dampRisk: 82, weeklyRent: 118.40, serviceCharge: 18.20 },
  { id: 'prop-054', uprn: '100023456054', address: 'Flat 4, Harbour Tower, Harbour View Estate', postcode: 'CT20 1QA', blockId: 'harbour-tower', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0786, lng: 1.1652, type: 'flat', bedrooms: 2, floor: 4, floorArea: 56, heatingType: 'gas-central', tenureType: 'starter', currentTenancyId: 'ten-054', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 60, expiryDate: '10/09/2029' }, gasSafety: { date: '05/02/2026', expiryDate: '04/02/2027', status: 'valid', engineer: 'HomeServe' }, eicr: { date: '15/04/2024', expiryDate: '14/04/2029', status: 'valid', observations: 1 }, smokeAlarms: { count: 3, lastTest: '05/02/2026', compliant: true }, coAlarms: { count: 1, lastTest: '05/02/2026', compliant: true }, boiler: { make: 'Vaillant', model: 'ecoTEC Plus', installYear: 2021, lastService: '05/02/2026', efficiency: 92 }, dampRisk: 30, weeklyRent: 105.20, serviceCharge: 18.20 },
  { id: 'prop-055', uprn: '100023456055', address: 'Flat 5, Harbour Tower, Harbour View Estate', postcode: 'CT20 1QA', blockId: 'harbour-tower', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0786, lng: 1.1652, type: 'flat', bedrooms: 1, floor: 5, floorArea: 38, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-055', isVoid: false, compliance: makeCompliance('expired', 'valid', 'non-compliant'), epc: { rating: 'D', sapScore: 53, expiryDate: '20/07/2028' }, gasSafety: { date: '10/01/2025', expiryDate: '09/01/2026', status: 'expired', engineer: 'PH Jones' }, eicr: { date: '20/03/2023', expiryDate: '19/03/2028', status: 'valid', observations: 2 }, smokeAlarms: { count: 2, lastTest: '10/01/2025', compliant: true }, coAlarms: { count: 1, lastTest: '10/01/2025', compliant: true }, boiler: { make: 'Worcester', model: 'Greenstar CDi', installYear: 2015, lastService: '10/01/2025', efficiency: 84 }, dampRisk: 75, weeklyRent: 86.80, serviceCharge: 18.20 },
  { id: 'prop-056', uprn: '100023456056', address: 'Flat 6, Harbour Tower, Harbour View Estate', postcode: 'CT20 1QA', blockId: 'harbour-tower', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0786, lng: 1.1652, type: 'flat', bedrooms: 2, floor: 6, floorArea: 56, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-056', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'C', sapScore: 70, expiryDate: '05/11/2029' }, gasSafety: { date: '20/01/2026', expiryDate: '19/01/2027', status: 'valid', engineer: 'HomeServe' }, eicr: { date: '10/06/2023', expiryDate: '09/06/2028', status: 'valid', observations: 1 }, smokeAlarms: { count: 3, lastTest: '20/01/2026', compliant: true }, coAlarms: { count: 1, lastTest: '20/01/2026', compliant: true }, boiler: { make: 'Vaillant', model: 'ecoTEC Pro', installYear: 2020, lastService: '20/01/2026', efficiency: 93 }, dampRisk: 28, weeklyRent: 105.20, serviceCharge: 18.20 },
  { id: 'prop-057', uprn: '100023456057', address: 'Flat 7, Harbour Tower, Harbour View Estate', postcode: 'CT20 1QA', blockId: 'harbour-tower', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0786, lng: 1.1652, type: 'flat', bedrooms: 3, floor: 7, floorArea: 72, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-057', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 56, expiryDate: '15/08/2028' }, gasSafety: { date: '01/12/2025', expiryDate: '30/11/2026', status: 'valid', engineer: 'PH Jones' }, eicr: { date: '20/07/2022', expiryDate: '19/07/2027', status: 'valid', observations: 3 }, smokeAlarms: { count: 3, lastTest: '01/12/2025', compliant: true }, coAlarms: { count: 1, lastTest: '01/12/2025', compliant: true }, boiler: { make: 'Ideal', model: 'Logic Plus', installYear: 2018, lastService: '01/12/2025', efficiency: 89 }, dampRisk: 50, weeklyRent: 118.40, serviceCharge: 18.20 },
  { id: 'prop-058', uprn: '100023456058', address: 'Flat 8, Harbour Tower, Harbour View Estate', postcode: 'CT20 1QA', blockId: 'harbour-tower', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0786, lng: 1.1652, type: 'flat', bedrooms: 2, floor: 8, floorArea: 54, heatingType: 'gas-central', tenureType: 'assured', isVoid: true, voidSince: '05/01/2026', compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 57, expiryDate: '25/05/2028' }, dampRisk: 35, weeklyRent: 102.40, serviceCharge: 18.20 },

  // === HARBOUR HOUSE (4 flats) ===
  { id: 'prop-059', uprn: '100023456059', address: 'Flat 25, Harbour House, Harbour View Estate', postcode: 'CT20 1QB', blockId: 'harbour-house', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0783, lng: 1.1658, type: 'flat', bedrooms: 2, floor: 1, floorArea: 52, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-059', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 61, expiryDate: '30/06/2029' }, gasSafety: { date: '05/12/2025', expiryDate: '04/12/2026', status: 'valid', engineer: 'HomeServe' }, eicr: { date: '15/09/2022', expiryDate: '14/09/2027', status: 'valid', observations: 2 }, smokeAlarms: { count: 3, lastTest: '05/12/2025', compliant: true }, coAlarms: { count: 1, lastTest: '05/12/2025', compliant: true }, boiler: { make: 'Baxi', model: 'Duo-tec', installYear: 2016, lastService: '05/12/2025', efficiency: 85 }, dampRisk: 40, weeklyRent: 98.60, serviceCharge: 14.80 },
  { id: 'prop-060', uprn: '100023456060', address: 'Flat 26, Harbour House, Harbour View Estate', postcode: 'CT20 1QB', blockId: 'harbour-house', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0783, lng: 1.1658, type: 'flat', bedrooms: 1, floor: 2, floorArea: 40, heatingType: 'gas-central', tenureType: 'assured', currentTenancyId: 'ten-060', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 59, expiryDate: '15/03/2028' }, gasSafety: { date: '10/01/2026', expiryDate: '09/01/2027', status: 'valid', engineer: 'HomeServe' }, eicr: { date: '20/11/2023', expiryDate: '19/11/2028', status: 'valid', observations: 1 }, smokeAlarms: { count: 2, lastTest: '10/01/2026', compliant: true }, coAlarms: { count: 1, lastTest: '10/01/2026', compliant: true }, boiler: { make: 'Worcester', model: 'Greenstar 30i', installYear: 2019, lastService: '10/01/2026', efficiency: 91 }, dampRisk: 22, weeklyRent: 86.80, serviceCharge: 14.80 },
  { id: 'prop-061', uprn: '100023456061', address: 'Flat 27, Harbour House, Harbour View Estate', postcode: 'CT20 1QB', blockId: 'harbour-house', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0783, lng: 1.1658, type: 'flat', bedrooms: 2, floor: 3, floorArea: 54, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-061', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'C', sapScore: 72, expiryDate: '10/10/2030' }, gasSafety: { date: '15/01/2026', expiryDate: '14/01/2027', status: 'valid', engineer: 'PH Jones' }, eicr: { date: '05/06/2024', expiryDate: '04/06/2029', status: 'valid', observations: 0 }, smokeAlarms: { count: 3, lastTest: '15/01/2026', compliant: true }, coAlarms: { count: 1, lastTest: '15/01/2026', compliant: true }, boiler: { make: 'Vaillant', model: 'ecoTEC Plus', installYear: 2022, lastService: '15/01/2026', efficiency: 94 }, dampRisk: 15, weeklyRent: 98.60, serviceCharge: 14.80 },
  { id: 'prop-062', uprn: '100023456062', address: 'Flat 28, Harbour House, Harbour View Estate', postcode: 'CT20 1QB', blockId: 'harbour-house', estateId: 'harbour-view', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0783, lng: 1.1658, type: 'flat', bedrooms: 1, floor: 4, floorArea: 38, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-062', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 56, expiryDate: '20/08/2028' }, gasSafety: { date: '01/02/2026', expiryDate: '31/01/2027', status: 'valid', engineer: 'HomeServe' }, eicr: { date: '10/04/2023', expiryDate: '09/04/2028', status: 'valid', observations: 1 }, smokeAlarms: { count: 2, lastTest: '01/02/2026', compliant: true }, coAlarms: { count: 1, lastTest: '01/02/2026', compliant: true }, boiler: { make: 'Baxi', model: 'Duo-tec', installYear: 2015, lastService: '01/02/2026', efficiency: 83 }, dampRisk: 32, weeklyRent: 86.80, serviceCharge: 14.80 },

  // === CHANNEL BLOCK (3 flats) ===
  { id: 'prop-063', uprn: '100023456063', address: 'Flat 1, Channel House, Channel Gardens', postcode: 'CT19 5RH', blockId: 'channel-block', estateId: 'channel-gardens', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0894, lng: 1.1538, type: 'flat', bedrooms: 2, floor: 1, floorArea: 58, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-063', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'C', sapScore: 71, expiryDate: '05/12/2029' }, gasSafety: { date: '20/11/2025', expiryDate: '19/11/2026', status: 'valid', engineer: 'HomeServe' }, eicr: { date: '01/07/2023', expiryDate: '30/06/2028', status: 'valid', observations: 1 }, smokeAlarms: { count: 3, lastTest: '20/11/2025', compliant: true }, coAlarms: { count: 1, lastTest: '20/11/2025', compliant: true }, boiler: { make: 'Vaillant', model: 'ecoTEC Plus', installYear: 2019, lastService: '20/11/2025', efficiency: 91 }, dampRisk: 18, weeklyRent: 102.40, serviceCharge: 22.60 },
  { id: 'prop-064', uprn: '100023456064', address: 'Flat 2, Channel House, Channel Gardens', postcode: 'CT19 5RH', blockId: 'channel-block', estateId: 'channel-gardens', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0894, lng: 1.1538, type: 'flat', bedrooms: 3, floor: 2, floorArea: 72, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-064', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'C', sapScore: 68, expiryDate: '15/09/2029' }, gasSafety: { date: '05/12/2025', expiryDate: '04/12/2026', status: 'valid', engineer: 'PH Jones' }, eicr: { date: '20/02/2024', expiryDate: '19/02/2029', status: 'valid', observations: 0 }, smokeAlarms: { count: 3, lastTest: '05/12/2025', compliant: true }, coAlarms: { count: 1, lastTest: '05/12/2025', compliant: true }, boiler: { make: 'Worcester', model: 'Greenstar CDi', installYear: 2020, lastService: '05/12/2025', efficiency: 92 }, dampRisk: 12, weeklyRent: 115.80, serviceCharge: 22.60 },
  { id: 'prop-065', uprn: '100023456065', address: 'Flat 3, Channel House, Channel Gardens', postcode: 'CT19 5RH', blockId: 'channel-block', estateId: 'channel-gardens', localAuthorityId: 'kent-coastal', regionId: 'south-east', lat: 51.0894, lng: 1.1538, type: 'flat', bedrooms: 2, floor: 3, floorArea: 56, heatingType: 'gas-central', tenureType: 'assured', currentTenancyId: 'ten-065', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 62, expiryDate: '20/04/2029' }, gasSafety: { date: '10/10/2025', expiryDate: '09/10/2026', status: 'valid', engineer: 'HomeServe' }, eicr: { date: '15/08/2023', expiryDate: '14/08/2028', status: 'valid', observations: 2 }, smokeAlarms: { count: 3, lastTest: '10/10/2025', compliant: true }, coAlarms: { count: 1, lastTest: '10/10/2025', compliant: true }, boiler: { make: 'Ideal', model: 'Logic Plus', installYear: 2018, lastService: '10/10/2025', efficiency: 88 }, dampRisk: 25, weeklyRent: 102.40, serviceCharge: 22.60 },

  // ============================================================
  // PROPERTIES — Leicester (prop-066 to prop-075)
  // ============================================================

  // === VICTORIA TOWER (5 flats) ===
  { id: 'prop-066', uprn: '100023456066', address: 'Flat 1, Victoria Tower, Victoria Park Estate', postcode: 'LE2 1XQ', blockId: 'victoria-tower', estateId: 'victoria-park', localAuthorityId: 'leicester', regionId: 'east-midlands', lat: 52.6196, lng: -1.1228, type: 'flat', bedrooms: 2, floor: 1, floorArea: 52, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-066', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 59, expiryDate: '10/05/2028' }, gasSafety: { date: '20/10/2025', expiryDate: '19/10/2026', status: 'valid', engineer: 'British Gas' }, eicr: { date: '05/03/2023', expiryDate: '04/03/2028', status: 'valid', observations: 2 }, asbestos: { acms: 2, lastSurvey: '10/02/2024', riskLevel: 'low' }, smokeAlarms: { count: 3, lastTest: '20/10/2025', compliant: true }, coAlarms: { count: 1, lastTest: '20/10/2025', compliant: true }, boiler: { make: 'Baxi', model: 'Duo-tec', installYear: 2016, lastService: '20/10/2025', efficiency: 85 }, dampRisk: 55, weeklyRent: 88.40, serviceCharge: 16.80 },
  { id: 'prop-067', uprn: '100023456067', address: 'Flat 2, Victoria Tower, Victoria Park Estate', postcode: 'LE2 1XQ', blockId: 'victoria-tower', estateId: 'victoria-park', localAuthorityId: 'leicester', regionId: 'east-midlands', lat: 52.6196, lng: -1.1228, type: 'flat', bedrooms: 1, floor: 2, floorArea: 38, heatingType: 'gas-central', tenureType: 'assured', currentTenancyId: 'ten-067', isVoid: false, compliance: makeCompliance('valid', 'expiring'), epc: { rating: 'D', sapScore: 54, expiryDate: '20/06/2027' }, gasSafety: { date: '15/12/2025', expiryDate: '14/12/2026', status: 'valid', engineer: 'PH Jones' }, eicr: { date: '10/04/2020', expiryDate: '09/04/2025', status: 'expiring', observations: 4 }, smokeAlarms: { count: 2, lastTest: '15/12/2025', compliant: true }, coAlarms: { count: 1, lastTest: '15/12/2025', compliant: true }, boiler: { make: 'Worcester', model: 'Greenstar 30i', installYear: 2013, lastService: '15/12/2025', efficiency: 82 }, dampRisk: 48, weeklyRent: 76.20, serviceCharge: 16.80 },
  { id: 'prop-068', uprn: '100023456068', address: 'Flat 3, Victoria Tower, Victoria Park Estate', postcode: 'LE2 1XQ', blockId: 'victoria-tower', estateId: 'victoria-park', localAuthorityId: 'leicester', regionId: 'east-midlands', lat: 52.6196, lng: -1.1228, type: 'flat', bedrooms: 3, floor: 3, floorArea: 68, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-068', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'E', sapScore: 44, expiryDate: '15/02/2027' }, gasSafety: { date: '05/11/2025', expiryDate: '04/11/2026', status: 'valid', engineer: 'British Gas' }, eicr: { date: '20/09/2022', expiryDate: '19/09/2027', status: 'valid', observations: 3 }, asbestos: { acms: 3, lastSurvey: '10/02/2024', riskLevel: 'medium' }, smokeAlarms: { count: 3, lastTest: '05/11/2025', compliant: true }, coAlarms: { count: 1, lastTest: '05/11/2025', compliant: true }, boiler: { make: 'Ideal', model: 'Logic Plus', installYear: 2011, lastService: '05/11/2025', efficiency: 76 }, dampRisk: 70, weeklyRent: 102.80, serviceCharge: 16.80 },
  { id: 'prop-069', uprn: '100023456069', address: 'Flat 4, Victoria Tower, Victoria Park Estate', postcode: 'LE2 1XQ', blockId: 'victoria-tower', estateId: 'victoria-park', localAuthorityId: 'leicester', regionId: 'east-midlands', lat: 52.6196, lng: -1.1228, type: 'flat', bedrooms: 2, floor: 4, floorArea: 52, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-069', isVoid: false, compliance: makeCompliance('expired', 'valid', 'non-compliant'), epc: { rating: 'D', sapScore: 57, expiryDate: '25/08/2028' }, gasSafety: { date: '10/12/2024', expiryDate: '09/12/2025', status: 'expired', engineer: 'PH Jones' }, eicr: { date: '15/05/2023', expiryDate: '14/05/2028', status: 'valid', observations: 2 }, smokeAlarms: { count: 3, lastTest: '10/12/2024', compliant: true }, coAlarms: { count: 1, lastTest: '10/12/2024', compliant: true }, boiler: { make: 'Baxi', model: 'Duo-tec', installYear: 2015, lastService: '10/12/2024', efficiency: 83 }, dampRisk: 42, weeklyRent: 88.40, serviceCharge: 16.80 },
  { id: 'prop-070', uprn: '100023456070', address: 'Flat 5, Victoria Tower, Victoria Park Estate', postcode: 'LE2 1XQ', blockId: 'victoria-tower', estateId: 'victoria-park', localAuthorityId: 'leicester', regionId: 'east-midlands', lat: 52.6196, lng: -1.1228, type: 'flat', bedrooms: 1, floor: 5, floorArea: 38, heatingType: 'gas-central', tenureType: 'assured', currentTenancyId: 'ten-070', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 55, expiryDate: '10/04/2028' }, gasSafety: { date: '01/01/2026', expiryDate: '31/12/2026', status: 'valid', engineer: 'British Gas' }, eicr: { date: '20/07/2024', expiryDate: '19/07/2029', status: 'valid', observations: 1 }, smokeAlarms: { count: 2, lastTest: '01/01/2026', compliant: true }, coAlarms: { count: 1, lastTest: '01/01/2026', compliant: true }, boiler: { make: 'Worcester', model: 'Greenstar CDi', installYear: 2019, lastService: '01/01/2026', efficiency: 90 }, dampRisk: 35, weeklyRent: 76.20, serviceCharge: 16.80 },

  // === VICTORIA HOUSES (3 houses) ===
  { id: 'prop-071', uprn: '100023456071', address: '19 Victoria Park Terraces', postcode: 'LE2 1XR', blockId: 'victoria-houses', estateId: 'victoria-park', localAuthorityId: 'leicester', regionId: 'east-midlands', lat: 52.6192, lng: -1.1235, type: 'house', bedrooms: 3, floorArea: 78, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-071', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 58, expiryDate: '30/09/2028' }, gasSafety: { date: '15/11/2025', expiryDate: '14/11/2026', status: 'valid', engineer: 'British Gas' }, eicr: { date: '01/06/2023', expiryDate: '31/05/2028', status: 'valid', observations: 2 }, smokeAlarms: { count: 3, lastTest: '15/11/2025', compliant: true }, coAlarms: { count: 1, lastTest: '15/11/2025', compliant: true }, boiler: { make: 'Worcester', model: 'Greenstar 30i', installYear: 2017, lastService: '15/11/2025', efficiency: 87 }, dampRisk: 45, weeklyRent: 96.40, serviceCharge: 8.60 },
  { id: 'prop-072', uprn: '100023456072', address: '21 Victoria Park Terraces', postcode: 'LE2 1XR', blockId: 'victoria-houses', estateId: 'victoria-park', localAuthorityId: 'leicester', regionId: 'east-midlands', lat: 52.6193, lng: -1.1233, type: 'house', bedrooms: 2, floorArea: 62, heatingType: 'gas-central', tenureType: 'assured', currentTenancyId: 'ten-072', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'E', sapScore: 40, expiryDate: '15/01/2027' }, gasSafety: { date: '01/12/2025', expiryDate: '30/11/2026', status: 'valid', engineer: 'PH Jones' }, eicr: { date: '15/08/2022', expiryDate: '14/08/2027', status: 'valid', observations: 3 }, smokeAlarms: { count: 2, lastTest: '01/12/2025', compliant: true }, coAlarms: { count: 1, lastTest: '01/12/2025', compliant: true }, boiler: { make: 'Baxi', model: 'Duo-tec', installYear: 2010, lastService: '01/12/2025', efficiency: 74 }, dampRisk: 60, weeklyRent: 82.60, serviceCharge: 8.60 },
  { id: 'prop-073', uprn: '100023456073', address: '23 Victoria Park Terraces', postcode: 'LE2 1XR', blockId: 'victoria-houses', estateId: 'victoria-park', localAuthorityId: 'leicester', regionId: 'east-midlands', lat: 52.6194, lng: -1.1231, type: 'house', bedrooms: 3, floorArea: 80, heatingType: 'gas-central', tenureType: 'secure', isVoid: true, voidSince: '20/12/2025', compliance: makeCompliance('valid', 'valid'), epc: { rating: 'D', sapScore: 56, expiryDate: '10/07/2028' }, dampRisk: 38, weeklyRent: 96.40, serviceCharge: 8.60 },

  // === ABBEY COURT (2 flats) ===
  { id: 'prop-074', uprn: '100023456074', address: 'Flat 1, Abbey Court, Abbey Meadows', postcode: 'LE4 5HN', blockId: 'abbey-court', estateId: 'abbey-meadows', localAuthorityId: 'leicester', regionId: 'east-midlands', lat: 52.6526, lng: -1.1383, type: 'flat', bedrooms: 2, floor: 1, floorArea: 55, heatingType: 'gas-central', tenureType: 'secure', currentTenancyId: 'ten-074', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'C', sapScore: 70, expiryDate: '20/11/2030' }, gasSafety: { date: '10/10/2025', expiryDate: '09/10/2026', status: 'valid', engineer: 'British Gas' }, eicr: { date: '05/01/2024', expiryDate: '04/01/2029', status: 'valid', observations: 0 }, smokeAlarms: { count: 3, lastTest: '10/10/2025', compliant: true }, coAlarms: { count: 1, lastTest: '10/10/2025', compliant: true }, boiler: { make: 'Vaillant', model: 'ecoTEC Plus', installYear: 2020, lastService: '10/10/2025', efficiency: 93 }, dampRisk: 10, weeklyRent: 88.40, serviceCharge: 15.40 },
  { id: 'prop-075', uprn: '100023456075', address: 'Flat 2, Abbey Court, Abbey Meadows', postcode: 'LE4 5HN', blockId: 'abbey-court', estateId: 'abbey-meadows', localAuthorityId: 'leicester', regionId: 'east-midlands', lat: 52.6526, lng: -1.1383, type: 'flat', bedrooms: 1, floor: 2, floorArea: 42, heatingType: 'gas-central', tenureType: 'starter', currentTenancyId: 'ten-075', isVoid: false, compliance: makeCompliance('valid', 'valid'), epc: { rating: 'C', sapScore: 72, expiryDate: '05/02/2031' }, gasSafety: { date: '15/01/2026', expiryDate: '14/01/2027', status: 'valid', engineer: 'PH Jones' }, eicr: { date: '20/06/2024', expiryDate: '19/06/2029', status: 'valid', observations: 0 }, smokeAlarms: { count: 2, lastTest: '15/01/2026', compliant: true }, coAlarms: { count: 1, lastTest: '15/01/2026', compliant: true }, boiler: { make: 'Ideal', model: 'Logic Plus', installYear: 2022, lastService: '15/01/2026', efficiency: 94 }, dampRisk: 8, weeklyRent: 76.20, serviceCharge: 15.40 },
];

// ============================================================
// TENANTS — Kent Coastal (ten-051 to ten-065, skipping voids)
// ============================================================

export const expandedTenants: Tenant[] = [
  // --- Harbour Tower ---
  { id: 'ten-051', title: 'Mrs', firstName: 'Janet', lastName: 'Hollingsworth', dob: '15/06/1958', email: 'j.hollingsworth@email.com', phone: '01303 850051', mobile: '07700 900051', propertyId: 'prop-051', tenancyId: 'tcy-051', tenancyStartDate: '10/09/2003', tenancyType: 'secure', tenancyStatus: 'active', household: [{ name: 'Brian Hollingsworth', relationship: 'Husband', dob: '22/01/1955', isDependent: false }], emergencyContact: { name: 'Brian Hollingsworth', phone: '07700 900151', relationship: 'Husband' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [{ type: 'Elderly - mobility', severity: 'medium', dateIdentified: '20/06/2024' }], communicationPreference: 'phone', ucStatus: 'none', paymentMethod: 'dd', rentBalance: 0, weeklyCharge: 120.60, arrearsRisk: 5, lastContact: '20/01/2026', contactCount30Days: 1 },
  { id: 'ten-052', title: 'Mr', firstName: 'Darren', lastName: 'Simmonds', dob: '28/03/1990', email: 'd.simmonds@email.com', phone: '01303 850052', mobile: '07700 900052', propertyId: 'prop-052', tenancyId: 'tcy-052', tenancyStartDate: '15/06/2022', tenancyType: 'assured', tenancyStatus: 'active', household: [], emergencyContact: { name: 'Karen Simmonds', phone: '07700 900152', relationship: 'Mother' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [], communicationPreference: 'email', ucStatus: 'claiming', paymentMethod: 'uc', rentBalance: -345.80, weeklyCharge: 106.80, arrearsRisk: 68, lastContact: '03/02/2026', contactCount30Days: 3 },
  { id: 'ten-053', title: 'Ms', firstName: 'Tracey', lastName: 'Marsh', dob: '12/11/1976', email: 't.marsh@email.com', phone: '01303 850053', mobile: '07700 900053', propertyId: 'prop-053', tenancyId: 'tcy-053', tenancyStartDate: '20/04/2010', tenancyType: 'secure', tenancyStatus: 'active', household: [{ name: 'Chloe Marsh', relationship: 'Daughter', dob: '08/09/2009', isDependent: true }, { name: 'Ethan Marsh', relationship: 'Son', dob: '14/02/2012', isDependent: true }], emergencyContact: { name: 'Sandra Marsh', phone: '07700 900153', relationship: 'Mother' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [], communicationPreference: 'sms', ucStatus: 'claiming', paymentMethod: 'uc', rentBalance: -678.20, weeklyCharge: 136.60, arrearsRisk: 78, lastContact: '05/02/2026', contactCount30Days: 4 },
  { id: 'ten-054', title: 'Mr', firstName: 'Kyle', lastName: 'Whitfield', dob: '02/08/1997', email: 'k.whitfield@email.com', phone: '01303 850054', mobile: '07700 900054', propertyId: 'prop-054', tenancyId: 'tcy-054', tenancyStartDate: '01/10/2025', tenancyType: 'starter', tenancyStatus: 'active', household: [{ name: 'Gemma Price', relationship: 'Partner', dob: '18/12/1998', isDependent: false }], emergencyContact: { name: 'Gemma Price', phone: '07700 900154', relationship: 'Partner' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [], communicationPreference: 'email', ucStatus: 'none', paymentMethod: 'dd', rentBalance: 0, weeklyCharge: 123.40, arrearsRisk: 12, lastContact: '01/02/2026', contactCount30Days: 1 },
  { id: 'ten-055', title: 'Mrs', firstName: 'Doreen', lastName: 'Kelsey', dob: '30/04/1943', email: '', phone: '01303 850055', propertyId: 'prop-055', tenancyId: 'tcy-055', tenancyStartDate: '18/07/1985', tenancyType: 'secure', tenancyStatus: 'active', household: [], emergencyContact: { name: 'Mark Kelsey', phone: '07700 900155', relationship: 'Son' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [{ type: 'Elderly - isolated', severity: 'high', dateIdentified: '15/03/2023' }, { type: 'Physical disability', severity: 'high', dateIdentified: '10/08/2024' }], communicationPreference: 'letter', ucStatus: 'none', paymentMethod: 'dd', rentBalance: 0, weeklyCharge: 105.00, arrearsRisk: 2, lastContact: '10/11/2025', contactCount30Days: 0 },
  { id: 'ten-056', title: 'Mr', firstName: 'Craig', lastName: 'Fenwick', dob: '18/12/1982', email: 'c.fenwick@email.com', phone: '01303 850056', mobile: '07700 900056', propertyId: 'prop-056', tenancyId: 'tcy-056', tenancyStartDate: '05/03/2015', tenancyType: 'secure', tenancyStatus: 'active', household: [{ name: 'Lisa Fenwick', relationship: 'Wife', dob: '22/05/1984', isDependent: false }, { name: 'Ruby Fenwick', relationship: 'Daughter', dob: '10/07/2015', isDependent: true }], emergencyContact: { name: 'Lisa Fenwick', phone: '07700 900156', relationship: 'Wife' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [], communicationPreference: 'email', ucStatus: 'none', paymentMethod: 'so', rentBalance: -95.20, weeklyCharge: 123.40, arrearsRisk: 22, lastContact: '28/01/2026', contactCount30Days: 1 },
  { id: 'ten-057', title: 'Ms', firstName: 'Angela', lastName: 'Brightwell', dob: '05/09/1968', email: 'a.brightwell@email.com', phone: '01303 850057', mobile: '07700 900057', propertyId: 'prop-057', tenancyId: 'tcy-057', tenancyStartDate: '22/11/2008', tenancyType: 'secure', tenancyStatus: 'active', household: [{ name: 'Ryan Brightwell', relationship: 'Son', dob: '15/04/2005', isDependent: true }], emergencyContact: { name: 'Ryan Brightwell', phone: '07700 900157', relationship: 'Son' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [], communicationPreference: 'phone', ucStatus: 'transitioning', paymentMethod: 'uc', rentBalance: -423.60, weeklyCharge: 136.60, arrearsRisk: 55, lastContact: '06/02/2026', contactCount30Days: 2 },
  // prop-058 is void — no tenant

  // --- Harbour House ---
  { id: 'ten-059', title: 'Mr', firstName: 'Raymond', lastName: 'Godfrey', dob: '20/01/1952', email: '', phone: '01303 850059', propertyId: 'prop-059', tenancyId: 'tcy-059', tenancyStartDate: '08/05/1990', tenancyType: 'secure', tenancyStatus: 'active', household: [{ name: 'Maureen Godfrey', relationship: 'Wife', dob: '14/08/1954', isDependent: false }], emergencyContact: { name: 'Maureen Godfrey', phone: '07700 900159', relationship: 'Wife' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [{ type: 'Elderly', severity: 'medium', dateIdentified: '01/01/2024' }], communicationPreference: 'letter', ucStatus: 'none', paymentMethod: 'dd', rentBalance: 0, weeklyCharge: 113.40, arrearsRisk: 3, lastContact: '15/12/2025', contactCount30Days: 0 },
  { id: 'ten-060', title: 'Ms', firstName: 'Sophie', lastName: 'Turnbull', dob: '22/07/1994', email: 's.turnbull@email.com', phone: '01303 850060', mobile: '07700 900060', propertyId: 'prop-060', tenancyId: 'tcy-060', tenancyStartDate: '01/03/2023', tenancyType: 'assured', tenancyStatus: 'active', household: [], emergencyContact: { name: 'Helen Turnbull', phone: '07700 900160', relationship: 'Mother' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [], communicationPreference: 'email', ucStatus: 'none', paymentMethod: 'card', rentBalance: -62.00, weeklyCharge: 101.60, arrearsRisk: 18, lastContact: '02/02/2026', contactCount30Days: 1 },
  { id: 'ten-061', title: 'Mrs', firstName: 'Patricia', lastName: 'Osborne', dob: '10/03/1965', email: 'p.osborne@email.com', phone: '01303 850061', mobile: '07700 900061', propertyId: 'prop-061', tenancyId: 'tcy-061', tenancyStartDate: '14/08/2012', tenancyType: 'secure', tenancyStatus: 'active', household: [], emergencyContact: { name: 'Keith Osborne', phone: '07700 900161', relationship: 'Brother' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [], communicationPreference: 'phone', ucStatus: 'none', paymentMethod: 'dd', rentBalance: 0, weeklyCharge: 113.40, arrearsRisk: 5, lastContact: '25/01/2026', contactCount30Days: 0 },
  { id: 'ten-062', title: 'Mr', firstName: 'Terry', lastName: 'Hadfield', dob: '08/06/1950', email: '', phone: '01303 850062', propertyId: 'prop-062', tenancyId: 'tcy-062', tenancyStartDate: '20/12/1988', tenancyType: 'secure', tenancyStatus: 'active', household: [], emergencyContact: { name: 'Julie Hadfield', phone: '07700 900162', relationship: 'Daughter' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [{ type: 'Elderly - hearing impairment', severity: 'medium', dateIdentified: '10/09/2023' }], communicationPreference: 'letter', ucStatus: 'none', paymentMethod: 'dd', rentBalance: 0, weeklyCharge: 101.60, arrearsRisk: 3, lastContact: '05/01/2026', contactCount30Days: 0 },

  // --- Channel Block ---
  { id: 'ten-063', title: 'Mr', firstName: 'Derek', lastName: 'Ashworth', dob: '25/02/1960', email: 'd.ashworth@email.com', phone: '01303 850063', mobile: '07700 900063', propertyId: 'prop-063', tenancyId: 'tcy-063', tenancyStartDate: '30/06/2005', tenancyType: 'secure', tenancyStatus: 'active', household: [{ name: 'Jean Ashworth', relationship: 'Wife', dob: '08/11/1962', isDependent: false }], emergencyContact: { name: 'Jean Ashworth', phone: '07700 900163', relationship: 'Wife' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [], communicationPreference: 'phone', ucStatus: 'none', paymentMethod: 'dd', rentBalance: 0, weeklyCharge: 125.00, arrearsRisk: 5, lastContact: '18/01/2026', contactCount30Days: 0 },
  { id: 'ten-064', title: 'Ms', firstName: 'Nicola', lastName: 'Pearce', dob: '14/10/1985', email: 'n.pearce@email.com', phone: '01303 850064', mobile: '07700 900064', propertyId: 'prop-064', tenancyId: 'tcy-064', tenancyStartDate: '22/01/2017', tenancyType: 'secure', tenancyStatus: 'active', household: [{ name: 'Oliver Pearce', relationship: 'Son', dob: '05/05/2014', isDependent: true }, { name: 'Isla Pearce', relationship: 'Daughter', dob: '20/12/2017', isDependent: true }], emergencyContact: { name: 'Carol Pearce', phone: '07700 900164', relationship: 'Mother' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [], communicationPreference: 'email', ucStatus: 'claiming', paymentMethod: 'uc', rentBalance: -198.40, weeklyCharge: 138.40, arrearsRisk: 42, lastContact: '04/02/2026', contactCount30Days: 2 },
  { id: 'ten-065', title: 'Mr', firstName: 'Stuart', lastName: 'Grantham', dob: '03/12/1988', email: 's.grantham@email.com', phone: '01303 850065', mobile: '07700 900065', propertyId: 'prop-065', tenancyId: 'tcy-065', tenancyStartDate: '10/08/2021', tenancyType: 'assured', tenancyStatus: 'active', household: [{ name: 'Emma Grantham', relationship: 'Partner', dob: '15/06/1990', isDependent: false }], emergencyContact: { name: 'Emma Grantham', phone: '07700 900165', relationship: 'Partner' }, assignedOfficer: 'Claire Barton', vulnerabilityFlags: [], communicationPreference: 'email', ucStatus: 'none', paymentMethod: 'so', rentBalance: 0, weeklyCharge: 125.00, arrearsRisk: 10, lastContact: '30/01/2026', contactCount30Days: 1 },

  // ============================================================
  // TENANTS — Leicester (ten-066 to ten-075, skipping void prop-073)
  // ============================================================

  // --- Victoria Tower ---
  { id: 'ten-066', title: 'Mr', firstName: 'Rajesh', lastName: 'Chauhan', dob: '18/05/1978', email: 'r.chauhan@email.com', phone: '0116 254 0066', mobile: '07700 900066', propertyId: 'prop-066', tenancyId: 'tcy-066', tenancyStartDate: '15/02/2013', tenancyType: 'secure', tenancyStatus: 'active', household: [{ name: 'Sunita Chauhan', relationship: 'Wife', dob: '25/09/1980', isDependent: false }, { name: 'Anisha Chauhan', relationship: 'Daughter', dob: '12/04/2011', isDependent: true }], emergencyContact: { name: 'Sunita Chauhan', phone: '07700 900166', relationship: 'Wife' }, assignedOfficer: 'Darren Kapoor', vulnerabilityFlags: [], communicationPreference: 'email', ucStatus: 'none', paymentMethod: 'dd', rentBalance: 0, weeklyCharge: 105.20, arrearsRisk: 5, lastContact: '22/01/2026', contactCount30Days: 0 },
  { id: 'ten-067', title: 'Ms', firstName: 'Chelsea', lastName: 'Fenton', dob: '30/09/1995', email: 'c.fenton@email.com', phone: '0116 254 0067', mobile: '07700 900067', propertyId: 'prop-067', tenancyId: 'tcy-067', tenancyStartDate: '01/04/2022', tenancyType: 'assured', tenancyStatus: 'active', household: [], emergencyContact: { name: 'Diane Fenton', phone: '07700 900167', relationship: 'Mother' }, assignedOfficer: 'Darren Kapoor', vulnerabilityFlags: [], communicationPreference: 'sms', ucStatus: 'claiming', paymentMethod: 'uc', rentBalance: -285.60, weeklyCharge: 93.00, arrearsRisk: 62, lastContact: '05/02/2026', contactCount30Days: 3 },
  { id: 'ten-068', title: 'Mr', firstName: 'Mohammed', lastName: 'Akhtar', dob: '22/01/1972', email: 'm.akhtar@email.com', phone: '0116 254 0068', mobile: '07700 900068', propertyId: 'prop-068', tenancyId: 'tcy-068', tenancyStartDate: '10/11/2007', tenancyType: 'secure', tenancyStatus: 'active', household: [{ name: 'Fatima Akhtar', relationship: 'Wife', dob: '05/07/1975', isDependent: false }, { name: 'Aamir Akhtar', relationship: 'Son', dob: '18/03/2008', isDependent: true }, { name: 'Sana Akhtar', relationship: 'Daughter', dob: '25/11/2010', isDependent: true }], emergencyContact: { name: 'Fatima Akhtar', phone: '07700 900168', relationship: 'Wife' }, assignedOfficer: 'Darren Kapoor', vulnerabilityFlags: [], communicationPreference: 'phone', ucStatus: 'none', paymentMethod: 'so', rentBalance: -120.00, weeklyCharge: 119.60, arrearsRisk: 28, lastContact: '01/02/2026', contactCount30Days: 1 },
  { id: 'ten-069', title: 'Mrs', firstName: 'Sharon', lastName: 'Pratt', dob: '14/08/1970', email: 's.pratt@email.com', phone: '0116 254 0069', mobile: '07700 900069', propertyId: 'prop-069', tenancyId: 'tcy-069', tenancyStartDate: '20/09/2011', tenancyType: 'secure', tenancyStatus: 'active', household: [], emergencyContact: { name: 'Diane Pratt', phone: '07700 900169', relationship: 'Sister' }, assignedOfficer: 'Darren Kapoor', vulnerabilityFlags: [{ type: 'Mental health', severity: 'medium', dateIdentified: '15/04/2024' }], communicationPreference: 'phone', ucStatus: 'claiming', paymentMethod: 'uc', rentBalance: -512.40, weeklyCharge: 105.20, arrearsRisk: 75, lastContact: '06/02/2026', contactCount30Days: 4 },
  { id: 'ten-070', title: 'Mr', firstName: 'Liam', lastName: 'Cartwright', dob: '10/06/1998', email: 'l.cartwright@email.com', phone: '0116 254 0070', mobile: '07700 900070', propertyId: 'prop-070', tenancyId: 'tcy-070', tenancyStartDate: '15/07/2024', tenancyType: 'assured', tenancyStatus: 'active', household: [], emergencyContact: { name: 'Steve Cartwright', phone: '07700 900170', relationship: 'Father' }, assignedOfficer: 'Darren Kapoor', vulnerabilityFlags: [], communicationPreference: 'email', ucStatus: 'none', paymentMethod: 'card', rentBalance: -48.00, weeklyCharge: 93.00, arrearsRisk: 15, lastContact: '02/02/2026', contactCount30Days: 1 },

  // --- Victoria Houses ---
  { id: 'ten-071', title: 'Mrs', firstName: 'Gurpreet', lastName: 'Dhillon', dob: '08/03/1980', email: 'g.dhillon@email.com', phone: '0116 254 0071', mobile: '07700 900071', propertyId: 'prop-071', tenancyId: 'tcy-071', tenancyStartDate: '05/06/2014', tenancyType: 'secure', tenancyStatus: 'active', household: [{ name: 'Harpreet Dhillon', relationship: 'Husband', dob: '20/10/1978', isDependent: false }, { name: 'Jasleen Dhillon', relationship: 'Daughter', dob: '15/02/2015', isDependent: true }], emergencyContact: { name: 'Harpreet Dhillon', phone: '07700 900171', relationship: 'Husband' }, assignedOfficer: 'Darren Kapoor', vulnerabilityFlags: [], communicationPreference: 'email', ucStatus: 'none', paymentMethod: 'dd', rentBalance: 0, weeklyCharge: 105.00, arrearsRisk: 5, lastContact: '20/01/2026', contactCount30Days: 0 },
  { id: 'ten-072', title: 'Mr', firstName: 'Kevin', lastName: 'Woodward', dob: '25/11/1963', email: 'k.woodward@email.com', phone: '0116 254 0072', mobile: '07700 900072', propertyId: 'prop-072', tenancyId: 'tcy-072', tenancyStartDate: '12/02/2019', tenancyType: 'assured', tenancyStatus: 'active', household: [], emergencyContact: { name: 'Brenda Woodward', phone: '07700 900172', relationship: 'Mother' }, assignedOfficer: 'Darren Kapoor', vulnerabilityFlags: [{ type: 'Physical disability', severity: 'medium', dateIdentified: '20/01/2024' }], communicationPreference: 'phone', ucStatus: 'managed-migration', paymentMethod: 'uc', rentBalance: -380.20, weeklyCharge: 91.20, arrearsRisk: 70, lastContact: '04/02/2026', contactCount30Days: 3 },
  // prop-073 is void — no tenant

  // --- Abbey Court ---
  { id: 'ten-074', title: 'Ms', firstName: 'Hannah', lastName: 'Wilkinson', dob: '16/07/1992', email: 'h.wilkinson@email.com', phone: '0116 254 0074', mobile: '07700 900074', propertyId: 'prop-074', tenancyId: 'tcy-074', tenancyStartDate: '20/09/2020', tenancyType: 'secure', tenancyStatus: 'active', household: [{ name: 'Freddie Wilkinson', relationship: 'Son', dob: '10/12/2021', isDependent: true }], emergencyContact: { name: 'Sarah Wilkinson', phone: '07700 900174', relationship: 'Mother' }, assignedOfficer: 'Darren Kapoor', vulnerabilityFlags: [], communicationPreference: 'email', ucStatus: 'none', paymentMethod: 'dd', rentBalance: 0, weeklyCharge: 103.80, arrearsRisk: 8, lastContact: '28/01/2026', contactCount30Days: 1 },
  { id: 'ten-075', title: 'Mr', firstName: 'Callum', lastName: 'Fletcher', dob: '04/04/2000', email: 'c.fletcher@email.com', phone: '0116 254 0075', mobile: '07700 900075', propertyId: 'prop-075', tenancyId: 'tcy-075', tenancyStartDate: '01/11/2025', tenancyType: 'starter', tenancyStatus: 'active', household: [], emergencyContact: { name: 'Janet Fletcher', phone: '07700 900175', relationship: 'Mother' }, assignedOfficer: 'Darren Kapoor', vulnerabilityFlags: [], communicationPreference: 'sms', ucStatus: 'claiming', paymentMethod: 'uc', rentBalance: -62.40, weeklyCharge: 91.60, arrearsRisk: 25, lastContact: '03/02/2026', contactCount30Days: 2 },
];
