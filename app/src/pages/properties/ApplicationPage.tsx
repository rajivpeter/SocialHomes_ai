import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProperty, useCreateApplication } from '@/hooks/useApi';
import PropertyMap from '@/components/shared/PropertyMap';
import { formatCurrency } from '@/utils/format';
import { ArrowLeft, ClipboardList, CheckCircle, AlertCircle, Building2, MapPin } from 'lucide-react';

export default function ApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(id || '');
  const createApplication = useCreateApplication();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentAddress: '',
    employmentStatus: '',
    annualIncome: '',
    moveInDate: '',
    householdSize: '1',
    additionalInfo: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await createApplication.mutateAsync({
        propertyId: id,
        ...form,
        annualIncome: form.annualIncome ? parseFloat(form.annualIncome) : 0,
        householdSize: parseInt(form.householdSize, 10),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit application:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-elevated rounded w-1/3" />
          <div className="h-64 bg-surface-elevated rounded" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Property Not Found</h1>
        <Link to="/properties" className="text-brand-teal hover:underline">Back to Properties</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-surface-card rounded-lg border border-status-compliant/30 p-8 text-center">
          <CheckCircle size={64} className="mx-auto mb-4 text-status-compliant" />
          <h1 className="text-3xl font-bold font-heading text-text-primary mb-2">Application Submitted!</h1>
          <p className="text-text-muted mb-2">
            Your application for <strong>{property.address}</strong> has been received.
          </p>
          <p className="text-text-muted mb-6">
            We'll review your application and contact you at <strong>{form.email}</strong> within 5 working days.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to={`/properties/${id}`}
              className="px-6 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors font-medium"
            >
              Back to Property
            </Link>
            <Link
              to="/allocations"
              className="px-6 py-2 bg-surface-elevated text-text-primary rounded-lg hover:bg-surface-hover transition-colors font-medium border border-border-default"
            >
              View All Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link to={`/properties/${id}`} className="inline-flex items-center gap-2 text-brand-teal hover:underline text-sm">
        <ArrowLeft size={16} />
        Back to {property.address}
      </Link>

      <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">Apply for this Property</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-surface-card rounded-lg border border-border-default p-6 space-y-4">
            <h2 className="text-lg font-bold text-brand-peach">Personal Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-text-muted mb-1">First Name *</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-text-muted mb-1">Last Name *</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-muted mb-1">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text-muted mb-1">Phone *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="currentAddress" className="block text-sm font-medium text-text-muted mb-1">Current Address</label>
              <input
                id="currentAddress"
                name="currentAddress"
                type="text"
                value={form.currentAddress}
                onChange={handleChange}
                className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                placeholder="Your current address"
              />
            </div>

            <h2 className="text-lg font-bold text-brand-peach pt-2">Employment & Financial</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="employmentStatus" className="block text-sm font-medium text-text-muted mb-1">Employment Status</label>
                <select
                  id="employmentStatus"
                  name="employmentStatus"
                  value={form.employmentStatus}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                >
                  <option value="">Select...</option>
                  <option value="employed">Employed</option>
                  <option value="self-employed">Self-Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="retired">Retired</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div>
                <label htmlFor="annualIncome" className="block text-sm font-medium text-text-muted mb-1">Annual Income</label>
                <input
                  id="annualIncome"
                  name="annualIncome"
                  type="number"
                  value={form.annualIncome}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                  placeholder="25000"
                />
              </div>
            </div>

            <h2 className="text-lg font-bold text-brand-peach pt-2">Move-In Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="moveInDate" className="block text-sm font-medium text-text-muted mb-1">Desired Move-In Date</label>
                <input
                  id="moveInDate"
                  name="moveInDate"
                  type="date"
                  value={form.moveInDate}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="householdSize" className="block text-sm font-medium text-text-muted mb-1">Household Size</label>
                <select
                  id="householdSize"
                  name="householdSize"
                  value={form.householdSize}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-text-muted mb-1">Additional Information</label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                rows={3}
                value={form.additionalInfo}
                onChange={handleChange}
                className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary placeholder-text-muted focus:border-brand-teal focus:outline-none resize-none"
                placeholder="Any other information to support your application..."
              />
            </div>

            {createApplication.isError && (
              <div className="flex items-center gap-2 text-sm text-status-critical bg-status-critical/10 rounded-lg p-3">
                <AlertCircle size={16} />
                Failed to submit application. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={createApplication.isPending}
              className="w-full px-6 py-3 bg-brand-peach text-white rounded-lg hover:bg-brand-peach/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createApplication.isPending ? (
                <>Submitting...</>
              ) : (
                <>
                  <ClipboardList size={18} />
                  Submit Application
                </>
              )}
            </button>
          </form>
        </div>

        {/* Property Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-surface-card rounded-lg border border-border-default p-4">
            <h3 className="text-lg font-bold font-heading text-brand-peach mb-3">Property Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-text-muted mt-0.5 shrink-0" />
                <div>
                  <div className="text-text-primary font-medium">{property.address}</div>
                  <div className="text-text-muted">{property.postcode}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-text-muted" />
                <span className="text-text-primary capitalize">{property.type} - {property.bedrooms} bed</span>
              </div>
              <div className="pt-2 border-t border-border-default">
                <div className="text-text-muted">Weekly Rent</div>
                <div className="text-lg font-bold text-brand-teal">{formatCurrency(property.weeklyRent)}</div>
              </div>
              <div>
                <div className="text-text-muted">Service Charge</div>
                <div className="font-medium text-text-primary">{formatCurrency(property.serviceCharge)}/week</div>
              </div>
              <div className="pt-2 border-t border-border-default">
                <div className="text-text-muted">EPC Rating</div>
                <div className="font-bold text-lg text-text-primary">{property.epc?.rating || 'N/A'}</div>
              </div>
            </div>
          </div>

          <PropertyMap
            lat={property.lat}
            lng={property.lng}
            address={property.address}
            postcode={property.postcode}
            height="200px"
          />
        </div>
      </div>
    </div>
  );
}
