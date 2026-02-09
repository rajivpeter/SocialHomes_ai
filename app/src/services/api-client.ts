// ============================================================
// SocialHomes.Ai — API Client
// Communicates with the Express backend at /api/v1/*
// Falls back to static data when API is unavailable (dev mode)
// ============================================================

import { getIdToken } from './firebase';

const API_BASE = '/api/v1';

/**
 * Recursively walk a JSON value and convert Firestore Timestamp objects
 * ({_seconds, _nanoseconds}) into ISO date strings so React components
 * never receive raw objects as children (prevents Error #310).
 */
function sanitizeFirestoreTimestamps(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitizeFirestoreTimestamps);
  // Firestore Timestamp → string
  if ('_seconds' in value && '_nanoseconds' in value && Object.keys(value).length === 2) {
    try {
      return new Date(value._seconds * 1000).toLocaleDateString('en-GB');
    } catch {
      return 'N/A';
    }
  }
  // Recurse into plain objects
  const out: Record<string, any> = {};
  for (const key of Object.keys(value)) {
    out[key] = sanitizeFirestoreTimestamps(value[key]);
  }
  return out;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const persona = localStorage.getItem('socialhomes-persona') || 'housing-officer';
  const authMode = localStorage.getItem('socialhomes-auth-mode');

  // Build auth headers: Firebase JWT if authenticated, otherwise X-Persona
  const authHeaders: Record<string, string> = {};
  if (authMode === 'firebase') {
    const token = await getIdToken();
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  }
  // Always include X-Persona as fallback (server uses it when no Bearer token)
  authHeaders['X-Persona'] = persona;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  const data = await response.json();
  return sanitizeFirestoreTimestamps(data) as T;
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

// ---- Explore ----
export const exploreApi = {
  hierarchy: (level?: string, parentId?: string) =>
    request<{ level: string; parentId?: string; children: any[] }>(
      `/explore/hierarchy${buildQueryString({ level, parentId })}`
    ),
  regions: () => request<any[]>('/explore/regions'),
  localAuthority: (id: string) => request<any>(`/explore/local-authorities/${id}`),
  estate: (id: string) => request<any>(`/explore/estates/${id}`),
  block: (id: string) => request<any>(`/explore/blocks/${id}`),
};

// ---- Properties ----
export const propertiesApi = {
  list: (filters?: Record<string, string | undefined>) =>
    request<{ items: any[]; total: number }>(
      `/properties${buildQueryString(filters || {})}`
    ),
  get: (id: string) => request<any>(`/properties/${id}`),
  update: (id: string, data: any) =>
    request<any>(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ---- Tenants ----
export const tenantsApi = {
  list: (filters?: Record<string, string | undefined>) =>
    request<{ items: any[]; total: number }>(
      `/tenants${buildQueryString(filters || {})}`
    ),
  get: (id: string) => request<any>(`/tenants/${id}`),
  activities: (id: string) => request<any[]>(`/tenants/${id}/activities`),
  cases: (id: string) => request<any[]>(`/tenants/${id}/cases`),
  update: (id: string, data: any) =>
    request<any>(`/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ---- Cases ----
export const casesApi = {
  list: (filters?: Record<string, string | undefined>) =>
    request<{ items: any[]; total: number }>(
      `/cases${buildQueryString(filters || {})}`
    ),
  get: (id: string) => request<any>(`/cases/${id}`),
  create: (data: any) =>
    request<any>('/cases', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/cases/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  activities: (id: string) => request<any[]>(`/cases/${id}/activities`),
};

// ---- Briefing ----
export const briefingApi = {
  get: () => request<any>('/briefing'),
};

// ---- Compliance ----
export const complianceApi = {
  overview: () => request<any>('/compliance/overview'),
};

// ---- Rent ----
export const rentApi = {
  dashboard: () => request<any>('/rent/dashboard'),
  transactions: (tenantId: string) => request<any[]>(`/rent/transactions/${tenantId}`),
};

// ---- Reports ----
export const reportsApi = {
  tsm: () => request<any[]>('/reports/tsm'),
  regulatory: () => request<any>('/reports/regulatory'),
};

// ---- AI ----
export const aiApi = {
  draftCommunication: (params: {
    tenantId: string;
    communicationType: string;
    tone?: string;
    caseRef?: string;
    persona?: string;
  }) => request<{ draft: string; metadata: any }>('/ai/draft-communication', {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  chat: (query: string, persona?: string) =>
    request<{ response: string; persona: string; timestamp: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ query, persona }),
    }),
};

// ---- Admin ----
export const adminApi = {
  audit: (limit?: number) => request<any[]>(`/admin/audit${buildQueryString({ limit })}`),
  users: () => request<any[]>('/admin/users'),
  createUser: (data: any) =>
    request<any>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  stats: () => request<any>('/admin/stats'),
  seed: (data: any) =>
    request<any>('/admin/seed', { method: 'POST', body: JSON.stringify(data) }),
};

// ---- Public Data ----
export const publicDataApi = {
  epc: (postcode: string) => request<any>(`/public-data/epc/${encodeURIComponent(postcode)}`),
  imd: (laCode: string) => request<any>(`/public-data/imd/${encodeURIComponent(laCode)}`),
  weather: (lat: number, lng: number) => request<any>(`/public-data/weather/${lat}/${lng}`),
};

// ---- Export ----
export const exportApi = {
  hactProperty: (id: string) => request<any>(`/export/hact/property/${id}`),
  hactTenant: (id: string) => request<any>(`/export/hact/tenant/${id}`),
  hactCase: (id: string) => request<any>(`/export/hact/case/${id}`),
};
