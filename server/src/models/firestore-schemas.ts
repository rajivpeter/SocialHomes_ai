// ============================================================
// Firestore Document Schemas — SocialHomes.Ai
// Each interface represents a Firestore document shape.
// Fields include both app-readable values and HACT-coded sub-object.
// ============================================================

export interface HactCoded {
  [key: string]: string | number | undefined;
}

// ---- Organisation ----
export interface OrganisationDoc {
  id: string;
  name: string;
  rpNumber: string;
  regulatoryGrade: string;
  totalUnits: number;
  occupancyRate: number;
  complianceRate: number;
  totalArrears: number;
  financialYear: string;
  hact?: HactCoded;
}

// ---- Geography ----
export interface RegionDoc {
  id: string;
  name: string;
  lat: number;
  lng: number;
  localAuthorities: string[];
  totalUnits: number;
  compliance: number;
  arrears: number;
  voids: number;
}

export interface LocalAuthorityDoc {
  id: string;
  name: string;
  regionId: string;
  lat: number;
  lng: number;
  estates: string[];
  totalUnits: number;
  compliance: number;
  lhaRates?: Record<string, number>;
}

export interface EstateDoc {
  id: string;
  name: string;
  localAuthorityId: string;
  postcode: string;
  lat: number;
  lng: number;
  constructionEra: string;
  totalUnits: number;
  blocks: string[];
  schemeType: string;
  managingOfficer: string;
  occupancy: number;
  compliance: number;
  dampCases: number;
  arrears: number;
  asbCases: number;
  repairsBacklog: number;
}

export interface BlockDoc {
  id: string;
  name: string;
  estateId: string;
  address: string;
  uprn: string;
  lat: number;
  lng: number;
  constructionType: string;
  constructionYear: number;
  storeys: number;
  totalUnits: number;
  units: string[];
  higherRisk: boolean;
  fireRiskAssessment: Record<string, any>;
  asbestosManagement: Record<string, any>;
  legionellaAssessment: Record<string, any>;
  communalFire: Record<string, any>;
  lifts?: Record<string, any>[];
  hact?: HactCoded;
}

// ---- Property ----
export interface PropertyDoc {
  id: string;
  uprn: string;
  address: string;
  postcode: string;
  blockId: string;
  estateId: string;
  localAuthorityId: string;
  regionId: string;
  lat: number;
  lng: number;
  type: string;
  bedrooms: number;
  floor?: number;
  floorArea: number;
  heatingType: string;
  tenureType: string;
  currentTenancyId?: string;
  isVoid: boolean;
  voidSince?: string;
  compliance: Record<string, string>;
  epc: Record<string, any>;
  gasSafety?: Record<string, any>;
  eicr?: Record<string, any>;
  asbestos?: Record<string, any>;
  smokeAlarms?: Record<string, any>;
  coAlarms?: Record<string, any>;
  boiler?: Record<string, any>;
  dampRisk: number;
  weeklyRent: number;
  serviceCharge: number;
  accessibility?: string[];
  hact?: {
    propertyPrimaryTypeCode?: string;
    tenureTypeCode?: string;
    constructionMethodCode?: string;
    propertyPhysicalFormCode?: string;
    propertyAdjacencyCode?: string;
    heatingTypeCode?: string;
  };
}

// ---- Tenant ----
export interface TenantDoc {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  phone: string;
  mobile?: string;
  propertyId: string;
  tenancyId: string;
  tenancyStartDate: string;
  tenancyType: string;
  tenancyStatus: string;
  household: Record<string, any>[];
  emergencyContact: Record<string, any>;
  assignedOfficer: string;
  vulnerabilityFlags: Record<string, any>[];
  communicationPreference: string;
  ucStatus?: string;
  paymentMethod: string;
  rentBalance: number;
  weeklyCharge: number;
  arrearsRisk: number;
  lastContact?: string;
  contactCount30Days: number;
  hact?: {
    personName?: { given: string; family: string; title: string };
    communicationChannelCode?: string;
    paymentMethodCode?: string;
    tenureTypeCode?: string;
  };
}

// ---- Case (unified) ----
export interface CaseDoc {
  id: string;
  reference: string;
  type: string; // 'repair' | 'complaint' | 'asb' | 'damp-mould' | 'financial'
  tenantId: string;
  propertyId: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  handler: string;
  createdDate: string;
  targetDate?: string;
  closedDate?: string;
  daysOpen: number;
  slaStatus: string;
  // Repair-specific
  sorCode?: string;
  sorDescription?: string;
  trade?: string;
  operative?: string;
  appointmentDate?: string;
  appointmentSlot?: string;
  completionDate?: string;
  cost?: number;
  firstTimeFix?: boolean;
  isAwaabsLaw?: boolean;
  awaabsLawCategory?: string;
  awaabsLawTimers?: Record<string, any>;
  recurrenceRisk?: number;
  satisfaction?: number;
  // Complaint-specific
  stage?: number;
  category?: string;
  acknowledgeDeadline?: string;
  responseDeadline?: string;
  acknowledgedDate?: string;
  respondedDate?: string;
  finding?: string;
  remedy?: string;
  compensation?: number;
  learningActions?: string[];
  ombudsmanEscalation?: boolean;
  escalationRisk?: number;
  // ASB-specific
  severity?: string;
  escalationStage?: string;
  evidenceCount?: number;
  multiAgencyPanel?: boolean;
  communityTrigger?: boolean;
  legalActionProbability?: number;
  // Damp-specific
  hazardClassification?: string;
  dampRiskScore?: number;
  cause?: string;
  linkedRepairs?: string[];
  // Financial-specific
  arrearsAmount?: number;
  arrearsReason?: string;
  paymentArrangement?: Record<string, any>;
  preActionChecklist?: Record<string, boolean>;
  // HACT
  hact?: HactCoded;
}

// ---- Activity ----
export interface ActivityDoc {
  id: string;
  caseId?: string;
  tenantId: string;
  type: string;
  direction?: string;
  subject: string;
  description: string;
  date: string;
  officer: string;
  linkedCaseRef?: string;
}

// ---- Audit ----
export interface AuditDoc {
  id: string;
  timestamp: string;
  user: string;
  entity: string;
  entityId: string;
  field: string;
  oldValue: string;
  newValue: string;
  action: string;
}
