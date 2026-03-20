import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Upload, Download, CheckCircle, AlertTriangle,
  Building2, Users, Wrench, CreditCard, FileSpreadsheet, Loader2,
  X, Eye, ChevronDown, Sparkles, Check, AlertCircle,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type EntityType = 'properties' | 'tenants' | 'cases' | 'rentTransactions';

interface FieldDef {
  field: string;
  label: string;
  required: boolean;
  type: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface MappingSuggestion {
  sourceField: string;
  targetField: string;
  confidence: number;
}

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
  errors: { row: number; message: string }[];
}

// ============================================================
// Entity type definitions for Step 1
// ============================================================

const ENTITY_OPTIONS: {
  id: EntityType;
  label: string;
  description: string;
  icon: typeof Building2;
  expectedFields: number;
}[] = [
  { id: 'properties', label: 'Properties', description: 'Import property stock data including addresses, types, bedrooms, EPC ratings, and rent amounts.', icon: Building2, expectedFields: 22 },
  { id: 'tenants', label: 'Tenants', description: 'Import tenant records with contact details, tenancy information, and payment data.', icon: Users, expectedFields: 19 },
  { id: 'cases', label: 'Cases / Repairs', description: 'Import repair orders, complaints, ASB cases, and other case records.', icon: Wrench, expectedFields: 17 },
  { id: 'rentTransactions', label: 'Rent Transactions', description: 'Import historical rent payment and charge transaction records.', icon: CreditCard, expectedFields: 10 },
];

// ============================================================
// CSV Parser (no external dependency)
// ============================================================

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Parse a CSV line respecting quoted fields
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, j) => {
      row[header] = values[j] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

// ============================================================
// API helpers
// ============================================================

const API_BASE = '/api/v1';

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const authMode = localStorage.getItem('socialhomes-auth-mode');
  const persona = localStorage.getItem('socialhomes-persona') || 'housing-officer';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Persona': persona,
  };

  if (authMode === 'firebase') {
    try {
      // Dynamic import to avoid circular deps
      const { getIdToken } = await import('@/services/firebase');
      const token = await getIdToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // Fall back to X-Persona
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ============================================================
// Step labels
// ============================================================

const STEP_LABELS = ['Entity Type', 'Upload', 'Map Fields', 'Validate', 'Import'];
const TOTAL_STEPS = STEP_LABELS.length;

// ============================================================
// Component
// ============================================================

export default function DataImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [entityType, setEntityType] = useState<EntityType | ''>('');
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');

  // Mapping state
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [targetFields, setTargetFields] = useState<FieldDef[]>([]);

  // Validation state
  const [validating, setValidating] = useState(false);
  const [validCount, setValidCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');

  // Loading templates
  const [templates, setTemplates] = useState<Record<string, { headers: string[]; fields: FieldDef[]; description: string }> | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // ============================================================
  // Fetch templates when needed
  // ============================================================

  const fetchTemplates = useCallback(async () => {
    if (templates) return templates;
    setLoadingTemplates(true);
    try {
      const data = await apiRequest<Record<string, { headers: string[]; fields: FieldDef[]; description: string }>>('/import/templates');
      setTemplates(data);
      return data;
    } catch {
      // Fallback: return null, we can still proceed
      return null;
    } finally {
      setLoadingTemplates(false);
    }
  }, [templates]);

  // ============================================================
  // Step navigation
  // ============================================================

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return entityType !== '';
      case 2: return rawData.length > 0;
      case 3: {
        // At least all required fields must be mapped
        const requiredFields = targetFields.filter(f => f.required);
        const mappedTargets = new Set(Object.values(mapping));
        return requiredFields.every(f => mappedTargets.has(f.field));
      }
      case 4: return validCount > 0;
      case 5: return true;
      default: return false;
    }
  }, [step, entityType, rawData, mapping, targetFields, validCount]);

  const handleNext = useCallback(async () => {
    if (step === 1 && entityType) {
      // Fetch templates when moving from step 1 to 2
      const tmpl = await fetchTemplates();
      if (tmpl && tmpl[entityType]) {
        setTargetFields(tmpl[entityType].fields);
      }
    }

    if (step === 2 && sourceHeaders.length > 0 && entityType) {
      // Auto-suggest mappings when moving to step 3
      try {
        const result = await apiRequest<{
          valid: number;
          invalid: number;
          total: number;
          errors: ValidationError[];
          suggestedMapping: MappingSuggestion[];
        }>('/import/validate', {
          method: 'POST',
          body: JSON.stringify({
            entityType,
            records: rawData.slice(0, 1), // Just send one record for suggestions
            sourceHeaders,
          }),
        });

        // Apply suggested mappings
        const newMapping: Record<string, string> = {};
        for (const suggestion of result.suggestedMapping) {
          if (suggestion.confidence >= 0.5) {
            newMapping[suggestion.sourceField] = suggestion.targetField;
          }
        }
        setMapping(newMapping);
      } catch {
        // If validation fails, still proceed — user can manually map
      }
    }

    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
    }
  }, [step, entityType, sourceHeaders, rawData, fetchTemplates]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(s => s - 1);
      // Reset downstream state if going back
      if (step === 5) {
        setImportResult(null);
        setImportError('');
        setImportProgress(0);
      }
      if (step === 4) {
        setValidationErrors([]);
        setValidCount(0);
        setPreviewData([]);
      }
    }
  }, [step]);

  // ============================================================
  // File handling
  // ============================================================

  const handleFile = useCallback((file: File) => {
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const { headers, rows } = parseCSV(text);
      setSourceHeaders(headers);
      setRawData(rows);
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv' || file.name.endsWith('.txt'))) {
      handleFile(file);
    }
  }, [handleFile]);

  // ============================================================
  // Download CSV template
  // ============================================================

  const downloadTemplate = useCallback(async () => {
    const tmpl = await fetchTemplates();
    if (!tmpl || !entityType || !tmpl[entityType]) return;
    const headers = tmpl[entityType].headers;
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entityType, fetchTemplates]);

  // ============================================================
  // Validate & Preview (Step 4)
  // ============================================================

  const runValidation = useCallback(async () => {
    if (!entityType) return;
    setValidating(true);
    setValidationErrors([]);

    try {
      // Apply mapping to records
      const mappedRecords = rawData.map(row => {
        const mapped: Record<string, any> = {};
        for (const [sourceField, targetField] of Object.entries(mapping)) {
          mapped[targetField] = row[sourceField];
        }
        return mapped;
      });

      // Validate
      const validationResult = await apiRequest<{
        valid: number;
        invalid: number;
        total: number;
        errors: ValidationError[];
        suggestedMapping: MappingSuggestion[];
      }>('/import/validate', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          records: mappedRecords,
        }),
      });

      setValidCount(validationResult.valid);
      setValidationErrors(validationResult.errors);

      // Preview
      const previewResult = await apiRequest<{
        preview: Record<string, any>[];
        targetFields: any[];
        totalRecords: number;
        previewCount: number;
      }>('/import/preview', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          records: rawData,
          mapping,
        }),
      });

      setPreviewData(previewResult.preview);
    } catch (err: any) {
      setValidationErrors([{ row: 0, field: 'general', message: err.message || 'Validation failed' }]);
    } finally {
      setValidating(false);
    }
  }, [entityType, rawData, mapping]);

  // Auto-validate when entering step 4
  const handleEnterStep4 = useCallback(async () => {
    await handleNext();
    // Run validation after step transition
    setTimeout(() => runValidation(), 100);
  }, [handleNext, runValidation]);

  // ============================================================
  // Execute import (Step 5)
  // ============================================================

  const executeImport = useCallback(async () => {
    if (!entityType) return;
    setImporting(true);
    setImportError('');
    setImportProgress(0);

    try {
      // Apply mapping to all records
      const mappedRecords = rawData.map(row => {
        const mapped: Record<string, any> = {};
        for (const [sourceField, targetField] of Object.entries(mapping)) {
          mapped[targetField] = row[sourceField];
        }
        return mapped;
      });

      // Simulate progress (since we do one batch call)
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const result = await apiRequest<ImportResult>('/import/execute', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          records: mappedRecords,
          mapping: {}, // mapping already applied
        }),
      });

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [entityType, rawData, mapping]);

  // ============================================================
  // Mapping helpers
  // ============================================================

  const updateMapping = useCallback((sourceField: string, targetField: string) => {
    setMapping(prev => {
      const next = { ...prev };
      if (targetField === '') {
        delete next[sourceField];
      } else {
        // Remove any other source mapped to this target
        for (const [key, val] of Object.entries(next)) {
          if (val === targetField && key !== sourceField) {
            delete next[key];
          }
        }
        next[sourceField] = targetField;
      }
      return next;
    });
  }, []);

  const mappedTargets = useMemo(() => new Set(Object.values(mapping)), [mapping]);

  // ============================================================
  // Entity type label helper
  // ============================================================

  const entityLabel = useMemo(() => {
    return ENTITY_OPTIONS.find(e => e.id === entityType)?.label || entityType;
  }, [entityType]);

  const entityRouteMap: Record<string, string> = {
    properties: '/properties',
    tenants: '/tenancies',
    cases: '/repairs',
    rentTransactions: '/rent',
  };

  // ============================================================
  // RENDER: Success screen
  // ============================================================

  if (importResult && step === 5) {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-surface-card rounded-xl p-8 md:p-12 border border-border-default text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
            <div className="w-16 h-16 rounded-full bg-status-compliant/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-status-compliant" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-2">
              Import Complete
            </h1>
            <p className="text-text-muted mb-6">
              Your {entityLabel.toLowerCase()} data has been successfully imported.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-surface-elevated rounded-lg p-4">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Imported</div>
                <div className="text-2xl font-bold font-heading text-status-compliant">{importResult.imported}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-4">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Skipped</div>
                <div className="text-2xl font-bold font-heading text-status-warning">{importResult.skipped}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-4">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Total</div>
                <div className="text-2xl font-bold font-heading text-text-primary">{importResult.total}</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-status-critical/10 border border-status-critical/20 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-status-critical mb-2">Import Errors ({importResult.errors.length})</h3>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-text-muted">
                      <span className="text-status-critical font-medium">Row {err.row}:</span> {err.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate(entityRouteMap[entityType] || '/admin')}
                className="px-6 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/80 transition-colors font-medium"
              >
                View Imported Data
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setEntityType('');
                  setRawData([]);
                  setSourceHeaders([]);
                  setFileName('');
                  setMapping({});
                  setTargetFields([]);
                  setValidCount(0);
                  setValidationErrors([]);
                  setPreviewData([]);
                  setImportResult(null);
                  setImportError('');
                  setImportProgress(0);
                }}
                className="px-6 py-3 bg-surface-elevated text-text-primary rounded-lg hover:bg-surface-hover transition-colors font-medium border border-border-default"
              >
                Import More Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: Wizard
  // ============================================================

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-4 mb-1">
            <button onClick={() => navigate('/admin')} className="text-text-muted hover:text-brand-teal transition-colors text-sm">
              <span className="flex items-center gap-1"><ArrowLeft size={14} /> Back to Admin</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">Data Import Wizard</h1>
          <p className="text-text-muted">Self-service migration — import your existing data into SocialHomes.Ai.</p>
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
              className="bg-brand-teal h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-surface-card rounded-xl p-6 md:p-8 border border-border-default opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>

          {/* ========== STEP 1: Select Entity Type ========== */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold font-heading text-text-primary mb-1">What data are you importing?</h2>
              <p className="text-sm text-text-muted mb-6">Select the type of records you want to bring into SocialHomes.Ai.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ENTITY_OPTIONS.map(option => {
                  const Icon = option.icon;
                  const selected = entityType === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setEntityType(option.id)}
                      className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                        selected
                          ? 'border-brand-teal bg-brand-teal/10 ring-1 ring-brand-teal/20'
                          : 'border-border-default bg-surface-elevated hover:border-brand-teal/40 hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-brand-teal/20 text-brand-teal' : 'bg-surface-card text-text-muted'
                        }`}>
                          <Icon size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${selected ? 'text-brand-teal' : 'text-text-primary'}`}>
                              {option.label}
                            </h3>
                            {selected && <Check size={16} className="text-brand-teal" />}
                          </div>
                          <p className="text-xs text-text-muted leading-relaxed">{option.description}</p>
                          <p className="text-[10px] text-text-muted mt-2 uppercase tracking-wider">
                            {option.expectedFields} fields supported
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========== STEP 2: Upload Data ========== */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold font-heading text-text-primary mb-1">Upload your {entityLabel} data</h2>
              <p className="text-sm text-text-muted mb-6">
                Upload a CSV file containing your {entityLabel.toLowerCase()} records. Need the right format?{' '}
                <button
                  onClick={downloadTemplate}
                  className="text-brand-teal hover:underline inline-flex items-center gap-1"
                  disabled={loadingTemplates}
                >
                  <Download size={12} /> Download template
                </button>
              </p>

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-brand-teal bg-brand-teal/10'
                    : fileName
                      ? 'border-status-compliant/40 bg-status-compliant/5'
                      : 'border-border-default hover:border-brand-teal/40 hover:bg-surface-hover'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />

                {fileName ? (
                  <div>
                    <FileSpreadsheet size={40} className="mx-auto mb-3 text-status-compliant" />
                    <p className="text-text-primary font-medium mb-1">{fileName}</p>
                    <p className="text-sm text-text-muted">{rawData.length} records found</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName('');
                        setRawData([]);
                        setSourceHeaders([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="mt-3 text-xs text-status-critical hover:underline inline-flex items-center gap-1"
                    >
                      <X size={12} /> Remove file
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={40} className="mx-auto mb-3 text-text-muted" />
                    <p className="text-text-primary font-medium mb-1">Drag & drop your CSV file here</p>
                    <p className="text-sm text-text-muted">or click to browse</p>
                    <p className="text-xs text-text-muted mt-2">Supports .csv files</p>
                  </div>
                )}
              </div>

              {/* Raw data preview */}
              {rawData.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Eye size={14} /> Raw Data Preview (first 5 rows)
                  </h3>
                  <div className="overflow-x-auto border border-border-default rounded-lg">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-surface-elevated">
                          {sourceHeaders.map(h => (
                            <th key={h} className="px-3 py-2 text-left text-text-muted font-medium whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-border-default hover:bg-surface-hover/50">
                            {sourceHeaders.map(h => (
                              <td key={h} className="px-3 py-2 text-text-secondary whitespace-nowrap max-w-[200px] truncate">
                                {row[h] || <span className="text-text-muted italic">empty</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== STEP 3: Map Fields ========== */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold font-heading text-text-primary mb-1">Map your fields</h2>
              <p className="text-sm text-text-muted mb-2">
                Match your CSV columns to the HACT v3.5 standard fields. AI has auto-suggested mappings based on your header names.
              </p>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={14} className="text-brand-teal" />
                <span className="text-xs text-brand-teal font-medium">
                  {Object.keys(mapping).length} of {sourceHeaders.length} fields auto-mapped
                </span>
              </div>

              {/* Required fields status */}
              {(() => {
                const requiredFields = targetFields.filter(f => f.required);
                const mappedRequired = requiredFields.filter(f => mappedTargets.has(f.field));
                const unmappedRequired = requiredFields.filter(f => !mappedTargets.has(f.field));
                return (
                  <div className={`rounded-lg p-3 mb-6 border ${
                    unmappedRequired.length === 0
                      ? 'bg-status-compliant/10 border-status-compliant/20'
                      : 'bg-status-warning/10 border-status-warning/20'
                  }`}>
                    <div className="flex items-center gap-2">
                      {unmappedRequired.length === 0 ? (
                        <CheckCircle size={14} className="text-status-compliant" />
                      ) : (
                        <AlertTriangle size={14} className="text-status-warning" />
                      )}
                      <span className="text-xs font-medium text-text-primary">
                        {mappedRequired.length}/{requiredFields.length} required fields mapped
                      </span>
                    </div>
                    {unmappedRequired.length > 0 && (
                      <p className="text-xs text-text-muted mt-1 ml-6">
                        Missing: {unmappedRequired.map(f => f.label).join(', ')}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Mapping table */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {sourceHeaders.map(header => {
                  const currentTarget = mapping[header] || '';
                  const targetDef = targetFields.find(f => f.field === currentTarget);
                  return (
                    <div
                      key={header}
                      className="flex items-center gap-3 p-3 bg-surface-elevated rounded-lg border border-border-default"
                    >
                      {/* Source */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">{header}</div>
                        <div className="text-[10px] text-text-muted">
                          e.g. "{rawData[0]?.[header] || 'N/A'}"
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight size={16} className="text-text-muted flex-shrink-0" />

                      {/* Target dropdown */}
                      <div className="flex-1 min-w-0 relative">
                        <select
                          value={currentTarget}
                          onChange={(e) => updateMapping(header, e.target.value)}
                          className="w-full bg-surface-card text-text-primary text-sm rounded-lg border border-border-default px-3 py-2 appearance-none cursor-pointer focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal outline-none"
                        >
                          <option value="">-- Skip this field --</option>
                          {targetFields.map(field => {
                            const alreadyMapped = mappedTargets.has(field.field) && mapping[header] !== field.field;
                            return (
                              <option
                                key={field.field}
                                value={field.field}
                                disabled={alreadyMapped}
                              >
                                {field.label}{field.required ? ' *' : ''}{alreadyMapped ? ' (already mapped)' : ''}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      </div>

                      {/* Status icon */}
                      <div className="flex-shrink-0 w-6">
                        {currentTarget ? (
                          <Check size={16} className="text-status-compliant" />
                        ) : (
                          <span className="block w-4 h-4 rounded-full border border-border-default" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========== STEP 4: Validate & Preview ========== */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold font-heading text-text-primary mb-1">Validate & Preview</h2>
              <p className="text-sm text-text-muted mb-6">
                Review validation results and preview how your data will look after import.
              </p>

              {/* Validate button / auto-validate */}
              {!validating && validCount === 0 && validationErrors.length === 0 && (
                <button
                  onClick={runValidation}
                  className="px-5 py-2.5 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/80 transition-colors font-medium text-sm mb-6 flex items-center gap-2"
                >
                  <CheckCircle size={16} /> Run Validation
                </button>
              )}

              {validating && (
                <div className="flex items-center gap-3 text-text-muted mb-6">
                  <Loader2 size={20} className="animate-spin text-brand-teal" />
                  <span className="text-sm">Validating {rawData.length} records...</span>
                </div>
              )}

              {/* Validation summary */}
              {!validating && (validCount > 0 || validationErrors.length > 0) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-status-compliant/10 border border-status-compliant/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle size={16} className="text-status-compliant" />
                        <span className="text-sm font-semibold text-text-primary">Valid Records</span>
                      </div>
                      <div className="text-3xl font-bold font-heading text-status-compliant">{validCount}</div>
                      <div className="text-xs text-text-muted">Ready to import</div>
                    </div>
                    <div className={`rounded-lg p-4 border ${
                      validationErrors.length > 0
                        ? 'bg-status-critical/10 border-status-critical/20'
                        : 'bg-surface-elevated border-border-default'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle size={16} className={validationErrors.length > 0 ? 'text-status-critical' : 'text-text-muted'} />
                        <span className="text-sm font-semibold text-text-primary">Errors</span>
                      </div>
                      <div className={`text-3xl font-bold font-heading ${validationErrors.length > 0 ? 'text-status-critical' : 'text-text-muted'}`}>
                        {validationErrors.length}
                      </div>
                      <div className="text-xs text-text-muted">
                        {validationErrors.length > 0 ? 'Fix to include these records' : 'No errors found'}
                      </div>
                    </div>
                  </div>

                  {/* Error list */}
                  {validationErrors.length > 0 && (
                    <div className="bg-surface-elevated rounded-lg border border-border-default">
                      <div className="p-3 border-b border-border-default flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                          <AlertTriangle size={14} className="text-status-warning" />
                          Validation Errors
                        </h3>
                        <button
                          onClick={() => setStep(3)}
                          className="text-xs text-brand-teal hover:underline"
                        >
                          Fix errors in mapping
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-border-default">
                        {validationErrors.slice(0, 50).map((err, i) => (
                          <div key={i} className="px-3 py-2 text-xs flex items-start gap-3">
                            <span className="text-text-muted font-mono whitespace-nowrap">Row {err.row}</span>
                            <span className="text-brand-teal font-medium whitespace-nowrap">{err.field}</span>
                            <span className="text-text-secondary">{err.message}</span>
                          </div>
                        ))}
                        {validationErrors.length > 50 && (
                          <div className="px-3 py-2 text-xs text-text-muted italic">
                            ...and {validationErrors.length - 50} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview table */}
                  {previewData.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <Eye size={14} /> Transformed Preview (first {previewData.length} records)
                      </h3>
                      <div className="overflow-x-auto border border-border-default rounded-lg">
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="bg-surface-elevated">
                              {Object.keys(previewData[0]).map(key => (
                                <th key={key} className="px-3 py-2 text-left text-text-muted font-medium whitespace-nowrap">
                                  {targetFields.find(f => f.field === key)?.label || key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.map((row, i) => (
                              <tr key={i} className="border-t border-border-default hover:bg-surface-hover/50">
                                {Object.entries(row).map(([key, val]) => (
                                  <td key={key} className="px-3 py-2 text-text-secondary whitespace-nowrap max-w-[200px] truncate">
                                    {val !== undefined && val !== null ? String(val) : <span className="text-text-muted italic">--</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========== STEP 5: Import ========== */}
          {step === 5 && !importResult && (
            <div>
              <h2 className="text-xl font-bold font-heading text-text-primary mb-1">Import {entityLabel}</h2>
              <p className="text-sm text-text-muted mb-6">
                Ready to import {validCount} valid records into SocialHomes.Ai. Records will be written in batches of 500.
              </p>

              {/* Summary */}
              <div className="bg-surface-elevated rounded-lg p-5 border border-border-default mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Entity</div>
                    <div className="text-sm font-semibold text-text-primary">{entityLabel}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Records</div>
                    <div className="text-sm font-semibold text-text-primary">{rawData.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Valid</div>
                    <div className="text-sm font-semibold text-status-compliant">{validCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Fields Mapped</div>
                    <div className="text-sm font-semibold text-text-primary">{Object.keys(mapping).length}</div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {importing && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-text-muted">Importing records...</span>
                    <span className="font-medium text-brand-teal">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-3">
                    <div
                      className="bg-brand-teal h-3 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Import error */}
              {importError && (
                <div className="bg-status-critical/10 border border-status-critical/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-status-critical" />
                    <span className="text-sm font-medium text-status-critical">Import Failed</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">{importError}</p>
                </div>
              )}

              {/* Import button */}
              {!importing && (
                <button
                  onClick={executeImport}
                  disabled={validCount === 0}
                  className="w-full px-6 py-4 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/80 transition-colors font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  Import {validCount} Records
                </button>
              )}

              {importing && (
                <div className="flex items-center justify-center gap-3 py-4 text-text-muted">
                  <Loader2 size={20} className="animate-spin text-brand-teal" />
                  <span className="text-sm">Writing records to database...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {!(step === 5 && importResult) && (
          <div className="flex items-center justify-between opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-5 py-2.5 bg-surface-elevated text-text-primary rounded-lg hover:bg-surface-hover transition-colors font-medium text-sm border border-border-default disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {step < TOTAL_STEPS && (
              <button
                onClick={step === 3 ? handleEnterStep4 : handleNext}
                disabled={!canProceed}
                className="px-5 py-2.5 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/80 transition-colors font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {step === 3 ? 'Validate' : 'Next'} <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
