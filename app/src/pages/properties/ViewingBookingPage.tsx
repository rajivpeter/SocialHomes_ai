import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProperty, useCreateViewing } from '@/hooks/useApi';
import PropertyMap from '@/components/shared/PropertyMap';
import { formatCurrency } from '@/utils/format';
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, Building2, MapPin } from 'lucide-react';

export default function ViewingBookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(id || '');
  const createViewing = useCreateViewing();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: 'morning',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await createViewing.mutateAsync({
        propertyId: id,
        ...form,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to book viewing:', err);
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
          <h1 className="text-3xl font-bold font-heading text-text-primary mb-2">Viewing Booked!</h1>
          <p className="text-text-muted mb-2">
            Your viewing request for <strong>{property.address}</strong> has been submitted.
          </p>
          <p className="text-text-muted mb-6">
            We'll confirm your appointment for <strong>{form.preferredDate}</strong> ({form.preferredTime}) via email at <strong>{form.email}</strong>.
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
              View All Viewings
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

      <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight">Book a Viewing</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-surface-card rounded-lg border border-border-default p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-muted mb-1">Full Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                  placeholder="John Smith"
                />
              </div>
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
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-muted mb-1">Phone Number *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange}
                className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                placeholder="07700 900000"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="preferredDate" className="block text-sm font-medium text-text-muted mb-1">Preferred Date *</label>
                <input
                  id="preferredDate"
                  name="preferredDate"
                  type="date"
                  required
                  value={form.preferredDate}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="preferredTime" className="block text-sm font-medium text-text-muted mb-1">Preferred Time</label>
                <select
                  id="preferredTime"
                  name="preferredTime"
                  value={form.preferredTime}
                  onChange={handleChange}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-teal focus:outline-none"
                >
                  <option value="morning">Morning (9am - 12pm)</option>
                  <option value="afternoon">Afternoon (12pm - 5pm)</option>
                  <option value="evening">Evening (5pm - 7pm)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-text-muted mb-1">Additional Message</label>
              <textarea
                id="message"
                name="message"
                rows={3}
                value={form.message}
                onChange={handleChange}
                className="w-full bg-surface-elevated border border-border-default rounded-lg px-4 py-2.5 text-text-primary placeholder-text-muted focus:border-brand-teal focus:outline-none resize-none"
                placeholder="Any special requirements or questions..."
              />
            </div>

            {createViewing.isError && (
              <div className="flex items-center gap-2 text-sm text-status-critical bg-status-critical/10 rounded-lg p-3">
                <AlertCircle size={16} />
                Failed to submit viewing request. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={createViewing.isPending}
              className="w-full px-6 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createViewing.isPending ? (
                <>Submitting...</>
              ) : (
                <>
                  <Calendar size={18} />
                  Book Viewing
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
