// ============================================================
// UK Public Data Integration Service
// Simulated data from real UK public APIs for contextual intelligence
// Sources: EPC Open Data, MHCLG IMD, data.london.gov.uk, Met Office
// ============================================================

// ---- EPC Data (epc.opendatacommunities.org) ----

export interface EpcData {
  address: string;
  postcode: string;
  currentRating: string; // A-G
  potentialRating: string;
  currentScore: number;
  potentialScore: number;
  heatingCostCurrent: number; // £/year
  heatingCostPotential: number;
  hotWaterCostCurrent: number;
  hotWaterCostPotential: number;
  lightingCostCurrent: number;
  lightingCostPotential: number;
  co2Current: number; // tonnes/year
  co2Potential: number;
  recommendations: { description: string; estimatedSavings: number; indicativeCost: string }[];
  lodgementDate: string;
  transactionType: string;
}

const epcDatabase: Record<string, EpcData[]> = {
  // === SOUTHWARK — Oak Park Estate (1960s concrete panel) ===
  SE15: [
    {
      address: 'Flat 1, Oak Tower, Oak Park Estate',
      postcode: 'SE15 4QN',
      currentRating: 'D',
      potentialRating: 'B',
      currentScore: 58,
      potentialScore: 82,
      heatingCostCurrent: 1120,
      heatingCostPotential: 580,
      hotWaterCostCurrent: 280,
      hotWaterCostPotential: 180,
      lightingCostCurrent: 110,
      lightingCostPotential: 65,
      co2Current: 3.8,
      co2Potential: 1.6,
      recommendations: [
        { description: 'Internal or external wall insulation', estimatedSavings: 312, indicativeCost: '£4,000 - £14,000' },
        { description: 'Replace single-glazed windows with double-glazed', estimatedSavings: 98, indicativeCost: '£3,300 - £6,500' },
        { description: 'Low energy lighting for all fixed outlets', estimatedSavings: 45, indicativeCost: '£30 - £80' },
      ],
      lodgementDate: '2023-11-15',
      transactionType: 'rental',
    },
    {
      address: 'Flat 3, Oak Tower, Oak Park Estate',
      postcode: 'SE15 4QN',
      currentRating: 'E',
      potentialRating: 'C',
      currentScore: 42,
      potentialScore: 71,
      heatingCostCurrent: 1480,
      heatingCostPotential: 720,
      hotWaterCostCurrent: 340,
      hotWaterCostPotential: 195,
      lightingCostCurrent: 135,
      lightingCostPotential: 70,
      co2Current: 5.2,
      co2Potential: 2.1,
      recommendations: [
        { description: 'Internal or external wall insulation', estimatedSavings: 420, indicativeCost: '£4,000 - £14,000' },
        { description: 'Upgrade boiler (current efficiency 78%)', estimatedSavings: 185, indicativeCost: '£2,200 - £3,000' },
        { description: 'Loft insulation top-up to 270mm', estimatedSavings: 65, indicativeCost: '£100 - £350' },
        { description: 'Draught-proofing', estimatedSavings: 48, indicativeCost: '£80 - £120' },
      ],
      lodgementDate: '2022-08-20',
      transactionType: 'rental',
    },
    {
      address: 'Flat 5, Oak Tower, Oak Park Estate',
      postcode: 'SE15 4QN',
      currentRating: 'C',
      potentialRating: 'B',
      currentScore: 72,
      potentialScore: 84,
      heatingCostCurrent: 680,
      heatingCostPotential: 480,
      hotWaterCostCurrent: 195,
      hotWaterCostPotential: 160,
      lightingCostCurrent: 65,
      lightingCostPotential: 52,
      co2Current: 2.1,
      co2Potential: 1.3,
      recommendations: [
        { description: 'Solar water heating', estimatedSavings: 55, indicativeCost: '£4,000 - £6,000' },
        { description: 'Low energy lighting for all fixed outlets', estimatedSavings: 13, indicativeCost: '£15 - £30' },
      ],
      lodgementDate: '2024-06-10',
      transactionType: 'rental',
    },
    {
      address: 'Flat 51, Oak House, Oak Park Estate',
      postcode: 'SE15 4QP',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 58,
      potentialScore: 73,
      heatingCostCurrent: 1090,
      heatingCostPotential: 610,
      hotWaterCostCurrent: 265,
      hotWaterCostPotential: 175,
      lightingCostCurrent: 105,
      lightingCostPotential: 60,
      co2Current: 3.6,
      co2Potential: 1.8,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 245, indicativeCost: '£500 - £1,500' },
        { description: 'Upgrade heating controls (TRVs + programmer)', estimatedSavings: 120, indicativeCost: '£350 - £450' },
        { description: 'Hot water cylinder insulation', estimatedSavings: 35, indicativeCost: '£15 - £30' },
      ],
      lodgementDate: '2023-03-22',
      transactionType: 'rental',
    },
    {
      address: 'Flat 80, Oak Court, Oak Park Estate',
      postcode: 'SE15 4QR',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 55,
      potentialScore: 70,
      heatingCostCurrent: 1210,
      heatingCostPotential: 680,
      hotWaterCostCurrent: 290,
      hotWaterCostPotential: 185,
      lightingCostCurrent: 125,
      lightingCostPotential: 68,
      co2Current: 4.1,
      co2Potential: 2.0,
      recommendations: [
        { description: 'External wall insulation', estimatedSavings: 290, indicativeCost: '£8,000 - £14,000' },
        { description: 'Replace boiler with condensing model', estimatedSavings: 165, indicativeCost: '£2,200 - £3,000' },
        { description: 'Low energy lighting', estimatedSavings: 57, indicativeCost: '£30 - £80' },
      ],
      lodgementDate: '2023-09-05',
      transactionType: 'rental',
    },
  ],

  // === SOUTHWARK — Riverside Crescent (2005 new build) ===
  SE1: [
    {
      address: 'Flat 1, Riverside North, Riverside Crescent',
      postcode: 'SE1 7PB',
      currentRating: 'B',
      potentialRating: 'A',
      currentScore: 82,
      potentialScore: 92,
      heatingCostCurrent: 420,
      heatingCostPotential: 290,
      hotWaterCostCurrent: 145,
      hotWaterCostPotential: 110,
      lightingCostCurrent: 52,
      lightingCostPotential: 38,
      co2Current: 1.4,
      co2Potential: 0.8,
      recommendations: [
        { description: 'Solar photovoltaic panels (2.5 kWp)', estimatedSavings: 85, indicativeCost: '£3,500 - £5,500' },
        { description: 'Solar water heating', estimatedSavings: 35, indicativeCost: '£4,000 - £6,000' },
      ],
      lodgementDate: '2024-02-18',
      transactionType: 'rental',
    },
    {
      address: 'Flat 2, Riverside North, Riverside Crescent',
      postcode: 'SE1 7PB',
      currentRating: 'B',
      potentialRating: 'A',
      currentScore: 84,
      potentialScore: 93,
      heatingCostCurrent: 395,
      heatingCostPotential: 275,
      hotWaterCostCurrent: 140,
      hotWaterCostPotential: 105,
      lightingCostCurrent: 48,
      lightingCostPotential: 35,
      co2Current: 1.3,
      co2Potential: 0.7,
      recommendations: [
        { description: 'Solar photovoltaic panels (2.5 kWp)', estimatedSavings: 90, indicativeCost: '£3,500 - £5,500' },
      ],
      lodgementDate: '2024-01-10',
      transactionType: 'rental',
    },
    {
      address: 'Flat 25, Riverside South, Riverside Crescent',
      postcode: 'SE1 7PC',
      currentRating: 'B',
      potentialRating: 'B',
      currentScore: 81,
      potentialScore: 88,
      heatingCostCurrent: 440,
      heatingCostPotential: 320,
      hotWaterCostCurrent: 150,
      hotWaterCostPotential: 115,
      lightingCostCurrent: 55,
      lightingCostPotential: 40,
      co2Current: 1.5,
      co2Potential: 0.9,
      recommendations: [
        { description: 'Upgrade heating controls', estimatedSavings: 60, indicativeCost: '£350 - £450' },
        { description: 'Low energy lighting', estimatedSavings: 15, indicativeCost: '£15 - £30' },
      ],
      lodgementDate: '2023-12-05',
      transactionType: 'rental',
    },
  ],

  // === LEWISHAM — Elm Gardens (1930s terraces) ===
  SE13: [
    {
      address: '1 Elm Gardens',
      postcode: 'SE13 6TH',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 58,
      potentialScore: 72,
      heatingCostCurrent: 1150,
      heatingCostPotential: 620,
      hotWaterCostCurrent: 275,
      hotWaterCostPotential: 170,
      lightingCostCurrent: 115,
      lightingCostPotential: 62,
      co2Current: 3.9,
      co2Potential: 1.7,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 280, indicativeCost: '£500 - £1,500' },
        { description: 'Loft insulation top-up to 270mm', estimatedSavings: 95, indicativeCost: '£100 - £350' },
        { description: 'Upgrade boiler to condensing model', estimatedSavings: 150, indicativeCost: '£2,200 - £3,000' },
      ],
      lodgementDate: '2022-11-30',
      transactionType: 'rental',
    },
    {
      address: '5 Elm Gardens',
      postcode: 'SE13 6TH',
      currentRating: 'E',
      potentialRating: 'C',
      currentScore: 40,
      potentialScore: 68,
      heatingCostCurrent: 1620,
      heatingCostPotential: 740,
      hotWaterCostCurrent: 360,
      hotWaterCostPotential: 200,
      lightingCostCurrent: 155,
      lightingCostPotential: 75,
      co2Current: 5.8,
      co2Potential: 2.3,
      recommendations: [
        { description: 'Solid wall insulation (internal or external)', estimatedSavings: 480, indicativeCost: '£4,000 - £14,000' },
        { description: 'Replace boiler (current efficiency <70%)', estimatedSavings: 220, indicativeCost: '£2,200 - £3,000' },
        { description: 'Floor insulation (suspended timber)', estimatedSavings: 85, indicativeCost: '£800 - £1,200' },
        { description: 'Draught-proofing', estimatedSavings: 55, indicativeCost: '£80 - £120' },
      ],
      lodgementDate: '2021-06-14',
      transactionType: 'rental',
    },
    {
      address: '7 Elm Gardens',
      postcode: 'SE13 6TH',
      currentRating: 'C',
      potentialRating: 'B',
      currentScore: 71,
      potentialScore: 82,
      heatingCostCurrent: 720,
      heatingCostPotential: 490,
      hotWaterCostCurrent: 200,
      hotWaterCostPotential: 155,
      lightingCostCurrent: 72,
      lightingCostPotential: 50,
      co2Current: 2.2,
      co2Potential: 1.3,
      recommendations: [
        { description: 'Solar photovoltaic panels (2.5 kWp)', estimatedSavings: 85, indicativeCost: '£3,500 - £5,500' },
        { description: 'Solar water heating', estimatedSavings: 45, indicativeCost: '£4,000 - £6,000' },
      ],
      lodgementDate: '2024-04-22',
      transactionType: 'rental',
    },
    {
      address: '11 Elm Gardens',
      postcode: 'SE13 6TH',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 59,
      potentialScore: 74,
      heatingCostCurrent: 1080,
      heatingCostPotential: 590,
      hotWaterCostCurrent: 260,
      hotWaterCostPotential: 165,
      lightingCostCurrent: 108,
      lightingCostPotential: 58,
      co2Current: 3.5,
      co2Potential: 1.6,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 260, indicativeCost: '£500 - £1,500' },
        { description: 'Upgrade heating controls', estimatedSavings: 110, indicativeCost: '£350 - £450' },
        { description: 'Hot water cylinder insulation', estimatedSavings: 30, indicativeCost: '£15 - £30' },
      ],
      lodgementDate: '2023-07-18',
      transactionType: 'rental',
    },
  ],

  // === LEWISHAM — Birch Court (1970s) ===
  SE6: [
    {
      address: 'Flat 1, Birch Court',
      postcode: 'SE6 3AD',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 63,
      potentialScore: 75,
      heatingCostCurrent: 920,
      heatingCostPotential: 540,
      hotWaterCostCurrent: 235,
      hotWaterCostPotential: 155,
      lightingCostCurrent: 85,
      lightingCostPotential: 50,
      co2Current: 3.0,
      co2Potential: 1.5,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 195, indicativeCost: '£500 - £1,500' },
        { description: 'Low energy lighting for all fixed outlets', estimatedSavings: 35, indicativeCost: '£30 - £80' },
        { description: 'Upgrade heating controls', estimatedSavings: 90, indicativeCost: '£350 - £450' },
      ],
      lodgementDate: '2023-05-12',
      transactionType: 'rental',
    },
    {
      address: 'Flat 3, Birch Court',
      postcode: 'SE6 3AD',
      currentRating: 'C',
      potentialRating: 'B',
      currentScore: 72,
      potentialScore: 83,
      heatingCostCurrent: 670,
      heatingCostPotential: 460,
      hotWaterCostCurrent: 190,
      hotWaterCostPotential: 150,
      lightingCostCurrent: 62,
      lightingCostPotential: 45,
      co2Current: 2.0,
      co2Potential: 1.2,
      recommendations: [
        { description: 'Solar photovoltaic panels', estimatedSavings: 80, indicativeCost: '£3,500 - £5,500' },
        { description: 'Low energy lighting', estimatedSavings: 17, indicativeCost: '£15 - £30' },
      ],
      lodgementDate: '2024-08-02',
      transactionType: 'rental',
    },
    {
      address: '25 Birch Court Bungalow',
      postcode: 'SE6 3AE',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 58,
      potentialScore: 71,
      heatingCostCurrent: 1050,
      heatingCostPotential: 590,
      hotWaterCostCurrent: 255,
      hotWaterCostPotential: 165,
      lightingCostCurrent: 95,
      lightingCostPotential: 55,
      co2Current: 3.4,
      co2Potential: 1.6,
      recommendations: [
        { description: 'Loft insulation top-up to 270mm', estimatedSavings: 120, indicativeCost: '£100 - £350' },
        { description: 'Cavity wall insulation', estimatedSavings: 210, indicativeCost: '£500 - £1,500' },
        { description: 'Replace boiler with condensing model', estimatedSavings: 140, indicativeCost: '£2,200 - £3,000' },
      ],
      lodgementDate: '2022-12-08',
      transactionType: 'rental',
    },
  ],

  // === LAMBETH — Maple Lane (1980s-90s mixed) ===
  SE24: [
    {
      address: 'Flat 1, Maple Tower, Maple Lane',
      postcode: 'SE24 0JB',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 62,
      potentialScore: 74,
      heatingCostCurrent: 960,
      heatingCostPotential: 550,
      hotWaterCostCurrent: 240,
      hotWaterCostPotential: 160,
      lightingCostCurrent: 90,
      lightingCostPotential: 52,
      co2Current: 3.2,
      co2Potential: 1.5,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 220, indicativeCost: '£500 - £1,500' },
        { description: 'Upgrade boiler to condensing model', estimatedSavings: 145, indicativeCost: '£2,200 - £3,000' },
        { description: 'Draught-proofing', estimatedSavings: 40, indicativeCost: '£80 - £120' },
      ],
      lodgementDate: '2023-04-15',
      transactionType: 'rental',
    },
    {
      address: 'Flat 2, Maple Tower, Maple Lane',
      postcode: 'SE24 0JB',
      currentRating: 'C',
      potentialRating: 'B',
      currentScore: 74,
      potentialScore: 85,
      heatingCostCurrent: 620,
      heatingCostPotential: 430,
      hotWaterCostCurrent: 180,
      hotWaterCostPotential: 140,
      lightingCostCurrent: 58,
      lightingCostPotential: 42,
      co2Current: 1.9,
      co2Potential: 1.1,
      recommendations: [
        { description: 'Solar photovoltaic panels (2.5 kWp)', estimatedSavings: 80, indicativeCost: '£3,500 - £5,500' },
      ],
      lodgementDate: '2024-09-20',
      transactionType: 'rental',
    },
    {
      address: '21 Maple Lane',
      postcode: 'SE24 0JC',
      currentRating: 'C',
      potentialRating: 'B',
      currentScore: 70,
      potentialScore: 82,
      heatingCostCurrent: 740,
      heatingCostPotential: 500,
      hotWaterCostCurrent: 205,
      hotWaterCostPotential: 155,
      lightingCostCurrent: 75,
      lightingCostPotential: 52,
      co2Current: 2.3,
      co2Potential: 1.4,
      recommendations: [
        { description: 'Loft insulation top-up', estimatedSavings: 65, indicativeCost: '£100 - £350' },
        { description: 'Solar photovoltaic panels', estimatedSavings: 90, indicativeCost: '£3,500 - £5,500' },
      ],
      lodgementDate: '2024-01-28',
      transactionType: 'rental',
    },
    {
      address: '25 Maple Lane',
      postcode: 'SE24 0JC',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 56,
      potentialScore: 69,
      heatingCostCurrent: 1180,
      heatingCostPotential: 650,
      hotWaterCostCurrent: 285,
      hotWaterCostPotential: 180,
      lightingCostCurrent: 120,
      lightingCostPotential: 65,
      co2Current: 4.0,
      co2Potential: 1.9,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 275, indicativeCost: '£500 - £1,500' },
        { description: 'Loft insulation top-up to 270mm', estimatedSavings: 80, indicativeCost: '£100 - £350' },
        { description: 'Upgrade heating controls', estimatedSavings: 105, indicativeCost: '£350 - £450' },
        { description: 'Low energy lighting', estimatedSavings: 55, indicativeCost: '£30 - £80' },
      ],
      lodgementDate: '2022-10-05',
      transactionType: 'rental',
    },
  ],

  // === KENT COASTAL — Folkestone (older coastal stock, D-E-F ratings) ===
  CT20: [
    {
      address: 'Flat 1, Marine Court, The Leas',
      postcode: 'CT20 2LR',
      currentRating: 'E',
      potentialRating: 'C',
      currentScore: 38,
      potentialScore: 68,
      heatingCostCurrent: 1680,
      heatingCostPotential: 780,
      hotWaterCostCurrent: 380,
      hotWaterCostPotential: 210,
      lightingCostCurrent: 145,
      lightingCostPotential: 72,
      co2Current: 5.8,
      co2Potential: 2.4,
      recommendations: [
        { description: 'Solid wall insulation (external preferred — coastal exposure)', estimatedSavings: 490, indicativeCost: '£8,000 - £22,000' },
        { description: 'Replace storage heaters with heat pump', estimatedSavings: 280, indicativeCost: '£7,000 - £13,000' },
        { description: 'Double glazing (salt-resistant frames)', estimatedSavings: 120, indicativeCost: '£3,300 - £6,500' },
      ],
      lodgementDate: '2022-05-18',
      transactionType: 'rental',
    },
    {
      address: '14 Sandgate Road',
      postcode: 'CT20 3HE',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 55,
      potentialScore: 72,
      heatingCostCurrent: 1240,
      heatingCostPotential: 680,
      hotWaterCostCurrent: 290,
      hotWaterCostPotential: 175,
      lightingCostCurrent: 118,
      lightingCostPotential: 62,
      co2Current: 4.2,
      co2Potential: 1.9,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 260, indicativeCost: '£500 - £1,500' },
        { description: 'Upgrade boiler to condensing model', estimatedSavings: 175, indicativeCost: '£2,200 - £3,000' },
        { description: 'Loft insulation', estimatedSavings: 85, indicativeCost: '£100 - £350' },
      ],
      lodgementDate: '2023-08-22',
      transactionType: 'rental',
    },
    {
      address: '8 Harbour Way',
      postcode: 'CT20 1QH',
      currentRating: 'F',
      potentialRating: 'D',
      currentScore: 28,
      potentialScore: 58,
      heatingCostCurrent: 2100,
      heatingCostPotential: 1050,
      hotWaterCostCurrent: 420,
      hotWaterCostPotential: 240,
      lightingCostCurrent: 165,
      lightingCostPotential: 80,
      co2Current: 7.2,
      co2Potential: 3.4,
      recommendations: [
        { description: 'Solid wall insulation', estimatedSavings: 580, indicativeCost: '£8,000 - £22,000' },
        { description: 'Replace inefficient boiler', estimatedSavings: 310, indicativeCost: '£2,200 - £3,000' },
        { description: 'Install double glazing throughout', estimatedSavings: 145, indicativeCost: '£3,300 - £6,500' },
        { description: 'Floor insulation', estimatedSavings: 95, indicativeCost: '£800 - £1,200' },
        { description: 'Draught-proofing', estimatedSavings: 65, indicativeCost: '£80 - £120' },
      ],
      lodgementDate: '2021-11-30',
      transactionType: 'rental',
    },
  ],

  CT19: [
    {
      address: 'Flat 3, Channel View, Cheriton Road',
      postcode: 'CT19 4QJ',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 60,
      potentialScore: 73,
      heatingCostCurrent: 1020,
      heatingCostPotential: 580,
      hotWaterCostCurrent: 250,
      hotWaterCostPotential: 165,
      lightingCostCurrent: 95,
      lightingCostPotential: 55,
      co2Current: 3.4,
      co2Potential: 1.6,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 230, indicativeCost: '£500 - £1,500' },
        { description: 'Upgrade heating controls', estimatedSavings: 100, indicativeCost: '£350 - £450' },
        { description: 'Low energy lighting', estimatedSavings: 40, indicativeCost: '£30 - £80' },
      ],
      lodgementDate: '2023-02-14',
      transactionType: 'rental',
    },
    {
      address: '22 Cheriton Gardens',
      postcode: 'CT19 4AW',
      currentRating: 'E',
      potentialRating: 'C',
      currentScore: 44,
      potentialScore: 70,
      heatingCostCurrent: 1420,
      heatingCostPotential: 700,
      hotWaterCostCurrent: 330,
      hotWaterCostPotential: 190,
      lightingCostCurrent: 130,
      lightingCostPotential: 65,
      co2Current: 5.0,
      co2Potential: 2.1,
      recommendations: [
        { description: 'External wall insulation', estimatedSavings: 380, indicativeCost: '£8,000 - £22,000' },
        { description: 'Replace boiler (very old, <70% efficiency)', estimatedSavings: 240, indicativeCost: '£2,200 - £3,000' },
        { description: 'Loft insulation top-up', estimatedSavings: 75, indicativeCost: '£100 - £350' },
      ],
      lodgementDate: '2022-07-20',
      transactionType: 'rental',
    },
    {
      address: '5 Radnor Park Road',
      postcode: 'CT19 5AS',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 52,
      potentialScore: 69,
      heatingCostCurrent: 1280,
      heatingCostPotential: 700,
      hotWaterCostCurrent: 305,
      hotWaterCostPotential: 185,
      lightingCostCurrent: 122,
      lightingCostPotential: 65,
      co2Current: 4.4,
      co2Potential: 2.0,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 270, indicativeCost: '£500 - £1,500' },
        { description: 'Upgrade boiler', estimatedSavings: 160, indicativeCost: '£2,200 - £3,000' },
        { description: 'Floor insulation (suspended timber)', estimatedSavings: 80, indicativeCost: '£800 - £1,200' },
      ],
      lodgementDate: '2023-06-10',
      transactionType: 'rental',
    },
  ],

  // === LEICESTER — Older Victorian/inter-war stock, D-E ratings ===
  LE2: [
    {
      address: '45 Clarendon Park Road',
      postcode: 'LE2 3AD',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 57,
      potentialScore: 72,
      heatingCostCurrent: 1100,
      heatingCostPotential: 610,
      hotWaterCostCurrent: 265,
      hotWaterCostPotential: 170,
      lightingCostCurrent: 108,
      lightingCostPotential: 60,
      co2Current: 3.7,
      co2Potential: 1.7,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 250, indicativeCost: '£500 - £1,500' },
        { description: 'Loft insulation top-up to 270mm', estimatedSavings: 90, indicativeCost: '£100 - £350' },
        { description: 'Upgrade boiler to condensing model', estimatedSavings: 150, indicativeCost: '£2,200 - £3,000' },
      ],
      lodgementDate: '2023-01-25',
      transactionType: 'rental',
    },
    {
      address: 'Flat 2, Queens Road Court',
      postcode: 'LE2 1TT',
      currentRating: 'E',
      potentialRating: 'C',
      currentScore: 45,
      potentialScore: 70,
      heatingCostCurrent: 1380,
      heatingCostPotential: 690,
      hotWaterCostCurrent: 320,
      hotWaterCostPotential: 190,
      lightingCostCurrent: 125,
      lightingCostPotential: 65,
      co2Current: 4.8,
      co2Potential: 2.0,
      recommendations: [
        { description: 'Internal wall insulation (solid walls)', estimatedSavings: 380, indicativeCost: '£4,000 - £14,000' },
        { description: 'Replace storage heaters with gas central heating', estimatedSavings: 260, indicativeCost: '£3,500 - £5,500' },
        { description: 'Double glazing', estimatedSavings: 95, indicativeCost: '£3,300 - £6,500' },
      ],
      lodgementDate: '2022-09-15',
      transactionType: 'rental',
    },
    {
      address: '78 Welford Road',
      postcode: 'LE2 7AA',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 61,
      potentialScore: 74,
      heatingCostCurrent: 980,
      heatingCostPotential: 560,
      hotWaterCostCurrent: 245,
      hotWaterCostPotential: 160,
      lightingCostCurrent: 98,
      lightingCostPotential: 55,
      co2Current: 3.3,
      co2Potential: 1.5,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 215, indicativeCost: '£500 - £1,500' },
        { description: 'Upgrade heating controls', estimatedSavings: 95, indicativeCost: '£350 - £450' },
        { description: 'Low energy lighting', estimatedSavings: 43, indicativeCost: '£30 - £80' },
      ],
      lodgementDate: '2023-11-08',
      transactionType: 'rental',
    },
    {
      address: '12 Knighton Fields Road East',
      postcode: 'LE2 6DQ',
      currentRating: 'D',
      potentialRating: 'B',
      currentScore: 55,
      potentialScore: 80,
      heatingCostCurrent: 1200,
      heatingCostPotential: 520,
      hotWaterCostCurrent: 280,
      hotWaterCostPotential: 155,
      lightingCostCurrent: 115,
      lightingCostPotential: 55,
      co2Current: 4.0,
      co2Potential: 1.4,
      recommendations: [
        { description: 'External wall insulation', estimatedSavings: 340, indicativeCost: '£8,000 - £14,000' },
        { description: 'Replace boiler with air source heat pump', estimatedSavings: 220, indicativeCost: '£7,000 - £13,000' },
        { description: 'Loft insulation', estimatedSavings: 80, indicativeCost: '£100 - £350' },
        { description: 'Low energy lighting', estimatedSavings: 60, indicativeCost: '£30 - £80' },
      ],
      lodgementDate: '2022-04-20',
      transactionType: 'rental',
    },
  ],

  LE4: [
    {
      address: '33 Belgrave Road',
      postcode: 'LE4 5AS',
      currentRating: 'E',
      potentialRating: 'C',
      currentScore: 42,
      potentialScore: 68,
      heatingCostCurrent: 1520,
      heatingCostPotential: 750,
      hotWaterCostCurrent: 350,
      hotWaterCostPotential: 200,
      lightingCostCurrent: 140,
      lightingCostPotential: 70,
      co2Current: 5.3,
      co2Potential: 2.2,
      recommendations: [
        { description: 'Solid wall insulation', estimatedSavings: 420, indicativeCost: '£4,000 - £14,000' },
        { description: 'Replace boiler (pre-condensing model)', estimatedSavings: 200, indicativeCost: '£2,200 - £3,000' },
        { description: 'Loft insulation', estimatedSavings: 95, indicativeCost: '£100 - £350' },
        { description: 'Double glazing', estimatedSavings: 80, indicativeCost: '£3,300 - £6,500' },
      ],
      lodgementDate: '2022-03-10',
      transactionType: 'rental',
    },
    {
      address: 'Flat 5, Abbey Park Court',
      postcode: 'LE4 5AQ',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 59,
      potentialScore: 73,
      heatingCostCurrent: 1060,
      heatingCostPotential: 590,
      hotWaterCostCurrent: 255,
      hotWaterCostPotential: 165,
      lightingCostCurrent: 100,
      lightingCostPotential: 56,
      co2Current: 3.5,
      co2Potential: 1.6,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 240, indicativeCost: '£500 - £1,500' },
        { description: 'Upgrade heating controls', estimatedSavings: 105, indicativeCost: '£350 - £450' },
        { description: 'Low energy lighting', estimatedSavings: 44, indicativeCost: '£30 - £80' },
      ],
      lodgementDate: '2023-10-18',
      transactionType: 'rental',
    },
    {
      address: '7 Rushey Mead',
      postcode: 'LE4 7ZE',
      currentRating: 'D',
      potentialRating: 'C',
      currentScore: 64,
      potentialScore: 76,
      heatingCostCurrent: 890,
      heatingCostPotential: 520,
      hotWaterCostCurrent: 225,
      hotWaterCostPotential: 150,
      lightingCostCurrent: 82,
      lightingCostPotential: 48,
      co2Current: 2.9,
      co2Potential: 1.4,
      recommendations: [
        { description: 'Cavity wall insulation', estimatedSavings: 195, indicativeCost: '£500 - £1,500' },
        { description: 'Loft insulation top-up', estimatedSavings: 70, indicativeCost: '£100 - £350' },
        { description: 'Solar water heating', estimatedSavings: 45, indicativeCost: '£4,000 - £6,000' },
      ],
      lodgementDate: '2024-02-28',
      transactionType: 'rental',
    },
  ],
};

/**
 * Returns simulated EPC data for a given postcode prefix.
 * Covers SE15, SE1, SE13, SE6, SE24 (London), CT20, CT19 (Kent), LE2, LE4 (Leicester).
 */
export function getEpcDataForPostcode(postcode: string): EpcData[] {
  // Normalise: strip spaces and match on prefix
  const normalised = postcode.replace(/\s+/g, '').toUpperCase();
  for (const [prefix, records] of Object.entries(epcDatabase)) {
    if (normalised.startsWith(prefix.replace(/\s+/g, ''))) {
      return records;
    }
  }
  return [];
}

// ---- Index of Multiple Deprivation (IMD) Data ----

export interface ImdData {
  lsoa: string;
  localAuthority: string;
  imdScore: number; // 0-100, higher = more deprived
  imdDecile: number; // 1-10, 1 = most deprived
  incomeDeprivation: number; // percentage
  employmentDeprivation: number;
  educationDeprivation: number;
  healthDeprivation: number;
  crimeDeprivation: number;
  livingEnvironmentDeprivation: number;
  barrierToHousingDeprivation: number;
  childPoverty: number; // percentage
}

const imdDatabase: Record<string, ImdData> = {
  southwark: {
    lsoa: 'Southwark 020A',
    localAuthority: 'London Borough of Southwark',
    imdScore: 38.2,
    imdDecile: 3,
    incomeDeprivation: 22.4,
    employmentDeprivation: 14.8,
    educationDeprivation: 18.5,
    healthDeprivation: 1.2,
    crimeDeprivation: 1.8,
    livingEnvironmentDeprivation: 42.6,
    barrierToHousingDeprivation: 48.2,
    childPoverty: 31.5,
  },
  lewisham: {
    lsoa: 'Lewisham 015B',
    localAuthority: 'London Borough of Lewisham',
    imdScore: 35.8,
    imdDecile: 3,
    incomeDeprivation: 20.6,
    employmentDeprivation: 13.9,
    educationDeprivation: 15.2,
    healthDeprivation: 0.9,
    crimeDeprivation: 1.5,
    livingEnvironmentDeprivation: 38.4,
    barrierToHousingDeprivation: 45.8,
    childPoverty: 29.8,
  },
  lambeth: {
    lsoa: 'Lambeth 023C',
    localAuthority: 'London Borough of Lambeth',
    imdScore: 30.4,
    imdDecile: 4,
    incomeDeprivation: 18.2,
    employmentDeprivation: 12.1,
    educationDeprivation: 12.8,
    healthDeprivation: 0.7,
    crimeDeprivation: 1.6,
    livingEnvironmentDeprivation: 35.2,
    barrierToHousingDeprivation: 44.1,
    childPoverty: 26.2,
  },
  'kent-coastal': {
    lsoa: 'Shepway 006D',
    localAuthority: 'Folkestone & Hythe District',
    imdScore: 28.6,
    imdDecile: 4,
    incomeDeprivation: 16.8,
    employmentDeprivation: 12.5,
    educationDeprivation: 22.4,
    healthDeprivation: 1.1,
    crimeDeprivation: 0.9,
    livingEnvironmentDeprivation: 32.8,
    barrierToHousingDeprivation: 26.5,
    childPoverty: 24.8,
  },
  leicester: {
    lsoa: 'Leicester 024E',
    localAuthority: 'Leicester City',
    imdScore: 34.2,
    imdDecile: 3,
    incomeDeprivation: 21.8,
    employmentDeprivation: 15.2,
    educationDeprivation: 20.6,
    healthDeprivation: 1.0,
    crimeDeprivation: 1.3,
    livingEnvironmentDeprivation: 30.5,
    barrierToHousingDeprivation: 22.8,
    childPoverty: 33.2,
  },
};

/**
 * Returns IMD data for a given local authority ID.
 * Covers southwark, lewisham, lambeth, kent-coastal, leicester.
 */
export function getImdDataForArea(localAuthorityId: string): ImdData {
  return (
    imdDatabase[localAuthorityId] ?? {
      lsoa: 'Unknown',
      localAuthority: 'Unknown',
      imdScore: 0,
      imdDecile: 5,
      incomeDeprivation: 0,
      employmentDeprivation: 0,
      educationDeprivation: 0,
      healthDeprivation: 0,
      crimeDeprivation: 0,
      livingEnvironmentDeprivation: 0,
      barrierToHousingDeprivation: 0,
      childPoverty: 0,
    }
  );
}

// ---- Housing Market Data (data.london.gov.uk style) ----

export interface HousingMarketData {
  area: string;
  averageHousePrice: number;
  annualPriceChange: number; // percentage
  medianRentPcm: { studio: number; oneBed: number; twoBed: number; threeBed: number };
  affordabilityRatio: number; // house price / earnings
  newBuildCompletions: number; // annual
  rightToBuyApplications: number;
  homelessnessAcceptances: number;
  socialHousingWaitlist: number;
}

const housingMarketDatabase: Record<string, HousingMarketData> = {
  southwark: {
    area: 'London Borough of Southwark',
    averageHousePrice: 548000,
    annualPriceChange: 2.8,
    medianRentPcm: { studio: 1350, oneBed: 1580, twoBed: 1920, threeBed: 2450 },
    affordabilityRatio: 14.2,
    newBuildCompletions: 1842,
    rightToBuyApplications: 128,
    homelessnessAcceptances: 1456,
    socialHousingWaitlist: 14800,
  },
  lewisham: {
    area: 'London Borough of Lewisham',
    averageHousePrice: 468000,
    annualPriceChange: 3.1,
    medianRentPcm: { studio: 1180, oneBed: 1380, twoBed: 1680, threeBed: 2150 },
    affordabilityRatio: 12.8,
    newBuildCompletions: 1245,
    rightToBuyApplications: 95,
    homelessnessAcceptances: 1284,
    socialHousingWaitlist: 11200,
  },
  lambeth: {
    area: 'London Borough of Lambeth',
    averageHousePrice: 572000,
    annualPriceChange: 2.4,
    medianRentPcm: { studio: 1400, oneBed: 1620, twoBed: 1980, threeBed: 2520 },
    affordabilityRatio: 14.8,
    newBuildCompletions: 1680,
    rightToBuyApplications: 112,
    homelessnessAcceptances: 1580,
    socialHousingWaitlist: 13500,
  },
  'kent-coastal': {
    area: 'Folkestone & Hythe District',
    averageHousePrice: 298000,
    annualPriceChange: 1.2,
    medianRentPcm: { studio: 650, oneBed: 780, twoBed: 950, threeBed: 1180 },
    affordabilityRatio: 9.4,
    newBuildCompletions: 385,
    rightToBuyApplications: 34,
    homelessnessAcceptances: 245,
    socialHousingWaitlist: 2800,
  },
  leicester: {
    area: 'Leicester City',
    averageHousePrice: 218000,
    annualPriceChange: 3.6,
    medianRentPcm: { studio: 525, oneBed: 650, twoBed: 795, threeBed: 950 },
    affordabilityRatio: 7.8,
    newBuildCompletions: 620,
    rightToBuyApplications: 48,
    homelessnessAcceptances: 680,
    socialHousingWaitlist: 6400,
  },
};

/**
 * Returns housing market data for a given local authority ID.
 * Realistic 2025-2026 data for London/SE/Midlands.
 */
export function getHousingMarketData(localAuthorityId: string): HousingMarketData {
  return (
    housingMarketDatabase[localAuthorityId] ?? {
      area: 'Unknown',
      averageHousePrice: 0,
      annualPriceChange: 0,
      medianRentPcm: { studio: 0, oneBed: 0, twoBed: 0, threeBed: 0 },
      affordabilityRatio: 0,
      newBuildCompletions: 0,
      rightToBuyApplications: 0,
      homelessnessAcceptances: 0,
      socialHousingWaitlist: 0,
    }
  );
}

// ---- Weather & Damp Risk Data ----

export interface WeatherRiskData {
  area: string;
  rainfallMm30Day: number;
  avgHumidity: number; // percentage
  avgTemp: number; // celsius
  dampRiskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  floodRiskZone: 'zone-1' | 'zone-2' | 'zone-3a' | 'zone-3b';
  condensationRisk: 'low' | 'moderate' | 'high';
  forecast7Day: { date: string; rainfall: number; humidity: number; temp: number }[];
}

const weatherDatabase: Record<string, WeatherRiskData> = {
  london: {
    area: 'Greater London',
    rainfallMm30Day: 62,
    avgHumidity: 84,
    avgTemp: 5.8,
    dampRiskLevel: 'high',
    floodRiskZone: 'zone-2',
    condensationRisk: 'high',
    forecast7Day: [
      { date: '2026-02-08', rainfall: 4.2, humidity: 88, temp: 5.2 },
      { date: '2026-02-09', rainfall: 6.8, humidity: 91, temp: 4.8 },
      { date: '2026-02-10', rainfall: 1.2, humidity: 82, temp: 6.1 },
      { date: '2026-02-11', rainfall: 0.0, humidity: 78, temp: 7.2 },
      { date: '2026-02-12', rainfall: 8.5, humidity: 92, temp: 5.5 },
      { date: '2026-02-13', rainfall: 3.4, humidity: 86, temp: 5.0 },
      { date: '2026-02-14', rainfall: 5.6, humidity: 89, temp: 4.6 },
    ],
  },
  'south-east': {
    area: 'Kent Coast',
    rainfallMm30Day: 72,
    avgHumidity: 87,
    avgTemp: 5.2,
    dampRiskLevel: 'very-high',
    floodRiskZone: 'zone-3a',
    condensationRisk: 'high',
    forecast7Day: [
      { date: '2026-02-08', rainfall: 5.8, humidity: 90, temp: 4.8 },
      { date: '2026-02-09', rainfall: 9.2, humidity: 93, temp: 4.2 },
      { date: '2026-02-10', rainfall: 2.4, humidity: 85, temp: 5.5 },
      { date: '2026-02-11', rainfall: 0.6, humidity: 81, temp: 6.8 },
      { date: '2026-02-12', rainfall: 11.2, humidity: 95, temp: 4.9 },
      { date: '2026-02-13', rainfall: 7.4, humidity: 91, temp: 4.4 },
      { date: '2026-02-14', rainfall: 4.8, humidity: 88, temp: 4.1 },
    ],
  },
  'east-midlands': {
    area: 'East Midlands (Leicester)',
    rainfallMm30Day: 48,
    avgHumidity: 79,
    avgTemp: 3.8,
    dampRiskLevel: 'moderate',
    floodRiskZone: 'zone-1',
    condensationRisk: 'moderate',
    forecast7Day: [
      { date: '2026-02-08', rainfall: 1.8, humidity: 80, temp: 3.2 },
      { date: '2026-02-09', rainfall: 3.2, humidity: 83, temp: 2.8 },
      { date: '2026-02-10', rainfall: 0.0, humidity: 75, temp: 4.5 },
      { date: '2026-02-11', rainfall: 0.0, humidity: 72, temp: 5.1 },
      { date: '2026-02-12', rainfall: 5.4, humidity: 85, temp: 3.5 },
      { date: '2026-02-13', rainfall: 2.1, humidity: 81, temp: 3.0 },
      { date: '2026-02-14', rainfall: 0.4, humidity: 77, temp: 2.4 },
    ],
  },
};

/**
 * Returns weather and damp risk data for a given region ID.
 * February 2026 UK weather — London/SE wet, East Midlands colder and drier.
 */
export function getWeatherRiskData(regionId: string): WeatherRiskData {
  return (
    weatherDatabase[regionId] ?? {
      area: 'Unknown',
      rainfallMm30Day: 0,
      avgHumidity: 0,
      avgTemp: 0,
      dampRiskLevel: 'low' as const,
      floodRiskZone: 'zone-1' as const,
      condensationRisk: 'low' as const,
      forecast7Day: [],
    }
  );
}

// ---- Area Intelligence Summary ----

export interface AreaIntelligence {
  localAuthorityId: string;
  riskFactors: { factor: string; severity: 'low' | 'medium' | 'high'; description: string }[];
  opportunities: { description: string; potentialSaving: string }[];
  regulatoryAlerts: { alert: string; deadline: string; impact: string }[];
  benchmarks: { metric: string; ourValue: number; sectorAverage: number; topQuartile: number }[];
  historicalTrends: { metric: string; values: { period: string; value: number }[] }[];
}

const areaIntelligenceDatabase: Record<string, AreaIntelligence> = {
  southwark: {
    localAuthorityId: 'southwark',
    riskFactors: [
      {
        factor: 'High-rise concrete panel stock',
        severity: 'high',
        description:
          'High-rise concrete panel stock requiring cladding assessment. Oak Tower (12-storey, 1964) classified as higher-risk building under Building Safety Act.',
      },
      {
        factor: 'Damp and mould prevalence',
        severity: 'high',
        description:
          'Above-average damp/mould rates in 1960s blocks. 5 active damp cases on Oak Park Estate alone; thermal bridging at concrete panel joints is primary driver.',
      },
      {
        factor: 'Asbestos management burden',
        severity: 'medium',
        description:
          'Oak Park Estate has 27 identified ACMs across 3 blocks. Ongoing management costs estimated at £35,000/year; refurbishment works require R&D surveys.',
      },
      {
        factor: 'Ageing boiler stock',
        severity: 'medium',
        description:
          '38% of boilers in Oak Park pre-date 2015 with efficiency below 85%. Increasing breakdown frequency during winter months drives emergency repair costs.',
      },
    ],
    opportunities: [
      {
        description: 'Retrofit to EPC C could save £45,000/year in energy costs across portfolio',
        potentialSaving: '£45,000/year',
      },
      {
        description: 'SHDF Wave 3 funding available for external wall insulation on Oak Park concrete panels',
        potentialSaving: '£1.2M grant (covers 67% of project cost)',
      },
      {
        description: 'Consolidate boiler replacements into planned programme — bulk procurement saving vs reactive',
        potentialSaving: '£180,000 over 3 years',
      },
      {
        description: 'Smart thermostat rollout to reduce heating waste and support vulnerable tenants',
        potentialSaving: '£22,000/year + reduced damp complaints',
      },
    ],
    regulatoryAlerts: [
      {
        alert: 'Building Safety Act: 4 higher-risk buildings require safety case submission by March 2026',
        deadline: '2026-03-31',
        impact: 'Oak Tower & Riverside North/South classified as higher-risk (7+ storeys). Safety case reports must be submitted to BSR. Non-compliance risks enforcement notice.',
      },
      {
        alert: "Awaab's Law: 14-day response for damp/mould hazards from October 2025",
        deadline: '2025-10-01',
        impact: '5 active damp cases require compliance with new fixed timescales. Investigation within 14 days, repairs started within 7 days of diagnosis.',
      },
      {
        alert: 'EPC C minimum for social housing by 2030 — 68% of Southwark stock currently below C',
        deadline: '2030-12-31',
        impact: 'Approximately 3,536 properties need upgrading. Estimated cost £28M over 5 years at current rates.',
      },
      {
        alert: 'Electrical Safety Standards: 3 overdue EICRs requiring urgent action',
        deadline: '2026-02-28',
        impact: 'Non-compliant properties risk HSE enforcement. Priority access required — 2 properties have known no-access issues.',
      },
    ],
    benchmarks: [
      { metric: 'Void turnaround (days)', ourValue: 22, sectorAverage: 28, topQuartile: 18 },
      { metric: 'Rent collection rate (%)', ourValue: 95.8, sectorAverage: 96.2, topQuartile: 98.5 },
      { metric: 'Repairs completed within SLA (%)', ourValue: 87.2, sectorAverage: 85.0, topQuartile: 92.0 },
      { metric: 'Gas safety compliance (%)', ourValue: 99.1, sectorAverage: 99.5, topQuartile: 99.9 },
      { metric: 'Tenant satisfaction (NPS)', ourValue: 34, sectorAverage: 38, topQuartile: 52 },
      { metric: 'Complaints resolved within 10 days (%)', ourValue: 78.5, sectorAverage: 75.0, topQuartile: 88.0 },
    ],
    historicalTrends: [
      {
        metric: 'Arrears rate (%)',
        values: [
          { period: '2025-03', value: 4.8 },
          { period: '2025-04', value: 4.9 },
          { period: '2025-05', value: 5.1 },
          { period: '2025-06', value: 5.0 },
          { period: '2025-07', value: 4.8 },
          { period: '2025-08', value: 4.6 },
          { period: '2025-09', value: 4.7 },
          { period: '2025-10', value: 5.2 },
          { period: '2025-11', value: 5.5 },
          { period: '2025-12', value: 5.8 },
          { period: '2026-01', value: 5.6 },
          { period: '2026-02', value: 5.4 },
        ],
      },
      {
        metric: 'Void rate (%)',
        values: [
          { period: '2025-03', value: 3.2 },
          { period: '2025-04', value: 3.4 },
          { period: '2025-05', value: 3.1 },
          { period: '2025-06', value: 2.9 },
          { period: '2025-07', value: 3.0 },
          { period: '2025-08', value: 3.3 },
          { period: '2025-09', value: 3.5 },
          { period: '2025-10', value: 3.8 },
          { period: '2025-11', value: 4.0 },
          { period: '2025-12', value: 4.2 },
          { period: '2026-01', value: 3.9 },
          { period: '2026-02', value: 3.8 },
        ],
      },
      {
        metric: 'Repairs backlog (count)',
        values: [
          { period: '2025-03', value: 180 },
          { period: '2025-04', value: 172 },
          { period: '2025-05', value: 158 },
          { period: '2025-06', value: 145 },
          { period: '2025-07', value: 138 },
          { period: '2025-08', value: 150 },
          { period: '2025-09', value: 165 },
          { period: '2025-10', value: 195 },
          { period: '2025-11', value: 218 },
          { period: '2025-12', value: 240 },
          { period: '2026-01', value: 228 },
          { period: '2026-02', value: 215 },
        ],
      },
      {
        metric: 'Complaint rate (per 1000 units)',
        values: [
          { period: '2025-03', value: 5.2 },
          { period: '2025-04', value: 5.5 },
          { period: '2025-05', value: 4.8 },
          { period: '2025-06', value: 4.2 },
          { period: '2025-07', value: 3.8 },
          { period: '2025-08', value: 4.1 },
          { period: '2025-09', value: 4.5 },
          { period: '2025-10', value: 5.8 },
          { period: '2025-11', value: 6.2 },
          { period: '2025-12', value: 6.8 },
          { period: '2026-01', value: 6.5 },
          { period: '2026-02', value: 6.1 },
        ],
      },
    ],
  },

  lewisham: {
    localAuthorityId: 'lewisham',
    riskFactors: [
      {
        factor: 'Victorian/inter-war terraces — solid wall heat loss',
        severity: 'high',
        description:
          'Elm Gardens stock (1930s terraces) has uninsulated solid walls. Average SAP score 58, with several properties rated E. Heat loss drives tenant fuel poverty and damp risk.',
      },
      {
        factor: 'Asbestos in pre-1980 stock',
        severity: 'medium',
        description:
          'Elm Gardens contains 22 ACMs including artex ceilings and boiler flues. Birch Court has 9 ACMs. Refurbishment works require licensed removal adding 15-25% cost uplift.',
      },
      {
        factor: 'Sheltered scheme viability',
        severity: 'medium',
        description:
          'Birch Court sheltered scheme has 93.8% occupancy — below target. Two void bungalows require adaptation investment. Demand for sheltered declining vs supported living.',
      },
      {
        factor: 'Overdue EICR compliance',
        severity: 'high',
        description:
          '1 property (5 Elm Gardens) has expired EICR with 7 observations. Access issues contributing to delay. Regulatory breach risk.',
      },
    ],
    opportunities: [
      {
        description: 'ECO4 funding for solid wall insulation on Elm Gardens terraces',
        potentialSaving: '£380,000 grant funding available',
      },
      {
        description: 'Convert sheltered voids to supported living — better demand and higher rental income',
        potentialSaving: '£18,000/year additional income',
      },
      {
        description: 'Planned boiler replacement programme across Elm Gardens (10 units) — bulk procurement',
        potentialSaving: '£42,000 vs reactive approach',
      },
    ],
    regulatoryAlerts: [
      {
        alert: 'EICR non-compliance: 1 property overdue, 2 approaching expiry within 6 months',
        deadline: '2026-03-01',
        impact: 'HSE enforcement risk. Specialist forced-entry procedure may be required for no-access property.',
      },
      {
        alert: 'Fire Safety (England) Regulations: Elm Gardens terraces require updated fire risk assessments for individual dwellings',
        deadline: '2026-06-30',
        impact: 'HMO-style FRA approach needed for converted properties. Estimated cost £8,000.',
      },
      {
        alert: 'EPC C minimum by 2030: 62% of Lewisham stock below C',
        deadline: '2030-12-31',
        impact: 'Approximately 2,356 properties need upgrading. Solid wall properties most challenging and costly.',
      },
    ],
    benchmarks: [
      { metric: 'Void turnaround (days)', ourValue: 25, sectorAverage: 28, topQuartile: 18 },
      { metric: 'Rent collection rate (%)', ourValue: 96.1, sectorAverage: 96.2, topQuartile: 98.5 },
      { metric: 'Repairs completed within SLA (%)', ourValue: 84.8, sectorAverage: 85.0, topQuartile: 92.0 },
      { metric: 'Gas safety compliance (%)', ourValue: 98.7, sectorAverage: 99.5, topQuartile: 99.9 },
      { metric: 'Tenant satisfaction (NPS)', ourValue: 36, sectorAverage: 38, topQuartile: 52 },
      { metric: 'Complaints resolved within 10 days (%)', ourValue: 72.4, sectorAverage: 75.0, topQuartile: 88.0 },
    ],
    historicalTrends: [
      {
        metric: 'Arrears rate (%)',
        values: [
          { period: '2025-03', value: 4.2 },
          { period: '2025-04', value: 4.3 },
          { period: '2025-05', value: 4.5 },
          { period: '2025-06', value: 4.4 },
          { period: '2025-07', value: 4.2 },
          { period: '2025-08', value: 4.0 },
          { period: '2025-09', value: 4.1 },
          { period: '2025-10', value: 4.6 },
          { period: '2025-11', value: 4.9 },
          { period: '2025-12', value: 5.2 },
          { period: '2026-01', value: 5.0 },
          { period: '2026-02', value: 4.8 },
        ],
      },
      {
        metric: 'Void rate (%)',
        values: [
          { period: '2025-03', value: 2.8 },
          { period: '2025-04', value: 3.0 },
          { period: '2025-05', value: 2.6 },
          { period: '2025-06', value: 2.4 },
          { period: '2025-07', value: 2.5 },
          { period: '2025-08', value: 2.8 },
          { period: '2025-09', value: 3.1 },
          { period: '2025-10', value: 3.4 },
          { period: '2025-11', value: 3.8 },
          { period: '2025-12', value: 4.1 },
          { period: '2026-01', value: 3.6 },
          { period: '2026-02', value: 3.4 },
        ],
      },
      {
        metric: 'Repairs backlog (count)',
        values: [
          { period: '2025-03', value: 85 },
          { period: '2025-04', value: 78 },
          { period: '2025-05', value: 72 },
          { period: '2025-06', value: 65 },
          { period: '2025-07', value: 60 },
          { period: '2025-08', value: 68 },
          { period: '2025-09', value: 75 },
          { period: '2025-10', value: 92 },
          { period: '2025-11', value: 105 },
          { period: '2025-12', value: 118 },
          { period: '2026-01', value: 110 },
          { period: '2026-02', value: 102 },
        ],
      },
      {
        metric: 'Complaint rate (per 1000 units)',
        values: [
          { period: '2025-03', value: 4.8 },
          { period: '2025-04', value: 5.0 },
          { period: '2025-05', value: 4.4 },
          { period: '2025-06', value: 3.9 },
          { period: '2025-07', value: 3.5 },
          { period: '2025-08', value: 3.8 },
          { period: '2025-09', value: 4.2 },
          { period: '2025-10', value: 5.4 },
          { period: '2025-11', value: 5.8 },
          { period: '2025-12', value: 6.2 },
          { period: '2026-01', value: 5.9 },
          { period: '2026-02', value: 5.5 },
        ],
      },
    ],
  },

  lambeth: {
    localAuthorityId: 'lambeth',
    riskFactors: [
      {
        factor: 'Mixed-era stock maintenance complexity',
        severity: 'medium',
        description:
          'Maple Lane comprises 1988 tower and 1992 houses — different construction types requiring different maintenance strategies. Component lifecycles misaligned.',
      },
      {
        factor: 'Rising damp in tower block ground floors',
        severity: 'medium',
        description:
          'Maple Tower ground-floor flats showing elevated damp risk scores (35-45). DPC effectiveness reducing after 35 years. Preventative programme recommended.',
      },
      {
        factor: 'Universal Credit migration impact',
        severity: 'medium',
        description:
          'UC rollout in Lambeth affecting 34% of tenants. Average 5-week wait driving temporary arrears spikes. Direct payment rate from DWP at 22%.',
      },
    ],
    opportunities: [
      {
        description: 'Maple Tower bin store sprinkler installation — reduces insurance premium',
        potentialSaving: '£8,500/year insurance saving',
      },
      {
        description: 'Group re-roofing of Maple Lane houses (12 units) vs individual repairs',
        potentialSaving: '£65,000 saving vs piecemeal approach',
      },
      {
        description: 'Solar PV on Maple Lane house roofs — FiT income and tenant bill reduction',
        potentialSaving: '£12,000/year income + £180/year per tenant',
      },
    ],
    regulatoryAlerts: [
      {
        alert: 'Consumer Standards (RSH): Annual self-assessment due by September 2026',
        deadline: '2026-09-30',
        impact: 'Requires evidence of compliance across Safety & Quality, Transparency, Neighbourhood & Community, and Tenancy standards.',
      },
      {
        alert: 'Smoke and Carbon Monoxide Alarm Regulations: Annual checks required',
        deadline: '2026-04-01',
        impact: 'All properties must have working smoke alarms on each storey and CO alarms in rooms with fixed combustion appliances. 4 properties due re-check.',
      },
    ],
    benchmarks: [
      { metric: 'Void turnaround (days)', ourValue: 20, sectorAverage: 28, topQuartile: 18 },
      { metric: 'Rent collection rate (%)', ourValue: 96.4, sectorAverage: 96.2, topQuartile: 98.5 },
      { metric: 'Repairs completed within SLA (%)', ourValue: 88.5, sectorAverage: 85.0, topQuartile: 92.0 },
      { metric: 'Gas safety compliance (%)', ourValue: 99.6, sectorAverage: 99.5, topQuartile: 99.9 },
      { metric: 'Tenant satisfaction (NPS)', ourValue: 42, sectorAverage: 38, topQuartile: 52 },
      { metric: 'Complaints resolved within 10 days (%)', ourValue: 81.2, sectorAverage: 75.0, topQuartile: 88.0 },
    ],
    historicalTrends: [
      {
        metric: 'Arrears rate (%)',
        values: [
          { period: '2025-03', value: 3.6 },
          { period: '2025-04', value: 3.8 },
          { period: '2025-05', value: 3.9 },
          { period: '2025-06', value: 3.7 },
          { period: '2025-07', value: 3.5 },
          { period: '2025-08', value: 3.4 },
          { period: '2025-09', value: 3.6 },
          { period: '2025-10', value: 4.0 },
          { period: '2025-11', value: 4.3 },
          { period: '2025-12', value: 4.6 },
          { period: '2026-01', value: 4.4 },
          { period: '2026-02', value: 4.2 },
        ],
      },
      {
        metric: 'Void rate (%)',
        values: [
          { period: '2025-03', value: 2.4 },
          { period: '2025-04', value: 2.6 },
          { period: '2025-05', value: 2.2 },
          { period: '2025-06', value: 2.0 },
          { period: '2025-07', value: 2.1 },
          { period: '2025-08', value: 2.4 },
          { period: '2025-09', value: 2.8 },
          { period: '2025-10', value: 3.0 },
          { period: '2025-11', value: 3.2 },
          { period: '2025-12', value: 3.4 },
          { period: '2026-01', value: 3.1 },
          { period: '2026-02', value: 2.9 },
        ],
      },
      {
        metric: 'Repairs backlog (count)',
        values: [
          { period: '2025-03', value: 52 },
          { period: '2025-04', value: 48 },
          { period: '2025-05', value: 42 },
          { period: '2025-06', value: 38 },
          { period: '2025-07', value: 35 },
          { period: '2025-08', value: 40 },
          { period: '2025-09', value: 48 },
          { period: '2025-10', value: 58 },
          { period: '2025-11', value: 68 },
          { period: '2025-12', value: 75 },
          { period: '2026-01', value: 70 },
          { period: '2026-02', value: 65 },
        ],
      },
      {
        metric: 'Complaint rate (per 1000 units)',
        values: [
          { period: '2025-03', value: 3.8 },
          { period: '2025-04', value: 4.0 },
          { period: '2025-05', value: 3.5 },
          { period: '2025-06', value: 3.1 },
          { period: '2025-07', value: 2.8 },
          { period: '2025-08', value: 3.0 },
          { period: '2025-09', value: 3.4 },
          { period: '2025-10', value: 4.2 },
          { period: '2025-11', value: 4.6 },
          { period: '2025-12', value: 5.0 },
          { period: '2026-01', value: 4.8 },
          { period: '2026-02', value: 4.5 },
        ],
      },
    ],
  },

  'kent-coastal': {
    localAuthorityId: 'kent-coastal',
    riskFactors: [
      {
        factor: 'Coastal exposure accelerating building deterioration',
        severity: 'high',
        description:
          'Salt-laden air and driving rain causing accelerated degradation of pointing, render, and metalwork. Maintenance cycle 30% shorter than inland equivalents. External decoration programme chronically underfunded.',
      },
      {
        factor: 'Seasonal population affecting anti-social behaviour patterns',
        severity: 'medium',
        description:
          'Holiday lets and seasonal workers create transient population. ASB spikes in summer months with 40% increase in noise complaints May-September. Reduced community cohesion.',
      },
      {
        factor: 'Fuel poverty in poorly insulated coastal stock',
        severity: 'high',
        description:
          '42% of stock rated E or below. Average EPC score 48. Coastal wind chill increases effective heating demand by 15-20% vs sheltered inland properties. Estimated 35% of tenants in fuel poverty.',
      },
      {
        factor: 'Flood and coastal erosion risk',
        severity: 'medium',
        description:
          '12 properties in Flood Zone 3a. Coastal erosion monitoring shows 0.3m/year retreat at eastern boundary. Insurance costs increasing 8% annually.',
      },
    ],
    opportunities: [
      {
        description: 'HUG2 (Home Upgrade Grant) funding for off-gas-grid coastal properties',
        potentialSaving: '£420,000 available for heat pump installations',
      },
      {
        description: 'Coastal Communities Fund bid for external improvement works',
        potentialSaving: '£180,000 grant towards render and window upgrades',
      },
      {
        description: 'Bulk marine-grade window replacement programme (28 units)',
        potentialSaving: '£35,000 saving vs individual replacements',
      },
    ],
    regulatoryAlerts: [
      {
        alert: 'Flood Re scheme review: properties in Zone 3a may face increased premiums from 2027',
        deadline: '2027-04-01',
        impact: 'Annual insurance costs for 12 at-risk properties could increase by £18,000 total. Flood resilience measures should be prioritised.',
      },
      {
        alert: 'EPC C minimum by 2030: 78% of Kent Coastal stock below C',
        deadline: '2030-12-31',
        impact: 'Approximately 661 properties need upgrading. Coastal conditions make external insulation more complex and expensive. Estimated £6.2M programme.',
      },
      {
        alert: 'HHSRS assessments: Excess cold hazard in 15 F-rated properties requires action',
        deadline: '2026-06-30',
        impact: 'Category 1 hazard under Housing Act 2004. LA enforcement risk if not addressed. Heating and insulation improvements required.',
      },
    ],
    benchmarks: [
      { metric: 'Void turnaround (days)', ourValue: 32, sectorAverage: 28, topQuartile: 18 },
      { metric: 'Rent collection rate (%)', ourValue: 94.8, sectorAverage: 96.2, topQuartile: 98.5 },
      { metric: 'Repairs completed within SLA (%)', ourValue: 81.5, sectorAverage: 85.0, topQuartile: 92.0 },
      { metric: 'Gas safety compliance (%)', ourValue: 99.2, sectorAverage: 99.5, topQuartile: 99.9 },
      { metric: 'Tenant satisfaction (NPS)', ourValue: 30, sectorAverage: 38, topQuartile: 52 },
      { metric: 'Complaints resolved within 10 days (%)', ourValue: 68.5, sectorAverage: 75.0, topQuartile: 88.0 },
    ],
    historicalTrends: [
      {
        metric: 'Arrears rate (%)',
        values: [
          { period: '2025-03', value: 5.8 },
          { period: '2025-04', value: 5.6 },
          { period: '2025-05', value: 5.2 },
          { period: '2025-06', value: 4.8 },
          { period: '2025-07', value: 4.5 },
          { period: '2025-08', value: 4.6 },
          { period: '2025-09', value: 5.0 },
          { period: '2025-10', value: 5.5 },
          { period: '2025-11', value: 6.0 },
          { period: '2025-12', value: 6.4 },
          { period: '2026-01', value: 6.2 },
          { period: '2026-02', value: 5.9 },
        ],
      },
      {
        metric: 'Void rate (%)',
        values: [
          { period: '2025-03', value: 3.5 },
          { period: '2025-04', value: 3.2 },
          { period: '2025-05', value: 2.8 },
          { period: '2025-06', value: 2.5 },
          { period: '2025-07', value: 2.2 },
          { period: '2025-08', value: 2.4 },
          { period: '2025-09', value: 2.8 },
          { period: '2025-10', value: 3.2 },
          { period: '2025-11', value: 3.6 },
          { period: '2025-12', value: 4.0 },
          { period: '2026-01', value: 3.8 },
          { period: '2026-02', value: 3.5 },
        ],
      },
      {
        metric: 'Repairs backlog (count)',
        values: [
          { period: '2025-03', value: 28 },
          { period: '2025-04', value: 25 },
          { period: '2025-05', value: 22 },
          { period: '2025-06', value: 18 },
          { period: '2025-07', value: 20 },
          { period: '2025-08', value: 24 },
          { period: '2025-09', value: 28 },
          { period: '2025-10', value: 35 },
          { period: '2025-11', value: 42 },
          { period: '2025-12', value: 48 },
          { period: '2026-01', value: 45 },
          { period: '2026-02', value: 40 },
        ],
      },
      {
        metric: 'Complaint rate (per 1000 units)',
        values: [
          { period: '2025-03', value: 6.2 },
          { period: '2025-04', value: 5.8 },
          { period: '2025-05', value: 5.5 },
          { period: '2025-06', value: 6.8 },
          { period: '2025-07', value: 7.5 },
          { period: '2025-08', value: 7.2 },
          { period: '2025-09', value: 6.0 },
          { period: '2025-10', value: 5.8 },
          { period: '2025-11', value: 6.5 },
          { period: '2025-12', value: 7.0 },
          { period: '2026-01', value: 6.8 },
          { period: '2026-02', value: 6.4 },
        ],
      },
    ],
  },

  leicester: {
    localAuthorityId: 'leicester',
    riskFactors: [
      {
        factor: 'Above-average fuel poverty in older stock',
        severity: 'high',
        description:
          'Leicester has 18.4% fuel poverty rate (vs 13.2% national average). Victorian terraces with solid walls and single glazing driving high heating costs. Average tenant energy spend £1,450/year — 40% above social housing median.',
      },
      {
        factor: 'Rising UC migration affecting payment patterns',
        severity: 'high',
        description:
          'UC full service rollout complete. 48% of tenants now on UC (up from 32% two years ago). Average 5-week wait creating predictable arrears spikes. Direct payment requests at 28% — above regional average.',
      },
      {
        factor: 'HMO conversion pressure in surrounding area',
        severity: 'medium',
        description:
          'Student and private rental HMO conversions encroaching on estate boundaries. Increased fly-tipping, parking pressure, and transient population affecting community stability.',
      },
      {
        factor: 'Cold weather vulnerability',
        severity: 'medium',
        description:
          'East Midlands experiences colder winters than London. 12 more frost days per year on average. Pipe burst risk elevated in properties with poor insulation. 3 burst incidents in Jan 2026 alone.',
      },
    ],
    opportunities: [
      {
        description: 'Midlands Net Zero Hub retrofit funding — Leicester priority area',
        potentialSaving: '£290,000 grant for whole-house retrofit pilot (20 units)',
      },
      {
        description: 'Leicester City Council partnership for area-based insulation scheme',
        potentialSaving: '£145,000 in shared procurement costs',
      },
      {
        description: 'Pre-payment meter to smart meter conversion programme — reduces self-disconnection',
        potentialSaving: '£8,200/year in reduced emergency top-ups and debt recovery costs',
      },
      {
        description: 'UC alternative payment arrangement proactive setup — reduce arrears spike duration',
        potentialSaving: '£24,000/year in reduced bad debt provision',
      },
    ],
    regulatoryAlerts: [
      {
        alert: 'Decent Homes 2: New standard expected to require EPC C and address damp/mould proactively',
        deadline: '2026-12-31',
        impact: 'Consultation response due. Estimated 72% of Leicester stock will need works under new standard. Forward planning essential.',
      },
      {
        alert: "Awaab's Law implementation: Leicester stock has 8 open damp cases requiring triage",
        deadline: '2025-10-01',
        impact: 'New fixed timescales apply. Cold, poorly insulated stock at higher risk. Proactive survey programme recommended for worst-performing properties.',
      },
      {
        alert: 'Gas boiler replacement ban for social housing from 2035 — forward planning required',
        deadline: '2035-01-01',
        impact: '85% of Leicester stock is gas-heated. Heat pump suitability assessments needed. Fabric-first approach essential before heating system changes.',
      },
    ],
    benchmarks: [
      { metric: 'Void turnaround (days)', ourValue: 19, sectorAverage: 28, topQuartile: 18 },
      { metric: 'Rent collection rate (%)', ourValue: 95.2, sectorAverage: 96.2, topQuartile: 98.5 },
      { metric: 'Repairs completed within SLA (%)', ourValue: 86.8, sectorAverage: 85.0, topQuartile: 92.0 },
      { metric: 'Gas safety compliance (%)', ourValue: 99.4, sectorAverage: 99.5, topQuartile: 99.9 },
      { metric: 'Tenant satisfaction (NPS)', ourValue: 40, sectorAverage: 38, topQuartile: 52 },
      { metric: 'Complaints resolved within 10 days (%)', ourValue: 76.8, sectorAverage: 75.0, topQuartile: 88.0 },
    ],
    historicalTrends: [
      {
        metric: 'Arrears rate (%)',
        values: [
          { period: '2025-03', value: 5.2 },
          { period: '2025-04', value: 5.4 },
          { period: '2025-05', value: 5.6 },
          { period: '2025-06', value: 5.3 },
          { period: '2025-07', value: 5.0 },
          { period: '2025-08', value: 4.8 },
          { period: '2025-09', value: 5.1 },
          { period: '2025-10', value: 5.8 },
          { period: '2025-11', value: 6.2 },
          { period: '2025-12', value: 6.6 },
          { period: '2026-01', value: 6.4 },
          { period: '2026-02', value: 6.1 },
        ],
      },
      {
        metric: 'Void rate (%)',
        values: [
          { period: '2025-03', value: 2.2 },
          { period: '2025-04', value: 2.4 },
          { period: '2025-05', value: 2.0 },
          { period: '2025-06', value: 1.8 },
          { period: '2025-07', value: 1.6 },
          { period: '2025-08', value: 1.8 },
          { period: '2025-09', value: 2.0 },
          { period: '2025-10', value: 2.4 },
          { period: '2025-11', value: 2.8 },
          { period: '2025-12', value: 3.2 },
          { period: '2026-01', value: 2.8 },
          { period: '2026-02', value: 2.5 },
        ],
      },
      {
        metric: 'Repairs backlog (count)',
        values: [
          { period: '2025-03', value: 22 },
          { period: '2025-04', value: 20 },
          { period: '2025-05', value: 18 },
          { period: '2025-06', value: 15 },
          { period: '2025-07', value: 14 },
          { period: '2025-08', value: 16 },
          { period: '2025-09', value: 20 },
          { period: '2025-10', value: 28 },
          { period: '2025-11', value: 35 },
          { period: '2025-12', value: 42 },
          { period: '2026-01', value: 38 },
          { period: '2026-02', value: 32 },
        ],
      },
      {
        metric: 'Complaint rate (per 1000 units)',
        values: [
          { period: '2025-03', value: 4.5 },
          { period: '2025-04', value: 4.8 },
          { period: '2025-05', value: 4.2 },
          { period: '2025-06', value: 3.8 },
          { period: '2025-07', value: 3.5 },
          { period: '2025-08', value: 3.6 },
          { period: '2025-09', value: 4.0 },
          { period: '2025-10', value: 4.8 },
          { period: '2025-11', value: 5.2 },
          { period: '2025-12', value: 5.8 },
          { period: '2026-01', value: 5.5 },
          { period: '2026-02', value: 5.2 },
        ],
      },
    ],
  },
};

/**
 * Returns rich area intelligence for a given local authority ID.
 * Includes risk factors, opportunities, regulatory alerts, benchmarks, and historical trends.
 */
export function getAreaIntelligence(localAuthorityId: string): AreaIntelligence {
  return (
    areaIntelligenceDatabase[localAuthorityId] ?? {
      localAuthorityId,
      riskFactors: [],
      opportunities: [],
      regulatoryAlerts: [],
      benchmarks: [],
      historicalTrends: [],
    }
  );
}
