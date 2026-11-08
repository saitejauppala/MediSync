import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Star,
  Bed,
  Navigation,
  Scale,
  Heart,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Badge, VerifiedBadge, EmergencyBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';

export const HospitalCard = ({ hospital, onSelectOnMap = null }) => {
  const { toggleSaveHospital, isHospitalSaved } = useAuth();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const isSaved = isHospitalSaved(hospital._id);
  const inCompare = isInCompare(hospital._id);

  const [lng, lat] = hospital.location?.coordinates || [78.4867, 17.3850];
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  const bedInfo = hospital.bedInventory;
  const occupancyRate = bedInfo && bedInfo.totalBeds > 0
    ? Math.round((bedInfo.occupiedBeds / bedInfo.totalBeds) * 100)
    : null;

  const handleCompareClick = (e) => {
    e.preventDefault();
    if (inCompare) {
      removeFromCompare(hospital._id);
    } else {
      addToCompare(hospital);
    }
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();
    await toggleSaveHospital(hospital._id);
  };

  return (
    <div className="group relative bg-[#171717] hover:bg-[#1c1c1c] border border-[#303030] hover:border-red-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-red-500/5 flex flex-col justify-between">
      <div>
        {/* Hospital Image & Top Badges */}
        <div className="relative h-48 w-full overflow-hidden bg-[#111111]">
          <img
            src={
              hospital.images?.[0] ||
              'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80'
            }
            alt={hospital.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-black/40 to-transparent" />

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {hospital.isVerified && <VerifiedBadge />}
            {hospital.hasEmergency && <EmergencyBadge />}
          </div>

          {/* Bookmark & Compare Quick Actions */}
          <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10">
            <button
              onClick={handleCompareClick}
              title={inCompare ? 'Remove from compare' : 'Add to compare'}
              className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                inCompare
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                  : 'bg-black/60 hover:bg-black/90 text-white border border-white/10'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSaveClick}
              title={isSaved ? 'Remove from saved' : 'Save hospital'}
              className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                isSaved
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                  : 'bg-black/60 hover:bg-black/90 text-white border border-white/10'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Distance Indicator if available */}
          {hospital.distance !== undefined && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-1">
              <Navigation className="w-3 h-3 text-red-500 fill-red-500" />
              <span>{hospital.distance} km away</span>
            </div>
          )}

          {/* Hospital Type */}
          <div className="absolute bottom-3 left-3">
            <Badge variant={hospital.type === 'Government' ? 'govt' : 'private'}>
              {hospital.type}
            </Badge>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <Link to={`/hospitals/${hospital._id}`}>
                <h3 className="text-base font-bold text-white hover:text-red-400 transition-colors line-clamp-1">
                  {hospital.name}
                </h3>
              </Link>
              <div className="flex items-center gap-1 bg-[#202020] px-2 py-0.5 rounded-md text-xs font-semibold text-amber-400 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{hospital.rating?.toFixed(1) || '4.5'}</span>
                <span className="text-text-secondary text-[10px]">({hospital.reviewCount || 0})</span>
              </div>
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>
                {hospital.locality ? `${hospital.locality}, ` : ''}{hospital.city} • {hospital.pincode}
              </span>
            </p>
          </div>

          {/* Specialities preview */}
          {hospital.specialities && hospital.specialities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hospital.specialities.slice(0, 3).map((spec, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] bg-[#202020] text-zinc-300 border border-[#303030]"
                >
                  {spec}
                </span>
              ))}
              {hospital.specialities.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md text-[11px] text-text-secondary">
                  +{hospital.specialities.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Live Bed Inventory Snapshot */}
          {bedInfo && (
            <div className="p-2.5 rounded-xl bg-[#111111] border border-[#262626] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-red-400" /> Bed Availability:
                </span>
                <span className="font-bold text-white">
                  <span className="text-emerald-400">{bedInfo.availableBeds}</span>
                  <span className="text-text-secondary font-normal"> / {bedInfo.totalBeds} available</span>
                </span>
              </div>
              {occupancyRate !== null && (
                <div className="w-full bg-[#202020] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      occupancyRate > 90 ? 'bg-red-500' : occupancyRate > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="p-5 pt-0 grid grid-cols-2 gap-2">
        <Link
          to={`/hospitals/${hospital._id}`}
          className="w-full py-2 px-3 rounded-lg bg-[#202020] hover:bg-[#282828] text-white text-xs font-semibold text-center border border-[#303030] hover:border-red-500/40 transition-colors"
        >
          View Details
        </Link>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold text-center flex items-center justify-center gap-1 transition-colors shadow-sm shadow-red-500/20"
        >
          <Navigation className="w-3 h-3 fill-white" />
          Directions
        </a>
      </div>
    </div>
  );
};

export default HospitalCard;
