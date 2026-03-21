import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { casesApi, aiApi } from '@/services/api-client';
import { useProperties, useTenants } from '@/hooks/useApi';
import {
  UtensilsCrossed, Bath, Bed, Sofa, DoorOpen, TreePine, Car, Home,
  ArrowLeft, ArrowRight, Upload, Camera, AlertTriangle, CheckCircle,
  Calendar, Clock, X, ImageIcon, Loader2, Wrench, Sparkles, PenLine,
  Building2, User, Search, Zap, Shield, ChevronDown, Info,
} from 'lucide-react';

// ============================================================
// Room definitions with contextual problems and descriptions
// ============================================================

type RoomKey = 'kitchen' | 'bathroom' | 'bedroom' | 'living-room' | 'hallway' | 'outside' | 'garage' | 'loft';

interface RoomDef {
  id: RoomKey;
  label: string;
  icon: typeof UtensilsCrossed;
}

const ROOMS: RoomDef[] = [
  { id: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
  { id: 'bathroom', label: 'Bathroom', icon: Bath },
  { id: 'bedroom', label: 'Bedroom', icon: Bed },
  { id: 'living-room', label: 'Living Room', icon: Sofa },
  { id: 'hallway', label: 'Hallway', icon: DoorOpen },
  { id: 'outside', label: 'Outside / Communal', icon: TreePine },
  { id: 'garage', label: 'Garage', icon: Car },
  { id: 'loft', label: 'Loft / Attic', icon: Home },
];

const PROBLEMS: Record<RoomKey, string[]> = {
  kitchen: ['Sink/Taps', 'Worktop', 'Cupboards/Units', 'Tiles', 'Extractor Fan', 'Boiler/Heating', 'Electrics', 'Floor', 'Ceiling', 'Damp/Mould'],
  bathroom: ['Toilet', 'Bath/Shower', 'Sink/Taps', 'Tiles', 'Extractor Fan', 'Mould', 'Floor', 'Ceiling'],
  bedroom: ['Window', 'Door', 'Wall', 'Ceiling', 'Floor', 'Heating/Radiator', 'Electrics', 'Damp/Mould'],
  'living-room': ['Window', 'Door', 'Wall', 'Ceiling', 'Floor', 'Heating/Radiator', 'Electrics', 'Fireplace', 'Damp/Mould'],
  hallway: ['Door', 'Wall', 'Ceiling', 'Floor', 'Stairs', 'Electrics', 'Smoke Alarm', 'Damp/Mould'],
  outside: ['Roof', 'Guttering', 'Walls', 'Fencing', 'Paths', 'Drainage', 'Garden', 'Door/Gate'],
  garage: ['Door', 'Electrics', 'Roof', 'Floor', 'Walls'],
  loft: ['Insulation', 'Roof', 'Access Hatch', 'Electrics', 'Water Tank'],
};

const DESCRIPTIONS: Record<string, string[]> = {
  // Kitchen
  'kitchen|Sink/Taps': ['Tap is dripping', 'Sink is blocked', 'Leak under the sink', 'Tap won\'t turn off', 'Tap won\'t turn on', 'Mixer tap broken'],
  'kitchen|Worktop': ['Worktop is damaged', 'Worktop is coming away from wall', 'Burn mark on worktop', 'Worktop is cracked'],
  'kitchen|Cupboards/Units': ['Cupboard door broken', 'Drawer broken', 'Hinge broken', 'Shelf collapsed', 'Handle missing'],
  'kitchen|Tiles': ['Tile is cracked', 'Tiles are loose', 'Grout is missing', 'Tile has fallen off'],
  'kitchen|Extractor Fan': ['Fan not working', 'Fan is noisy', 'Fan won\'t turn off', 'Fan cover missing'],
  'kitchen|Boiler/Heating': ['No heating at all', 'No hot water', 'Boiler making noise', 'Boiler leaking', 'Boiler showing error code', 'Pilot light keeps going out'],
  'kitchen|Electrics': ['Socket not working', 'Light not working', 'Switch sparking', 'No power in kitchen', 'Burning smell from socket'],
  'kitchen|Floor': ['Floor tile cracked', 'Vinyl is lifting', 'Floorboard is loose', 'Floor is uneven'],
  'kitchen|Ceiling': ['Ceiling is leaking', 'Ceiling has cracks', 'Paint is peeling', 'Damp patch on ceiling'],
  'kitchen|Damp/Mould': ['Black mould on walls', 'Damp patches', 'Mould behind units', 'Condensation on windows', 'Musty smell'],

  // Bathroom
  'bathroom|Toilet': ['Toilet won\'t flush', 'Toilet is leaking', 'Toilet is blocked', 'Seat is broken', 'Cistern won\'t fill'],
  'bathroom|Bath/Shower': ['Shower not working', 'Bath leaking', 'Shower head broken', 'No hot water in shower', 'Drain is blocked'],
  'bathroom|Sink/Taps': ['Tap is dripping', 'Sink is blocked', 'Leak under sink', 'Tap handle broken'],
  'bathroom|Tiles': ['Tile is cracked', 'Tiles are loose', 'Grout is missing', 'Water getting behind tiles'],
  'bathroom|Extractor Fan': ['Fan not working', 'Fan is noisy', 'Fan won\'t turn off'],
  'bathroom|Mould': ['Black mould on ceiling', 'Mould around bath/shower', 'Mould on walls', 'Mould behind toilet', 'Condensation problems'],
  'bathroom|Floor': ['Floor tile cracked', 'Vinyl is lifting', 'Floor feels soft/spongy', 'Water pooling on floor'],
  'bathroom|Ceiling': ['Ceiling is leaking', 'Paint is peeling', 'Damp patch visible', 'Artex is damaged'],

  // Bedroom
  'bedroom|Window': ['Window won\'t open', 'Window won\'t close', 'Broken glass', 'Handle broken', 'Draught from window', 'Condensation between panes'],
  'bedroom|Door': ['Door won\'t close', 'Lock broken', 'Handle loose', 'Door sticking', 'Gap under door'],
  'bedroom|Wall': ['Crack in wall', 'Damp patch', 'Plaster falling off', 'Hole in wall'],
  'bedroom|Ceiling': ['Crack in ceiling', 'Damp patch', 'Paint peeling', 'Leak from above'],
  'bedroom|Floor': ['Floorboard loose', 'Carpet damaged', 'Floor creaking badly', 'Gap in flooring'],
  'bedroom|Heating/Radiator': ['Radiator not heating', 'Radiator leaking', 'Radiator cold at bottom', 'Needs bleeding', 'TRV not working'],
  'bedroom|Electrics': ['Socket not working', 'Light not working', 'Switch broken', 'No power'],
  'bedroom|Damp/Mould': ['Black mould on walls', 'Damp patches', 'Condensation on windows', 'Musty smell', 'Mould on ceiling'],

  // Living room
  'living-room|Window': ['Window won\'t open', 'Window won\'t close', 'Broken glass', 'Handle broken', 'Draught from window'],
  'living-room|Door': ['Door won\'t close', 'Lock broken', 'Handle loose', 'Door sticking'],
  'living-room|Wall': ['Crack in wall', 'Damp patch', 'Plaster falling off', 'Hole in wall'],
  'living-room|Ceiling': ['Crack in ceiling', 'Damp patch', 'Paint peeling', 'Leak from above'],
  'living-room|Floor': ['Floorboard loose', 'Carpet damaged', 'Floor creaking badly'],
  'living-room|Heating/Radiator': ['Radiator not heating', 'Radiator leaking', 'Radiator cold at bottom', 'TRV not working'],
  'living-room|Electrics': ['Socket not working', 'Light not working', 'Switch broken', 'No power'],
  'living-room|Fireplace': ['Fireplace blocked', 'Chimney leaking', 'Gas fire not working', 'Draft from fireplace'],
  'living-room|Damp/Mould': ['Black mould on walls', 'Damp patches', 'Condensation on windows', 'Musty smell'],

  // Hallway
  'hallway|Door': ['Front door won\'t lock', 'Front door won\'t close', 'Door handle broken', 'Letterbox broken', 'Door chain broken'],
  'hallway|Wall': ['Crack in wall', 'Plaster falling off', 'Damp patch'],
  'hallway|Ceiling': ['Crack in ceiling', 'Paint peeling', 'Damp patch'],
  'hallway|Floor': ['Floor tile cracked', 'Carpet damaged', 'Floorboard loose'],
  'hallway|Stairs': ['Banister loose', 'Stair tread broken', 'Carpet loose on stairs', 'Stair rail missing'],
  'hallway|Electrics': ['Light not working', 'Switch broken', 'No power'],
  'hallway|Smoke Alarm': ['Alarm keeps beeping', 'Alarm not working', 'Alarm missing', 'CO alarm beeping'],
  'hallway|Damp/Mould': ['Damp patches', 'Mould on walls', 'Condensation'],

  // Outside
  'outside|Roof': ['Roof is leaking', 'Tiles missing', 'Flat roof damaged', 'Fascia board rotting', 'Lead flashing lifted'],
  'outside|Guttering': ['Gutter is blocked', 'Gutter is leaking', 'Downpipe is broken', 'Gutter overflowing'],
  'outside|Walls': ['Crack in external wall', 'Rendering is damaged', 'Brickwork is crumbling', 'Pointing needs repair'],
  'outside|Fencing': ['Fence panel is broken', 'Fence post is rotting', 'Gate is broken', 'Fence is leaning'],
  'outside|Paths': ['Path is cracked', 'Paving slab is loose', 'Path is uneven', 'Steps are damaged'],
  'outside|Drainage': ['Drain is blocked', 'Drain is overflowing', 'Manhole cover damaged', 'Bad smell from drain'],
  'outside|Garden': ['Overgrown communal area', 'Tree is dangerous', 'Hedge needs cutting', 'Rubbish dumped'],
  'outside|Door/Gate': ['Gate won\'t close', 'Gate lock broken', 'External door damaged', 'Communal door issue'],

  // Garage
  'garage|Door': ['Door won\'t open', 'Door won\'t close', 'Lock is broken', 'Mechanism is jammed', 'Door is damaged'],
  'garage|Electrics': ['Light not working', 'Socket not working', 'No power', 'Wiring exposed'],
  'garage|Roof': ['Roof is leaking', 'Tiles missing', 'Felt is damaged', 'Structural issue'],
  'garage|Floor': ['Floor is cracked', 'Floor is uneven', 'Water pooling', 'Surface is deteriorating'],
  'garage|Walls': ['Crack in wall', 'Damp coming through', 'Rendering damaged', 'Wall is leaning'],

  // Loft
  'loft|Insulation': ['No insulation', 'Insulation is damaged', 'Insulation needs replacing', 'Insulation is damp'],
  'loft|Roof': ['Roof is leaking', 'Daylight visible', 'Tiles missing from inside', 'Felt is torn'],
  'loft|Access Hatch': ['Hatch won\'t open', 'Hatch won\'t close properly', 'Ladder is broken', 'Hatch frame is damaged'],
  'loft|Electrics': ['Light not working', 'No power in loft', 'Wiring exposed', 'Switch is broken'],
  'loft|Water Tank': ['Tank is leaking', 'Overflow running constantly', 'Tank insulation missing', 'Valve is stuck'],
};

// ============================================================
// Trade mapping from room + problem
// ============================================================

function determineTrade(room: string, problem: string): string {
  const p = problem.toLowerCase();
  if (p.includes('boiler') || p.includes('heating') || p.includes('radiator')) return 'Gas Engineer';
  if (p.includes('electric') || p.includes('socket') || p.includes('switch') || p.includes('smoke alarm')) return 'Electrician';
  if (p.includes('sink') || p.includes('tap') || p.includes('toilet') || p.includes('shower') || p.includes('bath') || p.includes('drain')) return 'Plumber';
  if (p.includes('damp') || p.includes('mould') || p.includes('mold')) return 'Damp Specialist';
  if (p.includes('roof') || p.includes('gutter')) return 'Roofer';
  if (p.includes('door') || p.includes('window') || p.includes('cupboard') || p.includes('floor') || p.includes('stairs') || p.includes('hatch') || p.includes('fencing')) return 'Carpenter';
  if (p.includes('wall') || p.includes('ceiling') || p.includes('tiles') || p.includes('plaster')) return 'Plasterer';
  if (p.includes('garden') || p.includes('path')) return 'Grounds';
  if (p.includes('insulation') || p.includes('water tank')) return 'General';
  return 'General';
}

// ============================================================
// SOR code suggestion from room + problem
// ============================================================

function suggestSorCode(room: string, problem: string, descriptions: string[]): { code: string; description: string } {
  const desc = [...descriptions, problem, room].join(' ').toLowerCase();

  if (desc.includes('burst') || desc.includes('flooding')) return { code: 'PL001', description: 'Burst pipe — make safe and repair' };
  if (desc.includes('toilet')) return { code: 'PL002', description: 'Toilet repair or replacement' };
  if (desc.includes('tap') || desc.includes('dripping')) return { code: 'PL003', description: 'Tap repair or replacement' };
  if (desc.includes('drain') || desc.includes('blocked')) return { code: 'PL004', description: 'Blocked drain clearance' };
  if (desc.includes('shower')) return { code: 'PL005', description: 'Shower repair or replacement' };
  if (desc.includes('no heating') || desc.includes('no hot water') || desc.includes('boiler broken')) return { code: 'HT001', description: 'Total loss of heating — emergency repair' };
  if (desc.includes('boiler')) return { code: 'HT002', description: 'Boiler service and repair' };
  if (desc.includes('radiator')) return { code: 'HT003', description: 'Radiator repair or replacement' };
  if (desc.includes('gas smell') || desc.includes('gas leak')) return { code: 'HT004', description: 'Gas smell investigation' };
  if (desc.includes('no power') || desc.includes('no electricity')) return { code: 'EL001', description: 'Total loss of power — emergency' };
  if (desc.includes('socket') || desc.includes('switch') || desc.includes('plug')) return { code: 'EL002', description: 'Socket or switch repair' };
  if (desc.includes('light') || desc.includes('bulb')) return { code: 'EL003', description: 'Lighting repair or replacement' };
  if (desc.includes('smoke alarm') || desc.includes('co alarm')) return { code: 'EL004', description: 'Smoke/CO alarm repair' };
  if (desc.includes('door') && (desc.includes('lock') || desc.includes('security') || desc.includes('front'))) return { code: 'CA001', description: 'Door repair or replacement' };
  if (desc.includes('window') && desc.includes('broken glass')) return { code: 'CA003', description: 'Window boarding — security' };
  if (desc.includes('window')) return { code: 'CA002', description: 'Window repair (non-security)' };
  if (desc.includes('cupboard') || desc.includes('kitchen unit') || desc.includes('worktop')) return { code: 'CA004', description: 'Kitchen unit repair' };
  if (desc.includes('floor')) return { code: 'CA005', description: 'Floor repair' };
  if (desc.includes('damp') || desc.includes('mould') || desc.includes('mold') || desc.includes('condensation')) return { code: 'DM001', description: 'Damp and mould investigation' };
  if (desc.includes('roof') || desc.includes('leak from above')) return { code: 'RF001', description: 'Roof leak repair' };
  if (desc.includes('gutter') || desc.includes('downpipe')) return { code: 'RF002', description: 'Gutter repair or clearance' };
  if (desc.includes('pest') || desc.includes('mice') || desc.includes('rats')) return { code: 'GN001', description: 'Pest control treatment' };

  return { code: 'GN002', description: 'General repair' };
}

// ============================================================
// Priority auto-assignment logic
// ============================================================

type PriorityLevel = 'emergency' | 'awaabs-law' | 'urgent' | 'routine';

interface PriorityResult {
  level: PriorityLevel;
  label: string;
  explanation: string;
}

function autoPriority(room: string, problem: string, descriptions: string[]): PriorityResult {
  const joined = descriptions.join(' ').toLowerCase();

  if (problem === 'Boiler/Heating' && (joined.includes('no heating') || joined.includes('no hot water'))) {
    return { level: 'emergency', label: 'Emergency', explanation: 'Loss of heating or hot water is classified as an emergency repair (24-hour response).' };
  }
  if (problem === 'Electrics' && (joined.includes('sparking') || joined.includes('no power') || joined.includes('burning'))) {
    return { level: 'emergency', label: 'Emergency', explanation: 'Dangerous electrical faults (sparking, burning, or total power loss) require emergency response.' };
  }
  if (joined.includes('flooding') || joined.includes('burst') || (joined.includes('leak') && joined.includes('major'))) {
    return { level: 'emergency', label: 'Emergency', explanation: 'Significant water leaks or flooding are classified as emergency repairs.' };
  }
  if (problem === 'Damp/Mould' || problem === 'Mould' || joined.includes('mould') || joined.includes('damp')) {
    return { level: 'awaabs-law', label: "Awaab's Law", explanation: "Damp and mould issues fall under Awaab's Law. Your landlord must investigate within 14 calendar days and begin repairs promptly." };
  }
  if (problem === 'Stairs' || problem === 'Roof' || (problem === 'Window' && joined.includes('broken glass'))) {
    return { level: 'urgent', label: 'Urgent', explanation: 'This issue may pose a safety risk and is classified as urgent (5 working day response).' };
  }
  if (problem === 'Heating/Radiator' && joined.includes('not heating')) {
    return { level: 'urgent', label: 'Urgent', explanation: 'Heating issues are treated as urgent to ensure your home stays warm.' };
  }

  return { level: 'routine', label: 'Routine', explanation: 'This repair is classified as routine and will be completed within 20 working days.' };
}

// ============================================================
// Target date calculation based on priority
// ============================================================

function calculateTargetDate(priority: PriorityLevel): string {
  const now = new Date();
  let daysToAdd = 20;
  switch (priority) {
    case 'emergency': daysToAdd = 1; break;
    case 'awaabs-law': daysToAdd = 14; break;
    case 'urgent': daysToAdd = 5; break;
    case 'routine': daysToAdd = 20; break;
  }
  // Skip weekends for working-day based targets
  let added = 0;
  const date = new Date(now);
  while (added < daysToAdd) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date.toISOString().split('T')[0];
}

function getNextWorkingDay(daysFromNow: number): string {
  const date = new Date();
  let added = 0;
  while (added < daysFromNow) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date.toISOString().split('T')[0];
}

function formatDateUK(dateStr: string): string {
  if (!dateStr) return 'Not selected';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ============================================================
// Step labels for progress bar
// ============================================================

const STEP_LABELS = ['Property', 'Where', 'What', 'Describe', 'Photos', 'Priority', 'Appointment', 'Review'];
const TOTAL_STEPS = STEP_LABELS.length;

// ============================================================
// Wizard form state
// ============================================================

interface AiAnalysis {
  suggestedSorCode: string;
  suggestedSorDescription: string;
  suggestedPriority: string;
  suggestedTrade: string;
  isAwaabsLaw: boolean;
  estimatedCost: { min: number; max: number };
  confidence: number;
  reasoning: string;
  additionalFlags: string[];
}

interface PhotoAnalysis {
  suggestedCategory: string;
  suggestedPriority: string;
  possibleIssues: string[];
  description: string;
  confidence: number;
}

interface WizardFormData {
  // Property/Tenant
  propertyId: string;
  tenantId: string;
  // Location
  room: RoomKey | '';
  problem: string;
  descriptions: string[];
  freeText: string;
  // Photos
  photos: File[];
  photoPreviews: string[];
  // Priority
  priority: PriorityResult | null;
  priorityOverride: PriorityLevel | '';
  // Appointment
  preferredDate: string;
  preferredTime: 'morning' | 'afternoon' | 'all-day' | '';
  // AI analysis
  aiAnalysis: AiAnalysis | null;
  photoAnalysis: PhotoAnalysis | null;
}

const INITIAL_FORM: WizardFormData = {
  propertyId: '',
  tenantId: '',
  room: '',
  problem: '',
  descriptions: [],
  freeText: '',
  photos: [],
  photoPreviews: [],
  priority: null,
  priorityOverride: '',
  preferredDate: '',
  preferredTime: '',
  aiAnalysis: null,
  photoAnalysis: null,
};

// ============================================================
// AI Quick Report form state
// ============================================================

interface QuickReportData {
  propertyId: string;
  tenantId: string;
  description: string;
  photos: File[];
  photoPreviews: string[];
  aiAnalysis: AiAnalysis | null;
  photoAnalysis: PhotoAnalysis | null;
  priorityOverride: PriorityLevel | '';
  preferredDate: string;
  preferredTime: 'morning' | 'afternoon' | 'all-day' | '';
}

const INITIAL_QUICK: QuickReportData = {
  propertyId: '',
  tenantId: '',
  description: '',
  photos: [],
  photoPreviews: [],
  aiAnalysis: null,
  photoAnalysis: null,
  priorityOverride: '',
  preferredDate: '',
  preferredTime: '',
};

// ============================================================
// Component
// ============================================================

export default function ReportRepairWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Mode: 'choose' | 'ai' | 'manual'
  const [mode, setMode] = useState<'choose' | 'ai' | 'manual'>('choose');

  // Manual wizard state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM);

  // AI quick report state
  const [quickData, setQuickData] = useState<QuickReportData>(INITIAL_QUICK);
  const [quickStep, setQuickStep] = useState<'input' | 'analysing' | 'review'>('input');

  // Shared state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Data
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();

  const isHousingOfficer = useMemo(() => {
    const persona = localStorage.getItem('socialhomes-persona') || 'housing-officer';
    return persona !== 'tenant';
  }, []);

  // Filter tenants by selected property
  const filteredTenants = useMemo(() => {
    const propId = mode === 'ai' ? quickData.propertyId : formData.propertyId;
    if (!propId) return tenants;
    return tenants.filter((t: any) => t.propertyId === propId);
  }, [mode, quickData.propertyId, formData.propertyId, tenants]);

  // Calculate earliest available date based on priority
  const earliestDate = useMemo(() => {
    if (mode === 'ai') {
      const p = quickData.priorityOverride || quickData.aiAnalysis?.suggestedPriority || 'routine';
      switch (p) {
        case 'emergency': return getNextWorkingDay(1);
        case 'awaabs-law':
        case 'urgent': return getNextWorkingDay(2);
        default: return getNextWorkingDay(3);
      }
    }
    const effectivePriority = formData.priorityOverride || formData.priority?.level || 'routine';
    switch (effectivePriority) {
      case 'emergency': return getNextWorkingDay(1);
      case 'awaabs-law':
      case 'urgent': return getNextWorkingDay(2);
      default: return getNextWorkingDay(3);
    }
  }, [mode, formData.priority, formData.priorityOverride, quickData.aiAnalysis, quickData.priorityOverride]);

  // Auto-default preferredDate when it becomes available
  useEffect(() => {
    if (mode === 'ai' && quickStep === 'review' && !quickData.preferredDate) {
      setQuickData(prev => ({ ...prev, preferredDate: earliestDate, preferredTime: 'morning' }));
    }
  }, [mode, quickStep, earliestDate]);

  // Determine if Next is enabled for the current step (manual wizard)
  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return formData.propertyId !== '';
      case 2: return formData.room !== '';
      case 3: return formData.problem !== '';
      case 4: return formData.descriptions.length > 0 || formData.freeText.trim().length > 0;
      case 5: return true; // Photos optional
      case 6: return formData.priority !== null;
      case 7: return formData.preferredDate !== '' && formData.preferredTime !== '';
      case 8: return true;
      default: return false;
    }
  }, [step, formData]);

  // ---- Manual wizard handlers ----

  const handleNext = useCallback(() => {
    if (step === 5 && !formData.priority) {
      const priority = autoPriority(formData.room, formData.problem, formData.descriptions);
      setFormData(prev => ({ ...prev, priority }));
    }
    // Auto-default date on reaching appointment step
    if (step === 6 && !formData.preferredDate) {
      setFormData(prev => ({ ...prev, preferredDate: earliestDate, preferredTime: prev.preferredTime || 'morning' }));
    }
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  }, [step, formData, earliestDate]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(s => s - 1);
  }, [step]);

  const selectRoom = useCallback((roomId: RoomKey) => {
    setFormData(prev => ({ ...prev, room: roomId, problem: '', descriptions: [], priority: null, priorityOverride: '', aiAnalysis: null }));
  }, []);

  const selectProblem = useCallback((problem: string) => {
    setFormData(prev => ({ ...prev, problem, descriptions: [], priority: null, priorityOverride: '', aiAnalysis: null }));
  }, []);

  const toggleDescription = useCallback((desc: string) => {
    setFormData(prev => ({
      ...prev,
      descriptions: prev.descriptions.includes(desc) ? prev.descriptions.filter(d => d !== desc) : [...prev.descriptions, desc],
    }));
  }, []);

  // ---- Photo handling (shared) ----

  const addPhotos = useCallback((files: FileList | null, isQuick: boolean) => {
    if (!files) return;
    const accepted = Array.from(files).filter(f =>
      f.type === 'image/jpeg' || f.type === 'image/png' || f.type === 'image/heic'
    );
    const setter = isQuick ? setQuickData : setFormData;
    setter((prev: any) => {
      const remaining = 3 - prev.photos.length;
      const toAdd = accepted.slice(0, remaining);
      const newPreviews = toAdd.map((f: File) => URL.createObjectURL(f));
      return { ...prev, photos: [...prev.photos, ...toAdd], photoPreviews: [...prev.photoPreviews, ...newPreviews] };
    });
  }, []);

  const removePhoto = useCallback((index: number, isQuick: boolean) => {
    const setter = isQuick ? setQuickData : setFormData;
    setter((prev: any) => {
      URL.revokeObjectURL(prev.photoPreviews[index]);
      return {
        ...prev,
        photos: prev.photos.filter((_: any, i: number) => i !== index),
        photoPreviews: prev.photoPreviews.filter((_: any, i: number) => i !== index),
      };
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent, isQuick: boolean) => {
    e.preventDefault(); e.stopPropagation();
    addPhotos(e.dataTransfer.files, isQuick);
  }, [addPhotos]);

  // ---- AI Analysis ----

  const runAiAnalysis = useCallback(async () => {
    setAnalysing(true);
    setQuickStep('analysing');
    try {
      // Run text analysis
      const analysis = await aiApi.repairIntake(quickData.description, quickData.propertyId || undefined);
      setQuickData(prev => ({ ...prev, aiAnalysis: analysis }));

      // Run photo analysis if photos are available
      if (quickData.photos.length > 0) {
        try {
          const file = quickData.photos[0];
          const base64 = await fileToBase64(file);
          const photoResult = await aiApi.analyseRepairPhoto(base64);
          setQuickData(prev => ({ ...prev, photoAnalysis: photoResult }));
        } catch {
          // Photo analysis is best-effort
        }
      }

      setQuickStep('review');
    } catch (err: any) {
      // Fallback to local analysis
      const localAnalysis = localRepairAnalysis(quickData.description);
      setQuickData(prev => ({ ...prev, aiAnalysis: localAnalysis }));
      setQuickStep('review');
    } finally {
      setAnalysing(false);
    }
  }, [quickData.description, quickData.propertyId, quickData.photos]);

  // Also trigger AI analysis for manual wizard (on step 6 - priority)
  const runManualAiEnrichment = useCallback(async () => {
    if (formData.aiAnalysis) return; // Already ran
    const fullDescription = [
      formData.room, formData.problem, ...formData.descriptions, formData.freeText,
    ].filter(Boolean).join('. ');
    try {
      const analysis = await aiApi.repairIntake(fullDescription, formData.propertyId || undefined);
      setFormData(prev => ({ ...prev, aiAnalysis: analysis }));
    } catch {
      // Non-critical
    }
  }, [formData.room, formData.problem, formData.descriptions, formData.freeText, formData.propertyId, formData.aiAnalysis]);

  useEffect(() => {
    if (step === 6 && !formData.aiAnalysis) {
      runManualAiEnrichment();
    }
  }, [step]);

  // ---- Submit (shared) ----

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const ref = 'RPR-' + Date.now().toString(36).toUpperCase();

      if (mode === 'ai') {
        const ai = quickData.aiAnalysis;
        const effectivePriority = quickData.priorityOverride || ai?.suggestedPriority || 'routine';
        const prop = properties.find((p: any) => p.id === quickData.propertyId);
        const tenant = tenants.find((t: any) => t.id === quickData.tenantId);

        await casesApi.create({
          type: 'repair',
          reference: ref,
          subject: ai?.suggestedSorDescription || quickData.description.slice(0, 80),
          description: quickData.description,
          priority: effectivePriority === 'awaabs-law' ? 'urgent' : effectivePriority,
          status: effectivePriority === 'emergency' ? 'emergency' : 'open',
          trade: ai?.suggestedTrade || 'General',
          sorCode: ai?.suggestedSorCode || 'GN002',
          sorDescription: ai?.suggestedSorDescription || 'General repair',
          isAwaabsLaw: ai?.isAwaabsLaw || false,
          propertyId: quickData.propertyId || undefined,
          tenantId: quickData.tenantId || undefined,
          address: prop?.address,
          tenantName: tenant ? `${tenant.title} ${tenant.firstName} ${tenant.lastName}` : undefined,
          targetDate: calculateTargetDate(effectivePriority as PriorityLevel),
          preferredDate: quickData.preferredDate,
          preferredTime: quickData.preferredTime,
          photoCount: quickData.photos.length,
          estimatedCost: ai?.estimatedCost,
          aiConfidence: ai?.confidence,
          aiFlags: ai?.additionalFlags,
          createdDate: new Date().toISOString().split('T')[0],
          daysOpen: 0,
          recurrenceRisk: 0,
          handler: '',
          operative: '',
        });
      } else {
        const effectivePriority = formData.priorityOverride || formData.priority?.level || 'routine';
        const roomDef = ROOMS.find(r => r.id === formData.room);
        const ai = formData.aiAnalysis;
        const sor = suggestSorCode(formData.room, formData.problem, formData.descriptions);
        const trade = ai?.suggestedTrade || determineTrade(formData.room, formData.problem);
        const prop = properties.find((p: any) => p.id === formData.propertyId);
        const tenant = tenants.find((t: any) => t.id === formData.tenantId);

        await casesApi.create({
          type: 'repair',
          reference: ref,
          subject: `${roomDef?.label || formData.room} — ${formData.problem}`,
          description: [
            ...formData.descriptions,
            formData.freeText.trim() ? formData.freeText.trim() : null,
          ].filter(Boolean).join('. '),
          room: formData.room,
          problem: formData.problem,
          priority: effectivePriority === 'awaabs-law' ? 'urgent' : effectivePriority,
          status: effectivePriority === 'emergency' ? 'emergency' : 'open',
          trade: trade,
          sorCode: ai?.suggestedSorCode || sor.code,
          sorDescription: ai?.suggestedSorDescription || sor.description,
          isAwaabsLaw: effectivePriority === 'awaabs-law' || (ai?.isAwaabsLaw ?? false),
          propertyId: formData.propertyId || undefined,
          tenantId: formData.tenantId || undefined,
          address: prop?.address,
          tenantName: tenant ? `${tenant.title} ${tenant.firstName} ${tenant.lastName}` : undefined,
          targetDate: calculateTargetDate(effectivePriority as PriorityLevel),
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          photoCount: formData.photos.length,
          estimatedCost: ai?.estimatedCost,
          aiConfidence: ai?.confidence,
          aiFlags: ai?.additionalFlags,
          createdDate: new Date().toISOString().split('T')[0],
          daysOpen: 0,
          recurrenceRisk: ai?.confidence ? Math.round((1 - ai.confidence) * 30) : 0,
          handler: '',
          operative: '',
        });
      }

      setReferenceNumber(ref);
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit repair. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [mode, formData, quickData, properties, tenants, queryClient]);

  // ---- Render helpers ----

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'text-status-critical';
      case 'awaabs-law': return 'text-status-warning';
      case 'urgent': return 'text-status-warning';
      default: return 'text-brand-blue';
    }
  };

  const getPriorityBg = (level: string) => {
    switch (level) {
      case 'emergency': return 'bg-status-critical/20 border-status-critical/30';
      case 'awaabs-law': return 'bg-status-warning/20 border-status-warning/30';
      case 'urgent': return 'bg-status-warning/20 border-status-warning/30';
      default: return 'bg-brand-blue/20 border-brand-blue/30';
    }
  };

  // ============================================================
  // Property/Tenant selector component (reused in both modes)
  // ============================================================

  const PropertyTenantSelector = ({ propId, tenId, onChange, showLabel = true }: {
    propId: string; tenId: string;
    onChange: (field: string, value: string) => void;
    showLabel?: boolean;
  }) => {
    const [propSearch, setPropSearch] = useState('');
    const filteredProps = properties.filter((p: any) =>
      !propSearch || p.address?.toLowerCase().includes(propSearch.toLowerCase()) || p.uprn?.includes(propSearch)
    ).slice(0, 20);

    return (
      <div className="space-y-4">
        {showLabel && (
          <>
            <h2 className="text-xl font-bold text-text-primary mb-1">Select property and tenant</h2>
            <p className="text-text-muted text-sm mb-4">Link this repair to a property and tenant for tracking.</p>
          </>
        )}
        <div>
          <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">
            <Building2 size={12} className="inline mr-1 -mt-0.5" /> Property
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by address or UPRN..."
              value={propSearch}
              onChange={(e) => setPropSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 mb-2 bg-surface-dark border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
          </div>
          <select
            value={propId}
            onChange={(e) => { onChange('propertyId', e.target.value); setPropSearch(''); }}
            className="w-full px-4 py-3 bg-surface-dark border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent appearance-none cursor-pointer"
          >
            <option value="">-- Select property --</option>
            {filteredProps.map((p: any) => (
              <option key={p.id} value={p.id}>{p.address} ({p.uprn})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">
            <User size={12} className="inline mr-1 -mt-0.5" /> Tenant {!propId && <span className="text-text-muted/50">(select property first)</span>}
          </label>
          <select
            value={tenId}
            onChange={(e) => onChange('tenantId', e.target.value)}
            disabled={!propId}
            className="w-full px-4 py-3 bg-surface-dark border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent appearance-none cursor-pointer disabled:opacity-50"
          >
            <option value="">-- Select tenant (optional) --</option>
            {filteredTenants.map((t: any) => (
              <option key={t.id} value={t.id}>{t.title} {t.firstName} {t.lastName}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  // ============================================================
  // Photo upload component (reused)
  // ============================================================

  const PhotoUpload = ({ photos, previews, isQuick }: { photos: File[]; previews: string[]; isQuick: boolean }) => {
    const inputRef = isQuick ? quickFileInputRef : fileInputRef;
    return (
      <div>
        {photos.length < 3 && (
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, isQuick)}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border-default rounded-xl p-6 text-center cursor-pointer hover:border-brand-teal/50 hover:bg-brand-teal/5 transition-all duration-200"
          >
            <Camera size={28} className="mx-auto text-text-muted mb-2" />
            <p className="text-text-secondary text-sm font-medium mb-1">Drop photos here or click to browse</p>
            <p className="text-text-muted text-xs">JPG, PNG, or HEIC (max 3 photos)</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic"
              multiple
              className="hidden"
              onChange={(e) => addPhotos(e.target.files, isQuick)}
            />
          </div>
        )}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {previews.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border-default">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(i, isQuick); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-status-critical text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // Date + Time picker component (reused)
  // ============================================================

  const DateTimePicker = ({ date, time, earliest, onChange }: {
    date: string; time: string; earliest: string;
    onChange: (field: string, value: string) => void;
  }) => (
    <div className="space-y-5">
      <div>
        <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">
          <Calendar size={12} className="inline mr-1 -mt-0.5" /> Preferred Date
        </label>
        <input
          type="date"
          value={date}
          min={earliest}
          onChange={(e) => onChange('preferredDate', e.target.value)}
          className="w-full px-4 py-3 bg-surface-dark border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent [color-scheme:dark]"
        />
        <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
          <Info size={11} className="text-brand-teal" />
          Earliest available: {formatDateUK(earliest)}
        </p>
      </div>
      <div>
        <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">
          <Clock size={12} className="inline mr-1 -mt-0.5" /> Time Preference
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { id: 'morning', label: 'Morning', sub: '8am — 12pm' },
            { id: 'afternoon', label: 'Afternoon', sub: '12pm — 5pm' },
            { id: 'all-day', label: 'All Day', sub: '8am — 5pm' },
          ] as const).map(slot => (
            <button
              key={slot.id}
              onClick={() => onChange('preferredTime', slot.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                time === slot.id
                  ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                  : 'border-border-default bg-surface-elevated text-text-secondary hover:border-brand-teal/50'
              }`}
            >
              <div className="text-sm font-medium">{slot.label}</div>
              <div className="text-xs mt-0.5 opacity-70">{slot.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================
  // SUCCESS SCREEN (shared)
  // ============================================================
  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-surface-card rounded-xl p-8 md:p-12 border border-border-default text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
            <div className="w-16 h-16 rounded-full bg-status-compliant/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-status-compliant" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-2">Repair Reported</h1>
            <p className="text-text-muted mb-6">Your repair has been successfully logged and saved. We will be in touch to confirm your appointment.</p>
            <div className="bg-surface-elevated rounded-lg p-4 mb-8 inline-block">
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Reference Number</div>
              <div className="text-2xl font-bold font-heading text-brand-teal tracking-wider">{referenceNumber}</div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => navigate('/repairs')} className="px-6 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/80 transition-colors font-medium">
                View All Repairs
              </button>
              <button
                onClick={() => { setMode('choose'); setStep(1); setFormData(INITIAL_FORM); setQuickData(INITIAL_QUICK); setQuickStep('input'); setSubmitted(false); setReferenceNumber(''); }}
                className="px-6 py-3 bg-surface-elevated text-text-primary rounded-lg hover:bg-surface-hover transition-colors font-medium border border-border-default"
              >
                Report Another Repair
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MODE CHOOSER
  // ============================================================
  if (mode === 'choose') {
    return (
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-4 mb-1">
              <button onClick={() => navigate('/repairs')} className="text-text-muted hover:text-brand-teal transition-colors text-sm">
                <span className="flex items-center gap-1"><ArrowLeft size={14} /> Back to Repairs</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">Report a Repair</h1>
            <p className="text-text-muted">Choose how you would like to report the issue.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            {/* AI Quick Report */}
            <button
              onClick={() => setMode('ai')}
              className="bg-surface-card rounded-xl p-6 border-2 border-border-default hover:border-brand-teal text-left transition-all duration-200 hover:shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-teal/20 to-brand-blue/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles size={24} className="text-brand-teal" />
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-1">AI Quick Report</h2>
              <p className="text-sm text-text-muted mb-4">
                Describe the problem in your own words. AI will analyse your description and photos to auto-classify the repair, suggest priority, and estimate trade and cost.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] px-2 py-1 rounded-full bg-brand-teal/10 text-brand-teal font-medium">AI Classification</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-brand-blue/10 text-brand-blue font-medium">Photo Analysis</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-status-compliant/10 text-status-compliant font-medium">Auto-Priority</span>
              </div>
            </button>

            {/* Manual Wizard */}
            <button
              onClick={() => setMode('manual')}
              className="bg-surface-card rounded-xl p-6 border-2 border-border-default hover:border-brand-teal text-left transition-all duration-200 hover:shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-peach/20 to-status-warning/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PenLine size={24} className="text-brand-peach" />
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-1">Step-by-Step Wizard</h2>
              <p className="text-sm text-text-muted mb-4">
                Walk through each step to precisely identify the room, problem type, and details. Best when you want full control over how the repair is categorised.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] px-2 py-1 rounded-full bg-brand-peach/10 text-brand-peach font-medium">Guided Steps</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-brand-blue/10 text-brand-blue font-medium">Room Selection</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-status-compliant/10 text-status-compliant font-medium">Full Control</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // AI QUICK REPORT MODE
  // ============================================================
  if (mode === 'ai') {
    return (
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-4 mb-1">
              <button onClick={() => setMode('choose')} className="text-text-muted hover:text-brand-teal transition-colors text-sm">
                <span className="flex items-center gap-1"><ArrowLeft size={14} /> Change mode</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles size={28} className="text-brand-teal" />
              <div>
                <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">AI Quick Report</h1>
                <p className="text-text-muted">Describe the problem and let AI handle the rest.</p>
              </div>
            </div>
          </div>

          {/* Input phase */}
          {quickStep === 'input' && (
            <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              {/* Property/Tenant */}
              <div className="bg-surface-card rounded-xl p-6 border border-border-default">
                <PropertyTenantSelector
                  propId={quickData.propertyId}
                  tenId={quickData.tenantId}
                  onChange={(field, value) => setQuickData(prev => ({ ...prev, [field]: value }))}
                  showLabel={true}
                />
              </div>

              {/* Description */}
              <div className="bg-surface-card rounded-xl p-6 border border-border-default">
                <h2 className="text-xl font-bold text-text-primary mb-1">What is the problem?</h2>
                <p className="text-text-muted text-sm mb-4">Describe the issue in your own words. Be as detailed as you can — mention the room, what is broken, and how bad it is.</p>
                <textarea
                  value={quickData.description}
                  onChange={(e) => setQuickData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. The kitchen tap has been dripping for a week and now there's water pooling under the sink. The cupboard underneath is getting damp..."
                  rows={5}
                  className="w-full px-4 py-3 bg-surface-dark border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent resize-none text-sm"
                />
                <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                  <Sparkles size={12} className="text-brand-teal" />
                  AI will identify the room, problem type, trade, SOR code, priority, and flag any compliance issues.
                </div>
              </div>

              {/* Photos */}
              <div className="bg-surface-card rounded-xl p-6 border border-border-default">
                <h2 className="text-lg font-bold text-text-primary mb-1">Upload photos <span className="text-text-muted font-normal text-sm">(optional)</span></h2>
                <p className="text-text-muted text-sm mb-4">Photos help AI diagnose the issue more accurately.</p>
                <PhotoUpload photos={quickData.photos} previews={quickData.photoPreviews} isQuick={true} />
              </div>

              {/* Analyse button */}
              <div className="flex items-center justify-between">
                <button onClick={() => setMode('choose')} className="flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-text-primary bg-surface-card border border-border-default hover:bg-surface-hover transition-all">
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={runAiAnalysis}
                  disabled={!quickData.description.trim() || !quickData.propertyId}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-teal text-white rounded-lg font-medium hover:bg-brand-teal/80 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles size={16} />
                  Analyse with AI
                </button>
              </div>
            </div>
          )}

          {/* Analysing phase */}
          {quickStep === 'analysing' && (
            <div className="bg-surface-card rounded-xl p-12 border border-border-default text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <div className="w-16 h-16 rounded-full bg-brand-teal/20 flex items-center justify-center mx-auto mb-6">
                <Loader2 size={32} className="text-brand-teal animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">AI is analysing your repair...</h2>
              <p className="text-text-muted text-sm mb-6">Identifying problem type, trade, priority, and checking compliance requirements.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-elevated px-3 py-1.5 rounded-full">
                  <Loader2 size={12} className="animate-spin text-brand-teal" /> Classifying repair type
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-elevated px-3 py-1.5 rounded-full">
                  <Loader2 size={12} className="animate-spin text-brand-blue" /> Matching SOR code
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-elevated px-3 py-1.5 rounded-full">
                  <Loader2 size={12} className="animate-spin text-status-warning" /> Checking compliance
                </div>
              </div>
            </div>
          )}

          {/* Review phase */}
          {quickStep === 'review' && quickData.aiAnalysis && (
            <div className="space-y-5 opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              {/* AI analysis summary */}
              <div className="bg-surface-card rounded-xl p-6 border border-brand-teal/30">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-brand-teal" />
                  <h2 className="text-lg font-bold text-text-primary">AI Analysis</h2>
                  <span className="ml-auto text-xs px-2 py-1 rounded-full bg-brand-teal/10 text-brand-teal font-medium">
                    {Math.round(quickData.aiAnalysis.confidence * 100)}% confidence
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Trade</div>
                    <div className="text-sm font-medium text-text-primary">{quickData.aiAnalysis.suggestedTrade}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">SOR Code</div>
                    <div className="text-sm font-medium text-text-primary">{quickData.aiAnalysis.suggestedSorCode}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Est. Cost</div>
                    <div className="text-sm font-medium text-text-primary">
                      {quickData.aiAnalysis.estimatedCost
                        ? `£${quickData.aiAnalysis.estimatedCost.min}–£${quickData.aiAnalysis.estimatedCost.max}`
                        : 'TBD'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Priority</div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${getPriorityBg(quickData.priorityOverride || quickData.aiAnalysis.suggestedPriority)} ${getPriorityColor(quickData.priorityOverride || quickData.aiAnalysis.suggestedPriority)}`}>
                      {quickData.priorityOverride || quickData.aiAnalysis.suggestedPriority}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-text-secondary bg-surface-elevated rounded-lg p-3 mb-3">
                  <strong>SOR:</strong> {quickData.aiAnalysis.suggestedSorDescription}
                </div>

                <div className="text-xs text-text-muted italic">{quickData.aiAnalysis.reasoning}</div>

                {/* AI flags */}
                {quickData.aiAnalysis.additionalFlags.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {quickData.aiAnalysis.additionalFlags.map((flag, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-status-warning/10 text-status-warning px-3 py-1.5 rounded-lg">
                        <AlertTriangle size={12} /> {flag}
                      </div>
                    ))}
                  </div>
                )}

                {/* Awaab's Law banner */}
                {quickData.aiAnalysis.isAwaabsLaw && (
                  <div className="mt-3 bg-status-critical/10 border border-status-critical/30 rounded-lg p-3 flex items-start gap-2">
                    <Shield size={16} className="text-status-critical mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-status-critical">Awaab's Law Case Detected</p>
                      <p className="text-xs text-text-secondary">Strict timelines apply. Investigation must begin within 14 calendar days.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo analysis (if available) */}
              {quickData.photoAnalysis && quickData.photoAnalysis.confidence > 0 && (
                <div className="bg-surface-card rounded-xl p-5 border border-border-default">
                  <div className="flex items-center gap-2 mb-3">
                    <Camera size={16} className="text-brand-blue" />
                    <h3 className="text-sm font-bold text-text-primary">Photo Analysis</h3>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue font-medium">
                      {Math.round(quickData.photoAnalysis.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">{quickData.photoAnalysis.description}</p>
                  {quickData.photoAnalysis.possibleIssues.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {quickData.photoAnalysis.possibleIssues.map((issue, i) => (
                        <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-surface-elevated text-text-muted">{issue}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Priority override (housing officer) */}
              {isHousingOfficer && (
                <div className="bg-surface-card rounded-xl p-5 border border-border-default">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">Override Priority (Housing Officer)</div>
                  <div className="flex flex-wrap gap-2">
                    {(['emergency', 'awaabs-law', 'urgent', 'routine'] as PriorityLevel[]).map(level => {
                      const current = quickData.priorityOverride || quickData.aiAnalysis?.suggestedPriority;
                      const isActive = current === level;
                      const label = level === 'awaabs-law' ? "Awaab's Law" : level.charAt(0).toUpperCase() + level.slice(1);
                      return (
                        <button
                          key={level}
                          onClick={() => setQuickData(prev => ({
                            ...prev,
                            priorityOverride: level === prev.aiAnalysis?.suggestedPriority ? '' : level,
                          }))}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                            isActive ? `${getPriorityBg(level)} ${getPriorityColor(level)} border-current` : 'border-border-default bg-surface-dark text-text-muted hover:border-brand-teal/50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Appointment */}
              <div className="bg-surface-card rounded-xl p-6 border border-border-default">
                <h2 className="text-lg font-bold text-text-primary mb-4">Preferred appointment</h2>
                <DateTimePicker
                  date={quickData.preferredDate}
                  time={quickData.preferredTime}
                  earliest={earliestDate}
                  onChange={(field, value) => setQuickData(prev => ({ ...prev, [field]: value }))}
                />
              </div>

              {/* Submit error */}
              {submitError && (
                <div className="bg-status-critical/10 border border-status-critical/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-status-critical flex-shrink-0" />
                  <p className="text-sm text-status-critical">{submitError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button onClick={() => { setQuickStep('input'); setQuickData(prev => ({ ...prev, aiAnalysis: null, photoAnalysis: null })); }}
                  className="flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-text-primary bg-surface-card border border-border-default hover:bg-surface-hover transition-all"
                >
                  <ArrowLeft size={16} /> Edit Description
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !quickData.preferredDate || !quickData.preferredTime}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-teal text-white rounded-lg font-medium hover:bg-brand-teal/80 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><CheckCircle size={16} /> Report Repair</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // MANUAL WIZARD MODE
  // ============================================================
  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-4 mb-1">
            <button onClick={() => setMode('choose')} className="text-text-muted hover:text-brand-teal transition-colors text-sm">
              <span className="flex items-center gap-1"><ArrowLeft size={14} /> Change mode</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">Report a Repair</h1>
          <p className="text-text-muted">Tell us about the problem and we will get it sorted.</p>
        </div>

        {/* Progress bar */}
        <div className="bg-surface-card rounded-xl p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-3">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const isComplete = step > stepNum;
              const isCurrent = step === stepNum;
              return (
                <div key={label} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isComplete ? 'bg-brand-teal text-white' : isCurrent ? 'bg-brand-teal text-white ring-2 ring-brand-teal/30 ring-offset-2 ring-offset-surface-card' : 'bg-surface-elevated text-text-muted border border-border-default'
                  }`}>
                    {isComplete ? <CheckCircle size={14} /> : stepNum}
                  </div>
                  <span className={`text-[10px] mt-1 uppercase tracking-wider font-medium hidden sm:block ${
                    isCurrent ? 'text-brand-teal' : isComplete ? 'text-text-secondary' : 'text-text-muted'
                  }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="w-full bg-surface-elevated rounded-full h-1.5">
            <div className="bg-brand-teal h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }} />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-surface-card rounded-xl p-6 md:p-8 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>

          {/* STEP 1: PROPERTY/TENANT */}
          {step === 1 && (
            <div className="animate-fade-in">
              <PropertyTenantSelector
                propId={formData.propertyId}
                tenId={formData.tenantId}
                onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
              />
            </div>
          )}

          {/* STEP 2: WHERE */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Where is the problem?</h2>
              <p className="text-text-muted text-sm mb-6">Select the area of your home where the issue is.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ROOMS.map(room => {
                  const Icon = room.icon;
                  const isSelected = formData.room === room.id;
                  return (
                    <button key={room.id} onClick={() => selectRoom(room.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                        isSelected ? 'border-brand-teal bg-brand-teal/10 text-brand-teal shadow-sm' : 'border-border-default bg-surface-elevated text-text-secondary hover:border-brand-teal/50 hover:text-text-primary'
                      }`}
                    >
                      <Icon size={28} strokeWidth={isSelected ? 2.5 : 1.5} />
                      <span className="text-sm font-medium">{room.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: WHAT */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">What is the problem?</h2>
              <p className="text-text-muted text-sm mb-6">
                Select the type of issue in your <span className="text-brand-teal font-medium">{ROOMS.find(r => r.id === formData.room)?.label}</span>.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(formData.room ? PROBLEMS[formData.room] : []).map(problem => {
                  const isSelected = formData.problem === problem;
                  return (
                    <button key={problem} onClick={() => selectProblem(problem)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                        isSelected ? 'border-brand-teal bg-brand-teal/10 text-brand-teal shadow-sm' : 'border-border-default bg-surface-elevated text-text-secondary hover:border-brand-teal/50 hover:text-text-primary'
                      }`}
                    >
                      <Wrench size={18} strokeWidth={isSelected ? 2.5 : 1.5} className="flex-shrink-0" />
                      <span className="text-sm font-medium">{problem}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: DESCRIBE */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Describe the issue</h2>
              <p className="text-text-muted text-sm mb-6">Select all that apply, and add any extra detail below.</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {(DESCRIPTIONS[`${formData.room}|${formData.problem}`] ?? []).map(desc => {
                  const isSelected = formData.descriptions.includes(desc);
                  return (
                    <button key={desc} onClick={() => toggleDescription(desc)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                        isSelected ? 'border-brand-teal bg-brand-teal/10 text-brand-teal' : 'border-border-default bg-surface-elevated text-text-secondary hover:border-brand-teal/50'
                      }`}
                    >
                      {desc}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={formData.freeText}
                onChange={(e) => setFormData(prev => ({ ...prev, freeText: e.target.value }))}
                placeholder="Add any extra details about the problem..."
                rows={4}
                className="w-full px-4 py-3 bg-surface-dark border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* STEP 5: PHOTOS */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Upload photos</h2>
              <p className="text-text-muted text-sm mb-6">
                <Camera size={14} className="inline mr-1 -mt-0.5" />
                Photos help us diagnose the issue faster. You can upload up to 3 images.
              </p>
              <PhotoUpload photos={formData.photos} previews={formData.photoPreviews} isQuick={false} />
              {formData.photos.length === 0 && (
                <p className="text-text-muted text-xs mt-4 italic">This step is optional. You can skip it by clicking Next.</p>
              )}
            </div>
          )}

          {/* STEP 6: PRIORITY */}
          {step === 6 && formData.priority && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Priority assessment</h2>
              <p className="text-text-muted text-sm mb-6">Based on your answers, we have assessed the priority of this repair.</p>

              {(formData.priorityOverride || formData.priority.level) === 'emergency' && (
                <div className="bg-status-critical/10 border border-status-critical/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <AlertTriangle size={24} className="text-status-critical flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-status-critical mb-1">This is classified as an emergency.</p>
                    <p className="text-xs text-text-secondary">
                      If you are in immediate danger, call <span className="font-bold">999</span>. For gas emergencies, call the National Gas Emergency Service on <span className="font-bold">0800 111 999</span>.
                    </p>
                  </div>
                </div>
              )}

              <div className={`rounded-xl border p-6 mb-4 ${getPriorityBg(formData.priorityOverride || formData.priority.level)}`}>
                <div className={`text-2xl font-bold font-heading uppercase tracking-wider mb-2 ${getPriorityColor(formData.priorityOverride || formData.priority.level)}`}>
                  {formData.priorityOverride
                    ? (formData.priorityOverride === 'awaabs-law' ? "Awaab's Law" : formData.priorityOverride.charAt(0).toUpperCase() + formData.priorityOverride.slice(1))
                    : formData.priority.label}
                </div>
                <p className="text-sm text-text-secondary">{formData.priority.explanation}</p>
              </div>

              {/* AI enrichment info */}
              {formData.aiAnalysis && (
                <div className="bg-surface-elevated rounded-xl p-4 border border-brand-teal/20 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-brand-teal" />
                    <span className="text-xs font-medium text-brand-teal uppercase tracking-wider">AI Intelligence</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-[10px] text-text-muted uppercase">Trade</div>
                      <div className="font-medium text-text-primary">{formData.aiAnalysis.suggestedTrade}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted uppercase">SOR Code</div>
                      <div className="font-medium text-text-primary">{formData.aiAnalysis.suggestedSorCode}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted uppercase">Est. Cost</div>
                      <div className="font-medium text-text-primary">£{formData.aiAnalysis.estimatedCost.min}–£{formData.aiAnalysis.estimatedCost.max}</div>
                    </div>
                  </div>
                </div>
              )}

              {isHousingOfficer && (
                <div className="bg-surface-elevated rounded-xl p-4 border border-border-default">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">Override Priority (Housing Officer only)</div>
                  <div className="flex flex-wrap gap-2">
                    {(['emergency', 'awaabs-law', 'urgent', 'routine'] as PriorityLevel[]).map(level => {
                      const current = formData.priorityOverride || formData.priority?.level;
                      const isActive = current === level;
                      const label = level === 'awaabs-law' ? "Awaab's Law" : level.charAt(0).toUpperCase() + level.slice(1);
                      return (
                        <button key={level}
                          onClick={() => setFormData(prev => ({ ...prev, priorityOverride: level === prev.priority?.level ? '' : level }))}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                            isActive ? `${getPriorityBg(level)} ${getPriorityColor(level)} border-current` : 'border-border-default bg-surface-dark text-text-muted hover:border-brand-teal/50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: APPOINTMENT */}
          {step === 7 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Preferred appointment</h2>
              <p className="text-text-muted text-sm mb-6">Choose your preferred date and time. We will confirm the exact time with you.</p>
              <DateTimePicker
                date={formData.preferredDate}
                time={formData.preferredTime}
                earliest={earliestDate}
                onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
              />
            </div>
          )}

          {/* STEP 8: REVIEW */}
          {step === 8 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Review your repair report</h2>
              <p className="text-text-muted text-sm mb-6">Please check everything is correct before submitting.</p>

              <div className="space-y-4">
                {/* Property */}
                <div className="flex items-start justify-between p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Property</div>
                    <div className="text-sm font-medium text-text-primary">
                      {properties.find((p: any) => p.id === formData.propertyId)?.address || 'Not selected'}
                    </div>
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs text-brand-teal hover:underline">Edit</button>
                </div>

                {/* Room */}
                <div className="flex items-start justify-between p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Location</div>
                    <div className="text-sm font-medium text-text-primary">{ROOMS.find(r => r.id === formData.room)?.label}</div>
                  </div>
                  <button onClick={() => setStep(2)} className="text-xs text-brand-teal hover:underline">Edit</button>
                </div>

                {/* Problem */}
                <div className="flex items-start justify-between p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Problem</div>
                    <div className="text-sm font-medium text-text-primary">{formData.problem}</div>
                  </div>
                  <button onClick={() => setStep(3)} className="text-xs text-brand-teal hover:underline">Edit</button>
                </div>

                {/* Description */}
                <div className="flex items-start justify-between p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <div className="flex-1 mr-4">
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Description</div>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {formData.descriptions.map(d => (
                        <span key={d} className="px-2 py-0.5 bg-brand-teal/10 text-brand-teal rounded text-xs font-medium">{d}</span>
                      ))}
                    </div>
                    {formData.freeText && <p className="text-sm text-text-secondary mt-1">{formData.freeText}</p>}
                  </div>
                  <button onClick={() => setStep(4)} className="text-xs text-brand-teal hover:underline flex-shrink-0">Edit</button>
                </div>

                {/* Photos */}
                <div className="flex items-start justify-between p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Photos</div>
                    {formData.photos.length > 0 ? (
                      <div className="flex gap-2 mt-1">
                        {formData.photoPreviews.map((url, i) => (
                          <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-12 h-12 rounded object-cover border border-border-default" />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-text-muted"><ImageIcon size={14} /> No photos attached</div>
                    )}
                  </div>
                  <button onClick={() => setStep(5)} className="text-xs text-brand-teal hover:underline">Edit</button>
                </div>

                {/* Priority + AI info */}
                <div className="flex items-start justify-between p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Priority</div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold uppercase ${getPriorityBg(formData.priorityOverride || formData.priority?.level || 'routine')} ${getPriorityColor(formData.priorityOverride || formData.priority?.level || 'routine')}`}>
                      {formData.priorityOverride
                        ? (formData.priorityOverride === 'awaabs-law' ? "Awaab's Law" : formData.priorityOverride)
                        : formData.priority?.label}
                    </span>
                    {formData.aiAnalysis && (
                      <div className="mt-2 text-xs text-text-muted">
                        Trade: {formData.aiAnalysis.suggestedTrade} | SOR: {formData.aiAnalysis.suggestedSorCode} | Target: {formatDateUK(calculateTargetDate((formData.priorityOverride || formData.priority?.level || 'routine') as PriorityLevel))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setStep(6)} className="text-xs text-brand-teal hover:underline">Edit</button>
                </div>

                {/* Appointment */}
                <div className="flex items-start justify-between p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Preferred Appointment</div>
                    <div className="text-sm font-medium text-text-primary">{formatDateUK(formData.preferredDate)}</div>
                    <div className="text-xs text-text-muted mt-0.5 capitalize">
                      {formData.preferredTime === 'morning' ? 'Morning (8am — 12pm)' :
                       formData.preferredTime === 'afternoon' ? 'Afternoon (12pm — 5pm)' :
                       formData.preferredTime === 'all-day' ? 'All Day (8am — 5pm)' : 'Not selected'}
                    </div>
                  </div>
                  <button onClick={() => setStep(7)} className="text-xs text-brand-teal hover:underline">Edit</button>
                </div>
              </div>

              {submitError && (
                <div className="mt-4 bg-status-critical/10 border border-status-critical/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-status-critical flex-shrink-0" />
                  <p className="text-sm text-status-critical">{submitError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
              step === 1 ? 'text-text-muted cursor-not-allowed opacity-40' : 'text-text-primary bg-surface-card border border-border-default hover:bg-surface-hover'
            }`}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                canProceed ? 'bg-brand-teal text-white hover:bg-brand-teal/80 shadow-sm' : 'bg-surface-elevated text-text-muted cursor-not-allowed'
              }`}
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-brand-teal text-white rounded-lg font-medium hover:bg-brand-teal/80 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><CheckCircle size={16} /> Report Repair</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function localRepairAnalysis(description: string): AiAnalysis {
  // Fallback local analysis when API isn't available
  const desc = description.toLowerCase();

  const SOR_KEYWORDS: { code: string; desc: string; trade: string; keywords: string[]; costMin: number; costMax: number; priority: string }[] = [
    { code: 'PL001', desc: 'Burst pipe — make safe and repair', trade: 'Plumber', keywords: ['burst', 'pipe', 'flooding'], costMin: 80, costMax: 250, priority: 'emergency' },
    { code: 'PL003', desc: 'Tap repair or replacement', trade: 'Plumber', keywords: ['tap', 'dripping', 'faucet'], costMin: 30, costMax: 100, priority: 'routine' },
    { code: 'PL004', desc: 'Blocked drain clearance', trade: 'Plumber', keywords: ['drain', 'blocked'], costMin: 60, costMax: 180, priority: 'urgent' },
    { code: 'HT001', desc: 'Total loss of heating', trade: 'Gas Engineer', keywords: ['no heating', 'boiler broken', 'no hot water'], costMin: 100, costMax: 400, priority: 'emergency' },
    { code: 'HT002', desc: 'Boiler service and repair', trade: 'Gas Engineer', keywords: ['boiler'], costMin: 80, costMax: 300, priority: 'urgent' },
    { code: 'HT003', desc: 'Radiator repair', trade: 'Gas Engineer', keywords: ['radiator'], costMin: 40, costMax: 200, priority: 'routine' },
    { code: 'EL001', desc: 'Total loss of power', trade: 'Electrician', keywords: ['no power', 'no electricity'], costMin: 80, costMax: 250, priority: 'emergency' },
    { code: 'EL002', desc: 'Socket or switch repair', trade: 'Electrician', keywords: ['socket', 'switch'], costMin: 30, costMax: 100, priority: 'routine' },
    { code: 'DM001', desc: 'Damp and mould investigation', trade: 'Damp Specialist', keywords: ['damp', 'mould', 'mold', 'condensation'], costMin: 0, costMax: 150, priority: 'urgent' },
    { code: 'CA001', desc: 'Door repair or replacement', trade: 'Carpenter', keywords: ['door', 'lock'], costMin: 40, costMax: 200, priority: 'routine' },
    { code: 'CA002', desc: 'Window repair', trade: 'Carpenter', keywords: ['window'], costMin: 60, costMax: 250, priority: 'routine' },
    { code: 'RF001', desc: 'Roof leak repair', trade: 'Roofer', keywords: ['roof leak', 'roof'], costMin: 100, costMax: 500, priority: 'urgent' },
  ];

  let best = SOR_KEYWORDS[SOR_KEYWORDS.length - 1];
  let bestScore = 0;
  for (const entry of SOR_KEYWORDS) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (desc.includes(kw)) score += kw.split(' ').length * 10;
    }
    if (score > bestScore) { bestScore = score; best = entry; }
  }

  const dampKeywords = ['damp', 'mould', 'mold', 'condensation'];
  const isAwaabsLaw = dampKeywords.some(kw => desc.includes(kw));
  const flags: string[] = [];
  if (isAwaabsLaw) flags.push("Awaab's Law applies — strict timelines");

  return {
    suggestedSorCode: bestScore > 0 ? best.code : 'GN002',
    suggestedSorDescription: bestScore > 0 ? best.desc : 'General repair',
    suggestedPriority: bestScore > 0 ? best.priority : 'routine',
    suggestedTrade: bestScore > 0 ? best.trade : 'General',
    isAwaabsLaw,
    estimatedCost: { min: best.costMin, max: best.costMax },
    confidence: bestScore > 0 ? Math.min(0.9, bestScore / 30) : 0.3,
    reasoning: bestScore > 0 ? `Matched SOR code ${best.code} based on keyword analysis.` : 'Unable to match specific SOR code. Manual classification may be needed.',
    additionalFlags: flags,
  };
}
