/**
 * SocialHomes.Ai — Root Application
 * 5.3.7: Progressive loading with React.lazy() + Suspense for route-level code splitting
 */

import { Component, type ReactNode, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { SkeletonPage } from '@/components/shared/SkeletonLoader';

// Eagerly loaded pages (critical path)
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';

// Lazy loaded pages (code-split)
const BriefingPage = lazy(() => import('@/pages/briefing/BriefingPage'));
const ExplorePage = lazy(() => import('@/pages/explore/ExplorePage'));
const SearchPage = lazy(() => import('@/pages/search/SearchPage'));
const TenanciesPage = lazy(() => import('@/pages/tenancies/TenanciesPage'));
const TenancyDetailPage = lazy(() => import('@/pages/tenancies/TenancyDetailPage'));
const PropertiesPage = lazy(() => import('@/pages/properties/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('@/pages/properties/PropertyDetailPage'));
const ViewingBookingPage = lazy(() => import('@/pages/properties/ViewingBookingPage'));
const ApplicationPage = lazy(() => import('@/pages/properties/ApplicationPage'));
const RepairsPage = lazy(() => import('@/pages/repairs/RepairsPage'));
const RepairDetailPage = lazy(() => import('@/pages/repairs/RepairDetailPage'));
const RentPage = lazy(() => import('@/pages/rent/RentPage'));
const CompliancePage = lazy(() => import('@/pages/compliance/CompliancePage'));
const ComplianceTypePage = lazy(() => import('@/pages/compliance/ComplianceTypePage'));
const AwaabsLawPage = lazy(() => import('@/pages/compliance/AwaabsLawPage'));
const ComplaintsPage = lazy(() => import('@/pages/complaints/ComplaintsPage'));
const ComplaintDetailPage = lazy(() => import('@/pages/complaints/ComplaintDetailPage'));
const AllocationsPage = lazy(() => import('@/pages/allocations/AllocationsPage'));
const AsbPage = lazy(() => import('@/pages/asb/AsbPage'));
const AsbDetailPage = lazy(() => import('@/pages/asb/AsbDetailPage'));
const CommunicationsPage = lazy(() => import('@/pages/communications/CommunicationsPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const TsmReportPage = lazy(() => import('@/pages/reports/TsmReportPage'));
const DynamicReportPage = lazy(() => import('@/pages/reports/DynamicReportPage'));
const AiCentrePage = lazy(() => import('@/pages/ai-centre/AiCentrePage'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));
const IntegrationsPage = lazy(() => import('@/pages/admin/IntegrationsPage'));
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'));
const WorkflowBuilderPage = lazy(() => import('@/pages/admin/WorkflowBuilderPage'));
const NotificationPreferencesPage = lazy(() => import('@/pages/admin/NotificationPreferencesPage'));
const GdprDashboardPage = lazy(() => import('@/pages/admin/GdprDashboardPage'));
const TenantPortalPage = lazy(() => import('@/pages/tenant-portal/TenantPortalPage'));

// Suspense wrapper for lazy-loaded routes
function SuspenseWrapper({ children }: { children: ReactNode }) {
  return <Suspense fallback={<SkeletonPage />}>{children}</Suspense>;
}

// Error Boundary to catch and display runtime errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#E6EDF3', background: '#0D1117', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#BE3358', marginBottom: 16 }}>Runtime Error</h1>
          <pre style={{ color: '#EFAC92', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ color: '#6B7B8D', marginTop: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12 }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Root redirect: authenticated users go to /dashboard, others to /login.
 */
function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirect: /login if not auth'd, /dashboard if auth'd */}
          <Route path="/" element={<RootRedirect />} />

          {/* All protected pages inside Layout */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/briefing" element={<SuspenseWrapper><BriefingPage /></SuspenseWrapper>} />
            <Route path="/tenant-portal" element={<SuspenseWrapper><TenantPortalPage /></SuspenseWrapper>} />
            <Route path="/tenant-portal/*" element={<SuspenseWrapper><TenantPortalPage /></SuspenseWrapper>} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/explore" element={<SuspenseWrapper><ExplorePage /></SuspenseWrapper>} />
            <Route path="/explore/*" element={<SuspenseWrapper><ExplorePage /></SuspenseWrapper>} />
            <Route path="/search" element={<SuspenseWrapper><SearchPage /></SuspenseWrapper>} />
            <Route path="/tenancies" element={<SuspenseWrapper><TenanciesPage /></SuspenseWrapper>} />
            <Route path="/tenancies/new" element={<SuspenseWrapper><TenanciesPage /></SuspenseWrapper>} />
            <Route path="/tenancies/:id" element={<SuspenseWrapper><TenancyDetailPage /></SuspenseWrapper>} />
            <Route path="/properties" element={<SuspenseWrapper><PropertiesPage /></SuspenseWrapper>} />
            <Route path="/properties/:id" element={<SuspenseWrapper><PropertyDetailPage /></SuspenseWrapper>} />
            <Route path="/properties/:id/book-viewing" element={<SuspenseWrapper><ViewingBookingPage /></SuspenseWrapper>} />
            <Route path="/properties/:id/apply" element={<SuspenseWrapper><ApplicationPage /></SuspenseWrapper>} />
            <Route path="/repairs" element={<SuspenseWrapper><RepairsPage /></SuspenseWrapper>} />
            <Route path="/repairs/new" element={<SuspenseWrapper><RepairsPage /></SuspenseWrapper>} />
            <Route path="/repairs/schedule" element={<SuspenseWrapper><RepairsPage /></SuspenseWrapper>} />
            <Route path="/repairs/:id" element={<SuspenseWrapper><RepairDetailPage /></SuspenseWrapper>} />
            <Route path="/rent" element={<SuspenseWrapper><RentPage /></SuspenseWrapper>} />
            <Route path="/rent/accounts" element={<SuspenseWrapper><RentPage /></SuspenseWrapper>} />
            <Route path="/rent/accounts/:id" element={<SuspenseWrapper><RentPage /></SuspenseWrapper>} />
            <Route path="/rent/arrears" element={<SuspenseWrapper><RentPage /></SuspenseWrapper>} />
            <Route path="/compliance" element={<SuspenseWrapper><CompliancePage /></SuspenseWrapper>} />
            <Route path="/compliance/awaabs-law" element={<SuspenseWrapper><AwaabsLawPage /></SuspenseWrapper>} />
            <Route path="/compliance/:type" element={<SuspenseWrapper><ComplianceTypePage /></SuspenseWrapper>} />
            <Route path="/complaints" element={<SuspenseWrapper><ComplaintsPage /></SuspenseWrapper>} />
            <Route path="/complaints/new" element={<SuspenseWrapper><ComplaintsPage /></SuspenseWrapper>} />
            <Route path="/complaints/:id" element={<SuspenseWrapper><ComplaintDetailPage /></SuspenseWrapper>} />
            <Route path="/allocations" element={<SuspenseWrapper><AllocationsPage /></SuspenseWrapper>} />
            <Route path="/allocations/voids" element={<SuspenseWrapper><AllocationsPage /></SuspenseWrapper>} />
            <Route path="/allocations/lettings" element={<SuspenseWrapper><AllocationsPage /></SuspenseWrapper>} />
            <Route path="/asb" element={<SuspenseWrapper><AsbPage /></SuspenseWrapper>} />
            <Route path="/asb/:id" element={<SuspenseWrapper><AsbDetailPage /></SuspenseWrapper>} />
            <Route path="/communications" element={<SuspenseWrapper><CommunicationsPage /></SuspenseWrapper>} />
            <Route path="/communications/templates" element={<SuspenseWrapper><CommunicationsPage /></SuspenseWrapper>} />
            <Route path="/reports" element={<SuspenseWrapper><ReportsPage /></SuspenseWrapper>} />
            <Route path="/reports/tsm" element={<SuspenseWrapper><TsmReportPage /></SuspenseWrapper>} />
            <Route path="/reports/:slug" element={<SuspenseWrapper><DynamicReportPage /></SuspenseWrapper>} />
            <Route path="/ai" element={<SuspenseWrapper><AiCentrePage /></SuspenseWrapper>} />
            <Route path="/ai/insights" element={<SuspenseWrapper><AiCentrePage /></SuspenseWrapper>} />
            <Route path="/ai/predictions" element={<SuspenseWrapper><AiCentrePage /></SuspenseWrapper>} />
            <Route path="/ai/assistant" element={<SuspenseWrapper><AiCentrePage /></SuspenseWrapper>} />
            <Route path="/admin" element={<SuspenseWrapper><AdminPage /></SuspenseWrapper>} />
            <Route path="/admin/organisation" element={<SuspenseWrapper><AdminPage /></SuspenseWrapper>} />
            <Route path="/admin/users" element={<SuspenseWrapper><UserManagementPage /></SuspenseWrapper>} />
            <Route path="/admin/teams" element={<SuspenseWrapper><AdminPage /></SuspenseWrapper>} />
            <Route path="/admin/workflows" element={<SuspenseWrapper><WorkflowBuilderPage /></SuspenseWrapper>} />
            <Route path="/admin/integrations" element={<SuspenseWrapper><IntegrationsPage /></SuspenseWrapper>} />
            <Route path="/admin/notifications" element={<SuspenseWrapper><NotificationPreferencesPage /></SuspenseWrapper>} />
            <Route path="/admin/gdpr" element={<SuspenseWrapper><GdprDashboardPage /></SuspenseWrapper>} />
            <Route path="/admin/audit" element={<SuspenseWrapper><AdminPage /></SuspenseWrapper>} />
            <Route path="/admin/system" element={<SuspenseWrapper><AdminPage /></SuspenseWrapper>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
    </ErrorBoundary>
  );
}
