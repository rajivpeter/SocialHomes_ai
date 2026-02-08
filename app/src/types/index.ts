// ============================================================
// SocialHomes.Ai — Complete Type Definitions
// ============================================================

// ---- Personas ----
export type Persona = 'coo' | 'head-of-service' | 'manager' | 'housing-officer' | 'operative';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  persona: Persona;
  avatar?: string;
  team?: string;
  patch?: string;
}

// ---- Geography / Hierarchy ----
export interface Region {
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

export interface LocalAuthority {
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

export interface Estate {
  id: string;
  name: string;
  localAuthorityId: string;
  postcode: string;
  lat: number;
  lng: number;
  constructionEra: string;
  totalUnits: number;
  blocks: string[];
  schemeType: 'general-needs' | 'sheltered' | 'extra-care' | 'supported' | 'mixed';
  managingOfficer: string;
  occupancy: number;
  compliance: number;
  dampCases: number;
  arrears: number;
  asbCases: number;
  repairsBacklog: number;
}

export interface Block {
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
  fireRiskAssessment: {
    date: string;
    riskLevel: 'low' | 'medium' | 'substantial' | 'high' | 'very-high';
    actionItems: { description: string; status: 'complete' | 'in-progress' | 'overdue'; }[];
  };
  asbestosManagement: {
    surveyDate: string;
    acmCount: number;
    locations: string[];
  };
  legionellaAssessment: {
    date: string;
    waterSystem: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  communalFire: {
    detectionType: string;
    zones: number;
    serviceDate: string;
    emergencyLighting: boolean;
    compartmentation: 'good' | 'fair' | 'poor';
    fireDoors: { total: number; compliant: number; };
  };
  lifts?: { id: string; lolerDate: string; status: 'compliant' | 'due' | 'overdue'; }[];
}

// ---- Properties / Units ----
export type TenureType = 'secure' | 'assured' | 'ast' | 'starter' | 'fixed-term' | 'flexible' | 'licence' | 'shared-ownership';
export type PropertyType = 'flat' | 'house' | 'maisonette' | 'bungalow' | 'bedsit' | 'studio';
export type HeatingType = 'gas-central' | 'electric' | 'district' | 'communal' | 'storage-heaters';

export interface Property {
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
  type: PropertyType;
  bedrooms: number;
  floor?: number;
  floorArea: number;
  heatingType: HeatingType;
  tenureType: TenureType;
  currentTenancyId?: string;
  isVoid: boolean;
  voidSince?: string;
  compliance: ComplianceStatus;
  epc: { rating: string; sapScore: number; expiryDate: string; };
  gasSafety?: { date: string; expiryDate: string; status: 'valid' | 'expiring' | 'expired'; engineer: string; };
  eicr?: { date: string; expiryDate: string; status: 'valid' | 'expiring' | 'expired'; observations: number; };
  asbestos?: { acms: number; lastSurvey: string; riskLevel: 'low' | 'medium' | 'high'; };
  smokeAlarms?: { count: number; lastTest: string; compliant: boolean; };
  coAlarms?: { count: number; lastTest: string; compliant: boolean; };
  boiler?: { make: string; model: string; installYear: number; lastService: string; efficiency: number; };
  stockCondition?: StockComponent[];
  dampRisk: number; // 0-100 AI score
  weeklyRent: number;
  serviceCharge: number;
  accessibility?: string[];
}

export interface ComplianceStatus {
  overall: 'compliant' | 'expiring' | 'non-compliant';
  gas: 'valid' | 'expiring' | 'expired' | 'na';
  electrical: 'valid' | 'expiring' | 'expired';
  fire: 'valid' | 'expiring' | 'expired';
  asbestos: 'valid' | 'expiring' | 'expired';
  legionella: 'valid' | 'expiring' | 'expired' | 'na';
  lifts: 'valid' | 'expiring' | 'expired' | 'na';
}

export interface StockComponent {
  component: string;
  type: string;
  installYear: number;
  condition: 1 | 2 | 3 | 4 | 5;
  remainingLife: number;
  replacementCost: number;
}

// ---- Tenants ----
export interface Tenant {
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
  tenancyType: TenureType;
  tenancyStatus: 'active' | 'notice' | 'former' | 'suspended' | 'evicted';
  household: HouseholdMember[];
  emergencyContact: { name: string; phone: string; relationship: string; };
  assignedOfficer: string;
  vulnerabilityFlags: VulnerabilityFlag[];
  communicationPreference: 'email' | 'phone' | 'letter' | 'sms';
  ucStatus?: 'claiming' | 'transitioning' | 'managed-migration' | 'none';
  paymentMethod: 'dd' | 'uc' | 'so' | 'card' | 'cash' | 'hb';
  rentBalance: number;
  weeklyCharge: number;
  arrearsRisk: number; // AI score 0-100
  lastContact?: string;
  contactCount30Days: number;
}

export interface HouseholdMember {
  name: string;
  relationship: string;
  dob: string;
  isDependent: boolean;
}

export interface VulnerabilityFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  notes?: string;
  dateIdentified: string;
}

// ---- Cases (unified) ----
export type CaseType = 'complaint' | 'repair' | 'asb' | 'enquiry' | 'financial' | 'safeguarding' | 'damp-mould';

export interface Case {
  id: string;
  reference: string;
  type: CaseType;
  tenantId: string;
  propertyId: string;
  subject: string;
  description: string;
  status: string;
  priority: 'emergency' | 'urgent' | 'routine' | 'planned';
  handler: string;
  createdDate: string;
  targetDate?: string;
  closedDate?: string;
  daysOpen: number;
  slaStatus: 'within' | 'approaching' | 'breached';
  activities: Activity[];
  tasks: Task[];
}

// ---- Repairs ----
export interface Repair extends Case {
  type: 'repair';
  sorCode: string;
  sorDescription: string;
  trade: string;
  operative?: string;
  appointmentDate?: string;
  appointmentSlot?: string;
  completionDate?: string;
  cost?: number;
  materials?: string[];
  photosBefore?: string[];
  photosAfter?: string[];
  satisfaction?: number;
  firstTimeFix: boolean;
  isAwaabsLaw: boolean;
  awaabsLawCategory?: 'emergency' | 'significant';
  awaabsLawTimers?: AwaabsLawTimers;
  recurrenceRisk: number;
}

export interface AwaabsLawTimers {
  category: 'emergency' | 'significant';
  startDate: string;
  investigateDeadline?: string;
  summaryDeadline?: string;
  safetyWorksDeadline?: string;
  fullRepairDeadline?: string;
  emergencyDeadline?: string;
}

// ---- Complaints ----
export interface Complaint extends Case {
  type: 'complaint';
  stage: 1 | 2;
  category: string;
  acknowledgeDeadline: string;
  responseDeadline: string;
  acknowledgedDate?: string;
  respondedDate?: string;
  finding?: 'upheld' | 'partially-upheld' | 'not-upheld';
  remedy?: string;
  compensation?: number;
  learningActions?: string[];
  ombudsmanEscalation: boolean;
  escalationRisk: number;
}

// ---- ASB ----
export type AsbSeverity = 'cat-1' | 'cat-2' | 'cat-3';
export type AsbEscalationStage = 'warning' | 'abc' | 'cpw' | 'cpn' | 'injunction' | 'possession' | 'closure';

export interface AsbCase extends Case {
  type: 'asb';
  category: string;
  severity: AsbSeverity;
  escalationStage: AsbEscalationStage;
  evidenceCount: number;
  multiAgencyPanel: boolean;
  perpetratorId?: string;
  communityTrigger: boolean;
  legalActionProbability: number;
}

// ---- Financial / Arrears ----
export interface FinancialCase extends Case {
  type: 'financial';
  arrearsAmount: number;
  arrearsReason: string;
  escalationStage: 'pre-action' | 'nosp' | 'court' | 'possession';
  paymentArrangement?: { amount: number; frequency: string; compliance: number; startDate: string; };
  preActionChecklist: Record<string, boolean>;
}

// ---- Damp & Mould ----
export interface DampMouldCase extends Case {
  type: 'damp-mould';
  hazardClassification: 'emergency' | 'significant' | 'non-urgent';
  dampRiskScore: number;
  cause?: string;
  awaabsLawTimers: AwaabsLawTimers;
  environmentalData?: { humidity: number; temperature: number; moisture: number; };
  linkedRepairs: string[];
}

// ---- Activities ----
export interface Activity {
  id: string;
  caseId?: string;
  tenantId: string;
  type: 'call' | 'visit' | 'letter' | 'email' | 'sms' | 'system' | 'note';
  direction?: 'inbound' | 'outbound';
  subject: string;
  description: string;
  date: string;
  officer: string;
  linkedCaseRef?: string;
}

// ---- Tasks ----
export interface Task {
  id: string;
  caseId?: string;
  tenantId?: string;
  propertyId?: string;
  description: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  assignedTo: string;
  createdBy: string;
  createdDate: string;
  completedDate?: string;
  linkedCaseRef?: string;
}

// ---- Rent / Financial ----
export interface RentTransaction {
  id: string;
  tenantId: string;
  date: string;
  week: number;
  type: 'charge' | 'payment' | 'adjustment' | 'hb' | 'uc';
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ServiceCharge {
  description: string;
  weeklyAmount: number;
  annualBudget: number;
  apportionment: string;
}

// ---- Compliance ----
export interface ComplianceCertificate {
  id: string;
  propertyId: string;
  type: 'gas' | 'electrical' | 'fire' | 'asbestos' | 'legionella' | 'lift';
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
  contractor: string;
  reference: string;
  notes?: string;
}

// ---- Allocations / Voids ----
export type VoidStage = 'notice' | 'keys' | 'inspection' | 'works' | 'quality' | 'ready' | 'offer' | 'let';

export interface VoidProperty {
  id: string;
  propertyId: string;
  stage: VoidStage;
  voidDate: string;
  daysVoid: number;
  estimatedCost: number;
  weeklyRentLoss: number;
  contractor?: string;
  targetLetDate?: string;
}

export interface Applicant {
  id: string;
  name: string;
  band: 'A' | 'B' | 'C' | 'D';
  bedroomNeed: number;
  medicalPriority: boolean;
  registrationDate: string;
  localConnection: string;
  status: 'active' | 'suspended' | 'housed' | 'withdrawn';
}

// ---- Communications ----
export interface Communication {
  id: string;
  tenantId?: string;
  propertyId?: string;
  caseRef?: string;
  channel: 'email' | 'phone' | 'letter' | 'sms' | 'portal';
  direction: 'inbound' | 'outbound';
  subject: string;
  content: string;
  date: string;
  status: 'new' | 'read' | 'actioned' | 'archived';
  sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent';
  aiCategory?: string;
  aiPriority?: 'high' | 'medium' | 'low';
}

// ---- AI ----
export interface AiInsight {
  id: string;
  type: 'prediction' | 'alert' | 'recommendation' | 'analysis';
  severity: 'urgent' | 'attention' | 'info';
  title: string;
  description: string;
  confidence: number;
  affectedEntities: { type: string; id: string; name: string; }[];
  action?: string;
  date: string;
  model?: string;
}

export interface AiAction {
  id: string;
  icon: string;
  label: string;
  description: string;
  entityType: string;
  entityId: string;
  prediction?: { probability: number; consequence: string; };
  workflow: AiWorkflowStep[];
}

export interface AiWorkflowStep {
  type: 'preview' | 'edit' | 'confirm' | 'followup' | 'auto-create';
  title: string;
  content?: string;
  options?: string[];
}

// ---- Admin ----
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  entity: string;
  entityId: string;
  field: string;
  oldValue: string;
  newValue: string;
  ip: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'login' | 'export';
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: string[];
  actions: string[];
  isActive: boolean;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  logo: string;
  category: string;
}

// ---- Reports ----
export interface TsmMeasure {
  id: string;
  code: string;
  name: string;
  actual: number;
  target: number;
  sectorMedian: number;
  upperQuartile: number;
  lowerQuartile: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

// ---- KPIs ----
export interface KpiCard {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  colour: string;
  icon: string;
}

// ---- Notification ----
export interface Notification {
  id: string;
  type: 'urgent' | 'warning' | 'info' | 'ai';
  title: string;
  message: string;
  date: string;
  read: boolean;
  entityType?: string;
  entityId?: string;
}
