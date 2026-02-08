// UK formatting utilities

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

export function formatDate(dateStr: string): string {
  // Already DD/MM/YYYY, return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB');
}

export function daysUntil(dateStr: string): number {
  const parts = dateStr.split('/');
  const target = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  const now = new Date(2026, 1, 7); // Current date: 07/02/2026
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysSince(dateStr: string): number {
  const parts = dateStr.split('/');
  const target = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  const now = new Date(2026, 1, 7);
  return Math.ceil((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

export function workingDaysUntil(dateStr: string): number {
  const parts = dateStr.split('/');
  const target = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  const now = new Date(2026, 1, 7);
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
