import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Navigation, Star, Bed, AlertCircle, ExternalLink } from 'lucide-react';

// Custom SVG Icons for Leaflet markers
const createCustomIcon = (isEmergency, isSelected = false) => {
  const color = isSelected ? '#FFFFFF' : isEmergency ? '#E53935' : '#EF4444';
  const bgColor = isSelected ? '#E53935' : '#171717';
  const size = isSelected ? 42 : 34;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${bgColor}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3" fill="${color}"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const userIcon = L.divIcon({
  html: `
    <div style="position: relative; width: 22px; height: 22px;">
      <div style="position: absolute; inset: 0; background: #3B82F6; opacity: 0.4; border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; width: 22px; height: 22px; background: #3B82F6; border: 3px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>
    </div>
  `,
  className: 'user-location-marker',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Map controller to adjust bounds dynamically
const MapController = ({ center, hospitals, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 13);
      return;
    }

    if (hospitals && hospitals.length > 0) {
      const validPoints = hospitals
        .filter((h) => h.location?.coordinates?.length === 2)
        .map((h) => [h.location.coordinates[1], h.location.coordinates[0]]);

      if (validPoints.length > 0) {
        if (validPoints.length === 1) {
          map.setView(validPoints[0], 14);
        } else {
          const bounds = L.latLngBounds(validPoints);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      }
    } else if (center) {
      map.setView(center, 12);
    }
  }, [hospitals, userLocation, map, center]);

  return null;
};

export const HospitalMap = ({
  hospitals = [],
  center = [17.3850, 78.4867], // Default Hyderabad metro center
  zoom = 12,
  userLocation = null,
  selectedHospitalId = null,
  onMarkerClick = null,
  height = '500px',
}) => {
  return (
    <div
      style={{ height }}
      className="w-full rounded-2xl overflow-hidden border border-[#303030] shadow-xl relative z-0"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Dark Theme Tile Layer (CartoDB Dark Matter) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <MapController center={center} hospitals={hospitals} userLocation={userLocation} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-xs p-1">
                <p className="font-bold text-blue-400">Your Current Location</p>
                <p className="text-text-secondary text-[10px]">Accurate geolocation enabled</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Hospital Markers */}
        {hospitals.map((hospital) => {
          const coords = hospital.location?.coordinates;
          if (!coords || coords.length !== 2) return null;
          const [lng, lat] = coords;
          const isSelected = selectedHospitalId === hospital._id;
          const icon = createCustomIcon(hospital.hasEmergency, isSelected);

          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

          return (
            <Marker
              key={hospital._id}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) onMarkerClick(hospital);
                },
              }}
            >
              <Popup>
                <div className="w-56 p-1 space-y-2 text-white">
                  <div className="h-24 w-full rounded-lg overflow-hidden bg-black/50">
                    <img
                      src={
                        hospital.images?.[0] ||
                        'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={hospital.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white line-clamp-1">{hospital.name}</h4>
                    <p className="text-[10px] text-text-secondary line-clamp-1">
                      {hospital.locality ? `${hospital.locality}, ` : ''}{hospital.city}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#303030]">
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {hospital.rating?.toFixed(1) || '4.5'}
                    </span>
                    {hospital.bedInventory && (
                      <span className="text-emerald-400 font-semibold text-[10px]">
                        {hospital.bedInventory.availableBeds} beds avail.
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <Link
                      to={`/hospitals/${hospital._id}`}
                      className="py-1 px-2 rounded bg-[#202020] text-center text-[10px] text-white hover:text-red-400 border border-[#303030]"
                    >
                      Details
                    </Link>
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1 px-2 rounded bg-red-600 text-center text-[10px] text-white font-bold flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-2.5 h-2.5 fill-white" />
                      Route
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default HospitalMap;
