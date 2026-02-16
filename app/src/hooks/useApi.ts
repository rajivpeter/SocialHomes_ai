// ============================================================
// SocialHomes.Ai — React Query Hooks
// Wraps API client calls with React Query for caching,
// and falls back to static data when API is unavailable.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  propertiesApi,
  tenantsApi,
  casesApi,
  exploreApi,
  briefingApi,
  complianceApi,
  rentApi,
  reportsApi,
  aiApi,
  publicDataApi,
  lettingsApi,
  bookingApi,
} from '../services/api-client';

// Static data imports for fallback
import {
  regions as staticRegions,
  localAuthorities as staticLAs,
  estates as staticEstates,
  blocks as staticBlocks,
  properties as staticProperties,
  tenants as staticTenants,
  allCases as staticCases,
  allRepairs as staticRepairs,
  allComplaints as staticComplaints,
  allDampCases as staticDampCases,
  asbCases as staticAsbCases,
  activities as staticActivities,
  communications as staticComms,
  voidProperties as staticVoids,
  applicants as staticApplicants,
  tsmMeasures as staticTsm,
  organisation as staticOrg,
} from '../data';

import type {
  Region,
  LocalAuthority,
  Estate,
  Block,
  Property,
  Tenant,
  Case,
  Repair,
  Complaint,
} from '../types';

// ---- Config ----
// Check if the API is available. If fetch fails, fallback to static.
let apiAvailable: boolean | null = null;

async function checkApiAvailability(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  try {
    const res = await fetch('/health', { method: 'GET' });
    apiAvailable = res.ok;
  } catch {
    apiAvailable = false;
  }
  return apiAvailable;
}

// Wrapper that tries API first, falls back to static data
async function withFallback<T>(apiFn: () => Promise<T>, staticData: T): Promise<T> {
  const available = await checkApiAvailability();
  if (!available) return staticData;
  try {
    return await apiFn();
  } catch {
    return staticData;
  }
}

// ---- Explore Hooks ----
export function useExploreHierarchy(level?: string, parentId?: string) {
  return useQuery({
    queryKey: ['explore', 'hierarchy', level, parentId],
    queryFn: () => withFallback(
      () => exploreApi.hierarchy(level, parentId),
      buildStaticHierarchy(level, parentId)
    ),
  });
}

function buildStaticHierarchy(level?: string, parentId?: string) {
  if (!level) {
    return { level: 'country', children: staticRegions };
  }
  switch (level) {
    case 'region':
      return { level: 'region', parentId, children: staticLAs.filter(la => la.regionId === parentId) };
    case 'local-authority':
      return { level: 'local-authority', parentId, children: staticEstates.filter(e => e.localAuthorityId === parentId) };
    case 'estate':
      return { level: 'estate', parentId, children: staticBlocks.filter(b => b.estateId === parentId) };
    case 'block':
      return { level: 'block', parentId, children: staticProperties.filter(p => p.blockId === parentId) };
    default:
      return { level: level || 'unknown', children: [] };
  }
}

export function useRegions() {
  return useQuery({
    queryKey: ['explore', 'regions'],
    queryFn: () => withFallback(
      () => exploreApi.regions(),
      staticRegions
    ),
  });
}

// ---- Properties Hooks ----
export function useProperties(filters?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => withFallback(
      () => propertiesApi.list(filters).then(r => r.items),
      filterStatic(staticProperties, filters)
    ),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => withFallback(
      () => propertiesApi.get(id),
      staticProperties.find(p => p.id === id) || null
    ),
    enabled: !!id,
  });
}

// ---- Tenants Hooks ----
export function useTenants(filters?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: ['tenants', filters],
    queryFn: () => withFallback(
      () => tenantsApi.list(filters).then(r => r.items),
      filterStatic(staticTenants, filters)
    ),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: () => withFallback(
      () => tenantsApi.get(id),
      staticTenants.find(t => t.id === id) || null
    ),
    enabled: !!id,
  });
}

export function useTenantActivities(tenantId: string) {
  return useQuery({
    queryKey: ['tenant', tenantId, 'activities'],
    queryFn: () => withFallback(
      () => tenantsApi.activities(tenantId),
      staticActivities.filter(a => a.tenantId === tenantId)
    ),
    enabled: !!tenantId,
  });
}

export function useTenantCases(tenantId: string) {
  return useQuery({
    queryKey: ['tenant', tenantId, 'cases'],
    queryFn: () => withFallback(
      () => tenantsApi.cases(tenantId),
      staticCases.filter(c => c.tenantId === tenantId)
    ),
    enabled: !!tenantId,
  });
}

// ---- Cases Hooks ----
export function useCases(filters?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: ['cases', filters],
    queryFn: () => withFallback(
      () => casesApi.list(filters).then(r => r.items),
      filterStaticCases(filters)
    ),
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: ['case', id],
    queryFn: () => withFallback(
      () => casesApi.get(id),
      staticCases.find(c => c.id === id) || null
    ),
    enabled: !!id,
  });
}

export function useRepairs(filters?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: ['repairs', filters],
    queryFn: () => withFallback(
      () => casesApi.list({ ...filters, type: 'repair' }).then(r => r.items),
      filterStatic(staticRepairs as any[], filters)
    ),
  });
}

export function useComplaints(filters?: Record<string, string | undefined>) {
  return useQuery({
    queryKey: ['complaints', filters],
    queryFn: () => withFallback(
      () => casesApi.list({ ...filters, type: 'complaint' }).then(r => r.items),
      filterStatic(staticComplaints as any[], filters)
    ),
  });
}

// ---- Briefing ----
export function useBriefing() {
  return useQuery({
    queryKey: ['briefing'],
    queryFn: () => withFallback(
      () => briefingApi.get(),
      null
    ),
  });
}

// ---- Compliance ----
export function useComplianceOverview() {
  return useQuery({
    queryKey: ['compliance', 'overview'],
    queryFn: () => withFallback(
      () => complianceApi.overview(),
      null
    ),
  });
}

// ---- Rent ----
export function useRentDashboard() {
  return useQuery({
    queryKey: ['rent', 'dashboard'],
    queryFn: () => withFallback(
      () => rentApi.dashboard(),
      null
    ),
  });
}

// ---- Reports ----
export function useTsmReport() {
  return useQuery({
    queryKey: ['reports', 'tsm'],
    queryFn: () => withFallback(
      () => reportsApi.tsm(),
      staticTsm
    ),
  });
}

export function useRegulatoryReport() {
  return useQuery({
    queryKey: ['reports', 'regulatory'],
    queryFn: () => withFallback(
      () => reportsApi.regulatory(),
      null
    ),
  });
}

// ---- AI ----
export function useAiChat() {
  return useMutation({
    mutationFn: ({ query, persona }: { query: string; persona?: string }) =>
      aiApi.chat(query, persona),
  });
}

export function useAiDraftCommunication() {
  return useMutation({
    mutationFn: (params: {
      tenantId: string;
      communicationType: string;
      tone?: string;
      caseRef?: string;
      persona?: string;
    }) => aiApi.draftCommunication(params),
  });
}

// ---- Differentiator 1: Damp Risk ----
export function useDampRisk(propertyId: string) {
  return useQuery({
    queryKey: ['ai', 'damp-risk', propertyId],
    queryFn: () => aiApi.dampRisk(propertyId),
    enabled: !!propertyId,
  });
}

export function useDampRiskEstate(estateId: string) {
  return useQuery({
    queryKey: ['ai', 'damp-risk-estate', estateId],
    queryFn: () => aiApi.dampRiskEstate(estateId),
    enabled: !!estateId,
  });
}

// ---- Differentiator 2: Crime Context ----
export function useCrimeContext(estateId: string) {
  return useQuery({
    queryKey: ['ai', 'crime-context', estateId],
    queryFn: () => aiApi.crimeContext(estateId),
    enabled: !!estateId,
  });
}

export function useCrimeContextCase(caseId: string) {
  return useQuery({
    queryKey: ['ai', 'crime-context-case', caseId],
    queryFn: () => aiApi.crimeContextCase(caseId),
    enabled: !!caseId,
  });
}

// ---- Differentiator 3: Vulnerability ----
export function useVulnerability(tenantId: string) {
  return useQuery({
    queryKey: ['ai', 'vulnerability', tenantId],
    queryFn: () => aiApi.vulnerability(tenantId),
    enabled: !!tenantId,
  });
}

export function useVulnerabilityScan() {
  return useMutation({
    mutationFn: () => aiApi.vulnerabilityScan(),
  });
}

// ---- Differentiator 4: Benefits Check ----
export function useBenefitsCheck(tenantId: string) {
  return useQuery({
    queryKey: ['ai', 'benefits-check', tenantId],
    queryFn: () => aiApi.benefitsCheck(tenantId),
    enabled: !!tenantId,
  });
}

// ---- Differentiator 5: Property Passport ----
export function usePropertyPassport(propertyId: string) {
  return useQuery({
    queryKey: ['ai', 'property-passport', propertyId],
    queryFn: () => aiApi.propertyPassport(propertyId),
    enabled: !!propertyId,
  });
}

// ---- Differentiator 6: Neighbourhood Briefing ----
export function useNeighbourhoodBriefing(estateId: string) {
  return useQuery({
    queryKey: ['ai', 'neighbourhood-briefing', estateId],
    queryFn: () => aiApi.neighbourhoodBriefing(estateId),
    enabled: !!estateId,
  });
}

// ---- Public Data ----
export function useEpcData(postcode: string) {
  return useQuery({
    queryKey: ['public-data', 'epc', postcode],
    queryFn: () => publicDataApi.epc(postcode),
    enabled: !!postcode,
  });
}

export function useWeatherData(lat: number, lng: number) {
  return useQuery({
    queryKey: ['public-data', 'weather', lat, lng],
    queryFn: () => publicDataApi.weather(lat, lng),
    enabled: !!lat && !!lng,
  });
}

// ---- Mutations ----
export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => casesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => casesApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['case', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

// ---- Lettings / Viewings ----
export function useViewings() {
  return useQuery({
    queryKey: ['viewings'],
    queryFn: () => lettingsApi.viewings().then(r => r.items),
  });
}

export function useCreateViewing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => lettingsApi.createViewing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viewings'] });
    },
  });
}

// ---- Booking / Applications ----
export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: () => bookingApi.applications().then(r => r.items),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => bookingApi.apply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

// ---- Available Properties ----
export function useAvailableProperties() {
  return useQuery({
    queryKey: ['properties', 'available'],
    queryFn: () => withFallback(
      () => propertiesApi.list({ isVoid: 'true' }).then(r => r.items),
      staticProperties.filter(p => p.isVoid)
    ),
  });
}

// ---- Static data filter helpers ----
function filterStatic<T extends Record<string, any>>(
  data: T[],
  filters?: Record<string, string | undefined>,
): T[] {
  if (!filters) return data;
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === '') return true;
      return String(item[key]) === value;
    });
  });
}

function filterStaticCases(filters?: Record<string, string | undefined>) {
  let cases: any[] = staticCases;
  if (!filters) return cases;
  if (filters.type) {
    switch (filters.type) {
      case 'repair': cases = staticRepairs as any[]; break;
      case 'complaint': cases = staticComplaints as any[]; break;
      case 'damp-mould': cases = staticDampCases as any[]; break;
      case 'asb': cases = staticAsbCases as any[]; break;
      default: cases = staticCases.filter(c => c.type === filters.type);
    }
  }
  return filterStatic(cases, { ...filters, type: undefined });
}
