// UK formatting utilities

/**
 * Safely convert any value into a renderable string.
 * Handles Firestore Timestamps ({_seconds, _nanoseconds}),
 * Date objects, strings, numbers, null/undefined, and plain objects.
 * Prevents React Error #310 ("Objects are not valid as a React child").
 */
export function safeText(value: any, fallback = 'N/A'): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value || fallback;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  // Firestore Timestamp serialised via JSON (comes from Express API)
  if (typeof value === 'object' && '_seconds' in value) {
    try {
      const d = new Date(value._seconds * 1000);
      return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return fallback;
    }
  }
  // Native Date object
  if (value instanceof Date) {
    return value.toLocaleDateString('en-GB');
  }
  // Firestore Timestamp with toDate() (if used client-side)
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    try {
      return value.toDate().toLocaleDateString('en-GB');
    } catch {
      return fallback;
    }
  }
  // Fallback: stringify to prevent Error #310
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-GB').format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function formatDate(dateStr: any): string {
  if (!dateStr) return 'N/A';
  // Firestore Timestamp serialised as JSON {_seconds, _nanoseconds}
  if (typeof dateStr === 'object' && '_seconds' in dateStr) {
    try { return new Date(dateStr._seconds * 1000).toLocaleDateString('en-GB'); } catch { return 'N/A'; }
  }
  // Firestore Timestamp with toDate()
  if (typeof dateStr === 'object' && typeof dateStr.toDate === 'function') {
    try { return dateStr.toDate().toLocaleDateString('en-GB'); } catch { return 'N/A'; }
  }
  // Native Date
  if (dateStr instanceof Date) {
    return dateStr.toLocaleDateString('en-GB');
  }
  // String — Already DD/MM/YYYY, return as-is
  if (typeof dateStr === 'string') {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('en-GB');
  }
  return String(dateStr);
}

function toDateObj(dateStr: any): Date {
  if (!dateStr) return new Date(NaN);
  if (typeof dateStr === 'object' && '_seconds' in dateStr) return new Date(dateStr._seconds * 1000);
  if (typeof dateStr === 'object' && typeof dateStr.toDate === 'function') return dateStr.toDate();
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return new Date(dateStr);
}

export function daysUntil(dateStr: any): number {
  const target = toDateObj(dateStr);
  const now = new Date(2026, 1, 9); // Current date: 09/02/2026
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysSince(dateStr: any): number {
  const target = toDateObj(dateStr);
  const now = new Date(2026, 1, 9);
  return Math.ceil((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

export function workingDaysUntil(dateStr: any): number {
  const target = toDateObj(dateStr);
  const now = new Date(2026, 1, 9);
  let count = 0;
  const current = new Date(now);
  while (current < target) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

export function getTimerColour(daysRemaining: number, totalDays: number): string {
  const ratio = daysRemaining / totalDays;
  if (ratio > 0.5) return 'text-status-compliant';
  if (ratio > 0.2) return 'text-status-warning';
  if (daysRemaining > 0) return 'text-status-critical';
  return 'text-status-critical animate-pulse-critical';
}

export function getStatusColour(status: string): string {
  const map: Record<string, string> = {
    'compliant': 'bg-status-compliant/20 text-status-compliant',
    'valid': 'bg-status-compliant/20 text-status-compliant',
    'within': 'bg-status-compliant/20 text-status-compliant',
    'expiring': 'bg-status-warning/20 text-status-warning',
    'approaching': 'bg-status-warning/20 text-status-warning',
    'non-compliant': 'bg-status-critical/20 text-status-critical',
    'expired': 'bg-status-critical/20 text-status-critical',
    'breached': 'bg-status-critical/20 text-status-critical',
    'overdue': 'bg-status-critical/20 text-status-critical',
    'void': 'bg-status-void/20 text-status-void',
    'completed': 'bg-status-info/20 text-status-info',
    'closed': 'bg-status-void/20 text-status-void',
    'open': 'bg-brand-blue/20 text-brand-blue',
    'in-progress': 'bg-brand-teal/20 text-brand-teal',
    'investigation': 'bg-status-warning/20 text-status-warning',
    'response-due': 'bg-status-critical/20 text-status-critical',
    'awaiting-parts': 'bg-status-warning/20 text-status-warning',
    'monitoring': 'bg-status-info/20 text-status-info',
    'escalated': 'bg-status-critical/20 text-status-critical',
  };
  return map[status] || 'bg-status-void/20 text-status-void';
}

export function getCaseTypeColour(type: string): string {
  const map: Record<string, string> = {
    'complaint': 'border-l-orange-500',
    'repair': 'border-l-brand-blue',
    'asb': 'border-l-status-critical',
    'enquiry': 'border-l-status-void',
    'financial': 'border-l-status-warning',
    'safeguarding': 'border-l-status-ai',
    'damp-mould': 'border-l-brand-teal',
  };
  return map[type] || 'border-l-status-void';
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
