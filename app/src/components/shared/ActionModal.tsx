import { useState } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';

export interface ActionField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'readonly';
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
}

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  fields: ActionField[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => void;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export default function ActionModal({ open, onClose, title, description, icon, fields, submitLabel = 'Submit', onSubmit, variant = 'default' }: ActionModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    fields.forEach(f => { if (f.defaultValue) defaults[f.id] = f.defaultValue; });
    return defaults;
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setSubmitting(false);
    setSubmitted(true);
    onSubmit(values);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  const borderColor = variant === 'danger' ? 'border-status-critical/30' :
    variant === 'warning' ? 'border-status-warning/30' :
    variant === 'success' ? 'border-status-compliant/30' :
    'border-brand-teal/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative bg-surface-card rounded-xl border ${borderColor} shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-fade-in-up`} style={{ animationDuration: '200ms' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-default">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h2 className="text-lg font-bold text-text-primary">{title}</h2>
              {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* Success State */}
        {submitted ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-status-compliant mb-3" />
            <h3 className="text-lg font-bold text-text-primary mb-1">Action Completed</h3>
            <p className="text-sm text-text-muted">Changes have been saved successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-5 space-y-4">
              {fields.map(field => (
                <div key={field.id}>
                  <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5 font-medium">
                    {field.label}{field.required && <span className="text-status-critical ml-0.5">*</span>}
                  </label>
                  {field.type === 'readonly' ? (
                    <div className="px-3 py-2 bg-surface-elevated rounded-lg text-sm text-text-secondary border border-border-default">
                      {field.defaultValue}
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      className="w-full px-3 py-2 bg-surface-elevated rounded-lg text-sm text-text-primary border border-border-default focus:border-brand-teal focus:outline-none resize-y min-h-[80px]"
                      placeholder={field.placeholder}
                      value={values[field.id] || ''}
                      onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      className="w-full px-3 py-2 bg-surface-elevated rounded-lg text-sm text-text-primary border border-border-default focus:border-brand-teal focus:outline-none"
                      value={values[field.id] || ''}
                      onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      required={field.required}
                    >
                      <option value="">Select...</option>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      className="w-full px-3 py-2 bg-surface-elevated rounded-lg text-sm text-text-primary border border-border-default focus:border-brand-teal focus:outline-none"
                      placeholder={field.placeholder}
                      value={values[field.id] || ''}
                      onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border-default">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-muted bg-surface-elevated rounded-lg hover:bg-surface-hover transition-colors border border-border-default">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors flex items-center gap-2 ${
                  variant === 'danger' ? 'bg-status-critical hover:bg-status-critical/80' :
                  variant === 'warning' ? 'bg-status-warning hover:bg-status-warning/80' :
                  variant === 'success' ? 'bg-status-compliant hover:bg-status-compliant/80' :
                  'bg-brand-teal hover:bg-brand-teal/80'
                } disabled:opacity-50`}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
