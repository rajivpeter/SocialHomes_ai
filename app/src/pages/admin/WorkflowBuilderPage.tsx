/**
 * 5.3.5: Workflow Builder UI
 * Visual workflow builder for admin workflow engine.
 * Supports trigger selection, condition building, action configuration, and flow preview.
 */

import { useState } from 'react';
import {
  Workflow, Plus, Trash2, Play, Save, Copy, ChevronDown, ChevronRight,
  Zap, GitBranch, Mail, Bell, UserPlus, FileText, AlertTriangle,
  CheckCircle, Clock, Settings, ArrowDown, Eye, Pause, X, Edit2
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  config: Record<string, string>;
}

interface WorkflowDef {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: string;
  steps: WorkflowStep[];
  lastModified: string;
  createdBy: string;
  executionCount: number;
}

const TRIGGERS = [
  { id: 'case-created', label: 'Case Created', icon: Zap, desc: 'When a new case is created' },
  { id: 'sla-approaching', label: 'SLA Approaching', icon: Clock, desc: 'When SLA deadline is within threshold' },
  { id: 'arrears-threshold', label: 'Arrears Threshold', icon: AlertTriangle, desc: 'When tenant arrears exceed amount' },
  { id: 'compliance-expiring', label: 'Compliance Expiring', icon: AlertTriangle, desc: 'When a certificate is expiring' },
  { id: 'status-changed', label: 'Status Changed', icon: GitBranch, desc: 'When a case status changes' },
  { id: 'vulnerability-detected', label: 'Vulnerability Detected', icon: AlertTriangle, desc: 'When vulnerability score exceeds threshold' },
];

const CONDITIONS = [
  { id: 'case-type', label: 'Case Type', options: ['repair', 'complaint', 'asb', 'damp-mould', 'financial'] },
  { id: 'priority', label: 'Priority', options: ['emergency', 'urgent', 'routine', 'planned'] },
  { id: 'estate', label: 'Estate', options: ['Oak Park', 'Elm Gardens', 'Cedar Heights', 'Birch Lane', 'Willow Fields'] },
  { id: 'arrears-amount', label: 'Arrears Amount (£)', options: ['100', '250', '500', '1000', '2000'] },
  { id: 'days-before-expiry', label: 'Days Before Expiry', options: ['7', '14', '30', '60', '90'] },
];

const ACTIONS = [
  { id: 'send-email', label: 'Send Email', icon: Mail, desc: 'Send GOV.UK Notify email' },
  { id: 'send-notification', label: 'In-App Notification', icon: Bell, desc: 'Push notification to user' },
  { id: 'assign-case', label: 'Assign Case', icon: UserPlus, desc: 'Auto-assign to officer/team' },
  { id: 'create-task', label: 'Create Task', icon: FileText, desc: 'Create a follow-up task' },
  { id: 'escalate', label: 'Escalate', icon: AlertTriangle, desc: 'Escalate to manager' },
];

const presetWorkflows: WorkflowDef[] = [
  {
    id: 'wf-001', name: 'Emergency Repair Escalation', description: 'Auto-assign and notify manager for emergency repairs',
    isActive: true, trigger: 'case-created', steps: [
      { id: 's1', type: 'condition', config: { field: 'case-type', operator: 'equals', value: 'repair' } },
      { id: 's2', type: 'condition', config: { field: 'priority', operator: 'equals', value: 'emergency' } },
      { id: 's3', type: 'action', config: { action: 'assign-case', target: 'On-call Operative' } },
      { id: 's4', type: 'action', config: { action: 'send-notification', target: 'Team Manager' } },
    ],
    lastModified: '2026-02-20', createdBy: 'Priya Sharma', executionCount: 47,
  },
  {
    id: 'wf-002', name: 'Arrears Early Intervention', description: 'Trigger support letter when arrears exceed £250',
    isActive: true, trigger: 'arrears-threshold', steps: [
      { id: 's1', type: 'condition', config: { field: 'arrears-amount', operator: 'greater-than', value: '250' } },
      { id: 's2', type: 'action', config: { action: 'send-email', template: 'arrears-support' } },
      { id: 's3', type: 'action', config: { action: 'create-task', description: 'Follow-up call within 48 hours' } },
    ],
    lastModified: '2026-02-18', createdBy: 'Amy Chen', executionCount: 23,
  },
  {
    id: 'wf-003', name: 'Gas Safety Reminder', description: 'Send reminders at 30, 14, and 7 days before expiry',
    isActive: true, trigger: 'compliance-expiring', steps: [
      { id: 's1', type: 'condition', config: { field: 'days-before-expiry', operator: 'equals', value: '30' } },
      { id: 's2', type: 'action', config: { action: 'send-email', template: 'gas-safety-reminder' } },
      { id: 's3', type: 'action', config: { action: 'create-task', description: 'Book gas safety inspection' } },
    ],
    lastModified: '2026-02-15', createdBy: 'David Okafor', executionCount: 156,
  },
  {
    id: 'wf-004', name: 'Complaint SLA Warning', description: 'Alert handler when complaint SLA is approaching',
    isActive: false, trigger: 'sla-approaching', steps: [
      { id: 's1', type: 'condition', config: { field: 'case-type', operator: 'equals', value: 'complaint' } },
      { id: 's2', type: 'action', config: { action: 'send-notification', target: 'Case Handler' } },
      { id: 's3', type: 'action', config: { action: 'escalate', target: 'Team Manager' } },
    ],
    lastModified: '2026-02-10', createdBy: 'Marcus Thompson', executionCount: 0,
  },
];

export default function WorkflowBuilderPage() {
  const [workflows, setWorkflows] = useState<WorkflowDef[]>(presetWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDef | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const activeCount = workflows.filter(w => w.isActive).length;
  const totalExecs = workflows.reduce((s, w) => s + w.executionCount, 0);

  const toggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
  };

  const StepIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'trigger': return <Zap size={14} className="text-brand-teal" />;
      case 'condition': return <GitBranch size={14} className="text-status-warning" />;
      case 'action': return <Play size={14} className="text-status-ai" />;
      default: return <Settings size={14} className="text-text-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-peach flex items-center gap-2">
            <Workflow size={24} className="text-brand-teal" /> Workflow Builder
          </h1>
          <p className="text-sm text-text-muted mt-1">{workflows.length} workflows • {activeCount} active • {totalExecs} total executions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-teal text-white rounded-lg text-xs font-medium hover:bg-brand-teal/90 transition-all"
        >
          <Plus size={13} /> Create Workflow
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface-card border border-border-default rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Total Workflows</div>
          <div className="text-2xl font-bold font-heading text-text-primary">{workflows.length}</div>
        </div>
        <div className="bg-surface-card border border-border-default rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Active</div>
          <div className="text-2xl font-bold font-heading text-status-compliant">{activeCount}</div>
        </div>
        <div className="bg-surface-card border border-border-default rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Paused</div>
          <div className="text-2xl font-bold font-heading text-status-warning">{workflows.length - activeCount}</div>
        </div>
        <div className="bg-surface-card border border-border-default rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Executions (30d)</div>
          <div className="text-2xl font-bold font-heading text-brand-teal">{totalExecs}</div>
        </div>
      </div>

      {/* Workflow List */}
      <div className="space-y-3">
        {workflows.map(wf => {
          const triggerDef = TRIGGERS.find(t => t.id === wf.trigger);
          const TriggerIcon = triggerDef?.icon || Zap;
          const isSelected = selectedWorkflow?.id === wf.id;

          return (
            <div key={wf.id} className={`bg-surface-card border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-brand-teal/40' : 'border-border-default'}`}>
              {/* Workflow header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-hover/30 transition-colors"
                onClick={() => setSelectedWorkflow(isSelected ? null : wf)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${wf.isActive ? 'bg-brand-teal/10' : 'bg-surface-dark'}`}>
                    <TriggerIcon size={18} className={wf.isActive ? 'text-brand-teal' : 'text-text-muted'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-heading font-bold text-text-primary">{wf.name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        wf.isActive ? 'bg-status-compliant/15 text-status-compliant' : 'bg-status-void/15 text-status-void'
                      }`}>
                        {wf.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">{wf.description}</div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                      <span>Trigger: {triggerDef?.label}</span>
                      <span>•</span>
                      <span>{wf.steps.length} steps</span>
                      <span>•</span>
                      <span>{wf.executionCount} executions</span>
                      <span>•</span>
                      <span>By {wf.createdBy}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWorkflow(wf.id); }}
                    className={`relative w-10 h-5 rounded-full transition-all ${wf.isActive ? 'bg-brand-teal' : 'bg-surface-hover'}`}
                  >
                    <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all" style={{ left: wf.isActive ? '22px' : '2px' }} />
                  </button>
                  {isSelected ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
                </div>
              </div>

              {/* Expanded detail — Visual flow */}
              {isSelected && (
                <div className="px-4 pb-4 pt-2 border-t border-border-default">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Workflow Flow</span>
                    <div className="flex-1 h-px bg-border-default" />
                    <button className="flex items-center gap-1 text-[10px] text-brand-teal hover:text-brand-teal/80 font-medium">
                      <Edit2 size={10} /> Edit
                    </button>
                    <button className="flex items-center gap-1 text-[10px] text-brand-teal hover:text-brand-teal/80 font-medium">
                      <Eye size={10} /> Test
                    </button>
                    <button className="flex items-center gap-1 text-[10px] text-brand-teal hover:text-brand-teal/80 font-medium">
                      <Copy size={10} /> Duplicate
                    </button>
                  </div>

                  {/* Visual flow */}
                  <div className="space-y-0">
                    {/* Trigger */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-lg bg-brand-teal/15 flex items-center justify-center">
                          <Zap size={14} className="text-brand-teal" />
                        </div>
                        <div className="w-px h-6 bg-border-default" />
                      </div>
                      <div className="flex-1 bg-brand-teal/5 border border-brand-teal/20 rounded-lg p-3">
                        <div className="text-[10px] uppercase tracking-wider text-brand-teal font-semibold mb-0.5">Trigger</div>
                        <div className="text-xs text-text-primary font-medium">{triggerDef?.label}</div>
                        <div className="text-[10px] text-text-muted">{triggerDef?.desc}</div>
                      </div>
                    </div>

                    {/* Steps */}
                    {wf.steps.map((step, idx) => {
                      const isCondition = step.type === 'condition';
                      const isAction = step.type === 'action';
                      const condDef = CONDITIONS.find(c => c.id === step.config.field);
                      const actDef = ACTIONS.find(a => a.id === step.config.action);
                      const ActIcon = actDef?.icon || Settings;

                      return (
                        <div key={step.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isCondition ? 'bg-status-warning/15' : 'bg-status-ai/15'
                            }`}>
                              {isCondition ? <GitBranch size={14} className="text-status-warning" /> : <ActIcon size={14} className="text-status-ai" />}
                            </div>
                            {idx < wf.steps.length - 1 && <div className="w-px h-6 bg-border-default" />}
                          </div>
                          <div className={`flex-1 border rounded-lg p-3 ${
                            isCondition ? 'bg-status-warning/5 border-status-warning/20' : 'bg-status-ai/5 border-status-ai/20'
                          }`}>
                            <div className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${isCondition ? 'text-status-warning' : 'text-status-ai'}`}>
                              {step.type}
                            </div>
                            {isCondition && (
                              <>
                                <div className="text-xs text-text-primary font-medium">
                                  If {condDef?.label || step.config.field} {step.config.operator?.replace(/-/g, ' ')} "{step.config.value}"
                                </div>
                              </>
                            )}
                            {isAction && (
                              <>
                                <div className="text-xs text-text-primary font-medium">{actDef?.label || step.config.action}</div>
                                {step.config.target && <div className="text-[10px] text-text-muted">Target: {step.config.target}</div>}
                                {step.config.template && <div className="text-[10px] text-text-muted">Template: {step.config.template}</div>}
                                {step.config.description && <div className="text-[10px] text-text-muted">"{step.config.description}"</div>}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowCreateModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] glass-card-elevated rounded-2xl shadow-2xl z-50 animate-fade-in-up max-h-[80vh] overflow-y-auto">
            <div className="p-5 border-b border-border-default flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold text-text-primary">Create Workflow</h2>
                <p className="text-xs text-text-muted mt-1">Define triggers, conditions, and actions</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-1">Workflow Name</label>
                <input type="text" placeholder="e.g. Emergency Repair Auto-Assign" className="w-full bg-surface-dark border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-1">Description</label>
                <textarea placeholder="Describe what this workflow does..." className="w-full bg-surface-dark border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted h-16 resize-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-2">Select Trigger</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRIGGERS.map(t => (
                    <button key={t.id} className="p-3 bg-surface-dark border border-border-default rounded-lg text-left hover:border-brand-teal/30 hover:bg-brand-teal/5 transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <t.icon size={14} className="text-brand-teal" />
                        <span className="text-xs font-medium text-text-primary">{t.label}</span>
                      </div>
                      <div className="text-[10px] text-text-muted">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-text-muted font-semibold block mb-2">Add Actions</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIONS.map(a => (
                    <button key={a.id} className="p-3 bg-surface-dark border border-border-default rounded-lg text-left hover:border-status-ai/30 hover:bg-status-ai/5 transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <a.icon size={14} className="text-status-ai" />
                        <span className="text-xs font-medium text-text-primary">{a.label}</span>
                      </div>
                      <div className="text-[10px] text-text-muted">{a.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-border-default flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs text-text-muted hover:text-text-primary transition-colors">Cancel</button>
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-brand-teal text-white rounded-lg text-xs font-medium hover:bg-brand-teal/90 transition-all">Create Workflow</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
