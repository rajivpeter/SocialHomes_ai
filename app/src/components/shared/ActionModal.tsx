import { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element and focus the modal when opened
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the modal after animation
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });
    } else {
      // Restore focus when closing
      previousFocusRef.current?.focus();
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !modalRef.current) return;
    const modal = modalRef.current;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required && field.type !== 'readonly') {
        const val = values[field.id]?.trim();
        if (!val) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
    });
    return newErrors;
  }, [fields, values]);

  const handleBlur = (fieldId: string) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }));
    const field = fields.find(f => f.id === fieldId);
    if (field?.required && !values[fieldId]?.trim()) {
      setErrors(prev => ({ ...prev, [fieldId]: `${field.label} is required` }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched(Object.fromEntries(fields.map(f => [f.id, true])));
      return;
    }
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

  const fieldErrorClass = 'border-status-critical focus:border-status-critical';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        tabIndex={-1}
        className={`relative bg-surface-card rounded-xl border ${borderColor} shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-fade-in-up focus:outline-none`}
        style={{ animationDuration: '200ms' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-default">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-text-primary">{title}</h2>
              {description && <p id="modal-description" className="text-xs text-text-muted mt-0.5">{description}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated transition-colors" aria-label="Close dialog">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* Success State */}
        {submitted ? (
          <div className="p-8 text-center" role="status" aria-live="polite">
            <CheckCircle size={48} className="mx-auto text-status-compliant mb-3" />
            <h3 className="text-lg font-bold text-text-primary mb-1">Action Completed</h3>
            <p className="text-sm text-text-muted">Changes have been saved successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="p-5 space-y-4">
              {fields.map(field => {
                const fieldId = `field-${field.id}`;
                const errorId = `error-${field.id}`;
                const hasError = touched[field.id] && errors[field.id];
                return (
                  <div key={field.id}>
                    <label htmlFor={fieldId} className="block text-xs text-text-muted uppercase tracking-wider mb-1.5 font-medium">
                      {field.label}{field.required && <span className="text-status-critical ml-0.5" aria-label="required">*</span>}
                    </label>
                    {field.type === 'readonly' ? (
                      <div id={fieldId} className="px-3 py-2 bg-surface-elevated rounded-lg text-sm text-text-secondary border border-border-default" aria-readonly="true">
                        {field.defaultValue}
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        id={fieldId}
                        className={`w-full px-3 py-2 bg-surface-elevated rounded-lg text-sm text-text-primary border ${hasError ? fieldErrorClass : 'border-border-default focus:border-brand-teal'} focus:outline-none resize-y min-h-[80px]`}
                        placeholder={field.placeholder}
                        value={values[field.id] || ''}
                        onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        onBlur={() => handleBlur(field.id)}
                        aria-required={field.required}
                        aria-invalid={hasError ? 'true' : undefined}
                        aria-describedby={hasError ? errorId : undefined}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        id={fieldId}
                        className={`w-full px-3 py-2 bg-surface-elevated rounded-lg text-sm text-text-primary border ${hasError ? fieldErrorClass : 'border-border-default focus:border-brand-teal'} focus:outline-none`}
                        value={values[field.id] || ''}
                        onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        onBlur={() => handleBlur(field.id)}
                        aria-required={field.required}
                        aria-invalid={hasError ? 'true' : undefined}
                        aria-describedby={hasError ? errorId : undefined}
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={fieldId}
                        type={field.type}
                        className={`w-full px-3 py-2 bg-surface-elevated rounded-lg text-sm text-text-primary border ${hasError ? fieldErrorClass : 'border-border-default focus:border-brand-teal'} focus:outline-none`}
                        placeholder={field.placeholder}
                        value={values[field.id] || ''}
                        onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        onBlur={() => handleBlur(field.id)}
                        aria-required={field.required}
                        aria-invalid={hasError ? 'true' : undefined}
                        aria-describedby={hasError ? errorId : undefined}
                      />
                    )}
                    {hasError && (
                      <div id={errorId} className="flex items-center gap-1 mt-1 text-xs text-status-critical" role="alert">
                        <AlertCircle size={12} />
                        {errors[field.id]}
                      </div>
                    )}
                  </div>
                );
              })}
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
