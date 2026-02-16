import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icon issue with bundlers (Vite/Webpack)
// The default icon paths reference files that don't exist in bundled output
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface PropertyMapProps {
  lat: number;
  lng: number;
  address: string;
  postcode?: string;
  zoom?: number;
  height?: string;
  className?: string;
}

export default function PropertyMap({ lat, lng, address, postcode, zoom = 15, height = '300px', className = '' }: PropertyMapProps) {
  if (!lat || !lng) {
    return (
      <div className={`bg-surface-elevated rounded-lg flex items-center justify-center text-text-muted text-sm ${className}`} style={{ height }}>
        Location data not available
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <strong>{address}</strong>
            {postcode && <br />}
            {postcode}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
