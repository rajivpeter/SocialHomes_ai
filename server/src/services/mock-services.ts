// ============================================================
// SocialHomes.Ai — Mock Service Endpoints
// Simulated endpoints for Tier 3 services not yet integrated:
// DWP Universal Credit, IoT Sensors, GoCardless, NOMIS.
// These provide realistic responses for demo/development.
// ============================================================

// ── DWP Universal Credit (simulated) ──
export interface UcVerification {
  tenantId: string;
  nino: string;
  ucStatus: 'active' | 'pending' | 'transitioning' | 'not-applicable' | 'managed-payment';
  monthlyAmount: number;
  housingElement: number;
  paymentDate: string;
  directPaymentToLandlord: boolean;
  lastVerified: string;
}

export function mockUcVerification(tenantId: string): UcVerification {
  const statuses: UcVerification['ucStatus'][] = ['active', 'pending', 'transitioning', 'managed-payment', 'not-applicable'];
  const status = statuses[Math.abs(hashCode(tenantId)) % statuses.length];
  const isActive = status === 'active' || status === 'managed-payment';

  return {
    tenantId,
    nino: `QQ${String(Math.abs(hashCode(tenantId)) % 1000000).padStart(6, '0')}C`,
    ucStatus: status,
    monthlyAmount: isActive ? 300 + Math.round(Math.abs(hashCode(tenantId + 'amt')) % 800) : 0,
    housingElement: isActive ? 400 + Math.round(Math.abs(hashCode(tenantId + 'he')) % 600) : 0,
    paymentDate: isActive ? `2026-03-${String(7 + Math.abs(hashCode(tenantId + 'pd')) % 21).padStart(2, '0')}` : '',
    directPaymentToLandlord: status === 'managed-payment',
    lastVerified: new Date().toISOString(),
  };
}

// ── IoT Sensor Data (simulated) ──
export interface IoTSensorReading {
  propertyId: string;
  sensorId: string;
  location: string;
  readings: {
    temperature: number;
    humidity: number;
    dewPoint: number;
    co2Level: number;
    pressure: number;
  };
  alerts: { type: string; severity: 'info' | 'warning' | 'critical'; message: string }[];
  batteryLevel: number;
  lastReading: string;
}

export function mockIoTSensorData(propertyId: string): IoTSensorReading[] {
  const seed = Math.abs(hashCode(propertyId));
  const numSensors = 2 + (seed % 3);
  const locations = ['Living Room', 'Bedroom 1', 'Bedroom 2', 'Kitchen', 'Bathroom'];

  return Array.from({ length: numSensors }, (_, i) => {
    const locSeed = Math.abs(hashCode(propertyId + i));
    const temp = 16 + (locSeed % 8);
    const humidity = 45 + (locSeed % 40);
    const dewPoint = temp - 4 - (locSeed % 8);
    const co2 = 400 + (locSeed % 600);

    const alerts: IoTSensorReading['alerts'] = [];
    if (humidity > 70) alerts.push({ type: 'high-humidity', severity: 'warning', message: `Humidity at ${humidity}% — ventilation needed` });
    if (humidity > 85) alerts.push({ type: 'critical-humidity', severity: 'critical', message: `Humidity at ${humidity}% — mould growth risk` });
    if (temp < 18) alerts.push({ type: 'low-temperature', severity: 'info', message: `Temperature ${temp}°C — below recommended 18°C` });
    if (co2 > 800) alerts.push({ type: 'high-co2', severity: 'warning', message: `CO2 at ${co2}ppm — room needs ventilation` });

    return {
      propertyId,
      sensorId: `SENSOR-${propertyId.slice(-4)}-${i + 1}`,
      location: locations[i % locations.length],
      readings: {
        temperature: temp,
        humidity,
        dewPoint,
        co2Level: co2,
        pressure: 1010 + (locSeed % 20),
      },
      alerts,
      batteryLevel: 60 + (locSeed % 40),
      lastReading: new Date(Date.now() - (locSeed % 3600) * 1000).toISOString(),
    };
  });
}

// ── GoCardless Direct Debit (simulated) ──
export interface DirectDebitMandate {
  tenantId: string;
  mandateId: string;
  status: 'active' | 'pending' | 'cancelled' | 'failed';
  accountName: string;
  sortCode: string;
  accountNumberLast4: string;
  amount: number;
  frequency: 'weekly' | 'fortnightly' | 'monthly';
  nextPaymentDate: string;
  createdAt: string;
}

export function mockGoCardlessMandate(tenantId: string, weeklyRent: number): DirectDebitMandate {
  const seed = Math.abs(hashCode(tenantId));
  const statuses: DirectDebitMandate['status'][] = ['active', 'active', 'active', 'pending', 'cancelled'];
  const frequencies: DirectDebitMandate['frequency'][] = ['monthly', 'weekly', 'fortnightly'];

  const freq = frequencies[seed % frequencies.length];
  const amount = freq === 'monthly' ? weeklyRent * 4.33 : freq === 'fortnightly' ? weeklyRent * 2 : weeklyRent;

  return {
    tenantId,
    mandateId: `MD-${String(seed % 100000).padStart(5, '0')}`,
    status: statuses[seed % statuses.length],
    accountName: 'Mr/Mrs Tenant',
    sortCode: `${String(10 + seed % 90).padStart(2, '0')}-${String(seed % 100).padStart(2, '0')}-${String(seed % 100).padStart(2, '0')}`,
    accountNumberLast4: String(seed % 10000).padStart(4, '0'),
    amount: Math.round(amount * 100) / 100,
    frequency: freq,
    nextPaymentDate: `2026-03-${String(1 + seed % 28).padStart(2, '0')}`,
    createdAt: '2025-06-15T00:00:00.000Z',
  };
}

// ── NOMIS Labour Market (simulated) ──
export interface NomisLMIData {
  lsoaCode: string;
  economicActivity: {
    employmentRate: number;
    unemploymentRate: number;
    economicInactivityRate: number;
  };
  occupations: { name: string; percentage: number }[];
  averageWeeklyEarnings: number;
  benefitClaimants: {
    jsaRate: number;
    ucRate: number;
    esaRate: number;
  };
  qualifications: {
    noQualifications: number;
    level1: number;
    level2: number;
    level3: number;
    level4Plus: number;
  };
  lastUpdated: string;
}

export function mockNomisData(lsoaCode: string): NomisLMIData {
  const seed = Math.abs(hashCode(lsoaCode));
  const deprivation = (seed % 10) / 10; // 0-1 proxy for deprivation

  return {
    lsoaCode,
    economicActivity: {
      employmentRate: Math.round((75 - deprivation * 20) * 10) / 10,
      unemploymentRate: Math.round((4 + deprivation * 8) * 10) / 10,
      economicInactivityRate: Math.round((20 + deprivation * 12) * 10) / 10,
    },
    occupations: [
      { name: 'Professional', percentage: Math.round((25 - deprivation * 15) * 10) / 10 },
      { name: 'Associate Professional', percentage: Math.round((15 - deprivation * 5) * 10) / 10 },
      { name: 'Skilled Trades', percentage: Math.round((10 + deprivation * 5) * 10) / 10 },
      { name: 'Elementary Occupations', percentage: Math.round((10 + deprivation * 10) * 10) / 10 },
    ],
    averageWeeklyEarnings: Math.round(450 - deprivation * 150),
    benefitClaimants: {
      jsaRate: Math.round((1 + deprivation * 4) * 10) / 10,
      ucRate: Math.round((5 + deprivation * 15) * 10) / 10,
      esaRate: Math.round((3 + deprivation * 8) * 10) / 10,
    },
    qualifications: {
      noQualifications: Math.round((8 + deprivation * 15) * 10) / 10,
      level1: Math.round((12 + deprivation * 5) * 10) / 10,
      level2: Math.round(15 * 10) / 10,
      level3: Math.round((15 - deprivation * 3) * 10) / 10,
      level4Plus: Math.round((35 - deprivation * 20) * 10) / 10,
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ── Plentific/Fixflo Repairs Marketplace (simulated) ──
export interface RepairsMarketplaceQuote {
  contractor: string;
  amount: number;
  eta: string;
}

export interface RepairsMarketplaceJob {
  caseId: string;
  jobRef: string;
  status: 'posted' | 'quoted' | 'accepted' | 'in-progress' | 'completed';
  contractor: {
    name: string;
    rating: number;
    trades: string[];
    gasSafeNumber?: string;
  };
  quotes: RepairsMarketplaceQuote[];
  scheduledDate: string;
  completedDate: string | null;
  cost: number;
  satisfaction: number | null;
}

export function mockRepairsMarketplace(caseId: string): RepairsMarketplaceJob {
  const seed = Math.abs(hashCode(caseId));
  const statuses: RepairsMarketplaceJob['status'][] = ['posted', 'quoted', 'accepted', 'in-progress', 'completed'];
  const status = statuses[seed % statuses.length];

  const contractors = [
    'Pinnacle Property Services',
    'Mears Group',
    'Morgan Sindall',
    'Kier Services',
    'Wates Group',
    'Fortem Solutions',
    'Engie UK',
  ];
  const tradeOptions = [
    ['Plumbing', 'Heating'],
    ['Electrical'],
    ['Roofing', 'Guttering'],
    ['Plastering', 'Damp Proofing'],
    ['Carpentry', 'Joinery'],
    ['General Maintenance'],
    ['Gas', 'Heating'],
  ];

  const contractorIdx = seed % contractors.length;
  const isGasTrade = tradeOptions[contractorIdx].includes('Gas') || tradeOptions[contractorIdx].includes('Heating');

  const numQuotes = 2 + (seed % 3);
  const quotes: RepairsMarketplaceQuote[] = Array.from({ length: numQuotes }, (_, i) => {
    const qSeed = Math.abs(hashCode(caseId + 'q' + i));
    return {
      contractor: contractors[(contractorIdx + i) % contractors.length],
      amount: Math.round((150 + (qSeed % 800)) * 100) / 100,
      eta: `${1 + (qSeed % 10)} working days`,
    };
  });

  const isCompleted = status === 'completed';
  const baseCost = 200 + (seed % 1200);

  return {
    caseId,
    jobRef: `RPR-${String(seed % 100000).padStart(5, '0')}`,
    status,
    contractor: {
      name: contractors[contractorIdx],
      rating: Math.round((3.5 + (seed % 15) / 10) * 10) / 10,
      trades: tradeOptions[contractorIdx],
      ...(isGasTrade ? { gasSafeNumber: String(200000 + (seed % 99999)) } : {}),
    },
    quotes,
    scheduledDate: `2026-03-${String(1 + seed % 28).padStart(2, '0')}`,
    completedDate: isCompleted ? `2026-03-${String(5 + seed % 24).padStart(2, '0')}` : null,
    cost: Math.round(baseCost * 100) / 100,
    satisfaction: isCompleted ? Math.round((3 + (seed % 20) / 10) * 10) / 10 : null,
  };
}

// ── RSH/CORE/Ombudsman Regulatory (simulated) ──
export interface RegulatoryIssue {
  field: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface RegulatorySubmission {
  submissionRef: string;
  type: 'rsh-ida' | 'core-lettings' | 'core-sales' | 'ombudsman';
  status: 'draft' | 'submitted' | 'accepted' | 'queried' | 'rejected';
  period: string;
  submittedDate: string | null;
  responseDate: string | null;
  dataPoints: number;
  complianceScore: number;
  issues: RegulatoryIssue[];
}

export function mockRegulatorySubmission(
  type: 'rsh-ida' | 'core-lettings' | 'core-sales' | 'ombudsman',
  refId: string
): RegulatorySubmission {
  const seed = Math.abs(hashCode(type + refId));
  const statuses: RegulatorySubmission['status'][] = ['draft', 'submitted', 'accepted', 'queried', 'rejected'];
  const status = statuses[seed % statuses.length];
  const isSubmitted = status !== 'draft';
  const hasResponse = status === 'accepted' || status === 'queried' || status === 'rejected';

  const periodYear = 2025 + (seed % 2);
  const periodQuarter = 1 + (seed % 4);

  const issueTemplates: RegulatoryIssue[] = [
    { field: 'void-loss', severity: 'warning', message: 'Void loss exceeds sector median by 12%' },
    { field: 'repairs-response-time', severity: 'error', message: 'Emergency repair response time exceeds 24h target' },
    { field: 'tenant-satisfaction', severity: 'info', message: 'Overall satisfaction below upper quartile' },
    { field: 'arrears-rate', severity: 'warning', message: 'Current tenant arrears rate above benchmark at 6.2%' },
    { field: 'complaints-handling', severity: 'error', message: 'Stage 2 response times non-compliant with Housing Ombudsman code' },
    { field: 'damp-mould-cases', severity: 'warning', message: 'Open damp/mould cases increased 15% quarter-on-quarter' },
    { field: 'gas-safety', severity: 'error', message: '3 properties with expired LGSR certificates' },
  ];

  const numIssues = seed % 4;
  const issues: RegulatoryIssue[] = Array.from({ length: numIssues }, (_, i) => {
    return issueTemplates[(seed + i) % issueTemplates.length];
  });

  const dataPointsMap: Record<string, number> = {
    'rsh-ida': 85 + (seed % 40),
    'core-lettings': 120 + (seed % 60),
    'core-sales': 45 + (seed % 30),
    'ombudsman': 15 + (seed % 20),
  };

  return {
    submissionRef: `REG-${type.toUpperCase()}-${String(seed % 100000).padStart(5, '0')}`,
    type,
    status,
    period: `Q${periodQuarter} ${periodYear}/${periodYear + 1}`,
    submittedDate: isSubmitted ? `2026-01-${String(5 + seed % 24).padStart(2, '0')}` : null,
    responseDate: hasResponse ? `2026-02-${String(1 + seed % 26).padStart(2, '0')}` : null,
    dataPoints: dataPointsMap[type],
    complianceScore: Math.round((70 + (seed % 30)) * 10) / 10,
    issues,
  };
}

// ── DocuSign Digital Signing (simulated) ──
export interface SigningRecipient {
  name: string;
  email: string;
  role: 'tenant' | 'landlord' | 'guarantor' | 'witness';
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';
  signedDate: string | null;
}

export interface SigningEnvelope {
  envelopeId: string;
  documentType: 'tenancy-agreement' | 'section-21' | 'gas-cert' | 'atp';
  status: 'created' | 'sent' | 'viewed' | 'signed' | 'completed' | 'declined';
  recipients: SigningRecipient[];
  sentDate: string | null;
  viewedDate: string | null;
  signedDate: string | null;
  documentUrl: string;
}

export function mockSigningEnvelope(documentType: string, tenantId: string): SigningEnvelope {
  const seed = Math.abs(hashCode(documentType + tenantId));
  const validDocTypes: SigningEnvelope['documentType'][] = ['tenancy-agreement', 'section-21', 'gas-cert', 'atp'];
  const docType = validDocTypes.includes(documentType as any)
    ? (documentType as SigningEnvelope['documentType'])
    : 'tenancy-agreement';
  const envelopeStatuses: SigningEnvelope['status'][] = ['created', 'sent', 'viewed', 'signed', 'completed', 'declined'];
  const status = envelopeStatuses[seed % envelopeStatuses.length];

  const recipientNames = [
    { name: 'Mr James Thompson', email: 'j.thompson@email.co.uk' },
    { name: 'Mrs Sarah Ahmed', email: 's.ahmed@email.co.uk' },
    { name: 'Riverside Housing Assoc.', email: 'signing@riverside-ha.org.uk' },
  ];

  const recipientStatuses: SigningRecipient['status'][] = ['pending', 'sent', 'viewed', 'signed'];
  const recipients: SigningRecipient[] = [
    {
      ...recipientNames[seed % recipientNames.length],
      role: 'tenant',
      status: status === 'completed' ? 'signed' : recipientStatuses[seed % recipientStatuses.length],
      signedDate: status === 'completed' || status === 'signed'
        ? `2026-02-${String(1 + seed % 26).padStart(2, '0')}`
        : null,
    },
    {
      ...recipientNames[2],
      role: 'landlord',
      status: status === 'completed' ? 'signed' : 'pending',
      signedDate: status === 'completed'
        ? `2026-02-${String(3 + seed % 24).padStart(2, '0')}`
        : null,
    },
  ];

  const isSent = status !== 'created';
  const isViewed = status === 'viewed' || status === 'signed' || status === 'completed';
  const isSigned = status === 'signed' || status === 'completed';

  return {
    envelopeId: `ENV-${String(seed % 1000000).padStart(6, '0')}`,
    documentType: docType,
    status,
    recipients,
    sentDate: isSent ? `2026-02-${String(1 + seed % 26).padStart(2, '0')}` : null,
    viewedDate: isViewed ? `2026-02-${String(3 + seed % 24).padStart(2, '0')}` : null,
    signedDate: isSigned ? `2026-02-${String(5 + seed % 22).padStart(2, '0')}` : null,
    documentUrl: `https://signing.socialhomes.ai/documents/${docType}/${tenantId}`,
  };
}

// ── Experian/TransUnion Referencing (simulated) ──
export interface AffordabilityCheck {
  income: number;
  rent: number;
  ratio: number;
  passedThreshold: boolean;
}

export interface PreviousAddress {
  address: string;
  fromDate: string;
  toDate: string;
}

export interface ReferencingResult {
  applicationRef: string;
  provider: 'experian' | 'transunion';
  status: 'pending' | 'in-progress' | 'passed' | 'failed' | 'referred';
  creditScore: number;
  identityVerified: boolean;
  affordabilityCheck: AffordabilityCheck;
  previousAddresses: PreviousAddress[];
  ccjs: number;
  bankruptcies: number;
  recommendation: string;
}

export function mockReferencingResult(applicantId: string): ReferencingResult {
  const seed = Math.abs(hashCode(applicantId));
  const providers: ReferencingResult['provider'][] = ['experian', 'transunion'];
  const provider = providers[seed % providers.length];
  const statuses: ReferencingResult['status'][] = ['pending', 'in-progress', 'passed', 'passed', 'failed', 'referred'];
  const status = statuses[seed % statuses.length];

  const creditScore = 300 + (seed % 600);
  const income = 18000 + (seed % 30000);
  const weeklyRent = 120 + (seed % 180);
  const annualRent = weeklyRent * 52;
  const ratio = Math.round((annualRent / income) * 100) / 100;
  const passedThreshold = ratio <= 0.35;

  const ccjs = seed % 5 === 0 ? 1 + (seed % 2) : 0;
  const bankruptcies = seed % 8 === 0 ? 1 : 0;

  const streetNames = [
    'High Street', 'Church Lane', 'Station Road', 'Park Avenue', 'Mill Lane',
    'Victoria Road', 'Green Lane', 'King Street', 'Queen Street', 'London Road',
  ];
  const towns = ['Manchester', 'Birmingham', 'Leeds', 'Sheffield', 'Liverpool', 'Bristol', 'Nottingham'];

  const numAddresses = 1 + (seed % 3);
  const previousAddresses: PreviousAddress[] = Array.from({ length: numAddresses }, (_, i) => {
    const aSeed = Math.abs(hashCode(applicantId + 'addr' + i));
    const startYear = 2020 - (i * 2) - (aSeed % 2);
    const endYear = startYear + 1 + (aSeed % 2);
    return {
      address: `${1 + (aSeed % 120)} ${streetNames[aSeed % streetNames.length]}, ${towns[aSeed % towns.length]}`,
      fromDate: `${startYear}-${String(1 + aSeed % 12).padStart(2, '0')}-01`,
      toDate: `${endYear}-${String(1 + aSeed % 12).padStart(2, '0')}-01`,
    };
  });

  let recommendation: string;
  if (status === 'passed') {
    recommendation = 'Applicant meets all referencing criteria. Proceed with tenancy offer.';
  } else if (status === 'failed') {
    recommendation = ccjs > 0
      ? 'Applicant has outstanding CCJs. Consider requesting a guarantor.'
      : 'Affordability ratio exceeds threshold. Consider reduced rent or guarantor.';
  } else if (status === 'referred') {
    recommendation = 'Borderline case. Manual review recommended by lettings manager.';
  } else {
    recommendation = 'Referencing in progress. Results expected within 48 hours.';
  }

  return {
    applicationRef: `REF-${provider.toUpperCase().slice(0, 3)}-${String(seed % 100000).padStart(5, '0')}`,
    provider,
    status,
    creditScore,
    identityVerified: seed % 6 !== 0,
    affordabilityCheck: {
      income,
      rent: annualRent,
      ratio,
      passedThreshold,
    },
    previousAddresses,
    ccjs,
    bankruptcies,
    recommendation,
  };
}

// ── Land Registry (simulated) ──
export interface LeaseDetails {
  startDate: string;
  term: number;
  groundRent: number;
  remainingYears: number;
}

export interface LandRegistryTitle {
  titleNumber: string;
  propertyAddress: string;
  tenure: 'freehold' | 'leasehold';
  registeredOwner: string;
  pricePaid: number;
  lastSaleDate: string;
  leaseDetails: LeaseDetails | null;
  restrictions: string[];
}

export function mockLandRegistryTitle(propertyId: string): LandRegistryTitle {
  const seed = Math.abs(hashCode(propertyId));
  const tenure: LandRegistryTitle['tenure'] = seed % 3 === 0 ? 'leasehold' : 'freehold';

  const streetNames = [
    'Riverside Drive', 'Meadow Close', 'Elm Court', 'Cedar House', 'Oak Avenue',
    'Birch Walk', 'Willow Crescent', 'Maple Road', 'Ash Lane', 'Beech Place',
  ];
  const towns = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Sheffield', 'Liverpool', 'Coventry', 'Nottingham'];
  const postcodes = ['E1 6AN', 'M1 2WD', 'B5 4EJ', 'LS1 5HD', 'S1 2HE', 'L1 8JQ', 'CV1 5FB', 'NG1 7AS'];

  const owners = [
    'Riverside Community Housing Association Ltd',
    'Riverside Housing Group Ltd',
    'Metropolitan Housing Trust Ltd',
    'Sovereign Housing Association Ltd',
    'Peabody Trust',
  ];

  const houseNum = 1 + (seed % 150);
  const streetIdx = seed % streetNames.length;
  const townIdx = seed % towns.length;

  const restrictionOptions = [
    'No disposition of the registered estate by the proprietor of the registered estate is to be registered without a written consent signed by the Secretary of State.',
    'RESTRICTION: No transfer or lease is to be registered unless accompanied by a certificate from Riverside Community Housing Association.',
    'The land has the benefit of a right of way on foot and with vehicles over the accessway.',
    'The transfer to the proprietor contains a covenant to observe and perform the covenants referred to therein.',
    'RESTRICTION: No disposition of the registered estate is permitted until the expiry of the nomination period under the Housing Act 1996.',
  ];

  const numRestrictions = seed % 3;
  const restrictions: string[] = Array.from({ length: numRestrictions }, (_, i) => {
    return restrictionOptions[(seed + i) % restrictionOptions.length];
  });

  const saleYear = 2005 + (seed % 18);
  const basePriceByTenure = tenure === 'leasehold' ? 120000 : 180000;
  const pricePaid = basePriceByTenure + (seed % 280000);

  let leaseDetails: LeaseDetails | null = null;
  if (tenure === 'leasehold') {
    const leaseStart = 1960 + (seed % 40);
    const term = [99, 125, 250, 999][seed % 4];
    const elapsed = 2026 - leaseStart;
    leaseDetails = {
      startDate: `${leaseStart}-01-01`,
      term,
      groundRent: Math.round((50 + (seed % 450)) * 100) / 100,
      remainingYears: Math.max(0, term - elapsed),
    };
  }

  return {
    titleNumber: `${['NGL', 'WSX', 'LN', 'BM', 'MAN', 'SYK'][seed % 6]}${String(100000 + seed % 900000)}`,
    propertyAddress: `${houseNum} ${streetNames[streetIdx]}, ${towns[townIdx]} ${postcodes[townIdx]}`,
    tenure,
    registeredOwner: owners[seed % owners.length],
    pricePaid,
    lastSaleDate: `${saleYear}-${String(1 + seed % 12).padStart(2, '0')}-${String(1 + seed % 28).padStart(2, '0')}`,
    leaseDetails,
    restrictions,
  };
}

// ── Utility ──
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}
