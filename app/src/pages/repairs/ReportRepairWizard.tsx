import { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesApi } from '@/services/api-client';
import {
  UtensilsCrossed, Bath, Bed, Sofa, DoorOpen, TreePine, Car, Home,
  ArrowLeft, ArrowRight, Upload, Camera, AlertTriangle, CheckCircle,
  Calendar, Clock, X, ImageIcon, Loader2, Wrench,
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
  'living-room': ['Window', 'Door', 'Wall', 'Ceiling', 'Floor', 'Heating/Radiator', 'Electrics', 'Fireplace'],
  hallway: ['Door', 'Wall', 'Ceiling', 'Floor', 'Stairs', 'Electrics', 'Entry System'],
  outside: ['Roof', 'Gutters', 'Walls', 'Fencing', 'Paths', 'Drainage', 'Garden', 'Door/Gate'],
  garage: ['Door', 'Electrics', 'Roof', 'Floor', 'Walls'],
  loft: ['Insulation', 'Roof', 'Access Hatch', 'Electrics', 'Water Tank'],
};

const DESCRIPTIONS: Record<string, string[]> = {
  // Kitchen
  'kitchen|Sink/Taps': ['Tap is dripping', 'Sink is blocked', 'Leak under the sink', 'Tap won\'t turn off', 'Waste pipe broken'],
  'kitchen|Worktop': ['Worktop is cracked', 'Worktop is lifting', 'Burn mark or damage', 'Worktop coming away from wall'],
  'kitchen|Cupboards/Units': ['Door is hanging off', 'Drawer is broken', 'Handle is missing', 'Unit is coming away from wall', 'Hinge is broken'],
  'kitchen|Tiles': ['Tiles are cracked', 'Tiles are loose', 'Grout is missing or mouldy', 'Tiles are falling off'],
  'kitchen|Extractor Fan': ['Fan is not working', 'Fan is very noisy', 'Fan is not extracting properly', 'Cover is damaged'],
  'kitchen|Boiler/Heating': ['No heating at all', 'No hot water', 'Boiler is making noise', 'Boiler is leaking', 'Radiator not heating'],
  'kitchen|Electrics': ['Socket not working', 'Light not working', 'Sparking or burning smell', 'Trip switch keeps going', 'No power at all'],
  'kitchen|Floor': ['Floor tiles cracked or loose', 'Vinyl is lifting', 'Floor is uneven', 'Floorboard is broken'],
  'kitchen|Ceiling': ['Ceiling is stained', 'Plaster is cracking', 'Ceiling is damp', 'Plaster is falling'],
  'kitchen|Damp/Mould': ['Black mould on walls', 'Condensation on windows', 'Damp patch on wall', 'Musty smell', 'Wallpaper peeling from damp'],

  // Bathroom
  'bathroom|Toilet': ['Toilet won\'t flush', 'Toilet is leaking', 'Toilet seat broken', 'Toilet is blocked', 'Cistern not filling'],
  'bathroom|Bath/Shower': ['Shower not working', 'Bath is leaking', 'Shower head broken', 'Bath sealant deteriorated', 'Bath panel loose'],
  'bathroom|Sink/Taps': ['Tap is dripping', 'Sink is blocked', 'Leak under the sink', 'Tap won\'t turn off'],
  'bathroom|Tiles': ['Tiles are cracked', 'Tiles are loose', 'Grout is missing', 'Tiles are falling off'],
  'bathroom|Extractor Fan': ['Fan is not working', 'Fan is very noisy', 'Fan is not extracting', 'Cover is damaged'],
  'bathroom|Mould': ['Black mould on ceiling', 'Mould around bath/shower', 'Mould on walls', 'Mould behind tiles', 'Persistent damp'],
  'bathroom|Floor': ['Floor tiles cracked', 'Vinyl is lifting', 'Floor is wet/leaking', 'Floor is soft or rotting'],
  'bathroom|Ceiling': ['Ceiling is stained', 'Plaster is cracking', 'Ceiling is damp', 'Plaster is falling'],

  // Bedroom
  'bedroom|Window': ['Window won\'t open', 'Window won\'t close', 'Broken glass', 'Lock is broken', 'Draught coming in'],
  'bedroom|Door': ['Door won\'t close', 'Handle is broken', 'Lock is broken', 'Door is damaged', 'Hinge is broken'],
  'bedroom|Wall': ['Crack in wall', 'Plaster is loose', 'Damp patch', 'Hole in wall', 'Paint is peeling'],
  'bedroom|Ceiling': ['Ceiling is stained', 'Plaster is cracking', 'Ceiling is damp', 'Light fitting damaged'],
  'bedroom|Floor': ['Floorboard is broken', 'Carpet is damaged', 'Floor is uneven', 'Squeaky floorboard'],
  'bedroom|Heating/Radiator': ['Radiator not heating', 'Radiator is leaking', 'Radiator is cold at top', 'Valve is broken', 'No heating at all'],
  'bedroom|Electrics': ['Socket not working', 'Light not working', 'Sparking or burning smell', 'Switch is broken'],
  'bedroom|Damp/Mould': ['Black mould on walls', 'Condensation on windows', 'Damp patch on wall', 'Musty smell', 'Wallpaper peeling'],

  // Living Room
  'living-room|Window': ['Window won\'t open', 'Window won\'t close', 'Broken glass', 'Lock is broken', 'Draught coming in'],
  'living-room|Door': ['Door won\'t close', 'Handle is broken', 'Lock is broken', 'Door is damaged'],
  'living-room|Wall': ['Crack in wall', 'Plaster is loose', 'Damp patch', 'Hole in wall'],
  'living-room|Ceiling': ['Ceiling is stained', 'Plaster is cracking', 'Ceiling is damp', 'Light fitting damaged'],
  'living-room|Floor': ['Floorboard is broken', 'Carpet is damaged', 'Floor is uneven', 'Squeaky floorboard'],
  'living-room|Heating/Radiator': ['Radiator not heating', 'Radiator is leaking', 'Radiator is cold at top', 'Valve is broken', 'No heating at all'],
  'living-room|Electrics': ['Socket not working', 'Light not working', 'Sparking or burning smell', 'Switch is broken'],
  'living-room|Fireplace': ['Fireplace is blocked', 'Surround is damaged', 'Draught from chimney', 'Gas fire not igniting'],

  // Hallway
  'hallway|Door': ['Front door won\'t close', 'Door handle broken', 'Lock is broken', 'Door is damaged', 'Letterbox is broken'],
  'hallway|Wall': ['Crack in wall', 'Plaster is loose', 'Damp patch', 'Banister is loose'],
  'hallway|Ceiling': ['Ceiling is stained', 'Plaster is cracking', 'Ceiling is damp'],
  'hallway|Floor': ['Floor tiles cracked', 'Carpet is damaged', 'Floor is uneven', 'Threshold strip missing'],
  'hallway|Stairs': ['Stair tread is broken', 'Banister is loose', 'Carpet is loose on stairs', 'Spindle is missing'],
  'hallway|Electrics': ['Light not working', 'Socket not working', 'Switch is broken', 'Wiring exposed'],
  'hallway|Entry System': ['Intercom not working', 'Door buzzer broken', 'Fob reader not working', 'Communal door not locking'],

  // Outside
  'outside|Roof': ['Tiles are missing', 'Roof is leaking', 'Fascia is damaged', 'Ridge tiles loose'],
  'outside|Gutters': ['Gutter is blocked', 'Gutter is leaking', 'Downpipe is damaged', 'Gutter is overflowing'],
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

  // Emergency — no heating/hot water
  if (problem === 'Boiler/Heating' && (joined.includes('no heating') || joined.includes('no hot water'))) {
    return { level: 'emergency', label: 'Emergency', explanation: 'Loss of heating or hot water is classified as an emergency repair (24-hour response).' };
  }

  // Emergency — dangerous electrics
  if (problem === 'Electrics' && (joined.includes('sparking') || joined.includes('no power') || joined.includes('burning'))) {
    return { level: 'emergency', label: 'Emergency', explanation: 'Dangerous electrical faults (sparking, burning, or total power loss) require emergency response.' };
  }

  // Emergency — flooding / major leak
  if (joined.includes('flooding') || joined.includes('burst') || (joined.includes('leak') && joined.includes('major'))) {
    return { level: 'emergency', label: 'Emergency', explanation: 'Significant water leaks or flooding are classified as emergency repairs.' };
  }

  // Awaab's Law — damp and mould
  if (problem === 'Damp/Mould' || problem === 'Mould' || joined.includes('mould') || joined.includes('damp')) {
    return { level: 'awaabs-law', label: "Awaab's Law", explanation: "Damp and mould issues fall under Awaab's Law. Your landlord must investigate within 14 calendar days and begin repairs promptly." };
  }

  // Urgent — certain structural / safety items
  if (problem === 'Stairs' || problem === 'Roof' || (problem === 'Window' && joined.includes('broken glass'))) {
    return { level: 'urgent', label: 'Urgent', explanation: 'This issue may pose a safety risk and is classified as urgent (5 working day response).' };
  }

  // Heating radiator issues (not total loss)
  if (problem === 'Heating/Radiator' && joined.includes('not heating')) {
    return { level: 'urgent', label: 'Urgent', explanation: 'Heating issues are treated as urgent to ensure your home stays warm.' };
  }

  return { level: 'routine', label: 'Routine', explanation: 'This repair is classified as routine and will be completed within 20 working days.' };
}

// ============================================================
// Step labels for progress bar
// ============================================================

const STEP_LABELS = ['Where', 'What', 'Describe', 'Photos', 'Priority', 'Appointment', 'Review'];
const TOTAL_STEPS = STEP_LABELS.length;

// ============================================================
// Wizard form state
// ============================================================

interface WizardFormData {
  room: RoomKey | '';
  problem: string;
  descriptions: string[];
  freeText: string;
  photos: File[];
  photoPreviews: string[];
  priority: PriorityResult | null;
  priorityOverride: PriorityLevel | '';
  preferredDate: string;
  preferredTime: 'morning' | 'afternoon' | 'all-day' | '';
}

const INITIAL_FORM: WizardFormData = {
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
};

// ============================================================
// Component
// ============================================================

export default function ReportRepairWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For housing officer override detection (persona from localStorage)
  const isHousingOfficer = useMemo(() => {
    const persona = localStorage.getItem('socialhomes-persona') || 'housing-officer';
    return persona !== 'tenant';
  }, []);

  // Calculate earliest available date based on priority
  const earliestDate = useMemo(() => {
    const today = new Date();
    const effectivePriority = formData.priorityOverride || formData.priority?.level || 'routine';
    switch (effectivePriority) {
      case 'emergency': {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      }
      case 'awaabs-law':
      case 'urgent': {
        const d = new Date(today);
        d.setDate(d.getDate() + 2);
        return d.toISOString().split('T')[0];
      }
      default: {
        const d = new Date(today);
        d.setDate(d.getDate() + 3);
        return d.toISOString().split('T')[0];
      }
    }
  }, [formData.priority, formData.priorityOverride]);

  // Determine if Next is enabled for the current step
  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return formData.room !== '';
      case 2: return formData.problem !== '';
      case 3: return formData.descriptions.length > 0 || formData.freeText.trim().length > 0;
      case 4: return true; // Photos are optional
      case 5: return formData.priority !== null;
      case 6: return formData.preferredDate !== '' && formData.preferredTime !== '';
      case 7: return true;
      default: return false;
    }
  }, [step, formData]);

  // Auto-assign priority when moving to step 5
  const handleNext = useCallback(() => {
    if (step === 4 && !formData.priority) {
      const priority = autoPriority(formData.room, formData.problem, formData.descriptions);
      setFormData(prev => ({ ...prev, priority }));
    }
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
    }
  }, [step, formData]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  }, [step]);

  // Room selection
  const selectRoom = useCallback((roomId: RoomKey) => {
    setFormData(prev => ({
      ...prev,
      room: roomId,
      problem: '',
      descriptions: [],
      priority: null,
      priorityOverride: '',
    }));
  }, []);

  // Problem selection
  const selectProblem = useCallback((problem: string) => {
    setFormData(prev => ({
      ...prev,
      problem,
      descriptions: [],
      priority: null,
      priorityOverride: '',
    }));
  }, []);

  // Description chip toggle
  const toggleDescription = useCallback((desc: string) => {
    setFormData(prev => ({
      ...prev,
      descriptions: prev.descriptions.includes(desc)
        ? prev.descriptions.filter(d => d !== desc)
        : [...prev.descriptions, desc],
    }));
  }, []);

  // Photo handling
  const handlePhotoAdd = useCallback((files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files).filter(f =>
      f.type === 'image/jpeg' || f.type === 'image/png' || f.type === 'image/heic'
    );
    setFormData(prev => {
      const remaining = 3 - prev.photos.length;
      const toAdd = accepted.slice(0, remaining);
      const newPreviews = toAdd.map(f => URL.createObjectURL(f));
      return {
        ...prev,
        photos: [...prev.photos, ...toAdd],
        photoPreviews: [...prev.photoPreviews, ...newPreviews],
      };
    });
  }, []);

  const removePhoto = useCallback((index: number) => {
    setFormData(prev => {
      URL.revokeObjectURL(prev.photoPreviews[index]);
      return {
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index),
        photoPreviews: prev.photoPreviews.filter((_, i) => i !== index),
      };
    });
  }, []);

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlePhotoAdd(e.dataTransfer.files);
  }, [handlePhotoAdd]);

  // Submit
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const effectivePriority = formData.priorityOverride || formData.priority?.level || 'routine';
      const roomDef = ROOMS.find(r => r.id === formData.room);
      const ref = 'RPR-' + Date.now().toString(36).toUpperCase();

      await casesApi.create({
        type: 'repair',
        reference: ref,
        subject: `${roomDef?.label || formData.room} - ${formData.problem}`,
        description: [
          ...formData.descriptions,
          formData.freeText.trim() ? formData.freeText.trim() : null,
        ].filter(Boolean).join('. '),
        room: formData.room,
        problem: formData.problem,
        priority: effectivePriority,
        status: effectivePriority === 'emergency' ? 'emergency' : 'open',
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        photoCount: formData.photos.length,
        isAwaabsLaw: effectivePriority === 'awaabs-law',
        createdDate: new Date().toISOString(),
      });

      setReferenceNumber(ref);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit repair. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formData]);

  // ----- Render helpers -----

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
  // SUCCESS SCREEN
  // ============================================================
  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-surface-card rounded-xl p-8 md:p-12 border border-border-default text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
            <div className="w-16 h-16 rounded-full bg-status-compliant/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-status-compliant" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-2">
              Repair Reported
            </h1>
            <p className="text-text-muted mb-6">
              Your repair has been successfully logged. We will be in touch to confirm your appointment.
            </p>
            <div className="bg-surface-elevated rounded-lg p-4 mb-8 inline-block">
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Reference Number</div>
              <div className="text-2xl font-bold font-heading text-brand-teal tracking-wider">{referenceNumber}</div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/repairs')}
                className="px-6 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/80 transition-colors font-medium"
              >
                View All Repairs
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setFormData(INITIAL_FORM);
                  setSubmitted(false);
                  setReferenceNumber('');
                }}
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
  // WIZARD LAYOUT
  // ============================================================
  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-4 mb-1">
            <button onClick={() => navigate('/repairs')} className="text-text-muted hover:text-brand-teal transition-colors text-sm">
              <span className="flex items-center gap-1"><ArrowLeft size={14} /> Back to Repairs</span>
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
                    isComplete
                      ? 'bg-brand-teal text-white'
                      : isCurrent
                        ? 'bg-brand-teal text-white ring-2 ring-brand-teal/30 ring-offset-2 ring-offset-surface-card'
                        : 'bg-surface-elevated text-text-muted border border-border-default'
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
            <div
              className="bg-brand-teal h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-surface-card rounded-xl p-6 md:p-8 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>

          {/* ---- STEP 1: WHERE ---- */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Where is the problem?</h2>
              <p className="text-text-muted text-sm mb-6">Select the area of your home where the issue is.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ROOMS.map(room => {
                  const Icon = room.icon;
                  const isSelected = formData.room === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => selectRoom(room.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                        isSelected
                          ? 'border-brand-teal bg-brand-teal/10 text-brand-teal shadow-sm'
                          : 'border-border-default bg-surface-elevated text-text-secondary hover:border-brand-teal/50 hover:text-text-primary'
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

          {/* ---- STEP 2: WHAT ---- */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">What is the problem?</h2>
              <p className="text-text-muted text-sm mb-6">
                Select the type of issue in your <span className="text-brand-teal font-medium">{ROOMS.find(r => r.id === formData.room)?.label}</span>.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(formData.room ? PROBLEMS[formData.room] : []).map(problem => {
                  const isSelected = formData.problem === problem;
                  return (
                    <button
                      key={problem}
                      onClick={() => selectProblem(problem)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                        isSelected
                          ? 'border-brand-teal bg-brand-teal/10 text-brand-teal shadow-sm'
                          : 'border-border-default bg-surface-elevated text-text-secondary hover:border-brand-teal/50 hover:text-text-primary'
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

          {/* ---- STEP 3: DESCRIBE ---- */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Describe the issue</h2>
              <p className="text-text-muted text-sm mb-6">
                Select all that apply, and add any extra detail below.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {(DESCRIPTIONS[`${formData.room}|${formData.problem}`] ?? []).map(desc => {
                  const isSelected = formData.descriptions.includes(desc);
                  return (
                    <button
                      key={desc}
                      onClick={() => toggleDescription(desc)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                          : 'border-border-default bg-surface-elevated text-text-secondary hover:border-brand-teal/50'
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

          {/* ---- STEP 4: PHOTOS ---- */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Upload photos</h2>
              <p className="text-text-muted text-sm mb-6">
                <Camera size={14} className="inline mr-1 -mt-0.5" />
                Photos help us diagnose the issue faster. You can upload up to 3 images.
              </p>

              {formData.photos.length < 3 && (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border-default rounded-xl p-8 text-center cursor-pointer hover:border-brand-teal/50 hover:bg-brand-teal/5 transition-all duration-200"
                >
                  <Upload size={32} className="mx-auto text-text-muted mb-3" />
                  <p className="text-text-secondary text-sm font-medium mb-1">
                    Drag and drop photos here, or click to browse
                  </p>
                  <p className="text-text-muted text-xs">JPG, PNG, or HEIC (max 3 photos)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoAdd(e.target.files)}
                  />
                </div>
              )}

              {formData.photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {formData.photoPreviews.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border-default">
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-status-critical text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-1">
                        Photo {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.photos.length === 0 && (
                <p className="text-text-muted text-xs mt-4 italic">
                  This step is optional. You can skip it by clicking Next.
                </p>
              )}
            </div>
          )}

          {/* ---- STEP 5: PRIORITY ---- */}
          {step === 5 && formData.priority && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Priority assessment</h2>
              <p className="text-text-muted text-sm mb-6">
                Based on your answers, we have assessed the priority of this repair.
              </p>

              {/* Emergency banner */}
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

              {/* Priority card */}
              <div className={`rounded-xl border p-6 mb-6 ${getPriorityBg(formData.priorityOverride || formData.priority.level)}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`text-2xl font-bold font-heading uppercase tracking-wider ${getPriorityColor(formData.priorityOverride || formData.priority.level)}`}>
                    {formData.priorityOverride
                      ? (formData.priorityOverride === 'awaabs-law' ? "Awaab's Law" : formData.priorityOverride.charAt(0).toUpperCase() + formData.priorityOverride.slice(1))
                      : formData.priority.label}
                  </div>
                </div>
                <p className="text-sm text-text-secondary">{formData.priority.explanation}</p>
              </div>

              {/* Housing officer override */}
              {isHousingOfficer && (
                <div className="bg-surface-elevated rounded-xl p-4 border border-border-default">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">Override Priority (Housing Officer only)</div>
                  <div className="flex flex-wrap gap-2">
                    {(['emergency', 'awaabs-law', 'urgent', 'routine'] as PriorityLevel[]).map(level => {
                      const current = formData.priorityOverride || formData.priority?.level;
                      const isActive = current === level;
                      const label = level === 'awaabs-law' ? "Awaab's Law" : level.charAt(0).toUpperCase() + level.slice(1);
                      return (
                        <button
                          key={level}
                          onClick={() => setFormData(prev => ({ ...prev, priorityOverride: level === prev.priority?.level ? '' : level }))}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                            isActive
                              ? `${getPriorityBg(level)} ${getPriorityColor(level)} border-current`
                              : 'border-border-default bg-surface-dark text-text-muted hover:border-brand-teal/50'
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

          {/* ---- STEP 6: APPOINTMENT ---- */}
          {step === 6 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Preferred appointment</h2>
              <p className="text-text-muted text-sm mb-6">
                Choose your preferred date and time. We will confirm the exact time with you.
              </p>

              <div className="space-y-6">
                {/* Date picker */}
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">
                    <Calendar size={12} className="inline mr-1 -mt-0.5" />
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    min={earliestDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-dark border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Earliest available: {new Date(earliestDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Time preference */}
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">
                    <Clock size={12} className="inline mr-1 -mt-0.5" />
                    Time Preference
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([
                      { id: 'morning' as const, label: 'Morning', sub: '8am - 12pm' },
                      { id: 'afternoon' as const, label: 'Afternoon', sub: '12pm - 5pm' },
                      { id: 'all-day' as const, label: 'All Day', sub: '8am - 5pm' },
                    ]).map(slot => {
                      const isSelected = formData.preferredTime === slot.id;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setFormData(prev => ({ ...prev, preferredTime: slot.id }))}
                          className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                            isSelected
                              ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                              : 'border-border-default bg-surface-elevated text-text-secondary hover:border-brand-teal/50'
                          }`}
                        >
                          <div className="text-sm font-medium">{slot.label}</div>
                          <div className="text-xs mt-0.5 opacity-70">{slot.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---- STEP 7: REVIEW ---- */}
          {step === 7 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-text-primary mb-1">Review your repair report</h2>
              <p className="text-text-muted text-sm mb-6">
                Please check everything is correct before submitting.
              </p>

              <div className="space-y-4">
                {/* Room */}
                <div className="flex items-start justify-between p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Location</div>
                    <div className="text-sm font-medium text-text-primary">
                      {ROOMS.find(r => r.id === formData.room)?.label}
                    </div>
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs text-brand-teal hover:underline">Edit</button>
                </div>

                {/* Problem */}
                <div className="flex items-start justify-between p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Problem</div>
                    <div className="text-sm font-medium text-text-primary">{formData.problem}</div>
                  </div>
                  <button onClick={() => setStep(2)} className="text-xs text-brand-teal hover:underline">Edit</button>
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
                    {formData.freeText && (
                      <p className="text-sm text-text-secondary mt-1">{formData.freeText}</p>
                    )}
                  </div>
                  <button onClick={() => setStep(3)} className="text-xs text-brand-teal hover:underline flex-shrink-0">Edit</button>
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
                      <div className="flex items-center gap-1 text-sm text-text-muted">
                        <ImageIcon size={14} />
                        No photos attached
                      </div>
                    )}
                  </div>
                  <button onClick={() => setStep(4)} className="text-xs text-brand-teal hover:underline">Edit</button>
                </div>

                {/* Priority */}
                <div className="flex items-start justify-between p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Priority</div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold uppercase ${getPriorityBg(formData.priorityOverride || formData.priority?.level || 'routine')} ${getPriorityColor(formData.priorityOverride || formData.priority?.level || 'routine')}`}>
                      {formData.priorityOverride
                        ? (formData.priorityOverride === 'awaabs-law' ? "Awaab's Law" : formData.priorityOverride)
                        : formData.priority?.label}
                    </span>
                  </div>
                  <button onClick={() => setStep(5)} className="text-xs text-brand-teal hover:underline">Edit</button>
                </div>

                {/* Appointment */}
                <div className="flex items-start justify-between p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Preferred Appointment</div>
                    <div className="text-sm font-medium text-text-primary">
                      {formData.preferredDate
                        ? new Date(formData.preferredDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Not selected'}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5 capitalize">
                      {formData.preferredTime === 'morning' ? 'Morning (8am - 12pm)' :
                       formData.preferredTime === 'afternoon' ? 'Afternoon (12pm - 5pm)' :
                       formData.preferredTime === 'all-day' ? 'All Day (8am - 5pm)' : 'Not selected'}
                    </div>
                  </div>
                  <button onClick={() => setStep(6)} className="text-xs text-brand-teal hover:underline">Edit</button>
                </div>
              </div>

              {/* Submit error */}
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
              step === 1
                ? 'text-text-muted cursor-not-allowed opacity-40'
                : 'text-text-primary bg-surface-card border border-border-default hover:bg-surface-hover'
            }`}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                canProceed
                  ? 'bg-brand-teal text-white hover:bg-brand-teal/80 shadow-sm'
                  : 'bg-surface-elevated text-text-muted cursor-not-allowed'
              }`}
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-brand-teal text-white rounded-lg font-medium hover:bg-brand-teal/80 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Report Repair
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
