import { useState } from 'react';
import { Sparkles, Send, CheckCircle, Clock, X } from 'lucide-react';

interface AiAction {
  icon: string;
  label: string;
  description: string;
  preview?: string;
}

interface AiActionCardProps {
  title: string;
  actions: AiAction[];
  prediction?: { probability: number; consequence: string };
  warning?: string;
}

export default function AiActionCard({ title, actions, prediction, warning }: AiActionCardProps) {
  const [activeAction, setActiveAction] = useState<number | null>(null);
  const [step, setStep] = useState<'preview' | 'sent' | 'followup' | 'done'>('preview');

  const handleAction = (idx: number) => {
    setActiveAction(idx);
    setStep('preview');
  };

  const handleSend = () => setStep('sent');
  const handleFollowup = (choice: string) => {
    if (choice === 'yes') {
      setStep('followup');
    } else {
      setStep('done');
    }
  };
  const handleCreateTask = () => setStep('done');
  const handleClose = () => { setActiveAction(null); setStep('preview'); };

  return (
    <div className="border-l-[3px] border-status-ai bg-surface-elevated rounded-xl p-4 animate-fade-in-up relative overflow-hidden">
      {/* Subtle AI shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-status-ai/30 via-transparent to-status-ai/10" />

      <div className="flex items-center gap-2 mb-3">
        <div className="p-1 rounded-md bg-status-ai/10">
          <Sparkles size={14} className="text-status-ai" />
        </div>
        <span className="text-sm font-semibold text-status-ai">{title}</span>
      </div>

      {activeAction === null ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleAction(idx)}
                className="flex items-start gap-2 p-3 rounded-lg bg-surface-card hover:bg-surface-hover border border-border-default transition-all duration-200 text-left group hover:border-status-ai/30"
              >
                <span className="text-lg mt-0.5">{action.icon}</span>
                <div>
                  <div className="text-sm font-medium text-text-primary group-hover:text-status-ai transition-colors">{action.label}</div>
                  <div className="text-xs text-text-muted mt-0.5 leading-relaxed">{action.description}</div>
                </div>
              </button>
            ))}
          </div>

          {prediction && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-status-ai/5 border border-status-ai/15">
              <span className="text-sm">🔮</span>
              <div className="text-xs text-text-secondary">
                <span className="font-semibold text-status-ai">{prediction.probability}% probability</span> — {prediction.consequence}
              </div>
            </div>
          )}

          {warning && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-status-warning/5 border border-status-warning/15 mt-2">
              <span className="text-sm">ℹ️</span>
              <div className="text-xs text-status-warning">{warning}</div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {step === 'preview' && (
            <>
              <div className="bg-surface-card rounded-lg p-3 border border-border-default">
                <div className="text-[10px] text-text-muted mb-2 uppercase tracking-wider font-semibold">Preview</div>
                <div className="text-sm text-text-primary leading-relaxed">
                  {actions[activeAction].preview || `Dear ${'{Tenant Name}'},\n\nThank you for your patience regarding your recent ${actions[activeAction].label.toLowerCase()}. We wanted to update you on the current status and expected timeline.\n\nWe apologise for the delay and are working to resolve this as quickly as possible.\n\nKind regards,\nRCHA Housing Team`}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSend} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-status-ai to-status-ai/80 text-white rounded-lg text-sm font-medium hover:shadow-md hover:shadow-status-ai/20 transition-all duration-200">
                  <Send size={14} /> Send
                </button>
                <button onClick={handleClose} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-card text-text-secondary rounded-lg text-sm hover:bg-surface-hover transition-colors border border-border-default">
                  <X size={14} /> Cancel
                </button>
              </div>
            </>
          )}

          {step === 'sent' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-status-compliant">
                <CheckCircle size={18} />
                <span className="text-sm font-semibold">Sent successfully</span>
              </div>
              <div className="bg-surface-card rounded-lg p-3 border border-border-default">
                <div className="text-sm text-text-primary mb-2">Would you like to create a follow-up task?</div>
                <div className="flex gap-2">
                  <button onClick={() => handleFollowup('yes')} className="px-3 py-1.5 bg-gradient-to-r from-brand-teal to-brand-deep text-white rounded-lg text-sm font-medium hover:shadow-md hover:shadow-brand-teal/20 transition-all">Yes</button>
                  <button onClick={() => handleFollowup('no')} className="px-3 py-1.5 bg-surface-hover text-text-secondary rounded-lg text-sm border border-border-default hover:bg-surface-card transition-colors">No thanks</button>
                </div>
              </div>
            </div>
          )}

          {step === 'followup' && (
            <div className="space-y-3">
              <div className="bg-surface-card rounded-lg p-3 border border-border-default">
                <div className="text-sm text-text-primary mb-2">When should the follow-up be?</div>
                <div className="flex flex-wrap gap-2">
                  {['Day after completion', '3 working days', '1 week', 'Custom date'].map(opt => (
                    <button key={opt} onClick={handleCreateTask} className="px-3 py-1.5 bg-surface-hover text-text-secondary rounded-lg text-sm border border-border-default hover:border-brand-teal/50 hover:text-brand-teal transition-all duration-200">
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-status-compliant">
                <CheckCircle size={18} />
                <span className="text-sm font-semibold">All done! Action logged.</span>
              </div>
              {step === 'done' && activeAction !== null && (
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Clock size={12} />
                  <span>Follow-up task created and linked to case</span>
                </div>
              )}
              <button onClick={handleClose} className="text-sm text-brand-teal hover:text-brand-teal/80 transition-colors font-medium">Close</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
