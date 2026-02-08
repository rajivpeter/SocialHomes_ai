import { Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import Layout from '@/components/layout/Layout';

// Pages
import BriefingPage from '@/pages/briefing/BriefingPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ExplorePage from '@/pages/explore/ExplorePage';
import SearchPage from '@/pages/search/SearchPage';
import TenanciesPage from '@/pages/tenancies/TenanciesPage';
import TenancyDetailPage from '@/pages/tenancies/TenancyDetailPage';
import PropertiesPage from '@/pages/properties/PropertiesPage';
import PropertyDetailPage from '@/pages/properties/PropertyDetailPage';
import RepairsPage from '@/pages/repairs/RepairsPage';
import RepairDetailPage from '@/pages/repairs/RepairDetailPage';
import RentPage from '@/pages/rent/RentPage';
import CompliancePage from '@/pages/compliance/CompliancePage';
import AwaabsLawPage from '@/pages/compliance/AwaabsLawPage';
import ComplaintsPage from '@/pages/complaints/ComplaintsPage';
import ComplaintDetailPage from '@/pages/complaints/ComplaintDetailPage';
import AllocationsPage from '@/pages/allocations/AllocationsPage';
import AsbPage from '@/pages/asb/AsbPage';
import AsbDetailPage from '@/pages/asb/AsbDetailPage';
import CommunicationsPage from '@/pages/communications/CommunicationsPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import TsmReportPage from '@/pages/reports/TsmReportPage';
import AiCentrePage from '@/pages/ai-centre/AiCentrePage';
import AdminPage from '@/pages/admin/AdminPage';
import TenantPortalPage from '@/pages/tenant-portal/TenantPortalPage';

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

export default function App() {
  return (
    <ErrorBoundary>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/briefing" replace />} />

          {/* All pages inside Layout */}
          <Route element={<Layout />}>
            <Route path="/briefing" element={<BriefingPage />} />
            <Route path="/tenant-portal" element={<TenantPortalPage />} />
            <Route path="/tenant-portal/*" element={<TenantPortalPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/explore/*" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/tenancies" element={<TenanciesPage />} />
            <Route path="/tenancies/new" element={<TenanciesPage />} />
            <Route path="/tenancies/:id" element={<TenancyDetailPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/repairs" element={<RepairsPage />} />
            <Route path="/repairs/new" element={<RepairsPage />} />
            <Route path="/repairs/schedule" element={<RepairsPage />} />
            <Route path="/repairs/:id" element={<RepairDetailPage />} />
            <Route path="/rent" element={<RentPage />} />
            <Route path="/rent/accounts" element={<RentPage />} />
            <Route path="/rent/accounts/:id" element={<RentPage />} />
            <Route path="/rent/arrears" element={<RentPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/compliance/gas" element={<CompliancePage />} />
            <Route path="/compliance/electrical" element={<CompliancePage />} />
            <Route path="/compliance/fire" element={<CompliancePage />} />
            <Route path="/compliance/asbestos" element={<CompliancePage />} />
            <Route path="/compliance/legionella" element={<CompliancePage />} />
            <Route path="/compliance/lifts" element={<CompliancePage />} />
            <Route path="/compliance/awaabs-law" element={<AwaabsLawPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/complaints/new" element={<ComplaintsPage />} />
            <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
            <Route path="/allocations" element={<AllocationsPage />} />
            <Route path="/allocations/voids" element={<AllocationsPage />} />
            <Route path="/allocations/lettings" element={<AllocationsPage />} />
            <Route path="/asb" element={<AsbPage />} />
            <Route path="/asb/:id" element={<AsbDetailPage />} />
            <Route path="/communications" element={<CommunicationsPage />} />
            <Route path="/communications/templates" element={<CommunicationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/tsm" element={<TsmReportPage />} />
            <Route path="/reports/core" element={<ReportsPage />} />
            <Route path="/reports/regulatory" element={<ReportsPage />} />
            <Route path="/reports/ombudsman" element={<ReportsPage />} />
            <Route path="/reports/performance" element={<ReportsPage />} />
            <Route path="/reports/financial" element={<ReportsPage />} />
            <Route path="/reports/stock-condition" element={<ReportsPage />} />
            <Route path="/ai" element={<AiCentrePage />} />
            <Route path="/ai/insights" element={<AiCentrePage />} />
            <Route path="/ai/predictions" element={<AiCentrePage />} />
            <Route path="/ai/assistant" element={<AiCentrePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/organisation" element={<AdminPage />} />
            <Route path="/admin/users" element={<AdminPage />} />
            <Route path="/admin/teams" element={<AdminPage />} />
            <Route path="/admin/workflows" element={<AdminPage />} />
            <Route path="/admin/integrations" element={<AdminPage />} />
            <Route path="/admin/audit" element={<AdminPage />} />
            <Route path="/admin/system" element={<AdminPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
    </ErrorBoundary>
  );
}
