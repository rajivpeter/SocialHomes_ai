import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2, User, Calendar, Wrench, AlertTriangle,
  CheckCircle, Clock, ArrowRight, UserCheck, Edit,
  TrendingUp, XCircle, Home, FileText, ShieldCheck, ShieldAlert,
  ClipboardList, Search, CalendarCheck, UserPlus, PlayCircle, CircleCheckBig, Lock,
  Sparkles, ChevronDown, Plus, Copy, MessageSquareWarning, PoundSterling,
  LinkIcon, RotateCcw
} from 'lucide-react';
import { useRepairs, useProperties, useTenants, useComplaints } from '@/hooks/useApi';
import { activities as activitiesData } from '@/data';
import StatusPill from '@/components/shared/StatusPill';
import CountdownTimer from '@/components/shared/CountdownTimer';
import WorkflowProgress from '@/components/shared/WorkflowProgress';
import AiActionCard from '@/components/shared/AiActionCard';
import ActionModal from '@/components/shared/ActionModal';
import type { ActionField } from '@/components/shared/ActionModal';
import { formatDate, formatCurrency } from '@/utils/format';
import { useRepairIntelligence } from '@/hooks/useEntityIntelligence';
import { casesApi } from '@/services/api-client';

type TabId = 'details' | 'costs' | 'linked' | 'activity';

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: repairs = [] } = useRepairs();
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();
  const { data: complaints = [] } = useComplaints();

  const repair = repairs.find((r: any) => r.id === id);
  const property = repair ? properties.find((p: any) => p.id === repair.propertyId) : null;
  const tenant = repair ? tenants.find((t: any) => t.id === repair.tenantId) : null;
  const repairActivities = repair ? activitiesData.filter(a => a.caseId === repair.id) : [];

  const intel = useRepairIntelligence(repair);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [showSecondaryActions, setShowSecondaryActions] = useState(false);

  // Sidebar intelligence — counts
  const propertyRepairCount = useMemo(() => {
    if (!repair) return 0;
    return repairs.filter((r: any) => r.propertyId === repair.propertyId).length;
  }, [repairs, repair?.propertyId]);

  const propertyDampCount = useMemo(() => {
    if (!repair) return 0;
    return repairs.filter((r: any) => r.propertyId === repair.propertyId && (r.sorDescription?.toLowerCase().includes('damp') || r.sorDescription?.toLowerCase().includes('mould') || r.type === 'damp-mould')).length;
  }, [repairs, repair?.propertyId]);

  // Linked cases data
  const linkedRepairs = useMemo(() => {
    if (!repair?.linkedCases?.length) return [];
    return repairs.filter((r: any) => repair.linkedCases.includes(r.id));
  }, [repairs, repair?.linkedCases]);

  const linkedComplaints = useMemo(() => {
    if (!repair?.linkedComplaints?.length) return [];
    return complaints.filter((c: any) => repair.linkedComplaints.includes(c.id));
  }, [complaints, repair?.linkedComplaints]);

  // Cost calculations
  const labourLog: any[] = repair?.labourLog ?? [];
  const partsLog: any[] = repair?.partsLog ?? [];
  const totalLabourCost = labourLog.reduce((sum: number, e: any) => sum + ((e.hours || 0) * (e.rate || 0)), 0);
  const totalPartsCost = partsLog.reduce((sum: number, e: any) => sum + ((e.quantity || 0) * (e.unitCost || 0)), 0);

  if (!repair) {
    return (
      <div className="space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-card rounded-lg p-8 border border-border-default text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Repair Not Found</h1>
            <p className="text-text-muted mb-4">The repair you're looking for doesn't exist.</p>
            <Link to="/repairs" className="text-brand-teal hover:underline">
              ← Back to Repairs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const invalidateRepairs = () => {
    queryClient.invalidateQueries({ queryKey: ['repairs'] });
    queryClient.invalidateQueries({ queryKey: ['cases'] });
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-status-critical/20 text-status-critical border-status-critical/30';
      case 'urgent': return 'bg-status-warning/20 text-status-warning border-status-warning/30';
      case 'routine': return 'bg-brand-blue/20 text-brand-blue border-brand-blue/30';
      case 'planned': return 'bg-status-compliant/20 text-status-compliant border-status-compliant/30';
      default: return 'bg-surface-elevated text-text-secondary border-border-default';
    }
  };

  // ── Workflow stages ──
  const repairWorkflowStages = [
    { id: 'reported', label: 'Reported', icon: <ClipboardList size={16} /> },
    { id: 'triaged', label: 'Triaged', icon: <Search size={16} /> },
    { id: 'scheduled', label: 'Scheduled', icon: <CalendarCheck size={16} /> },
    { id: 'assigned', label: 'Assigned', icon: <UserPlus size={16} /> },
    { id: 'in-progress', label: 'In Progress', icon: <PlayCircle size={16} /> },
    { id: 'completed', label: 'Completed', icon: <CircleCheckBig size={16} /> },
    { id: 'closed', label: 'Closed', icon: <Lock size={16} /> },
  ];

  const getRepairCurrentStage = (): string => {
    switch (repair.status) {
      case 'open': return repair.handler ? 'triaged' : 'reported';
      case 'triaged': return 'triaged';
      case 'scheduled': return 'scheduled';
      case 'awaiting-parts': return 'scheduled';
      case 'assigned': return 'assigned';
      case 'in-progress': return 'in-progress';
      case 'completed': return 'completed';
      case 'closed': return 'closed';
      default: return 'reported';
    }
  };

  const getRepairCompletedStages = (): string[] => {
    const statusOrder = ['reported', 'triaged', 'scheduled', 'assigned', 'in-progress', 'completed', 'closed'];
    const currentStage = getRepairCurrentStage();
    const currentIndex = statusOrder.indexOf(currentStage);
    return statusOrder.slice(0, currentIndex);
  };

  const isRepairOverdue = repair.targetDate ? new Date(repair.targetDate) < new Date() && repair.status !== 'completed' && repair.status !== 'closed' : false;

  // ── Smart primary action by status ──
  const getPrimaryAction = () => {
    switch (repair.status) {
      case 'open': return { label: 'Triage & Assign', modal: 'assign', colour: 'bg-brand-teal', icon: <UserCheck size={16} /> };
      case 'assigned': return { label: 'Start Work', modal: 'startWork', colour: 'bg-brand-blue', icon: <PlayCircle size={16} /> };
      case 'in-progress': return { label: 'Mark Complete', modal: 'markComplete', colour: 'bg-brand-blue', icon: <CircleCheckBig size={16} /> };
      case 'completed': return { label: 'Close & Review', modal: 'close', colour: 'bg-status-compliant', icon: <CheckCircle size={16} /> };
      case 'closed': return { label: 'Reopen', modal: 'reopen', colour: 'bg-surface-elevated text-text-primary border border-border-default', icon: <RotateCcw size={16} /> };
      default: return { label: 'Update Status', modal: 'update', colour: 'bg-brand-teal', icon: <Edit size={16} /> };
    }
  };

  const getSecondaryActions = () => {
    const actions: { label: string; modal: string; icon: React.ReactNode }[] = [];
    if (repair.status !== 'closed') {
      actions.push({ label: 'Update Status', modal: 'update', icon: <Edit size={14} /> });
    }
    if (['open', 'assigned', 'in-progress'].includes(repair.status)) {
      actions.push({ label: 'Escalate', modal: 'escalate', icon: <TrendingUp size={14} /> });
    }
    if (['assigned', 'in-progress'].includes(repair.status)) {
      actions.push({ label: 'Log Labour', modal: 'logLabour', icon: <PoundSterling size={14} /> });
      actions.push({ label: 'Log Parts', modal: 'logParts', icon: <Wrench size={14} /> });
    }
    actions.push({ label: 'Create Linked Repair', modal: 'createLinked', icon: <LinkIcon size={14} /> });
    actions.push({ label: 'Raise Complaint', modal: 'raiseComplaint', icon: <MessageSquareWarning size={14} /> });
    actions.push({ label: 'Duplicate', modal: 'duplicate', icon: <Copy size={14} /> });
    return actions;
  };

  const primaryAction = getPrimaryAction();
  const secondaryActions = getSecondaryActions();

  // ── AI Actions ──
  const generateAiActions = () => {
    const actions = [];
    if (repair.recurrenceRisk > 70) {
      actions.push({
        icon: '🔍', label: 'Root Cause Analysis',
        description: 'Analyze recurring repair patterns and identify underlying issues',
        preview: `This repair has a ${repair.recurrenceRisk}% recurrence risk. AI analysis suggests investigating root causes.`
      });
    }
    if (repair.daysOpen > 30) {
      actions.push({
        icon: '📧', label: 'Send Update to Tenant',
        description: 'Send proactive communication about repair status and timeline',
        preview: `Dear ${tenant ? `${tenant.title} ${tenant.firstName} ${tenant.lastName}` : 'Resident'},\n\nRe: ${repair.reference} — ${repair.subject}\n\nWe are writing to update you on the progress of the above repair at ${property?.address || 'your property'}.\n\nWe understand that this repair was reported on ${repair.createdDate} and has been open for ${repair.daysOpen} days. We sincerely apologise for the delay in completing this work.\n\nCurrent Status: ${repair.status === 'in-progress' ? 'Work is currently in progress' : repair.status === 'awaiting-parts' ? 'We are awaiting parts needed to complete the repair' : 'Your repair is being actively managed'}.\n${repair.operative ? `Your assigned operative is ${repair.operative}.` : ''}\n\nWe are working to resolve this as quickly as possible and will keep you informed of any further updates. If you have any questions or concerns, please do not hesitate to contact us.\n\nIf you are unhappy with the service you have received, you have the right to raise a formal complaint through our complaints procedure.\n\nYours sincerely,\n\n${repair.handler || 'Housing Services Team'}\nRCHA Housing Services\nTel: 0300 123 4567`
      });
    }
    if (repair.isAwaabsLaw && repair.awaabsLawTimers) {
      actions.push({
        icon: '⚠️', label: "Escalate Awaab's Law Case",
        description: "Flag for immediate management attention due to Awaab's Law compliance",
        preview: `This repair is an Awaab's Law case (${repair.awaabsLawCategory}). Immediate escalation required.`
      });
    }
    return actions;
  };
  const aiActions = generateAiActions();

  // ── Modal field definitions ──
  const assignFields: ActionField[] = [
    { id: 'ref', label: 'Reference', type: 'readonly', defaultValue: repair.reference },
    { id: 'handler', label: 'Assigned Officer', type: 'select', required: true, options: [
      { value: 'sarah-mitchell', label: 'Sarah Mitchell — Housing Officer' },
      { value: 'james-wright', label: 'James Wright — Head of Housing' },
      { value: 'priya-patel', label: 'Priya Patel — Manager' },
      { value: 'mark-johnson', label: 'Mark Johnson — Operative' },
    ]},
    { id: 'operative', label: 'Operative', type: 'select', options: [
      { value: 'mike-carpenter', label: 'Mike Carpenter — Plumber' },
      { value: 'dave-spark', label: 'Dave Spark — Electrician' },
      { value: 'ben-fix', label: 'Ben Fix — General Repairs' },
      { value: 'jane-build', label: 'Jane Build — Roofer' },
    ]},
    { id: 'notes', label: 'Assignment Notes', type: 'textarea', placeholder: 'Add any instructions for the operative...' },
  ];

  const updateFields: ActionField[] = [
    { id: 'ref', label: 'Reference', type: 'readonly', defaultValue: repair.reference },
    { id: 'status', label: 'Status', type: 'select', required: true, defaultValue: repair.status, options: [
      { value: 'open', label: 'Open' },
      { value: 'triaged', label: 'Triaged' },
      { value: 'assigned', label: 'Assigned' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'awaiting-parts', label: 'Awaiting Parts' },
      { value: 'completed', label: 'Completed' },
    ]},
    { id: 'priority', label: 'Priority', type: 'select', defaultValue: repair.priority, options: [
      { value: 'emergency', label: 'Emergency (24hr)' },
      { value: 'urgent', label: 'Urgent (5 WD)' },
      { value: 'routine', label: 'Routine (20 WD)' },
      { value: 'planned', label: 'Planned (90 days)' },
    ]},
    { id: 'appointmentDate', label: 'Appointment Date', type: 'date' },
    { id: 'appointmentSlot', label: 'Appointment Slot', type: 'select', options: [
      { value: 'am', label: 'Morning (8am-12pm)' },
      { value: 'pm', label: 'Afternoon (12pm-5pm)' },
      { value: 'all-day', label: 'All Day' },
    ]},
    { id: 'notes', label: 'Update Notes', type: 'textarea', placeholder: 'Describe the update...' },
  ];

  const escalateFields: ActionField[] = [
    { id: 'ref', label: 'Reference', type: 'readonly', defaultValue: repair.reference },
    { id: 'escalateTo', label: 'Escalate To', type: 'select', required: true, options: [
      { value: 'manager', label: 'Team Manager' },
      { value: 'head-of-housing', label: 'Head of Housing' },
      { value: 'coo', label: 'Chief Operating Officer' },
      { value: 'contractor', label: 'Contractor Supervisor' },
    ]},
    { id: 'reason', label: 'Reason for Escalation', type: 'select', required: true, options: [
      { value: 'sla-breach', label: 'SLA Breach' },
      { value: 'tenant-complaint', label: 'Tenant Complaint' },
      { value: 'awaabs-law', label: "Awaab's Law Compliance" },
      { value: 'recurring', label: 'Recurring Issue' },
      { value: 'health-safety', label: 'Health & Safety Risk' },
      { value: 'cost', label: 'Cost Exceeds Budget' },
    ]},
    { id: 'notes', label: 'Escalation Details', type: 'textarea', required: true, placeholder: 'Explain why this repair needs escalation...' },
  ];

  const closeFields: ActionField[] = [
    { id: 'ref', label: 'Reference', type: 'readonly', defaultValue: repair.reference },
    { id: 'completionDate', label: 'Completion Date', type: 'date', required: true },
    { id: 'firstTimeFix', label: 'First Time Fix?', type: 'select', required: true, options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No — Recall Required' },
    ]},
    { id: 'satisfaction', label: 'Tenant Satisfaction', type: 'select', options: [
      { value: '5', label: '5 — Very Satisfied' },
      { value: '4', label: '4 — Satisfied' },
      { value: '3', label: '3 — Neutral' },
      { value: '2', label: '2 — Dissatisfied' },
      { value: '1', label: '1 — Very Dissatisfied' },
    ]},
    { id: 'notes', label: 'Close-out Notes', type: 'textarea', placeholder: 'Describe the outcome...' },
  ];

  const markCompleteFields: ActionField[] = [
    { id: 'ref', label: 'Reference', type: 'readonly', defaultValue: repair.reference },
    { id: 'completionDate', label: 'Completion Date', type: 'date', required: true },
    { id: 'notes', label: 'Completion Notes', type: 'textarea', placeholder: 'Describe the work completed...' },
  ];

  const labourFields: ActionField[] = [
    { id: 'operative', label: 'Operative', type: 'text', required: true, placeholder: 'Name of operative' },
    { id: 'hours', label: 'Hours', type: 'number', required: true, min: 0.5, step: 0.5, placeholder: 'e.g. 2.5' },
    { id: 'rate', label: 'Hourly Rate (£)', type: 'number', required: true, min: 0, step: 0.01, placeholder: 'e.g. 35.00' },
    { id: 'date', label: 'Date', type: 'date', required: true },
    { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Work carried out...' },
  ];

  const partsFields: ActionField[] = [
    { id: 'partName', label: 'Part Name', type: 'text', required: true, placeholder: 'e.g. Copper pipe 15mm' },
    { id: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1, step: 1, placeholder: 'e.g. 3' },
    { id: 'unitCost', label: 'Unit Cost (£)', type: 'number', required: true, min: 0, step: 0.01, placeholder: 'e.g. 12.50' },
    { id: 'supplier', label: 'Supplier', type: 'text', placeholder: 'e.g. Plumb Center' },
    { id: 'date', label: 'Date', type: 'date', required: true },
  ];

  // ── Tab definitions ──
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'Details', icon: <FileText size={14} /> },
    { id: 'costs', label: 'Costs', icon: <PoundSterling size={14} /> },
    { id: 'linked', label: 'Linked', icon: <LinkIcon size={14} /> },
    { id: 'activity', label: 'Activity', icon: <Clock size={14} /> },
  ];

  // ── Vulnerability badge colour ──
  const getVulnerabilityColour = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-status-critical/20 text-status-critical animate-pulse';
      case 'medium': return 'bg-status-warning/20 text-status-warning';
      case 'low': return 'bg-brand-blue/20 text-brand-blue';
      default: return 'bg-surface-elevated text-text-muted';
    }
  };

  // ── Damp risk bar colour ──
  const getDampBarColour = (score: number) => {
    if (score >= 70) return 'bg-status-critical';
    if (score >= 40) return 'bg-status-warning';
    return 'bg-status-compliant';
  };

  return (
    <>
    {/* ── Modals ── */}
    <ActionModal open={activeModal === 'assign'} onClose={() => setActiveModal(null)} title="Triage & Assign Repair" description={`Assign ${repair.reference} to an officer`} icon={<UserCheck size={20} className="text-brand-teal" />} fields={assignFields} submitLabel="Assign" onSubmit={async (v) => { await casesApi.update(repair.id, { handler: v.handler, assignedOperative: v.operative, status: 'assigned' }); invalidateRepairs(); }} />
    <ActionModal open={activeModal === 'update'} onClose={() => setActiveModal(null)} title="Update Repair" description={`Update status, priority, or schedule for ${repair.reference}`} icon={<Edit size={20} className="text-brand-blue" />} fields={updateFields} submitLabel="Save Changes" onSubmit={async (v) => { await casesApi.update(repair.id, { status: v.status, priority: v.priority, appointmentDate: v.appointmentDate || undefined, appointmentSlot: v.appointmentSlot || undefined }); invalidateRepairs(); }} />
    <ActionModal open={activeModal === 'escalate'} onClose={() => setActiveModal(null)} title="Escalate Repair" description={`Escalate ${repair.reference} to management`} icon={<TrendingUp size={20} className="text-status-warning" />} fields={escalateFields} submitLabel="Escalate" variant="warning" onSubmit={async (v) => { await casesApi.update(repair.id, { priority: 'emergency', escalatedReason: v.reason, escalatedNotes: v.notes, status: 'escalated' }); invalidateRepairs(); }} />
    <ActionModal open={activeModal === 'close'} onClose={() => setActiveModal(null)} title="Close & Review" description={`Close ${repair.reference} and capture outcome`} icon={<CheckCircle size={20} className="text-status-compliant" />} fields={closeFields} submitLabel="Close Repair" variant="success" onSubmit={async (v) => { await casesApi.update(repair.id, { status: 'closed', completionDate: v.completionDate, completionNotes: v.notes, firstTimeFix: v.firstTimeFix === 'yes', satisfactionRating: v.satisfaction ? parseInt(v.satisfaction) : undefined }); invalidateRepairs(); }} />
    <ActionModal open={activeModal === 'markComplete'} onClose={() => setActiveModal(null)} title="Mark Complete" description={`Mark ${repair.reference} as completed`} icon={<CircleCheckBig size={20} className="text-brand-blue" />} fields={markCompleteFields} submitLabel="Mark Complete" onSubmit={async (v) => { await casesApi.update(repair.id, { status: 'completed', completionDate: v.completionDate, completionNotes: v.notes }); invalidateRepairs(); }} />
    <ActionModal open={activeModal === 'startWork'} onClose={() => setActiveModal(null)} title="Start Work" description={`Confirm starting work on ${repair.reference}`} icon={<PlayCircle size={20} className="text-brand-blue" />} fields={[{ id: 'ref', label: 'Reference', type: 'readonly', defaultValue: repair.reference }, { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any notes before starting...' }]} submitLabel="Start Work" onSubmit={async () => { await casesApi.update(repair.id, { status: 'in-progress' }); invalidateRepairs(); }} />
    <ActionModal open={activeModal === 'reopen'} onClose={() => setActiveModal(null)} title="Reopen Repair" description={`Reopen ${repair.reference}`} icon={<RotateCcw size={20} className="text-text-secondary" />} fields={[{ id: 'ref', label: 'Reference', type: 'readonly', defaultValue: repair.reference }, { id: 'reason', label: 'Reason for Reopening', type: 'textarea', required: true, placeholder: 'Why does this repair need reopening?' }]} submitLabel="Reopen" onSubmit={async (v) => { await casesApi.update(repair.id, { status: 'open', reopenReason: v.reason }); invalidateRepairs(); }} />
    <ActionModal open={activeModal === 'logLabour'} onClose={() => setActiveModal(null)} title="Log Labour" description={`Add labour entry for ${repair.reference}`} icon={<PoundSterling size={20} className="text-brand-teal" />} fields={labourFields} submitLabel="Add Labour" onSubmit={async (v) => {
      const entry = { id: `lab-${Date.now()}`, date: v.date, operative: v.operative, hours: parseFloat(v.hours), rate: parseFloat(v.rate), description: v.description || '' };
      const existing = repair.labourLog ?? [];
      await casesApi.update(repair.id, { labourLog: [...existing, entry] });
      invalidateRepairs();
    }} />
    <ActionModal open={activeModal === 'logParts'} onClose={() => setActiveModal(null)} title="Log Parts" description={`Add parts entry for ${repair.reference}`} icon={<Wrench size={20} className="text-brand-blue" />} fields={partsFields} submitLabel="Add Parts" onSubmit={async (v) => {
      const entry = { id: `part-${Date.now()}`, date: v.date, partName: v.partName, quantity: parseInt(v.quantity), unitCost: parseFloat(v.unitCost), supplier: v.supplier || '' };
      const existing = repair.partsLog ?? [];
      await casesApi.update(repair.id, { partsLog: [...existing, entry] });
      invalidateRepairs();
    }} />
    <ActionModal open={activeModal === 'createLinked'} onClose={() => setActiveModal(null)} title="Create Linked Repair" description="Create a new repair linked to this case" icon={<LinkIcon size={20} className="text-brand-teal" />} fields={[
      { id: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Describe the linked repair...' },
      { id: 'trade', label: 'Trade', type: 'select', required: true, options: [
        { value: 'plumbing', label: 'Plumbing' }, { value: 'electrical', label: 'Electrical' },
        { value: 'carpentry', label: 'Carpentry' }, { value: 'roofing', label: 'Roofing' },
        { value: 'general', label: 'General' }, { value: 'gas', label: 'Gas' },
      ]},
      { id: 'priority', label: 'Priority', type: 'select', defaultValue: 'routine', options: [
        { value: 'emergency', label: 'Emergency' }, { value: 'urgent', label: 'Urgent' },
        { value: 'routine', label: 'Routine' }, { value: 'planned', label: 'Planned' },
      ]},
      { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Details...' },
    ]} submitLabel="Create & Link" onSubmit={async (v) => {
      const newCase = await casesApi.create({
        type: 'repair', subject: v.subject, description: v.description || v.subject,
        trade: v.trade, priority: v.priority, status: 'open',
        propertyId: repair.propertyId, tenantId: repair.tenantId,
        parentCaseId: repair.id, sorCode: repair.sorCode, sorDescription: repair.sorDescription,
      });
      const existingLinked = repair.linkedCases ?? [];
      await casesApi.update(repair.id, { linkedCases: [...existingLinked, newCase.id] });
      invalidateRepairs();
    }} />
    <ActionModal open={activeModal === 'raiseComplaint'} onClose={() => setActiveModal(null)} title="Raise Complaint" description="Create a complaint linked to this repair" icon={<MessageSquareWarning size={20} className="text-status-warning" />} fields={[
      { id: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Complaint subject...' },
      { id: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the complaint...' },
    ]} submitLabel="Raise Complaint" variant="warning" onSubmit={async (v) => {
      const today = new Date().toISOString().split('T')[0];
      const ackDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const respDeadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const newCase = await casesApi.create({
        type: 'complaint', subject: v.subject, description: v.description, status: 'open',
        stage: 1, category: 'Repairs & Maintenance', priority: 'routine',
        propertyId: repair.propertyId, tenantId: repair.tenantId,
        handler: repair.handler || 'Unassigned',
        escalationRisk: 30, ombudsmanEscalation: false,
        acknowledgeDeadline: ackDeadline, responseDeadline: respDeadline,
        daysOpen: 0, slaStatus: 'within',
        reference: `CMP-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      });
      const existingLinked = repair.linkedComplaints ?? [];
      await casesApi.update(repair.id, { linkedComplaints: [...existingLinked, newCase.id] });
      invalidateRepairs();
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    }} />
    <ActionModal open={activeModal === 'duplicate'} onClose={() => setActiveModal(null)} title="Duplicate Repair" description={`Create a copy of ${repair.reference}`} icon={<Copy size={20} className="text-brand-blue" />} fields={[
      { id: 'ref', label: 'Duplicating From', type: 'readonly', defaultValue: repair.reference },
      { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any changes for the duplicate...' },
    ]} submitLabel="Create Duplicate" onSubmit={async () => {
      await casesApi.create({
        type: 'repair', subject: repair.subject, description: repair.description,
        sorCode: repair.sorCode, sorDescription: repair.sorDescription,
        trade: repair.trade, priority: repair.priority, status: 'open',
        propertyId: repair.propertyId, tenantId: repair.tenantId,
        duplicatedFrom: repair.id,
      });
      invalidateRepairs();
    }} />

    <div className={`space-y-6 ${intel.urgencyLevel === 'crisis' ? 'ring-1 ring-brand-garnet/20 rounded-xl p-2' : intel.urgencyLevel === 'urgent' ? 'ring-1 ring-status-warning/10 rounded-xl p-2' : ''}`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── AI Warnings ── */}
        {intel.dynamicWarnings.length > 0 && (
          <div className="space-y-2 opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
            {intel.dynamicWarnings.map((w: string, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-status-critical/10 border border-status-critical/20 rounded-lg px-4 py-2 text-sm text-status-critical">
                <AlertTriangle size={16} />
                {w}
              </div>
            ))}
          </div>
        )}

        {/* ── Header ── */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-4 mb-4">
            <Link to="/repairs" className="text-text-muted hover:text-brand-teal transition-colors">
              ← Back to Repairs
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">{repair.reference}</h1>
              <p className="text-text-secondary text-lg">{repair.subject}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill status={repair.status} size="md" />
              <span className={`px-3 py-1 rounded-lg border text-sm font-medium capitalize ${getPriorityBadgeColor(repair.priority)}`}>
                {repair.priority}
              </span>
            </div>
          </div>
        </div>

        {/* ── Workflow Progress ── */}
        <div className="bg-surface-card rounded-lg p-6 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
          <WorkflowProgress
            stages={repairWorkflowStages}
            currentStage={getRepairCurrentStage()}
            completedStages={getRepairCompletedStages()}
            variant="horizontal"
            size="md"
            slaDeadline={repair.targetDate}
            isOverdue={isRepairOverdue}
          />
        </div>

        {/* ── AI Status Banner ── */}
        {intel.statusSuggestion && (
          <div className="border-l-[3px] border-status-ai bg-surface-elevated/50 rounded-lg px-4 py-3 flex items-center gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
            <Sparkles size={16} className="text-status-ai flex-shrink-0" />
            <span className="text-sm text-text-primary">{intel.statusSuggestion}</span>
          </div>
        )}

        {/* ── Awaab's Law Timers ── */}
        {repair.isAwaabsLaw && repair.awaabsLawTimers && (
          <div className="bg-surface-card rounded-lg p-4 border border-status-critical/30 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-status-critical" />
              <h2 className="text-lg font-bold text-status-critical">Awaab's Law Case</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {repair.awaabsLawTimers.category === 'emergency' && repair.awaabsLawTimers.emergencyDeadline && (
                <CountdownTimer deadline={repair.awaabsLawTimers.emergencyDeadline} label="Emergency Deadline" size="lg" />
              )}
              {repair.awaabsLawTimers.category === 'significant' && (
                <>
                  {repair.awaabsLawTimers.investigateDeadline && <CountdownTimer deadline={repair.awaabsLawTimers.investigateDeadline} label="Investigate" useWorkingDays={true} size="lg" />}
                  {repair.awaabsLawTimers.summaryDeadline && <CountdownTimer deadline={repair.awaabsLawTimers.summaryDeadline} label="Summary" useWorkingDays={true} size="lg" />}
                  {repair.awaabsLawTimers.safetyWorksDeadline && <CountdownTimer deadline={repair.awaabsLawTimers.safetyWorksDeadline} label="Safety Works" useWorkingDays={true} size="lg" />}
                  {repair.awaabsLawTimers.fullRepairDeadline && <CountdownTimer deadline={repair.awaabsLawTimers.fullRepairDeadline} label="Full Repair" size="lg" />}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Main Content: Tabs + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Tabbed Content (65%) ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Tab Bar */}
            <div className="bg-surface-card rounded-lg border border-border-default overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
              <div className="flex border-b border-border-default">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'border-brand-teal text-brand-teal bg-brand-teal/5'
                        : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface-elevated/50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* ── Details Tab ── */}
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Description</div>
                      <div className="text-sm text-text-primary">{repair.description}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Trade</div>
                        <div className="text-sm text-text-primary">{repair.trade}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Operative</div>
                        <div className="text-sm text-text-primary">{repair.operative || '-'}</div>
                        {repair.operative && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {(repair.trade?.toLowerCase() === 'plumbing' || repair.trade?.toLowerCase() === 'gas') && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-status-compliant/20 text-status-compliant border border-status-compliant/30">
                                <ShieldCheck size={10} /> Gas Safe Registered
                              </span>
                            )}
                            {repair.trade?.toLowerCase() === 'electrical' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-blue/20 text-brand-blue border border-brand-blue/30">
                                <ShieldCheck size={10} /> NICEIC Verified
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Created Date</div>
                        <div className="text-sm text-text-primary">{formatDate(repair.createdDate)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Target Date</div>
                        <div className="text-sm text-text-primary">{repair.targetDate ? formatDate(repair.targetDate) : '-'}</div>
                      </div>
                      {repair.appointmentDate && (
                        <div>
                          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Appointment</div>
                          <div className="text-sm text-text-primary">{formatDate(repair.appointmentDate)} {repair.appointmentSlot}</div>
                        </div>
                      )}
                      {repair.completionDate && (
                        <div>
                          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Completion Date</div>
                          <div className="text-sm text-text-primary">{formatDate(repair.completionDate)}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Cost Summary</div>
                        <div className="text-sm text-text-primary">{formatCurrency(totalLabourCost + totalPartsCost + (repair.cost || 0))}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Days Open</div>
                        <div className={`text-sm font-medium ${repair.daysOpen > 30 ? 'text-status-critical' : repair.daysOpen > 14 ? 'text-status-warning' : 'text-text-primary'}`}>
                          {repair.daysOpen}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">First Time Fix</div>
                        <div className="text-sm text-text-primary">{repair.firstTimeFix ? 'Yes' : 'No'}</div>
                      </div>
                      {repair.satisfaction !== undefined && (
                        <div>
                          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Satisfaction</div>
                          <div className="text-sm text-text-primary">{repair.satisfaction}/5</div>
                        </div>
                      )}
                    </div>
                    {repair.recurrenceRisk > 0 && (
                      <div className="mt-4 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp size={16} className="text-status-warning" />
                          <div className="text-xs font-medium text-status-warning uppercase tracking-wider">Recurrence Risk</div>
                        </div>
                        <div className="text-sm text-text-primary">{repair.recurrenceRisk}% - {repair.recurrenceRisk > 70 ? 'High risk of recurrence' : repair.recurrenceRisk > 40 ? 'Moderate risk' : 'Low risk'}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Costs Tab ── */}
                {activeTab === 'costs' && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-surface-elevated rounded-lg p-4 text-center">
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Labour</div>
                        <div className="text-lg font-bold text-text-primary">{formatCurrency(totalLabourCost)}</div>
                      </div>
                      <div className="bg-surface-elevated rounded-lg p-4 text-center">
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Parts</div>
                        <div className="text-lg font-bold text-text-primary">{formatCurrency(totalPartsCost)}</div>
                      </div>
                      <div className="bg-brand-teal/10 rounded-lg p-4 text-center border border-brand-teal/20">
                        <div className="text-xs text-brand-teal uppercase tracking-wider mb-1">Total</div>
                        <div className="text-lg font-bold text-brand-teal">{formatCurrency(totalLabourCost + totalPartsCost)}</div>
                      </div>
                    </div>

                    {/* Labour Log */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Labour Log</h3>
                        <button onClick={() => setActiveModal('logLabour')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-teal/10 text-brand-teal rounded-lg hover:bg-brand-teal/20 transition-colors">
                          <Plus size={12} /> Add Labour
                        </button>
                      </div>
                      {labourLog.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border-default text-xs text-text-muted uppercase tracking-wider">
                                <th className="text-left py-2 pr-3">Date</th>
                                <th className="text-left py-2 pr-3">Operative</th>
                                <th className="text-right py-2 pr-3">Hours</th>
                                <th className="text-right py-2 pr-3">Rate</th>
                                <th className="text-right py-2 pr-3">Total</th>
                                <th className="text-left py-2">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {labourLog.map((entry: any) => (
                                <tr key={entry.id} className="border-b border-border-default/50">
                                  <td className="py-2 pr-3 text-text-secondary">{formatDate(entry.date)}</td>
                                  <td className="py-2 pr-3 text-text-primary">{entry.operative}</td>
                                  <td className="py-2 pr-3 text-right text-text-primary">{entry.hours}</td>
                                  <td className="py-2 pr-3 text-right text-text-primary">{formatCurrency(entry.rate)}</td>
                                  <td className="py-2 pr-3 text-right font-medium text-text-primary">{formatCurrency(entry.hours * entry.rate)}</td>
                                  <td className="py-2 text-text-muted">{entry.description || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-text-muted text-center py-6 bg-surface-elevated/50 rounded-lg">No labour entries recorded</div>
                      )}
                    </div>

                    {/* Parts Log */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Parts Log</h3>
                        <button onClick={() => setActiveModal('logParts')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-blue/10 text-brand-blue rounded-lg hover:bg-brand-blue/20 transition-colors">
                          <Plus size={12} /> Add Parts
                        </button>
                      </div>
                      {partsLog.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border-default text-xs text-text-muted uppercase tracking-wider">
                                <th className="text-left py-2 pr-3">Date</th>
                                <th className="text-left py-2 pr-3">Part</th>
                                <th className="text-right py-2 pr-3">Qty</th>
                                <th className="text-right py-2 pr-3">Unit Cost</th>
                                <th className="text-right py-2 pr-3">Total</th>
                                <th className="text-left py-2">Supplier</th>
                              </tr>
                            </thead>
                            <tbody>
                              {partsLog.map((entry: any) => (
                                <tr key={entry.id} className="border-b border-border-default/50">
                                  <td className="py-2 pr-3 text-text-secondary">{formatDate(entry.date)}</td>
                                  <td className="py-2 pr-3 text-text-primary">{entry.partName}</td>
                                  <td className="py-2 pr-3 text-right text-text-primary">{entry.quantity}</td>
                                  <td className="py-2 pr-3 text-right text-text-primary">{formatCurrency(entry.unitCost)}</td>
                                  <td className="py-2 pr-3 text-right font-medium text-text-primary">{formatCurrency(entry.quantity * entry.unitCost)}</td>
                                  <td className="py-2 text-text-muted">{entry.supplier || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-text-muted text-center py-6 bg-surface-elevated/50 rounded-lg">No parts entries recorded</div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Linked Cases Tab ── */}
                {activeTab === 'linked' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => setActiveModal('createLinked')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-teal/10 text-brand-teal rounded-lg hover:bg-brand-teal/20 transition-colors">
                        <Plus size={12} /> Create Linked Repair
                      </button>
                      <button onClick={() => setActiveModal('raiseComplaint')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-status-warning/10 text-status-warning rounded-lg hover:bg-status-warning/20 transition-colors">
                        <MessageSquareWarning size={12} /> Raise Complaint
                      </button>
                      <button onClick={() => setActiveModal('duplicate')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-blue/10 text-brand-blue rounded-lg hover:bg-brand-blue/20 transition-colors">
                        <Copy size={12} /> Duplicate
                      </button>
                    </div>

                    {(linkedRepairs.length > 0 || linkedComplaints.length > 0) ? (
                      <div className="space-y-2">
                        {linkedRepairs.map((lr: any) => (
                          <Link key={lr.id} to={`/repairs/${lr.id}`} className="flex items-center justify-between p-3 bg-surface-elevated/50 rounded-lg hover:bg-surface-elevated transition-colors group">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-brand-blue/20 text-brand-blue">REPAIR</span>
                              <span className="text-sm font-medium text-brand-teal group-hover:underline">{lr.reference}</span>
                              <span className="text-sm text-text-muted">{lr.subject}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusPill status={lr.status} size="sm" />
                              <span className="text-xs text-text-muted">{formatDate(lr.createdDate)}</span>
                            </div>
                          </Link>
                        ))}
                        {linkedComplaints.map((lc: any) => (
                          <Link key={lc.id} to={`/complaints/${lc.id}`} className="flex items-center justify-between p-3 bg-surface-elevated/50 rounded-lg hover:bg-surface-elevated transition-colors group">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-status-warning/20 text-status-warning">COMPLAINT</span>
                              <span className="text-sm font-medium text-brand-teal group-hover:underline">{lc.reference}</span>
                              <span className="text-sm text-text-muted">{lc.subject}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusPill status={lc.status} size="sm" />
                              <span className="text-xs text-text-muted">{formatDate(lc.createdDate)}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-text-muted text-center py-8 bg-surface-elevated/50 rounded-lg">
                        No linked cases. Use the buttons above to create links.
                      </div>
                    )}

                    {repair.parentCaseId && (
                      <div className="mt-4 p-3 border border-border-default rounded-lg">
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Parent Case</div>
                        <Link to={`/repairs/${repair.parentCaseId}`} className="text-sm text-brand-teal hover:underline">{repair.parentCaseId}</Link>
                      </div>
                    )}
                    {repair.duplicatedFrom && (
                      <div className="p-3 border border-border-default rounded-lg">
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Duplicated From</div>
                        <Link to={`/repairs/${repair.duplicatedFrom}`} className="text-sm text-brand-teal hover:underline">{repair.duplicatedFrom}</Link>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Activity Tab ── */}
                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    {repairActivities.length > 0 ? (
                      repairActivities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 pb-4 border-b border-border-default last:border-0">
                          <div className="w-8 h-8 rounded-full bg-brand-teal/20 flex items-center justify-center flex-shrink-0">
                            <Clock size={14} className="text-brand-teal" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-text-primary">{activity.subject}</div>
                            <div className="text-xs text-text-secondary mt-1">{activity.description}</div>
                            <div className="text-xs text-text-muted mt-1">{formatDate(activity.date)} · {activity.officer}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-text-muted text-center py-8">
                        No activities logged yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Actions */}
            {aiActions.length > 0 && (
              <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <AiActionCard
                  title="AI Recommended Actions"
                  actions={aiActions}
                  prediction={repair.recurrenceRisk > 70 ? { probability: repair.recurrenceRisk, consequence: 'High probability of recurring repairs without intervention' } : undefined}
                  warning={repair.isAwaabsLaw ? "Awaab's Law compliance required" : undefined}
                />
              </div>
            )}

            {/* Dynamic AI Fields */}
            {intel.dynamicFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '220ms', animationFillMode: 'forwards' }}>
                {intel.dynamicFields.map((field, i) => (
                  <div key={i} className="border-l-[3px] border-status-ai bg-surface-elevated/50 rounded-lg p-3">
                    <div className="text-[10px] text-status-ai uppercase tracking-wider font-medium mb-1">&#10022; AI estimate</div>
                    <div className="text-lg font-bold text-text-primary">{field.value}</div>
                    <div className="text-xs text-text-muted">{field.label}</div>
                    <div className="text-[10px] text-text-muted mt-1">{field.source}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Sidebar (35%) ── */}
          <div className="lg:col-span-4 space-y-4">

            {/* Tenant */}
            <div className="bg-surface-card rounded-lg p-5 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2 mb-3">
                <User size={16} className="text-brand-peach" />
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Tenant</h3>
              </div>
              <Link to={`/tenancies/${tenant?.id}`} className="text-sm font-medium text-brand-teal hover:underline block mb-2">
                {tenant ? `${tenant.title} ${tenant.firstName} ${tenant.lastName}` : 'N/A'}
              </Link>
              {tenant?.communicationPreference && (
                <div className="text-xs text-text-muted mb-2">Prefers: {tenant.communicationPreference}</div>
              )}
              {tenant?.vulnerabilityFlags && tenant.vulnerabilityFlags.length > 0 && (
                <div className="space-y-1.5 mt-3">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Vulnerability Flags</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tenant.vulnerabilityFlags.map((flag: any, i: number) => (
                      <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getVulnerabilityColour(flag.severity)}`}>
                        <ShieldAlert size={10} />
                        {flag.type.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Property */}
            <div className="bg-surface-card rounded-lg p-5 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '180ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-brand-teal" />
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Property</h3>
              </div>
              <Link to={`/properties/${property?.uprn}`} className="text-sm font-medium text-brand-teal hover:underline block mb-2">
                {property?.address || 'N/A'}
              </Link>
              {property && (
                <>
                  <div className="space-y-2 mt-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Damp Risk Score</div>
                        <span className={`text-xs font-bold ${property.dampRisk >= 70 ? 'text-status-critical' : property.dampRisk >= 40 ? 'text-status-warning' : 'text-status-compliant'}`}>
                          {property.dampRisk}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${getDampBarColour(property.dampRisk)}`} style={{ width: `${property.dampRisk}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Previous damp/mould cases</span>
                      <span className="font-medium text-text-primary">{propertyDampCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Total repairs at property</span>
                      <span className="font-medium text-text-primary">{propertyRepairCount}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Assigned Officer */}
            <div className="bg-surface-card rounded-lg p-5 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '210ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center gap-2 mb-3">
                <UserCheck size={16} className="text-brand-blue" />
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Assigned Officer</h3>
              </div>
              <div className="text-sm font-medium text-text-primary mb-1">{repair.handler || 'Unassigned'}</div>
              <div className="text-xs text-text-muted">{repair.sorCode} — {repair.sorDescription}</div>
            </div>

          </div>
        </div>

        {/* ── Smart Action Bar ── */}
        <div className="bg-surface-card rounded-lg p-4 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3">
            {/* Primary Action */}
            <button
              onClick={() => setActiveModal(primaryAction.modal)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-80 transition-colors ${primaryAction.colour}`}
            >
              {primaryAction.icon}
              {primaryAction.label}
            </button>

            {/* Secondary Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSecondaryActions(!showSecondaryActions)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-text-secondary bg-surface-elevated rounded-lg hover:bg-surface-hover transition-colors border border-border-default"
              >
                More Actions
                <ChevronDown size={14} className={`transition-transform ${showSecondaryActions ? 'rotate-180' : ''}`} />
              </button>
              {showSecondaryActions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSecondaryActions(false)} />
                  <div className="absolute bottom-full mb-2 left-0 bg-surface-card rounded-lg border border-border-default shadow-xl z-50 min-w-[200px] py-1">
                    {secondaryActions.map((action) => (
                      <button
                        key={action.modal}
                        onClick={() => { setActiveModal(action.modal); setShowSecondaryActions(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-elevated transition-colors"
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
