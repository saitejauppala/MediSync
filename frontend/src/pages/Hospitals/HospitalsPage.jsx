import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  Navigation,
  Map as MapIcon,
  List as ListIcon,
  AlertTriangle,
  RefreshCw,
  Building2,
  X,
  Compass,
} from 'lucide-react';
import hospitalService from '../../services/hospitalService';
import HospitalCard from '../../components/hospitals/HospitalCard';
import HospitalMap from '../../components/maps/HospitalMap';
import Button from '../../components/common/Button';

const SPECIALITIES_OPTIONS = [
  'All',
  'Cardiology',
  'Neurology',
  'Orthopaedics',
  'Paediatrics',
  'Dermatology',
  'Oncology',
  'Gynaecology',
  'General Medicine',
  'Ophthalmology',
  'ENT',
  'Dentistry',
  'Urology',
];

export const HospitalsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [selectedSpeciality, setSelectedSpeciality] = useState(searchParams.get('speciality') || 'All');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'All');
  const [emergencyOnly, setEmergencyOnly] = useState(searchParams.get('emergency') === 'true');
  const [is24x7Only, setIs24x7Only] = useState(searchParams.get('is24x7') === 'true');
  const [distanceKm, setDistanceKm] = useState(25);
  const [sortBy, setSortBy] = useState('rating');

  // Geolocation state
  const [userCoords, setUserCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // View state: 'split' | 'list' | 'map'
  const [viewMode, setViewMode] = useState('split');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Data states
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detect location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserCoords(coords);
        setGeoLoading(false);
      },
      (error) => {
        setGeoLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Enter your city or PIN manually.');
        } else {
          setGeoError('Unable to retrieve location coordinates. Enter city manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Fetch hospitals based on active parameters
  const loadHospitals = async () => {
    setLoading(true);
    try {
      if (userCoords) {
        // Geospatial Nearby API call
        const res = await hospitalService.getNearbyHospitals({
          longitude: userCoords.longitude,
          latitude: userCoords.latitude,
          maxDistance: distanceKm,
          emergency: emergencyOnly ? 'true' : undefined,
          type: selectedType !== 'All' ? selectedType : undefined,
          speciality: selectedSpeciality !== 'All' ? selectedSpeciality : undefined,
        });

        if (res.success) {
          setHospitals(res.hospitals);
          setTotal(res.count);
          setTotalPages(1);
        }
      } else {
        // Standard Filter API call
        const res = await hospitalService.getHospitals({
          search: search || undefined,
          city: city || undefined,
          type: selectedType !== 'All' ? selectedType : undefined,
          speciality: selectedSpeciality !== 'All' ? selectedSpeciality : undefined,
          emergency: emergencyOnly ? 'true' : undefined,
          is24x7: is24x7Only ? 'true' : undefined,
          page,
          limit: 12,
          sortBy,
        });

        if (res.success) {
          setHospitals(res.hospitals);
          setTotal(res.total);
          setTotalPages(res.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, [userCoords, distanceKm, selectedSpeciality, selectedType, emergencyOnly, is24x7Only, sortBy, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadHospitals();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCity('');
    setSelectedSpeciality('All');
    setSelectedType('All');
    setEmergencyOnly(false);
    setIs24x7Only(false);
    setUserCoords(null);
    setGeoError('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      {/* Top Search & Filter Bar */}
      <div className="bg-[#111111] border-b border-[#303030] sticky top-16 z-30 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Main search form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 w-full flex items-center gap-2 bg-[#171717] border border-[#303030] rounded-xl px-3 py-1.5 focus-within:border-red-500 transition-colors"
          >
            <Search className="w-4 h-4 text-red-500 shrink-0" />
            <input
              type="text"
              placeholder="Search by hospital name, locality, or PIN code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-white text-xs sm:text-sm w-full focus:outline-none placeholder-text-secondary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-text-secondary hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Location button & view mode controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={handleDetectLocation}
              disabled={geoLoading}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                userCoords
                  ? 'bg-red-950/80 border-red-500 text-white shadow-md shadow-red-500/20'
                  : 'bg-[#171717] border-[#303030] text-text-secondary hover:text-white hover:bg-[#202020]'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : 'text-red-500'}`} />
              <span>{userCoords ? 'GPS Location Active' : 'Detect My Location'}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#171717] border border-[#303030] rounded-xl p-1">
              <button
                onClick={() => setViewMode('split')}
                title="Split Map & List"
                className={`p-1.5 rounded-lg text-xs transition-colors hidden lg:block ${
                  viewMode === 'split' ? 'bg-red-500 text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-red-500 text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                title="Map View"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'map' ? 'bg-red-500 text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#171717] border border-[#303030] text-text-secondary hover:text-white"
            >
              <SlidersHorizontal className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Geolocation feedback note */}
        {geoError && (
          <div className="max-w-7xl mx-auto mt-2 text-xs text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{geoError}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <div className={`space-y-6 ${mobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-[#171717] border border-[#303030] rounded-2xl p-5 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-red-500" />
                  Filter Facilities
                </h3>
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
                >
                  Reset All
                </button>
              </div>

              {/* GPS Radius Slider (When location enabled) */}
              {userCoords && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white">Search Radius</span>
                    <span className="text-red-400">{distanceKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(parseInt(e.target.value, 10))}
                    className="w-full accent-red-500 bg-[#303030] h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-text-secondary">
                    <span>5 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                  </div>
                </div>
              )}

              {/* Hospital Ownership Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white block">Facility Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['All', 'Private', 'Government'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`py-1.5 px-2 text-xs rounded-lg border font-medium transition-all ${
                        selectedType === type
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'bg-[#202020] border-[#303030] text-text-secondary hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speciality Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white block">Medical Speciality</label>
                <select
                  value={selectedSpeciality}
                  onChange={(e) => setSelectedSpeciality(e.target.value)}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  {SPECIALITIES_OPTIONS.map((spec) => (
                    <option key={spec} value={spec} className="bg-[#171717] text-white">
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Filters */}
              <div className="space-y-3 pt-3 border-t border-[#303030]">
                <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    24/7 Emergency Care Only
                  </span>
                  <input
                    type="checkbox"
                    checked={emergencyOnly}
                    onChange={(e) => setEmergencyOnly(e.target.checked)}
                    className="accent-red-500 w-4 h-4 rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                  <span className="text-white font-medium">Open 24x7 Facility</span>
                  <input
                    type="checkbox"
                    checked={is24x7Only}
                    onChange={(e) => setIs24x7Only(e.target.checked)}
                    className="accent-red-500 w-4 h-4 rounded"
                  />
                </label>
              </div>

              {/* Sort By */}
              <div className="space-y-2 pt-3 border-t border-[#303030]">
                <label className="text-xs font-semibold text-white block">Sort Results</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="rating">Highest Patient Rating</option>
                  <option value="name">Alphabetical (A - Z)</option>
                  <option value="recent">Recently Added</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className={`${mobileFilterOpen ? 'hidden' : 'block'} ${viewMode === 'map' ? 'lg:col-span-3' : viewMode === 'list' ? 'lg:col-span-3' : 'lg:col-span-3'}`}>
            {/* Header info */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Available Hospitals
                </h2>
                <p className="text-xs text-text-secondary">
                  Showing {hospitals.length} {userCoords ? `within ${distanceKm} km` : 'verified medical facilities'}
                </p>
              </div>
            </div>

            {/* Split View (Cards on Left/Top, Interactive Map on Right/Bottom) */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Cards Column */}
                <div className="xl:col-span-7 space-y-4 max-h-[800px] overflow-y-auto pr-1">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-44 rounded-2xl bg-[#171717] border border-[#303030] animate-pulse" />
                      ))}
                    </div>
                  ) : hospitals.length === 0 ? (
                    <div className="text-center py-16 bg-[#171717] rounded-2xl border border-[#303030] p-8">
                      <Building2 className="w-12 h-12 text-red-500/40 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-white">No Hospitals Match Filters</h3>
                      <p className="text-xs text-text-secondary mt-1">
                        Try expanding your distance radius or resetting your medical speciality filter.
                      </p>
                      <Button variant="secondary" size="sm" onClick={handleClearFilters} className="mt-4">
                        Reset Filters
                      </Button>
                    </div>
                  ) : (
                    hospitals.map((hospital) => (
                      <div
                        key={hospital._id}
                        onMouseEnter={() => setSelectedHospitalId(hospital._id)}
                      >
                        <HospitalCard hospital={hospital} />
                      </div>
                    ))
                  )}
                </div>

                {/* Map Column */}
                <div className="xl:col-span-5 h-[400px] xl:h-[800px] sticky top-36">
                  <HospitalMap
                    hospitals={hospitals}
                    userLocation={userCoords}
                    selectedHospitalId={selectedHospitalId}
                    height="100%"
                  />
                </div>
              </div>
            )}

            {/* Full List View */}
            {viewMode === 'list' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hospitals.map((hospital) => (
                  <HospitalCard key={hospital._id} hospital={hospital} />
                ))}
              </div>
            )}

            {/* Full Map View */}
            {viewMode === 'map' && (
              <div className="h-[700px] w-full">
                <HospitalMap
                  hospitals={hospitals}
                  userLocation={userCoords}
                  selectedHospitalId={selectedHospitalId}
                  height="100%"
                />
              </div>
            )}

            {/* Pagination */}
            {!userCoords && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#303030] text-xs text-white disabled:opacity-30 hover:bg-[#171717]"
                >
                  Previous
                </button>
                <span className="text-xs text-text-secondary px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#303030] text-xs text-white disabled:opacity-30 hover:bg-[#171717]"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalsPage;
