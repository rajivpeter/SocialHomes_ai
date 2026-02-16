import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { regions, localAuthorities, estates, blocks, properties, tenants } from '@/data';
import { allRepairs as repairs, allComplaints as complaints, allDampCases as dampCases } from '@/data';
import { organisation, aiInsights } from '@/data';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import { ChevronRight, Map as MapIcon, List, ExternalLink, AlertTriangle, TrendingUp, TrendingDown, Thermometer, Shield, BarChart3, Activity } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { getImdDataForArea, getHousingMarketData, getWeatherRiskData, getAreaIntelligence, getEpcDataForPostcode } from '@/services/public-data';

type DrillDownLevel = 'country' | 'region' | 'la' | 'estate' | 'block' | 'unit' | 'tenant';

interface BreadcrumbItem {
  label: string;
  level: DrillDownLevel;
  id?: string;
}

function BuildingFloor({ y, units, onClick }: { y: number; units: any[]; onClick: (unit: any) => void }) {
  return (
    <group position={[0, y, 0]}>
      {units.map((unit, i) => {
        const x = (i % 5) * 2.5 - 5;
        const z = Math.floor(i / 5) * 2.5 - 2.5;
        const color = unit.isVoid ? '#6B7B8D' : 
                      unit.compliance === 'non-compliant' ? '#BE3358' : 
                      unit.compliance === 'expiring' ? '#EFAC92' : '#058995';
        return (
          <mesh key={unit.id || i} position={[x, 0, z]} onClick={() => onClick(unit)}>
            <boxGeometry args={[2, 2.5, 2]} />
            <meshStandardMaterial color={color} transparent opacity={0.85} />
          </mesh>
        );
      })}
      {/* Floor plate */}
      <mesh position={[0, -1.3, 0]}>
        <boxGeometry args={[15, 0.15, 8]} />
        <meshStandardMaterial color="#1E2A38" />
      </mesh>
    </group>
  );
}

function Building3D({ block, onUnitClick }: { block: any; onUnitClick: (unit: any) => void }) {
  const storeys = block?.storeys || 4;
  const blockProperties = block?.id ? properties.filter(p => p.blockId === block.id) : [];
  const unitsPerFloor = Math.ceil(blockProperties.length / storeys);
  
  const floors = Array.from({ length: storeys }, (_, floor) => {
    const startIdx = floor * unitsPerFloor;
    const endIdx = Math.min(startIdx + unitsPerFloor, blockProperties.length);
    const floorProperties = blockProperties.slice(startIdx, endIdx);
    
    // Fill remaining slots with void units if needed
    const units = floorProperties.map((prop, i) => ({
      id: prop.id,
      name: prop.address,
      isVoid: prop.isVoid,
      compliance: prop.compliance?.overall || 'compliant',
    }));
    
    // Add void units to fill the floor if needed
    while (units.length < unitsPerFloor) {
      units.push({
        id: `void-${floor}-${units.length}`,
        name: `Void ${floor * unitsPerFloor + units.length + 1}`,
        isVoid: true,
        compliance: 'compliant',
      });
    }
    
    return { floor, units, y: floor * 3 };
  });

  return (
    <Canvas camera={{ position: [20, 15, 20], fov: 50 }} style={{ height: '500px', background: '#0B0F14' }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <pointLight position={[-10, 10, -10]} intensity={0.3} color="#058995" />
      {floors.map(f => (
        <BuildingFloor key={f.floor} y={f.y} units={f.units} onClick={onUnitClick} />
      ))}
      {/* Ground */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#0D1117" />
      </mesh>
      <OrbitControls enableDamping dampingFactor={0.05} />
    </Canvas>
  );
}

export default function ExplorePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const [level, setLevel] = useState<DrillDownLevel>('country');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: 'England', level: 'country' }
  ]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [show3D, setShow3D] = useState(false);
  const navigate = useNavigate();

  // Compute area intelligence based on current selection
  const areaIntel = useMemo(() => {
    if (level === 'la' && selectedId) {
      return {
        imd: getImdDataForArea(selectedId),
        market: getHousingMarketData(selectedId),
        intelligence: getAreaIntelligence(selectedId),
      };
    }
    if (level === 'region' && selectedId) {
      const las = localAuthorities.filter(la => la.regionId === selectedId);
      if (las.length > 0) {
        return {
          imd: getImdDataForArea(las[0].id),
          market: getHousingMarketData(las[0].id),
          intelligence: getAreaIntelligence(las[0].id),
        };
      }
    }
    if (level === 'estate' && selectedId) {
      const estate = estates.find(e => e.id === selectedId);
      if (estate) {
        return {
          imd: getImdDataForArea(estate.localAuthorityId),
          market: getHousingMarketData(estate.localAuthorityId),
          intelligence: getAreaIntelligence(estate.localAuthorityId),
        };
      }
    }
    if (level === 'block' && selectedId) {
      const block = blocks.find(b => b.id === selectedId);
      if (block) {
        const estate = estates.find(e => e.id === block.estateId);
        if (estate) {
          return {
            imd: getImdDataForArea(estate.localAuthorityId),
            market: getHousingMarketData(estate.localAuthorityId),
            intelligence: getAreaIntelligence(estate.localAuthorityId),
          };
        }
      }
    }
    return null;
  }, [level, selectedId]);

  // Weather risk for current region
  const weatherRisk = useMemo(() => {
    if (level === 'country') return getWeatherRiskData('london');
    if (level === 'region' && selectedId) return getWeatherRiskData(selectedId);
    if (level === 'la' && selectedId) {
      const la = localAuthorities.find(l => l.id === selectedId);
      return la ? getWeatherRiskData(la.regionId) : null;
    }
    if (level === 'estate' && selectedId) {
      const estate = estates.find(e => e.id === selectedId);
      if (estate) {
        const la = localAuthorities.find(l => l.id === estate.localAuthorityId);
        return la ? getWeatherRiskData(la.regionId) : null;
      }
    }
    return null;
  }, [level, selectedId]);

  // Contextual case stats for current entity
  const caseStats = useMemo(() => {
    let scopeProps: string[] = [];
    if (level === 'estate' && selectedId) {
      scopeProps = properties.filter(p => p.estateId === selectedId).map(p => p.id);
    } else if (level === 'block' && selectedId) {
      scopeProps = properties.filter(p => p.blockId === selectedId).map(p => p.id);
    } else if (level === 'la' && selectedId) {
      scopeProps = properties.filter(p => p.localAuthorityId === selectedId).map(p => p.id);
    } else if (level === 'region' && selectedId) {
      scopeProps = properties.filter(p => p.regionId === selectedId).map(p => p.id);
    } else {
      scopeProps = properties.map(p => p.id);
    }

    const scopeTenantIds = tenants.filter(t => scopeProps.includes(t.propertyId)).map(t => t.id);
    const scopeRepairs = repairs.filter(r => scopeProps.includes(r.propertyId));
    const scopeComplaints = complaints.filter(c => scopeTenantIds.includes(c.tenantId || ''));
    const scopeDamp = dampCases.filter(d => scopeProps.includes(d.propertyId));
    const tenantsInArrears = tenants.filter(t => scopeProps.includes(t.propertyId) && t.rentBalance < 0);
    const totalArrears = tenantsInArrears.reduce((sum, t) => sum + Math.abs(t.rentBalance), 0);
    const avgDampRisk = scopeProps.length > 0 ? properties.filter(p => scopeProps.includes(p.id)).reduce((sum, p) => sum + (p.dampRisk || 0), 0) / scopeProps.length : 0;

    return {
      openRepairs: scopeRepairs.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length,
      emergencyRepairs: scopeRepairs.filter(r => r.priority === 'emergency' && r.status !== 'completed').length,
      openComplaints: scopeComplaints.filter(c => c.status !== 'closed').length,
      dampCases: scopeDamp.filter(d => d.status !== 'closed').length,
      tenantsInArrears: tenantsInArrears.length,
      totalArrears,
      avgDampRisk: Math.round(avgDampRisk),
      nonCompliant: properties.filter(p => scopeProps.includes(p.id) && p.compliance?.overall === 'non-compliant').length,
      expiring: properties.filter(p => scopeProps.includes(p.id) && p.compliance?.overall === 'expiring').length,
    };
  }, [level, selectedId]);

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
    if (viewMode !== 'map' || !mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      const map = L.default.map('map', {
        center: [51.5, -1.5],
        zoom: 6,
        zoomControl: true,
      });

      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      updateMapMarkers();
    });
  }, [viewMode]);

  // Update map markers when level or selection changes
  useEffect(() => {
    if (viewMode !== 'map' || !mapInstanceRef.current) return;
    updateMapMarkers();
  }, [viewMode, level, selectedId]);

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current!;

      if (level === 'country') {
        // Show region markers
        regions.forEach(region => {
          const marker = createCustomMarker(
            L.default,
            region.lat,
            region.lng,
            region.totalUnits,
            'region',
            () => drillDown('region', region.id, region.name)
          );
          marker.addTo(map);
          markersRef.current.push(marker);
        });
        map.setView([51.5, -1.5], 6);
      } else if (level === 'region' && selectedId) {
        const region = regions.find(r => r.id === selectedId);
        if (region) {
          const las = localAuthorities.filter(la => la.regionId === selectedId);
          las.forEach(la => {
            const marker = createCustomMarker(
              L.default,
              la.lat,
              la.lng,
              la.totalUnits,
              'la',
              () => drillDown('la', la.id, la.name)
            );
            marker.addTo(map);
            markersRef.current.push(marker);
          });
          map.setView([region.lat, region.lng], 8);
        }
      } else if (level === 'la' && selectedId) {
        const la = localAuthorities.find(l => l.id === selectedId);
        if (la) {
          const estateList = estates.filter(e => e.localAuthorityId === selectedId);
          estateList.forEach(estate => {
            const marker = createCustomMarker(
              L.default,
              estate.lat,
              estate.lng,
              estate.totalUnits,
              'estate',
              () => drillDown('estate', estate.id, estate.name)
            );
            marker.addTo(map);
            markersRef.current.push(marker);
          });
          map.setView([la.lat, la.lng], 11);
        }
      } else if (level === 'estate' && selectedId) {
        const estate = estates.find(e => e.id === selectedId);
        if (estate) {
          const blockList = blocks.filter(b => b.estateId === selectedId);
          blockList.forEach(block => {
            const marker = createCustomMarker(
              L.default,
              block.lat,
              block.lng,
              block.totalUnits,
              'block',
              () => drillDown('block', block.id, block.name)
            );
            marker.addTo(map);
            markersRef.current.push(marker);
          });
          map.setView([estate.lat, estate.lng], 14);
        }
      } else if (level === 'block' && selectedId) {
        const block = blocks.find(b => b.id === selectedId);
        if (block) {
          const propertyList = properties.filter(p => p.blockId === selectedId);
          propertyList.forEach(property => {
            const marker = createCustomMarker(
              L.default,
              property.lat,
              property.lng,
              1,
              'unit',
              () => drillDown('unit', property.id, property.address)
            );
            marker.addTo(map);
            markersRef.current.push(marker);
          });
          map.setView([block.lat, block.lng], 16);
        }
      } else if (level === 'unit' && selectedId) {
        const property = properties.find(p => p.id === selectedId);
        if (property && property.currentTenancyId) {
          const tenant = tenants.find(t => t.tenancyId === property.currentTenancyId);
          if (tenant) {
            const marker = createCustomMarker(
              L.default,
              property.lat,
              property.lng,
              1,
              'tenant',
              () => drillDown('tenant', tenant.id, `${tenant.firstName} ${tenant.lastName}`)
            );
            marker.addTo(map);
            markersRef.current.push(marker);
          }
        }
        if (property) {
          map.setView([property.lat, property.lng], 18);
        }
      }
    });
  };

  const createCustomMarker = (
    L: { divIcon: typeof import('leaflet').divIcon; marker: typeof import('leaflet').marker; DomEvent: typeof import('leaflet').DomEvent },
    lat: number,
    lng: number,
    count: number,
    type: string,
    onClick: () => void
  ) => {
    const colors: Record<string, string> = {
      region: '#058995',
      la: '#5BA4AA',
      estate: '#EFAC92',
      block: '#BE3358',
      unit: '#A371F7',
      tenant: '#2EA043',
    };

    const color = colors[type] || '#6B7B8D';
    const size = type === 'region' ? 40 : type === 'la' ? 35 : type === 'estate' ? 30 : type === 'block' ? 25 : 20;

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid #0D1117;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: ${size > 30 ? '12px' : '10px'};
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          ${count > 99 ? '99+' : count}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    const marker = L.marker([lat, lng], { icon });
    // Add popup for Selenium detectability and user context
    const labels: Record<string, string> = { region: 'Region', la: 'Local Authority', estate: 'Estate', block: 'Block', unit: 'Unit', tenant: 'Tenant' };
    const popupContent = `<div style="font-size:13px;font-weight:600">${labels[type] || type}</div><div style="font-size:11px">${count} unit${count !== 1 ? 's' : ''}</div><div style="font-size:10px;color:#058995;cursor:pointer">Click to explore →</div>`;
    marker.bindPopup(popupContent);
    marker.on('mouseover', () => { marker.openPopup(); });
    marker.on('mouseout', () => { marker.closePopup(); });
    marker.on('click', onClick);
    return marker;
  };

  const drillDown = (newLevel: DrillDownLevel, id: string, name: string) => {
    setLevel(newLevel);
    setSelectedId(id);
    // Reset 3D view when leaving block level
    if (newLevel !== 'block') {
      setShow3D(false);
    }
    
    const newBreadcrumbs: BreadcrumbItem[] = [{ label: 'England', level: 'country' }];
    
    if (newLevel === 'region') {
      newBreadcrumbs.push({ label: name, level: 'region', id });
    } else if (newLevel === 'la') {
      const la = localAuthorities.find(l => l.id === id);
      if (la) {
        newBreadcrumbs.push({ label: regions.find(r => r.id === la.regionId)?.name || '', level: 'region', id: la.regionId });
        newBreadcrumbs.push({ label: name, level: 'la', id });
      }
    } else if (newLevel === 'estate') {
      const estate = estates.find(e => e.id === id);
      if (estate) {
        const la = localAuthorities.find(l => l.id === estate.localAuthorityId);
        if (la) {
          newBreadcrumbs.push({ label: regions.find(r => r.id === la.regionId)?.name || '', level: 'region', id: la.regionId });
          newBreadcrumbs.push({ label: la.name, level: 'la', id: la.id });
          newBreadcrumbs.push({ label: name, level: 'estate', id });
        }
      }
    } else if (newLevel === 'block') {
      const block = blocks.find(b => b.id === id);
      if (block) {
        const estate = estates.find(e => e.id === block.estateId);
        if (estate) {
          const la = localAuthorities.find(l => l.id === estate.localAuthorityId);
          if (la) {
            newBreadcrumbs.push({ label: regions.find(r => r.id === la.regionId)?.name || '', level: 'region', id: la.regionId });
            newBreadcrumbs.push({ label: la.name, level: 'la', id: la.id });
            newBreadcrumbs.push({ label: estate.name, level: 'estate', id: estate.id });
            newBreadcrumbs.push({ label: name, level: 'block', id });
          }
        }
      }
    } else if (newLevel === 'unit') {
      const property = properties.find(p => p.id === id);
      if (property) {
        const block = blocks.find(b => b.id === property.blockId);
        if (block) {
          const estate = estates.find(e => e.id === block.estateId);
          if (estate) {
            const la = localAuthorities.find(l => l.id === estate.localAuthorityId);
            if (la) {
              newBreadcrumbs.push({ label: regions.find(r => r.id === la.regionId)?.name || '', level: 'region', id: la.regionId });
              newBreadcrumbs.push({ label: la.name, level: 'la', id: la.id });
              newBreadcrumbs.push({ label: estate.name, level: 'estate', id: estate.id });
              newBreadcrumbs.push({ label: block.name, level: 'block', id: block.id });
              newBreadcrumbs.push({ label: name, level: 'unit', id });
            }
          }
        }
      }
    } else if (newLevel === 'tenant') {
      const tenant = tenants.find(t => t.id === id);
      if (tenant) {
        const property = properties.find(p => p.id === tenant.propertyId);
        if (property) {
          const block = blocks.find(b => b.id === property.blockId);
          if (block) {
            const estate = estates.find(e => e.id === block.estateId);
            if (estate) {
              const la = localAuthorities.find(l => l.id === estate.localAuthorityId);
              if (la) {
                newBreadcrumbs.push({ label: regions.find(r => r.id === la.regionId)?.name || '', level: 'region', id: la.regionId });
                newBreadcrumbs.push({ label: la.name, level: 'la', id: la.id });
                newBreadcrumbs.push({ label: estate.name, level: 'estate', id: estate.id });
                newBreadcrumbs.push({ label: block.name, level: 'block', id: block.id });
                newBreadcrumbs.push({ label: property.address, level: 'unit', id: property.id });
                newBreadcrumbs.push({ label: name, level: 'tenant', id });
              }
            }
          }
        }
      }
    }
    
    setBreadcrumbs(newBreadcrumbs);
  };

  const navigateToBreadcrumb = (breadcrumb: BreadcrumbItem, index: number) => {
    if (index === 0) {
      setLevel('country');
      setSelectedId(null);
      setBreadcrumbs([{ label: 'England', level: 'country' }]);
    } else {
      drillDown(breadcrumb.level, breadcrumb.id!, breadcrumb.label);
    }
  };

  const getCurrentEntity = () => {
    if (level === 'country') {
      return {
        name: 'RCHA Portfolio',
        type: 'Country',
        metrics: {
          totalUnits: organisation.totalUnits,
          occupancy: organisation.occupancyRate,
          compliance: organisation.complianceRate,
          arrears: organisation.totalArrears,
        },
        children: regions.map(r => ({ id: r.id, name: r.name, count: r.totalUnits })),
      };
    } else if (level === 'region' && selectedId) {
      const region = regions.find(r => r.id === selectedId);
      if (region) {
        return {
          name: region.name,
          type: 'Region',
          metrics: {
            totalUnits: region.totalUnits,
            compliance: region.compliance,
            arrears: region.arrears,
            voids: region.voids,
          },
          children: localAuthorities
            .filter(la => la.regionId === selectedId)
            .map(la => ({ id: la.id, name: la.name, count: la.totalUnits })),
        };
      }
    } else if (level === 'la' && selectedId) {
      const la = localAuthorities.find(l => l.id === selectedId);
      if (la) {
        return {
          name: la.name,
          type: 'Local Authority',
          metrics: {
            totalUnits: la.totalUnits,
            compliance: la.compliance,
          },
          children: estates
            .filter(e => e.localAuthorityId === selectedId)
            .map(e => ({ id: e.id, name: e.name, count: e.totalUnits })),
        };
      }
    } else if (level === 'estate' && selectedId) {
      const estate = estates.find(e => e.id === selectedId);
      if (estate) {
        return {
          name: estate.name,
          type: 'Estate',
          metrics: {
            totalUnits: estate.totalUnits,
            occupancy: estate.occupancy,
            compliance: estate.compliance,
            arrears: estate.arrears,
            dampCases: estate.dampCases,
            asbCases: estate.asbCases,
            repairsBacklog: estate.repairsBacklog,
          },
          children: blocks
            .filter(b => b.estateId === selectedId)
            .map(b => ({ id: b.id, name: b.name, count: b.totalUnits })),
        };
      }
    } else if (level === 'block' && selectedId) {
      const block = blocks.find(b => b.id === selectedId);
      if (block) {
        const blockProperties = properties.filter(p => p.blockId === selectedId);
        return {
          name: block.name,
          type: 'Block',
          metrics: {
            totalUnits: block.totalUnits,
            storeys: block.storeys,
            constructionYear: block.constructionYear,
            higherRisk: block.higherRisk,
          },
          children: blockProperties.map(p => ({ id: p.id, name: p.address, count: 1 })),
          blockDetails: block,
        };
      }
    } else if (level === 'unit' && selectedId) {
      const property = properties.find(p => p.id === selectedId);
      if (property) {
        const tenant = property.currentTenancyId 
          ? tenants.find(t => t.tenancyId === property.currentTenancyId)
          : null;
        return {
          name: property.address,
          type: 'Unit',
          metrics: {
            bedrooms: property.bedrooms,
            floorArea: property.floorArea,
            weeklyRent: property.weeklyRent,
            serviceCharge: property.serviceCharge,
            dampRisk: property.dampRisk,
          },
          propertyDetails: property,
          tenant: tenant,
        };
      }
    } else if (level === 'tenant' && selectedId) {
      const tenant = tenants.find(t => t.id === selectedId);
      if (tenant) {
        const property = properties.find(p => p.id === tenant.propertyId);
        return {
          name: `${tenant.title} ${tenant.firstName} ${tenant.lastName}`,
          type: 'Tenant',
          metrics: {
            weeklyCharge: tenant.weeklyCharge,
            rentBalance: tenant.rentBalance,
            arrearsRisk: tenant.arrearsRisk,
            contactCount30Days: tenant.contactCount30Days,
          },
          tenantDetails: tenant,
          property: property,
        };
      }
    }
    return null;
  };

  const entity = getCurrentEntity();

  return (
    <div className="h-screen flex flex-col bg-surface-dark">
      {/* Breadcrumb Trail */}
      <div className="px-6 py-3 bg-surface-card border-b border-border-default">
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={14} className="text-text-muted" />}
              <button
                onClick={() => navigateToBreadcrumb(crumb, index)}
                className={`${
                  index === breadcrumbs.length - 1
                    ? 'text-brand-peach font-semibold'
                    : 'text-brand-teal hover:text-brand-peach cursor-pointer'
                }`}
              >
                {crumb.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Split Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map/List Panel - 60% */}
        {viewMode === 'map' ? (
          <div className="w-[60%] relative flex flex-col">
            {level === 'block' && (
              <div className="p-4 border-b border-border-default bg-surface-card">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShow3D(false)} 
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      !show3D 
                        ? 'bg-brand-teal text-white' 
                        : 'bg-surface-elevated text-text-muted hover:bg-surface-hover'
                    }`}
                  >
                    2D Map
                  </button>
                  <button 
                    onClick={() => setShow3D(true)} 
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      show3D 
                        ? 'bg-brand-teal text-white' 
                        : 'bg-surface-elevated text-text-muted hover:bg-surface-hover'
                    }`}
                  >
                    3D Building
                  </button>
                </div>
              </div>
            )}
            {level === 'block' && show3D ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 rounded-lg overflow-hidden border border-border-default m-4">
                  <Building3D 
                    block={blocks.find(b => b.id === selectedId)} 
                    onUnitClick={(unit) => {
                      if (unit.id && !unit.id.startsWith('void-')) {
                        const property = properties.find(p => p.id === unit.id);
                        if (property) {
                          drillDown('unit', property.id, property.address);
                        }
                      }
                    }} 
                  />
                </div>
                <div className="bg-surface-card p-3 mx-4 mb-4 flex gap-4 text-xs rounded-lg border border-border-default">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#058995]" /> 
                    <span className="text-text-secondary">Compliant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#EFAC92]" /> 
                    <span className="text-text-secondary">Expiring</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#BE3358]" /> 
                    <span className="text-text-secondary">Non-compliant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#6B7B8D]" /> 
                    <span className="text-text-secondary">Void</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div id="map" ref={mapRef} className="flex-1 w-full h-full" />
                
                {/* Level indicator overlay */}
                <div className="absolute top-4 left-4 bg-surface-card/90 backdrop-blur-sm border border-border-default rounded-lg px-4 py-2">
                  <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Current Level</div>
                  <div className="text-sm font-semibold text-text-primary capitalize">{level}</div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-[60%] bg-surface-card border-r border-border-default overflow-y-auto">
            {entity && entity.children && entity.children.length > 0 ? (
              <div className="p-6">
                <h2 className="text-xl font-bold font-heading text-brand-peach mb-4">
                  {level === 'country' ? 'Regions' : level === 'region' ? 'Local Authorities' : level === 'la' ? 'Estates' : level === 'estate' ? 'Blocks' : 'Units'} ({entity.children.length})
                </h2>
                <div className="bg-surface-elevated rounded-lg border border-border-default overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface-dark border-b border-border-default">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Units</th>
                          {level === 'region' && (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Compliance</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Arrears</th>
                            </>
                          )}
                          {level === 'la' && (
                            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Compliance</th>
                          )}
                          {level === 'estate' && (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Storeys</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Built</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Address</th>
                            </>
                          )}
                          {level === 'block' && (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Postcode</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Bedrooms</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {entity.children.map((child, index) => {
                          let fullEntity: any = null;
                          if (level === 'country') {
                            fullEntity = regions.find(r => r.id === child.id);
                          } else if (level === 'region') {
                            fullEntity = localAuthorities.find(la => la.id === child.id);
                          } else if (level === 'la') {
                            fullEntity = estates.find(e => e.id === child.id);
                          } else if (level === 'estate') {
                            fullEntity = blocks.find(b => b.id === child.id);
                          } else if (level === 'block') {
                            fullEntity = properties.find(p => p.id === child.id);
                          }

                          const nextLevel: DrillDownLevel = 
                            level === 'country' ? 'region' :
                            level === 'region' ? 'la' :
                            level === 'la' ? 'estate' :
                            level === 'estate' ? 'block' :
                            'unit';

                          return (
                            <tr
                              key={child.id}
                              onClick={() => drillDown(nextLevel, child.id, child.name)}
                              className="hover:bg-surface-hover transition-colors cursor-pointer opacity-0 animate-fade-in-up"
                              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                            >
                              <td className="px-4 py-3">
                                <div className="text-sm text-text-primary font-medium">{child.name}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-text-secondary">{formatNumber(child.count)}</span>
                              </td>
                              {level === 'region' && fullEntity && (
                                <>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-text-secondary">{formatPercent(fullEntity.compliance)}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-text-secondary">{formatCurrency(fullEntity.arrears)}</span>
                                  </td>
                                </>
                              )}
                              {level === 'la' && fullEntity && (
                                <td className="px-4 py-3">
                                  <span className="text-sm text-text-secondary">{formatPercent(fullEntity.compliance)}</span>
                                </td>
                              )}
                              {level === 'estate' && fullEntity && (
                                <>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-text-secondary">{fullEntity.storeys || 'N/A'}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-text-secondary">{fullEntity.constructionYear || 'N/A'}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-text-secondary">{fullEntity.address || 'N/A'}</span>
                                  </td>
                                </>
                              )}
                              {level === 'block' && fullEntity && (
                                <>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-text-secondary">{fullEntity.postcode || 'N/A'}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-text-secondary capitalize">{fullEntity.type || 'N/A'}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-text-secondary">{fullEntity.bedrooms || 'N/A'}</span>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-text-muted">
                <p>No items to display</p>
              </div>
            )}
          </div>
        )}

        {/* Context Panel - 40% */}
        <div className="w-[40%] bg-surface-card border-l border-border-default overflow-y-auto">
          {entity ? (
            <div className="p-6 space-y-6">
              {/* Entity Header */}
              <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-2xl font-bold font-heading text-brand-peach mb-1">{entity.name}</h1>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-brand-teal/20 text-brand-teal">
                      {entity.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                {entity.metrics.totalUnits !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Total Units</div>
                    <div className="text-2xl font-bold text-text-primary">{formatNumber(entity.metrics.totalUnits)}</div>
                  </div>
                )}
                {entity.metrics.occupancy !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Occupancy</div>
                    <div className="text-2xl font-bold text-text-primary">{formatPercent(entity.metrics.occupancy)}</div>
                  </div>
                )}
                {entity.metrics.compliance !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Compliance</div>
                    <div className="text-2xl font-bold text-text-primary">{formatPercent(entity.metrics.compliance)}</div>
                  </div>
                )}
                {entity.metrics.arrears !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Arrears</div>
                    <div className="text-2xl font-bold text-text-primary">{formatCurrency(entity.metrics.arrears)}</div>
                  </div>
                )}
                {entity.metrics.voids !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Voids</div>
                    <div className="text-2xl font-bold text-text-primary">{entity.metrics.voids}</div>
                  </div>
                )}
                {entity.metrics.dampCases !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Damp Cases</div>
                    <div className="text-2xl font-bold text-text-primary">{entity.metrics.dampCases}</div>
                  </div>
                )}
                {entity.metrics.asbCases !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">ASB Cases</div>
                    <div className="text-2xl font-bold text-text-primary">{entity.metrics.asbCases}</div>
                  </div>
                )}
                {entity.metrics.repairsBacklog !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Repairs Backlog</div>
                    <div className="text-2xl font-bold text-text-primary">{entity.metrics.repairsBacklog}</div>
                  </div>
                )}
                {entity.metrics.storeys !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Storeys</div>
                    <div className="text-2xl font-bold text-text-primary">{entity.metrics.storeys}</div>
                  </div>
                )}
                {entity.metrics.constructionYear !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Built</div>
                    <div className="text-2xl font-bold text-text-primary">{entity.metrics.constructionYear}</div>
                  </div>
                )}
                {entity.metrics.bedrooms !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Bedrooms</div>
                    <div className="text-2xl font-bold text-text-primary">{entity.metrics.bedrooms}</div>
                  </div>
                )}
                {entity.metrics.floorArea !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Floor Area</div>
                    <div className="text-2xl font-bold text-text-primary">{entity.metrics.floorArea}m²</div>
                  </div>
                )}
                {entity.metrics.weeklyRent !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Weekly Rent</div>
                    <div className="text-2xl font-bold text-text-primary">{formatCurrency(entity.metrics.weeklyRent)}</div>
                  </div>
                )}
                {entity.metrics.serviceCharge !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Service Charge</div>
                    <div className="text-2xl font-bold text-text-primary">{formatCurrency(entity.metrics.serviceCharge)}</div>
                  </div>
                )}
                {entity.metrics.dampRisk !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Damp Risk</div>
                    <div className="text-2xl font-bold text-text-primary">{entity.metrics.dampRisk}%</div>
                  </div>
                )}
                {entity.metrics.weeklyCharge !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Weekly Charge</div>
                    <div className="text-2xl font-bold text-text-primary">{formatCurrency(entity.metrics.weeklyCharge)}</div>
                  </div>
                )}
                {entity.metrics.rentBalance !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Rent Balance</div>
                    <div className={`text-2xl font-bold ${entity.metrics.rentBalance > 0 ? 'text-status-critical' : 'text-text-primary'}`}>
                      {formatCurrency(entity.metrics.rentBalance)}
                    </div>
                  </div>
                )}
                {entity.metrics.arrearsRisk !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Arrears Risk</div>
                    <div className="text-2xl font-bold text-text-primary">{entity.metrics.arrearsRisk}%</div>
                  </div>
                )}
                {entity.metrics.contactCount30Days !== undefined && (
                  <div className="bg-surface-elevated rounded-lg p-4 border border-border-default">
                    <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Contacts (30d)</div>
                    <div className="text-2xl font-bold text-text-primary">{entity.metrics.contactCount30Days}</div>
                  </div>
                )}
              </div>

              {/* Compliance Status Cards (for Block level) */}
              {entity.blockDetails && (
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                  <h2 className="text-lg font-bold font-heading text-brand-peach mb-3">Compliance Status</h2>
                  <div className="space-y-2">
                    <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
                      <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Fire Risk Assessment</div>
                      <div className="text-sm text-text-primary">{typeof entity.blockDetails.fireRiskAssessment.date === 'object' ? String(entity.blockDetails.fireRiskAssessment.date) : entity.blockDetails.fireRiskAssessment.date}</div>
                      <div className="text-xs text-text-muted mt-1">Risk Level: {entity.blockDetails.fireRiskAssessment.riskLevel}</div>
                    </div>
                    <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
                      <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Asbestos Management</div>
                      <div className="text-sm text-text-primary">{entity.blockDetails.asbestosManagement.acmCount} ACMs identified</div>
                      <div className="text-xs text-text-muted mt-1">Last survey: {typeof entity.blockDetails.asbestosManagement.surveyDate === 'object' ? String(entity.blockDetails.asbestosManagement.surveyDate) : entity.blockDetails.asbestosManagement.surveyDate}</div>
                    </div>
                    <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
                      <div className="text-xs uppercase tracking-wider text-brand-teal mb-1">Legionella Assessment</div>
                      <div className="text-sm text-text-primary">Risk Level: {entity.blockDetails.legionellaAssessment.riskLevel}</div>
                      <div className="text-xs text-text-muted mt-1">Last assessment: {entity.blockDetails.legionellaAssessment.date}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3D View Toggle (for Block level) */}
              {level === 'block' && (
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
                  <div className="bg-status-ai/10 border-2 border-status-ai rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-text-primary mb-1">3D View Available</div>
                        <div className="text-xs text-text-muted">Visualise this block in 3D</div>
                      </div>
                      <button className="px-4 py-2 bg-status-ai text-white rounded-lg hover:bg-status-ai/80 transition-colors text-sm font-medium">
                        View 3D
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Children List */}
              {entity.children && entity.children.length > 0 && (
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                  <h2 className="text-lg font-bold font-heading text-brand-peach mb-3">
                    {level === 'country' ? 'Regions' : level === 'region' ? 'Local Authorities' : level === 'la' ? 'Estates' : level === 'estate' ? 'Blocks' : 'Units'} ({entity.children.length})
                  </h2>
                  <ul className="panel-list space-y-2">
                    {entity.children.map((child, index) => (
                      <li
                        key={child.id}
                        onClick={() => {
                          const nextLevel: DrillDownLevel =
                            level === 'country' ? 'region' :
                            level === 'region' ? 'la' :
                            level === 'la' ? 'estate' :
                            level === 'estate' ? 'block' :
                            'unit';
                          drillDown(nextLevel, child.id, child.name);
                        }}
                        className="w-full bg-surface-elevated hover:bg-surface-hover rounded-lg p-3 border border-border-default text-left transition-colors opacity-0 animate-fade-in-up cursor-pointer list-none"
                        style={{ animationDelay: `${350 + index * 50}ms`, animationFillMode: 'forwards' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-text-primary truncate">{child.name}</div>
                            {child.count > 1 && (
                              <div className="text-xs text-text-muted mt-1">{formatNumber(child.count)} units</div>
                            )}
                          </div>
                          <ChevronRight size={16} className="text-text-muted flex-shrink-0 ml-2" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Case & Risk Summary */}
              {level !== 'tenant' && (
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
                  <h2 className="text-lg font-bold font-heading text-brand-peach mb-3 flex items-center gap-2">
                    <Activity size={18} /> Live Risk Summary
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {caseStats.emergencyRepairs > 0 && (
                      <div className="bg-status-critical/10 border border-status-critical/20 rounded-lg p-3">
                        <div className="text-xs text-status-critical uppercase tracking-wider">Emergency</div>
                        <div className="text-xl font-bold text-status-critical">{caseStats.emergencyRepairs}</div>
                        <div className="text-[10px] text-text-muted">open repairs</div>
                      </div>
                    )}
                    <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
                      <div className="text-xs text-brand-teal uppercase tracking-wider">Repairs</div>
                      <div className="text-xl font-bold text-text-primary">{caseStats.openRepairs}</div>
                      <div className="text-[10px] text-text-muted">open</div>
                    </div>
                    {caseStats.nonCompliant > 0 && (
                      <div className="bg-status-critical/10 border border-status-critical/20 rounded-lg p-3">
                        <div className="text-xs text-status-critical uppercase tracking-wider">Non-Compliant</div>
                        <div className="text-xl font-bold text-status-critical">{caseStats.nonCompliant}</div>
                        <div className="text-[10px] text-text-muted">properties</div>
                      </div>
                    )}
                    {caseStats.expiring > 0 && (
                      <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg p-3">
                        <div className="text-xs text-status-warning uppercase tracking-wider">Expiring</div>
                        <div className="text-xl font-bold text-status-warning">{caseStats.expiring}</div>
                        <div className="text-[10px] text-text-muted">compliance certs</div>
                      </div>
                    )}
                    <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
                      <div className="text-xs text-brand-teal uppercase tracking-wider">Complaints</div>
                      <div className="text-xl font-bold text-text-primary">{caseStats.openComplaints}</div>
                      <div className="text-[10px] text-text-muted">open</div>
                    </div>
                    <div className="bg-surface-elevated rounded-lg p-3 border border-border-default">
                      <div className="text-xs text-brand-teal uppercase tracking-wider">In Arrears</div>
                      <div className="text-xl font-bold text-text-primary">{caseStats.tenantsInArrears}</div>
                      <div className="text-[10px] text-text-muted">{formatCurrency(caseStats.totalArrears)}</div>
                    </div>
                    {caseStats.dampCases > 0 && (
                      <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg p-3">
                        <div className="text-xs text-status-warning uppercase tracking-wider">Damp/Mould</div>
                        <div className="text-xl font-bold text-status-warning">{caseStats.dampCases}</div>
                        <div className="text-[10px] text-text-muted">avg risk {caseStats.avgDampRisk}%</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weather & Damp Risk */}
              {weatherRisk && (level === 'region' || level === 'la' || level === 'estate') && (
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                  <h2 className="text-lg font-bold font-heading text-brand-peach mb-3 flex items-center gap-2">
                    <Thermometer size={18} /> Weather & Damp Risk
                  </h2>
                  <div className={`rounded-lg p-4 border ${weatherRisk.dampRiskLevel === 'very-high' || weatherRisk.dampRiskLevel === 'high' ? 'bg-status-critical/5 border-status-critical/20' : 'bg-surface-elevated border-border-default'}`}>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <div className="text-[10px] text-text-muted uppercase">Rainfall 30d</div>
                        <div className="text-sm font-bold text-text-primary">{weatherRisk.rainfallMm30Day}mm</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-text-muted uppercase">Humidity</div>
                        <div className="text-sm font-bold text-text-primary">{weatherRisk.avgHumidity}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-text-muted uppercase">Temp</div>
                        <div className="text-sm font-bold text-text-primary">{weatherRisk.avgTemp}°C</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        weatherRisk.dampRiskLevel === 'very-high' ? 'bg-status-critical/20 text-status-critical' :
                        weatherRisk.dampRiskLevel === 'high' ? 'bg-status-warning/20 text-status-warning' :
                        'bg-brand-teal/20 text-brand-teal'
                      }`}>{weatherRisk.dampRiskLevel} damp risk</span>
                      <span className="text-[10px] text-text-muted">Condensation: {weatherRisk.condensationRisk}</span>
                    </div>
                    {weatherRisk.forecast7Day.length > 0 && (
                      <div className="mt-3 flex gap-1">
                        {weatherRisk.forecast7Day.slice(0, 7).map((d, i) => (
                          <div key={i} className="flex-1 text-center">
                            <div className="text-[9px] text-text-muted">{d.date.slice(0, 5)}</div>
                            <div className={`h-${Math.max(1, Math.round(d.rainfall / 3))} bg-brand-blue/40 rounded-t mt-1 min-h-[4px]`} style={{ height: Math.max(4, d.rainfall * 1.5) + 'px' }} />
                            <div className="text-[9px] text-text-muted">{d.rainfall}mm</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Area Intelligence (LA level and above) */}
              {areaIntel && (level === 'la' || level === 'region') && (
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
                  <h2 className="text-lg font-bold font-heading text-brand-peach mb-3 flex items-center gap-2">
                    <Shield size={18} /> Area Intelligence
                  </h2>
                  
                  {/* Risk Factors */}
                  {areaIntel.intelligence.riskFactors.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs uppercase tracking-wider text-text-muted mb-2">Risk Factors</div>
                      <div className="space-y-2">
                        {areaIntel.intelligence.riskFactors.slice(0, 3).map((rf, i) => (
                          <div key={i} className={`flex items-start gap-2 rounded-lg p-2 text-xs ${
                            rf.severity === 'high' ? 'bg-status-critical/10 border border-status-critical/20' :
                            rf.severity === 'medium' ? 'bg-status-warning/10 border border-status-warning/20' :
                            'bg-surface-elevated border border-border-default'
                          }`}>
                            <AlertTriangle size={14} className={`mt-0.5 flex-shrink-0 ${rf.severity === 'high' ? 'text-status-critical' : rf.severity === 'medium' ? 'text-status-warning' : 'text-text-muted'}`} />
                            <div>
                              <div className="font-semibold text-text-primary">{rf.factor}</div>
                              <div className="text-text-muted mt-0.5">{rf.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regulatory Alerts */}
                  {areaIntel.intelligence.regulatoryAlerts.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs uppercase tracking-wider text-text-muted mb-2">Regulatory Alerts</div>
                      <div className="space-y-2">
                        {areaIntel.intelligence.regulatoryAlerts.slice(0, 2).map((ra, i) => (
                          <div key={i} className="bg-brand-garnet/10 border border-brand-garnet/20 rounded-lg p-2 text-xs">
                            <div className="font-semibold text-brand-peach">{ra.alert}</div>
                            <div className="text-text-muted mt-0.5">Deadline: {typeof ra.deadline === 'object' ? String(ra.deadline) : ra.deadline} | Impact: {ra.impact}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Benchmarks */}
                  {areaIntel.intelligence.benchmarks.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs uppercase tracking-wider text-text-muted mb-2">Performance vs Sector</div>
                      <div className="space-y-2">
                        {areaIntel.intelligence.benchmarks.slice(0, 4).map((b, i) => {
                          const isGood = b.metric.includes('collection') || b.metric.includes('satisfaction') || b.metric.includes('compliance')
                            ? b.ourValue >= b.sectorAverage
                            : b.ourValue <= b.sectorAverage;
                          return (
                            <div key={i} className="bg-surface-elevated rounded-lg p-2 border border-border-default text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-text-muted capitalize">{b.metric}</span>
                                <span className={`font-bold ${isGood ? 'text-status-compliant' : 'text-status-critical'}`}>
                                  {b.ourValue}{b.metric.includes('rate') || b.metric.includes('satisfaction') || b.metric.includes('compliance') ? '%' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-surface-dark rounded-full h-1.5 overflow-hidden">
                                  <div className={`h-full rounded-full ${isGood ? 'bg-status-compliant' : 'bg-status-critical'}`} 
                                    style={{ width: `${Math.min(100, (b.ourValue / (b.topQuartile * 1.2)) * 100)}%` }} />
                                </div>
                                <span className="text-[9px] text-text-muted">Sector avg: {b.sectorAverage}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Historical Trends mini chart */}
                  {areaIntel.intelligence.historicalTrends.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-text-muted mb-2">12-Month Trends</div>
                      {areaIntel.intelligence.historicalTrends.slice(0, 2).map((trend, ti) => {
                        const vals = trend.values.map(v => v.value);
                        const max = Math.max(...vals);
                        const min = Math.min(...vals);
                        const range = max - min || 1;
                        const latest = vals[vals.length - 1];
                        const first = vals[0];
                        const improving = trend.metric.includes('collection') || trend.metric.includes('satisfaction')
                          ? latest > first : latest < first;
                        return (
                          <div key={ti} className="bg-surface-elevated rounded-lg p-2 border border-border-default mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-text-muted capitalize">{trend.metric}</span>
                              <span className="flex items-center gap-1 text-xs">
                                {improving ? <TrendingUp size={12} className="text-status-compliant" /> : <TrendingDown size={12} className="text-status-critical" />}
                                <span className={improving ? 'text-status-compliant' : 'text-status-critical'}>
                                  {latest}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-end gap-px h-8">
                              {vals.map((v, vi) => (
                                <div key={vi} className="flex-1 bg-brand-teal/40 rounded-t" 
                                  style={{ height: `${((v - min) / range) * 100}%`, minHeight: '2px' }} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* IMD & Housing Market */}
                  {areaIntel.imd && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="bg-surface-elevated rounded-lg p-2 border border-border-default">
                        <div className="text-[10px] text-text-muted uppercase">IMD Decile</div>
                        <div className={`text-lg font-bold ${areaIntel.imd.imdDecile <= 3 ? 'text-status-critical' : areaIntel.imd.imdDecile <= 5 ? 'text-status-warning' : 'text-status-compliant'}`}>
                          {areaIntel.imd.imdDecile}/10
                        </div>
                        <div className="text-[9px] text-text-muted">{areaIntel.imd.imdDecile <= 3 ? 'Most deprived' : areaIntel.imd.imdDecile <= 5 ? 'Above average' : 'Below average'}</div>
                      </div>
                      <div className="bg-surface-elevated rounded-lg p-2 border border-border-default">
                        <div className="text-[10px] text-text-muted uppercase">Child Poverty</div>
                        <div className="text-lg font-bold text-text-primary">{areaIntel.imd.childPoverty}%</div>
                        <div className="text-[9px] text-text-muted">of children</div>
                      </div>
                      <div className="bg-surface-elevated rounded-lg p-2 border border-border-default">
                        <div className="text-[10px] text-text-muted uppercase">Avg House Price</div>
                        <div className="text-lg font-bold text-text-primary">{formatCurrency(areaIntel.market.averageHousePrice)}</div>
                        <div className="text-[9px] text-text-muted">{areaIntel.market.annualPriceChange > 0 ? '+' : ''}{areaIntel.market.annualPriceChange}% yr</div>
                      </div>
                      <div className="bg-surface-elevated rounded-lg p-2 border border-border-default">
                        <div className="text-[10px] text-text-muted uppercase">Housing Waitlist</div>
                        <div className="text-lg font-bold text-text-primary">{formatNumber(areaIntel.market.socialHousingWaitlist)}</div>
                        <div className="text-[9px] text-text-muted">households</div>
                      </div>
                    </div>
                  )}

                  {/* Opportunities */}
                  {areaIntel.intelligence.opportunities.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs uppercase tracking-wider text-text-muted mb-2">Opportunities</div>
                      {areaIntel.intelligence.opportunities.slice(0, 2).map((opp, i) => (
                        <div key={i} className="bg-status-compliant/5 border border-status-compliant/20 rounded-lg p-2 text-xs mb-2">
                          <div className="text-status-compliant font-semibold">{opp.description}</div>
                          <div className="text-text-muted mt-0.5">Potential saving: {opp.potentialSaving}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Links */}
              {level === 'unit' && selectedId && (
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                  <button 
                    onClick={() => navigate(`/properties/${selectedId}`)} 
                    className="w-full bg-brand-teal/10 hover:bg-brand-teal/20 border border-brand-teal/30 rounded-lg p-4 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-brand-teal">View Full Property Detail</div>
                        <div className="text-xs text-text-muted mt-1">Compliance, cases, documents, AI analysis</div>
                      </div>
                      <ExternalLink size={16} className="text-brand-teal" />
                    </div>
                  </button>
                </div>
              )}

              {level === 'tenant' && selectedId && (
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                  <div className="space-y-2">
                    <button 
                      onClick={() => navigate(`/tenancies/${selectedId}`)} 
                      className="w-full bg-brand-teal/10 hover:bg-brand-teal/20 border border-brand-teal/30 rounded-lg p-4 text-left transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-brand-teal">View Full Tenancy Detail</div>
                          <div className="text-xs text-text-muted mt-1">Rent account, cases, communications, AI actions</div>
                        </div>
                        <ExternalLink size={16} className="text-brand-teal" />
                      </div>
                    </button>
                    {entity.property && (
                      <button 
                        onClick={() => navigate(`/properties/${entity.property?.id}`)} 
                        className="w-full bg-surface-elevated hover:bg-surface-hover border border-border-default rounded-lg p-3 text-left transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-text-primary">View Property</div>
                            <div className="text-xs text-text-muted">{entity.property.address}</div>
                          </div>
                          <ExternalLink size={14} className="text-text-muted" />
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Data Sources Attribution */}
              {(level === 'la' || level === 'region') && areaIntel && (
                <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
                  <div className="rounded-lg p-3 bg-surface-elevated/30 border border-border-default">
                    <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1">Data Sources</div>
                    <div className="text-[9px] text-text-muted space-y-0.5">
                      <div>EPC Register — epc.opendatacommunities.org</div>
                      <div>IMD 2019 — MHCLG Open Data</div>
                      <div>Housing Market — data.london.gov.uk</div>
                      <div>Weather — Met Office Open Data</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-text-muted">Loading...</div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="px-6 py-3 bg-surface-card border-t border-border-default flex items-center justify-between">
        <div className="text-sm text-text-muted">
          {level === 'country' && `Showing ${regions.length} regions`}
          {level === 'region' && selectedId && `Showing ${localAuthorities.filter(la => la.regionId === selectedId).length} local authorities`}
          {level === 'la' && selectedId && `Showing ${estates.filter(e => e.localAuthorityId === selectedId).length} estates`}
          {level === 'estate' && selectedId && `Showing ${blocks.filter(b => b.estateId === selectedId).length} blocks`}
          {level === 'block' && selectedId && `Showing ${properties.filter(p => p.blockId === selectedId).length} units`}
          {level === 'unit' && 'Unit detail view'}
          {level === 'tenant' && 'Tenant detail view'}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-brand-teal text-white'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover'
            }`}
          >
            <MapIcon size={16} className="inline mr-2" />
            Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-brand-teal text-white'
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover'
            }`}
          >
            <List size={16} className="inline mr-2" />
            List
          </button>
        </div>
      </div>
    </div>
  );
}
