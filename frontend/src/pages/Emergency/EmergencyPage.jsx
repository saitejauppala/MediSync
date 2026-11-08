import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  PhoneCall,
  Navigation,
  MapPin,
  HeartPulse,
  Activity,
  Bed,
  ShieldAlert,
  Clock,
  Compass,
  Building2,
  ExternalLink,
} from 'lucide-react';
import hospitalService from '../../services/hospitalService';
import HospitalMap from '../../components/maps/HospitalMap';
import Button from '../../components/common/Button';

export const EmergencyPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Emergency feature filters
  const [bloodBankOnly, setBloodBankOnly] = useState(false);
  const [cardiacOnly, setCardiacOnly] = useState(false);
  const [traumaOnly, setTraumaOnly] = useState(false);

  const fetchEmergencyHospitals = async (coords = null) => {
    setLoading(true);
    try {
      const params = {
        maxDistance: 35,
        bloodBankOnly: bloodBankOnly ? 'true' : undefined,
        cardiacOnly: cardiacOnly ? 'true' : undefined,
        traumaOnly: traumaOnly ? 'true' : undefined,
      };

      if (coords) {
        params.longitude = coords.longitude;
        params.latitude = coords.latitude;
      }

      const res = await hospitalService.getNearbyEmergency(params);
      if (res.success) {
        setHospitals(res.hospitals);
      }
    } catch (err) {
      console.error('Failed to fetch emergency hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyHospitals(userLocation);
  }, [userLocation, bloodBankOnly, cardiacOnly, traumaOnly]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(coords);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white pb-20">
      {/* High-priority Emergency Disclaimer Banner */}
      <div className="bg-red-600 text-white py-4 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-wide uppercase">
                Life-Threatening Emergency Notice
              </h2>
              <p className="text-xs text-red-100 max-w-2xl">
                MediSync is a navigation discovery directory and does not dispatch emergency paramedics. If a patient is unconscious, unresponsive, or experiencing acute chest pain, dial national emergency hotlines directly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:112"
              className="px-4 py-2 rounded-xl bg-white text-red-600 font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:bg-red-50 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Dial 112 (National)
            </a>
            <a
              href="tel:108"
              className="px-4 py-2 rounded-xl bg-red-950 text-white font-extrabold text-xs flex items-center gap-1.5 border border-red-400 hover:bg-red-900 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Dial 108 (Ambulance)
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Controls row */}
        <div className="bg-[#171717] border border-red-900/60 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950 text-red-400 text-xs font-bold border border-red-900 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>24/7 Verified Trauma Facilities</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Nearby Emergency Hospital Finder
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Find immediate trauma centers, 24/7 ICUs, blood banks, and ambulance fleets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={userLocation ? 'primary' : 'secondary'}
              size="md"
              icon={Navigation}
              loading={geoLoading}
              onClick={detectLocation}
              className={userLocation ? 'bg-red-600 text-white' : ''}
            >
              {userLocation ? 'GPS Tracking Active' : 'Sort by Nearest (GPS)'}
            </Button>
          </div>
        </div>

        {/* Emergency Filters Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-secondary font-medium mr-2">Quick Filter:</span>
          <button
            onClick={() => setBloodBankOnly(!bloodBankOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              bloodBankOnly
                ? 'bg-red-500 border-red-500 text-white'
                : 'bg-[#171717] border-[#303030] text-text-secondary hover:text-white'
            }`}
          >
            Blood Bank Available
          </button>
          <button
            onClick={() => setCardiacOnly(!cardiacOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              cardiacOnly
                ? 'bg-red-500 border-red-500 text-white'
                : 'bg-[#171717] border-[#303030] text-text-secondary hover:text-white'
            }`}
          >
            Cardiac Emergency Suite
          </button>
          <button
            onClick={() => setTraumaOnly(!traumaOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              traumaOnly
                ? 'bg-red-500 border-red-500 text-white'
                : 'bg-[#171717] border-[#303030] text-text-secondary hover:text-white'
            }`}
          >
            Level 1 Trauma Comprehensive
          </button>
        </div>

        {/* Emergency Map & List Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Emergency Hospitals List */}
          <div className="lg:col-span-7 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-[#171717] border border-[#303030] animate-pulse" />
                ))}
              </div>
            ) : hospitals.length === 0 ? (
              <div className="p-8 text-center bg-[#171717] rounded-2xl border border-[#303030]">
                <ShieldAlert className="w-12 h-12 text-red-500/40 mx-auto mb-2" />
                <h3 className="text-base font-bold text-white">No Emergency Centers Match Filters</h3>
                <p className="text-xs text-text-secondary mt-1">Try relaxing filter constraints.</p>
              </div>
            ) : (
              hospitals.map((hospital) => {
                const em = hospital.emergencyDetails;
                const [lng, lat] = hospital.location?.coordinates || [78.4867, 17.3850];
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

                return (
                  <div
                    key={hospital._id}
                    className="p-5 rounded-2xl bg-[#171717] hover:bg-[#1b1b1b] border border-red-900/40 hover:border-red-500 rounded-2xl space-y-4 transition-all shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                          <Link to={`/hospitals/${hospital._id}`}>
                            <h3 className="text-base font-extrabold text-white hover:text-red-400 transition-colors">
                              {hospital.name}
                            </h3>
                          </Link>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{hospital.locality ? `${hospital.locality}, ` : ''}{hospital.city}</span>
                          {hospital.distance !== undefined && (
                            <strong className="text-white ml-2">({hospital.distance} km away)</strong>
                          )}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-900 shrink-0">
                        {em?.traumaLevel || 'Level 1 Trauma'}
                      </span>
                    </div>

                    {/* Emergency tags row */}
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {em?.bloodBankAvailable && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-900">
                          Blood Bank Ready
                        </span>
                      )}
                      {em?.cardiacEmergencyReady && (
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-semibold border border-red-900">
                          Cath Lab / Cardiac Unit
                        </span>
                      )}
                      {em?.strokeCenterReady && (
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-semibold border border-blue-900">
                          Dedicated Stroke Center
                        </span>
                      )}
                      {hospital.bedInventory && (
                        <span className="px-2 py-0.5 rounded bg-[#202020] text-zinc-300 border border-[#303030]">
                          <strong className="text-emerald-400">{hospital.bedInventory.availableBeds}</strong> beds available
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#262626]">
                      <a
                        href={`tel:${em?.directEmergencyHotline || hospital.emergencyPhone || hospital.phone}`}
                        className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs text-center flex items-center justify-center gap-2 transition-colors shadow-md shadow-red-500/30"
                      >
                        <PhoneCall className="w-4 h-4 animate-bounce" />
                        Call Emergency Desk ({em?.directEmergencyHotline || hospital.emergencyPhone || hospital.phone})
                      </a>
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-4 rounded-xl bg-[#202020] hover:bg-[#282828] text-white font-semibold text-xs text-center flex items-center justify-center gap-1.5 border border-[#303030] transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                        Turn-by-turn Navigation
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Interactive Emergency Map */}
          <div className="lg:col-span-5 h-[500px] lg:h-[750px] sticky top-24">
            <HospitalMap
              hospitals={hospitals}
              userLocation={userLocation}
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPage;
