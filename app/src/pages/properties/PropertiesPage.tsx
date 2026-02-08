import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '@/hooks/useApi';
import { formatCurrency } from '@/utils/format';
import { Map, List, Search, Filter, Building2, Home, Building } from 'lucide-react';
import StatusPill from '@/components/shared/StatusPill';

type ViewMode = 'list' | 'map';

export default function PropertiesPage() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCompliance, setFilterCompliance] = useState<string>('all');

  const { data: properties = [] } = useProperties();

  const filteredProperties = properties.filter((prop: any) => {
    const matchesSearch = 
      prop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.postcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.uprn.includes(searchQuery);
    
    const matchesType = filterType === 'all' || prop.type === filterType;
    const matchesCompliance = filterCompliance === 'all' || prop.compliance.overall === filterCompliance;
    
    return matchesSearch && matchesType && matchesCompliance;
  });

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'house':
        return <Home size={16} className="text-brand-teal" />;
      case 'flat':
        return <Building size={16} className="text-brand-blue" />;
      case 'bungalow':
        return <Building2 size={16} className="text-brand-peach" />;
      default:
        return <Building2 size={16} className="text-text-muted" />;
    }
  };

  // Load Leaflet CSS
  useEffect(() => {
    const existingLink = document.querySelector('link[href*="leaflet"]');
    if (existingLink) return; // Already loaded
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);
    
    return () => {
      const linkToRemove = document.querySelector('link[href*="leaflet"]');
      if (linkToRemove && linkToRemove === link) {
        document.head.removeChild(linkToRemove);
      }
    };
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (viewMode !== 'map' || !mapRef.current) return;
    
    let map: any;
    
    import('leaflet').then((L) => {
      map = L.default.map(mapRef.current!).setView([51.47, -0.07], 13);
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      filteredProperties.forEach(prop => {
        // Use lat/lng if available, otherwise use approximate coordinates near Southwark
        const lat = prop.lat || 51.47 + (Math.random() - 0.5) * 0.01;
        const lng = prop.lng || -0.07 + (Math.random() - 0.5) * 0.01;
        
        const color = prop.compliance?.overall === 'compliant' ? '#10B981' : 
                      prop.compliance?.overall === 'expiring' ? '#F59E0B' : '#EF4444';
        const marker = L.default.circleMarker([lat, lng], {
          radius: 8, fillColor: color, color: '#1E2A38', weight: 1, opacity: 1, fillOpacity: 0.8
        }).addTo(map);
        marker.bindPopup(`<b>${prop.address}</b><br>${prop.postcode}<br>EPC: ${prop.epc?.rating || 'N/A'}`);
        marker.on('click', () => { window.location.href = '/properties/' + prop.id; });
      });
    });

    return () => { 
      if (map) {
        map.remove();
      }
    };
  }, [viewMode, filteredProperties]);

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div>
            <h1 className="text-3xl font-bold font-heading text-gradient-brand tracking-tight mb-1">Properties</h1>
            <p className="text-text-muted">{filteredProperties.length} of {properties.length} properties</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border transition-colors ${
                viewMode === 'list'
                  ? 'bg-brand-teal/20 border-brand-teal text-brand-teal'
                  : 'bg-surface-card border-border-default text-text-muted hover:text-text-primary'
              }`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg border transition-colors ${
                viewMode === 'map'
                  ? 'bg-brand-teal/20 border-brand-teal text-brand-teal'
                  : 'bg-surface-card border-border-default text-text-muted hover:text-text-primary'
              }`}
            >
              <Map size={20} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-surface-card rounded-lg border border-border-default p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by postcode, address, or UPRN..."
                className="w-full bg-surface-elevated border border-border-default rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-teal transition-colors"
              />
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-surface-elevated border border-border-default rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-teal transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="flat">Flat</option>
                <option value="house">House</option>
                <option value="maisonette">Maisonette</option>
                <option value="bungalow">Bungalow</option>
              </select>
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <select
                value={filterCompliance}
                onChange={(e) => setFilterCompliance(e.target.value)}
                className="w-full bg-surface-elevated border border-border-default rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-teal transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Compliance</option>
                <option value="compliant">Compliant</option>
                <option value="expiring">Expiring</option>
                <option value="non-compliant">Non-Compliant</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <div className="bg-surface-card rounded-lg border border-border-default overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-elevated border-b border-border-default">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">UPRN</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Address</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Bedrooms</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Tenure</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Compliance</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Rent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">EPC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filteredProperties.map((property, index) => (
                    <tr
                      key={property.id}
                      onClick={() => navigate(`/properties/${property.uprn}`)}
                      className="hover:bg-surface-elevated transition-colors opacity-0 animate-fade-in-up cursor-pointer"
                      style={{ animationDelay: `${250 + index * 20}ms`, animationFillMode: 'forwards' }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-text-secondary">{property.uprn}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-text-primary font-medium group-hover:text-brand-teal transition-colors">{property.address}</div>
                        <div className="text-xs text-text-muted">{property.postcode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getPropertyTypeIcon(property.type)}
                          <span className="text-sm text-text-secondary capitalize">{property.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-secondary">{property.bedrooms}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-secondary capitalize">{property.tenureType.replace('-', ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        {property.isVoid ? (
                          <StatusPill status="void" />
                        ) : (
                          <StatusPill status="occupied" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={property.compliance.overall} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-text-primary font-medium">{formatCurrency(property.weeklyRent)}</span>
                        <span className="text-xs text-text-muted block">/week</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          property.epc.rating === 'A' || property.epc.rating === 'B' ? 'bg-status-compliant/20 text-status-compliant' :
                          property.epc.rating === 'C' || property.epc.rating === 'D' ? 'bg-status-warning/20 text-status-warning' :
                          'bg-status-critical/20 text-status-critical'
                        }`}>
                          {property.epc.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-surface-card rounded-lg border border-border-default overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <div ref={mapRef} className="w-full h-[600px]" />
          </div>
        )}
      </div>
    </div>
  );
}
