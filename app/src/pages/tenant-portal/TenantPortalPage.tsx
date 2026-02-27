/**
 * TenantPortalPage — Self-service tenant portal
 * 5.3.10: Enhanced with responsive design, repair wizard, rent history chart,
 * document viewer, and accessibility improvements.
 * Light-themed UI separate from the main staff dark theme.
 */

import { useState } from 'react';
import {
  Wrench, PoundSterling, CreditCard, MessageCircle, Clock, CheckCircle,
  AlertCircle, Camera, ChevronRight, ChevronLeft, FileText, Download,
  Home, Phone, Mail, CalendarDays, ArrowLeft, Send, X, Upload,
  TrendingDown, TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { useNavigate } from 'react-router-dom';

// Mock tenant data — in real app this comes from auth/context
const tenantData = {
  name: 'Mrs Chen',
  address: '14 Maple Court, Riverside Estate, London SE8 4PQ',
  tenancyRef: 'TEN-2024-01234',
  tenancyStart: '15/03/2019',
  housingOfficer: { name: 'James Wilson', phone: '020 7946 0123', email: 'j.wilson@example.org' },
  rentBalance: -487.20,
  weeklyCharge: 140.90,
  nextPaymentDate: '03/03/2026',
  paymentMethod: 'Direct Debit',
  rentHistory: [
    { month: 'Sep', paid: 563.60, due: 563.60 },
    { month: 'Oct', paid: 563.60, due: 563.60 },
    { month: 'Nov', paid: 422.70, due: 563.60 },
    { month: 'Dec', paid: 563.60, due: 563.60 },
    { month: 'Jan', paid: 563.60, due: 563.60 },
    { month: 'Feb', paid: 76.40, due: 563.60 },
  ],
  activeRepairs: [
    {
      id: 'rep-001',
      reference: 'REP-2025-04521',
      description: 'Radiator leak in living room',
      status: 'in-progress' as const,
      date: '23/12/2025',
      priority: 'urgent' as const,
      appointmentDate: '04/03/2026 09:00-12:00',
    },
    {
      id: 'rep-002',
      reference: 'REP-2026-00123',
      description: 'Kitchen tap dripping',
      status: 'scheduled' as const,
      date: '05/02/2026',
      priority: 'routine' as const,
      appointmentDate: '10/03/2026 13:00-17:00',
    },
  ],
  documents: [
    { id: 'doc-1', name: 'Tenancy Agreement', type: 'PDF', date: '15/03/2019', size: '2.4 MB' },
    { id: 'doc-2', name: 'Gas Safety Certificate 2025', type: 'PDF', date: '10/11/2025', size: '340 KB' },
    { id: 'doc-3', name: 'Rent Statement Q4 2025', type: 'PDF', date: '02/01/2026', size: '128 KB' },
    { id: 'doc-4', name: 'Home Contents Insurance', type: 'PDF', date: '01/04/2025', size: '560 KB' },
  ],
};

// Repair wizard categories
const repairCategories = [
  { id: 'plumbing', label: 'Plumbing & Water', icon: '🔧', items: ['Leaking tap', 'Blocked drain', 'Toilet not flushing', 'Burst pipe', 'No hot water'] },
  { id: 'heating', label: 'Heating', icon: '🔥', items: ['Boiler not working', 'Radiator not heating', 'Thermostat fault', 'No heating'] },
  { id: 'electrical', label: 'Electrical', icon: '⚡', items: ['Power socket not working', 'Light fitting issue', 'Tripped fuse', 'Smoke detector beeping'] },
  { id: 'doors-windows', label: 'Doors & Windows', icon: '🚪', items: ['Door lock broken', 'Window won\'t close', 'Broken glass', 'Draught issues'] },
  { id: 'damp-mould', label: 'Damp & Mould', icon: '💧', items: ['Black mould on walls', 'Damp patches', 'Condensation problems', 'Leaking roof'] },
  { id: 'other', label: 'Other', icon: '🏠', items: ['Pest control', 'Communal area issue', 'Garden/external', 'Other (describe below)'] },
];

type WizardStep = 'category' | 'detail' | 'photos' | 'confirm';

export default function TenantPortalPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'repairs' | 'rent' | 'documents' | 'contact'>('home');
  const [showRepairWizard, setShowRepairWizard] = useState(false);

  // Repair wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [repairDescription, setRepairDescription] = useState('');
  const [repairPhotos, setRepairPhotos] = useState<string[]>([]);
  const [repairSubmitted, setRepairSubmitted] = useState(false);

  // Contact form state
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const resetWizard = () => {
    setWizardStep('category');
    setSelectedCategory('');
    setSelectedItem('');
    setRepairDescription('');
    setRepairPhotos([]);
    setRepairSubmitted(false);
    setShowRepairWizard(false);
  };

  const handleRepairSubmit = () => {
    setRepairSubmitted(true);
    setTimeout(() => {
      resetWizard();
      setActiveTab('repairs');
    }, 3000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setContactSubject('');
      setContactMessage('');
    }, 3000);
  };

  const tabs = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'repairs' as const, label: 'Repairs', icon: Wrench },
    { id: 'rent' as const, label: 'Rent', icon: PoundSterling },
    { id: 'documents' as const, label: 'Documents', icon: FileText },
    { id: 'contact' as const, label: 'Contact', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F5F0' }}>
      {/* Top Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Back to staff view">
              <ArrowLeft size={18} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">My Home</h1>
              <p className="text-xs text-gray-500 hidden sm:block">{tenantData.tenancyRef}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">{tenantData.name}</div>
            <div className="text-xs text-gray-500 hidden sm:block">{tenantData.address}</div>
          </div>
        </div>
      </header>

      {/* Tab Navigation — scrollable on mobile */}
      <nav className="bg-white border-b border-gray-200 sticky top-[52px] z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto no-scrollbar -mb-px" role="tablist">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ═══════════════════ HOME TAB ═══════════════════ */}
        {activeTab === 'home' && (
          <>
            {/* Welcome */}
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Welcome back, {tenantData.name}</h2>
              <p className="text-gray-600">Manage your tenancy, report repairs, and stay informed</p>
            </div>

            {/* Quick Action Tiles — responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { setActiveTab('repairs'); setShowRepairWizard(true); }}
                className="bg-white rounded-xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-all duration-200 text-left group opacity-0 animate-fade-in-up"
                style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 sm:p-4 rounded-xl bg-teal-100 group-hover:bg-teal-200 transition-colors flex-shrink-0">
                    <Wrench size={28} className="text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-0.5">Report a Repair</h3>
                    <p className="text-sm text-gray-600">Tell us about any issues in your home</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                </div>
              </button>

              {/* Rent Balance */}
              <div
                onClick={() => setActiveTab('rent')}
                className="bg-white rounded-xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-all cursor-pointer opacity-0 animate-fade-in-up"
                style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 sm:p-4 rounded-xl bg-blue-100 flex-shrink-0">
                    <PoundSterling size={28} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-0.5">Rent Balance</h3>
                    <p className="text-sm text-gray-600">Your current account</p>
                  </div>
                </div>
                <div className={`text-3xl font-bold ${tenantData.rentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {tenantData.rentBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(tenantData.rentBalance))}
                </div>
                {tenantData.rentBalance < 0 && (
                  <p className="text-xs text-gray-500 mt-1">Please contact us to discuss payment options</p>
                )}
              </div>

              {/* Make a Payment */}
              <button className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-all duration-200 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <div className="flex items-center gap-4">
                  <CreditCard size={28} />
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold mb-0.5">Make a Payment</h3>
                    <p className="text-sm opacity-90">Pay your rent or service charge online</p>
                  </div>
                  <ChevronRight size={20} className="opacity-60 flex-shrink-0" />
                </div>
              </button>

              {/* Contact Us */}
              <button
                onClick={() => setActiveTab('contact')}
                className="bg-white rounded-xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-all duration-200 text-left group opacity-0 animate-fade-in-up"
                style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 sm:p-4 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors flex-shrink-0">
                    <MessageCircle size={28} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-0.5">Contact Us</h3>
                    <p className="text-sm text-gray-600">Get in touch with your housing officer</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                </div>
              </button>
            </div>

            {/* Active Repairs Summary */}
            {tenantData.activeRepairs.length > 0 && (
              <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Active Repairs</h3>
                  <button onClick={() => setActiveTab('repairs')} className="text-sm text-teal-600 font-medium hover:underline">View all →</button>
                </div>
                <div className="space-y-3">
                  {tenantData.activeRepairs.map(repair => (
                    <div key={repair.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-10 rounded-full flex-shrink-0 ${repair.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{repair.description}</div>
                        <div className="text-xs text-gray-500">{repair.reference}</div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        repair.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {repair.status === 'in-progress' ? 'In Progress' : 'Scheduled'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════ REPAIRS TAB ═══════════════════ */}
        {activeTab === 'repairs' && (
          <>
            {/* Repair Wizard Modal */}
            {showRepairWizard && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => resetWizard()}>
                <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  {/* Wizard Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      {wizardStep !== 'category' && !repairSubmitted && (
                        <button
                          onClick={() => {
                            if (wizardStep === 'detail') setWizardStep('category');
                            if (wizardStep === 'photos') setWizardStep('detail');
                            if (wizardStep === 'confirm') setWizardStep('photos');
                          }}
                          className="p-1 rounded-lg hover:bg-gray-100"
                        >
                          <ChevronLeft size={20} className="text-gray-500" />
                        </button>
                      )}
                      <h3 className="text-lg font-bold text-gray-900">
                        {repairSubmitted ? 'Repair Reported!' : 'Report a Repair'}
                      </h3>
                    </div>
                    <button onClick={resetWizard} className="p-2 rounded-lg hover:bg-gray-100">
                      <X size={18} className="text-gray-500" />
                    </button>
                  </div>

                  {/* Progress Steps */}
                  {!repairSubmitted && (
                    <div className="px-5 pt-4 pb-2">
                      <div className="flex items-center gap-1">
                        {(['category', 'detail', 'photos', 'confirm'] as WizardStep[]).map((step, i) => (
                          <div
                            key={step}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              (['category', 'detail', 'photos', 'confirm'] as WizardStep[]).indexOf(wizardStep) >= i
                                ? 'bg-teal-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Step {(['category', 'detail', 'photos', 'confirm'] as WizardStep[]).indexOf(wizardStep) + 1} of 4
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    {/* Step 1: Category */}
                    {wizardStep === 'category' && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-4">What type of repair do you need?</p>
                        <div className="grid grid-cols-2 gap-3">
                          {repairCategories.map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => { setSelectedCategory(cat.id); setWizardStep('detail'); }}
                              className={`p-4 rounded-xl border-2 text-left transition-all hover:border-teal-300 hover:shadow-md ${
                                selectedCategory === cat.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="text-2xl mb-2">{cat.icon}</div>
                              <div className="text-sm font-semibold text-gray-900">{cat.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 2: Detail */}
                    {wizardStep === 'detail' && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">Select the specific issue:</p>
                        <div className="space-y-2">
                          {repairCategories.find(c => c.id === selectedCategory)?.items.map(item => (
                            <button
                              key={item}
                              onClick={() => { setSelectedItem(item); }}
                              className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm ${
                                selectedItem === item ? 'border-teal-500 bg-teal-50 font-medium' : 'border-gray-200 hover:border-teal-300'
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                        <div>
                          <label htmlFor="repair-desc" className="block text-sm font-medium text-gray-700 mb-1">Additional details (optional)</label>
                          <textarea
                            id="repair-desc"
                            rows={3}
                            value={repairDescription}
                            onChange={e => setRepairDescription(e.target.value)}
                            placeholder="Describe the issue in more detail..."
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none resize-none"
                          />
                        </div>
                        <button
                          onClick={() => setWizardStep('photos')}
                          disabled={!selectedItem}
                          className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                        >
                          Continue
                        </button>
                      </div>
                    )}

                    {/* Step 3: Photos */}
                    {wizardStep === 'photos' && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">Upload photos to help us diagnose the issue faster (optional)</p>
                        <div className="grid grid-cols-3 gap-3">
                          {repairPhotos.map((_, i) => (
                            <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center relative">
                              <Camera size={24} className="text-gray-400" />
                              <button
                                onClick={() => setRepairPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {repairPhotos.length < 3 && (
                            <button
                              onClick={() => setRepairPhotos(prev => [...prev, `photo-${Date.now()}`])}
                              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-teal-400 hover:text-teal-500 transition-colors"
                            >
                              <Upload size={20} />
                              <span className="text-[10px] mt-1">Add Photo</span>
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => setWizardStep('confirm')}
                          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                        >
                          {repairPhotos.length > 0 ? 'Continue' : 'Skip & Continue'}
                        </button>
                      </div>
                    )}

                    {/* Step 4: Confirm */}
                    {wizardStep === 'confirm' && !repairSubmitted && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 mb-2">Please confirm the details below:</p>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Category</div>
                            <div className="text-sm font-semibold text-gray-900">{repairCategories.find(c => c.id === selectedCategory)?.label}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Issue</div>
                            <div className="text-sm font-semibold text-gray-900">{selectedItem}</div>
                          </div>
                          {repairDescription && (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Details</div>
                              <div className="text-sm text-gray-700">{repairDescription}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Photos</div>
                            <div className="text-sm text-gray-700">{repairPhotos.length} attached</div>
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800">We aim to respond within 24 hours. Emergency repairs (no heating, flooding, gas leak) — call us immediately on <strong>0800 111 2222</strong>.</p>
                        </div>
                        <button
                          onClick={handleRepairSubmit}
                          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Submit Repair Request
                        </button>
                      </div>
                    )}

                    {/* Success */}
                    {repairSubmitted && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle size={32} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Repair Reported!</h3>
                        <p className="text-gray-600 text-sm mb-1">Reference: <span className="font-mono font-semibold">REP-2026-00456</span></p>
                        <p className="text-gray-500 text-xs">We'll be in touch within 24 hours.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Repairs List */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Repairs</h2>
              <button
                onClick={() => setShowRepairWizard(true)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Wrench size={16} />
                Report New Repair
              </button>
            </div>

            {tenantData.activeRepairs.length > 0 ? (
              <div className="space-y-4">
                {tenantData.activeRepairs.map((repair, index) => (
                  <div
                    key={repair.id}
                    className="bg-white rounded-xl p-5 shadow-md border-l-4 opacity-0 animate-fade-in-up"
                    style={{
                      borderLeftColor: repair.priority === 'urgent' ? '#EF4444' : '#3B82F6',
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: 'forwards',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-xs font-mono text-gray-500">{repair.reference}</span>
                        <h3 className="text-lg font-semibold text-gray-900 mt-0.5">{repair.description}</h3>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 w-fit ${
                        repair.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {repair.status === 'in-progress' ? <Clock size={14} /> : <CheckCircle size={14} />}
                        {repair.status === 'in-progress' ? 'In Progress' : 'Scheduled'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarDays size={14} />
                        Reported: {repair.date}
                      </div>
                      {repair.appointmentDate && (
                        <div className="flex items-center gap-2 text-teal-600 font-medium">
                          <Clock size={14} />
                          Appointment: {repair.appointmentDate}
                        </div>
                      )}
                      {repair.priority === 'urgent' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle size={14} />
                          <span className="font-medium">Urgent priority</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-md text-center">
                <CheckCircle size={48} className="mx-auto mb-3 text-green-500 opacity-50" />
                <p className="text-gray-600">You have no active repairs</p>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════ RENT TAB ═══════════════════ */}
        {activeTab === 'rent' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Rent Account</h2>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-md opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
                <div className="text-sm text-gray-500 mb-1">Weekly Charge</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(tenantData.weeklyCharge)}</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-md opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
                <div className="text-sm text-gray-500 mb-1">Current Balance</div>
                <div className={`text-2xl font-bold flex items-center gap-2 ${tenantData.rentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {tenantData.rentBalance < 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                  {tenantData.rentBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(tenantData.rentBalance))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-md opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <div className="text-sm text-gray-500 mb-1">Next Payment</div>
                <div className="text-lg font-bold text-gray-900">{tenantData.nextPaymentDate}</div>
                <div className="text-xs text-gray-500">{tenantData.paymentMethod}</div>
              </div>
            </div>

            {/* Rent History Chart */}
            <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History (Last 6 Months)</h3>
              <div className="space-y-3">
                {tenantData.rentHistory.map((month, i) => {
                  const paidPercent = Math.min(100, (month.paid / month.due) * 100);
                  const shortfall = month.due - month.paid;
                  return (
                    <div key={month.month} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${200 + i * 50}ms`, animationFillMode: 'forwards' }}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 w-10">{month.month}</span>
                        <span className={`text-xs font-medium ${paidPercent >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(month.paid)} / {formatCurrency(month.due)}
                        </span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${paidPercent >= 100 ? 'bg-green-500' : paidPercent >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${paidPercent}%` }}
                        />
                      </div>
                      {shortfall > 0 && (
                        <div className="text-[10px] text-red-500 mt-0.5">Shortfall: {formatCurrency(shortfall)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Make Payment CTA */}
            <button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
              <CreditCard size={18} />
              Make a Payment
            </button>
          </>
        )}

        {/* ═══════════════════ DOCUMENTS TAB ═══════════════════ */}
        {activeTab === 'documents' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Your Documents</h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {tenantData.documents.map((doc, i) => (
                <div
                  key={doc.id}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors opacity-0 animate-fade-in-up ${
                    i < tenantData.documents.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="p-2.5 bg-red-50 rounded-lg flex-shrink-0">
                    <FileText size={20} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{doc.name}</div>
                    <div className="text-xs text-gray-500">{doc.date} · {doc.size}</div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors flex-shrink-0" aria-label={`Download ${doc.name}`}>
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════════════════ CONTACT TAB ═══════════════════ */}
        {activeTab === 'contact' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>

            {/* Housing Officer Card */}
            <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Housing Officer</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-lg flex-shrink-0">
                  {tenantData.housingOfficer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{tenantData.housingOfficer.name}</div>
                  <div className="text-sm text-gray-500">Housing Officer</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href={`tel:${tenantData.housingOfficer.phone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors">
                  <Phone size={16} className="text-teal-600" />
                  <span className="text-sm text-gray-900">{tenantData.housingOfficer.phone}</span>
                </a>
                <a href={`mailto:${tenantData.housingOfficer.email}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors">
                  <Mail size={16} className="text-teal-600" />
                  <span className="text-sm text-gray-900 truncate">{tenantData.housingOfficer.email}</span>
                </a>
              </div>
            </div>

            {/* Quick Message Form */}
            <div className="bg-white rounded-xl p-5 sm:p-6 shadow-md opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Send a Message</h3>
              {messageSent ? (
                <div className="text-center py-6">
                  <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
                  <p className="text-gray-900 font-semibold">Message Sent!</p>
                  <p className="text-sm text-gray-500">We'll reply within 2 working days.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="portal-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      id="portal-subject"
                      value={contactSubject}
                      onChange={e => setContactSubject(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="">Select a topic...</option>
                      <option value="repair">Repair enquiry</option>
                      <option value="rent">Rent query</option>
                      <option value="complaint">Make a complaint</option>
                      <option value="transfer">Transfer request</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="portal-message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      id="portal-message"
                      rows={4}
                      value={contactMessage}
                      onChange={e => setContactMessage(e.target.value)}
                      placeholder="Describe your enquiry..."
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!contactSubject || !contactMessage}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    <Send size={16} />
                    Send Message
                  </button>
                </form>
              )}
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-800">Emergency? Call us now</h4>
                  <p className="text-sm text-red-700 mt-1">For gas leaks, flooding, no heating, or security issues:</p>
                  <a href="tel:08001112222" className="text-lg font-bold text-red-800 hover:underline">0800 111 2222</a>
                  <p className="text-xs text-red-600 mt-1">Available 24/7, including weekends and bank holidays</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-around py-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                  activeTab === tab.id ? 'text-teal-600' : 'text-gray-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-[9px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
