import { useState } from 'react';
import { Wrench, PoundSterling, CreditCard, MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

// Mock tenant data - in real app this would come from auth/context
const tenantData = {
  name: 'Mrs Chen',
  rentBalance: -487.20,
  weeklyCharge: 140.90,
  activeRepairs: [
    {
      id: 'rep-001',
      reference: 'REP-2025-04521',
      description: 'Radiator leak in living room',
      status: 'in-progress',
      date: '23/12/2025',
      priority: 'urgent'
    },
    {
      id: 'rep-002',
      reference: 'REP-2026-00123',
      description: 'Kitchen tap dripping',
      status: 'scheduled',
      date: '05/02/2026',
      priority: 'routine'
    }
  ]
};

export default function TenantPortalPage() {
  const [activeRepairs] = useState(tenantData.activeRepairs);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F5F0' }}>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {tenantData.name}</h1>
          <p className="text-lg text-gray-600">Manage your tenancy, report repairs, and stay informed</p>
        </div>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Report a Repair */}
          <button className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 text-left opacity-0 animate-fade-in-up group" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-teal-100 group-hover:bg-teal-200 transition-colors">
                <Wrench size={32} className="text-teal-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Report a Repair</h2>
                <p className="text-sm text-gray-600">Tell us about any issues in your home</p>
              </div>
            </div>
          </button>

          {/* Check Rent Balance */}
          <div className="bg-white rounded-xl p-6 shadow-md opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-xl bg-blue-100">
                <PoundSterling size={32} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Rent Balance</h2>
                <p className="text-sm text-gray-600">Your current account balance</p>
              </div>
            </div>
            <div className={`text-3xl font-bold mb-2 ${tenantData.rentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(tenantData.rentBalance))}
            </div>
            {tenantData.rentBalance < 0 && (
              <p className="text-sm text-gray-600">You have arrears. Please contact us to discuss payment options.</p>
            )}
          </div>

          {/* Make a Payment */}
          <button className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-4">
              <CreditCard size={32} />
              <div className="flex-1 text-left">
                <h2 className="text-xl font-bold mb-1">Make a Payment</h2>
                <p className="text-sm opacity-90">Pay your rent or service charge online</p>
              </div>
            </div>
          </button>

          {/* Contact Us */}
          <button className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 text-left opacity-0 animate-fade-in-up group" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
                <MessageCircle size={32} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Us</h2>
                <p className="text-sm text-gray-600">Get in touch with your housing officer</p>
              </div>
            </div>
          </button>
        </div>

        {/* Active Repairs Section */}
        <div className="bg-white rounded-xl p-6 shadow-md opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Active Repairs</h2>
          {activeRepairs.length > 0 ? (
            <div className="space-y-4">
              {activeRepairs.map((repair, index) => (
                <div
                  key={repair.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${350 + index * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-mono text-gray-500">{repair.reference}</span>
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">{repair.description}</h3>
                    </div>
                    {repair.status === 'in-progress' ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        <Clock size={14} />
                        In Progress
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        <CheckCircle size={14} />
                        Scheduled
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Reported: {repair.date}
                  </div>
                  {repair.priority === 'urgent' && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle size={16} />
                      <span className="font-medium">Urgent repair</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto mb-3 text-green-500 opacity-50" />
              <p className="text-gray-600">You have no active repairs</p>
            </div>
          )}
        </div>

        {/* Rent Statement Summary */}
        <div className="bg-white rounded-xl p-6 shadow-md opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rent Account Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Weekly Charge</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(tenantData.weeklyCharge)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Current Balance</div>
              <div className={`text-2xl font-bold ${tenantData.rentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(tenantData.rentBalance))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Payment Method</div>
              <div className="text-lg font-semibold text-gray-900">Direct Debit</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
