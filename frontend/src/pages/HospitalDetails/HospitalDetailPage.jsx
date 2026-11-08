import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Clock,
  Globe,
  Mail,
  Star,
  Bed,
  ShieldCheck,
  AlertCircle,
  Navigation,
  Calendar,
  Heart,
  Scale,
  Send,
  CheckCircle2,
  Share2,
  ChevronRight,
  Info,
} from 'lucide-react';
import hospitalService from '../../services/hospitalService';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';
import { VerifiedBadge, EmergencyBadge, Badge } from '../../components/common/Badge';
import HospitalMap from '../../components/maps/HospitalMap';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export const HospitalDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated, toggleSaveHospital, isHospitalSaved } = useAuth();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();
  const notify = useToast();

  const [hospital, setHospital] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Appointment Modal state
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false);
  const [appointmentError, setAppointmentError] = useState('');
  const [appointmentForm, setAppointmentForm] = useState({
    department: '',
    preferredDate: '',
    preferredTime: '10:00 AM',
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    patientAge: '',
    patientGender: 'Male',
    reasonForVisit: '',
  });

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    waitTimeMinutes: 15,
  });

  useEffect(() => {
    const fetchHospitalData = async () => {
      setLoading(true);
      try {
        const res = await hospitalService.getHospitalById(id);
        if (res.success) {
          setHospital(res.hospital);
          if (res.hospital.specialities?.[0]) {
            setAppointmentForm((prev) => ({
              ...prev,
              department: res.hospital.specialities[0],
              patientName: user?.name || '',
              patientEmail: user?.email || '',
              patientPhone: user?.phone || '',
            }));
          }
        }
        // Load reviews
        const revRes = await hospitalService.getHospitalReviews(id);
        if (revRes.success) {
          setReviews(revRes.reviews);
        }
      } catch (err) {
        setError('Hospital profile could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090909] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-text-secondary">Loading verified hospital records...</p>
        </div>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="min-h-screen bg-[#090909] text-white flex items-center justify-center p-4">
        <div className="text-center p-8 bg-[#171717] rounded-2xl border border-[#303030] max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Hospital Not Found</h2>
          <p className="text-xs text-text-secondary mt-1">{error || 'This healthcare facility could not be retrieved.'}</p>
          <Link to="/hospitals">
            <Button variant="primary" size="sm" className="mt-4">
              Return to Discovery
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const coordinates = hospital.location?.coordinates;
  const hasCoordinates = Array.isArray(coordinates)
    && coordinates.length === 2
    && coordinates.every(Number.isFinite);
  const [lng, lat] = hasCoordinates ? coordinates : [80.6480, 16.5062];
  const destination = hasCoordinates
    ? `${lat},${lng}`
    : [hospital.name, hospital.address, hospital.locality, hospital.city, hospital.pincode].filter(Boolean).join(', ');
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  const isSaved = isHospitalSaved(hospital._id);
  const inCompare = isInCompare(hospital._id);
  const bedInfo = hospital.bedInventory;
  const emergencyInfo = hospital.emergencyDetails;
  const isVijayawadaHospital = hospital.city?.toLowerCase() === 'vijayawada';

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAppointmentError('Please log in as a patient to request an appointment.');
      return;
    }
    setAppointmentSubmitting(true);
    setAppointmentError('');
    try {
      const res = await hospitalService.createAppointment({
        hospitalId: hospital._id,
        ...appointmentForm,
      });
      if (res.success) {
        setAppointmentSuccess(true);
        notify(res.message || 'Appointment request submitted successfully. The hospital will confirm it shortly.');
        setTimeout(() => {
          setAppointmentSuccess(false);
          setAppointmentModalOpen(false);
        }, 2500);
      }
    } catch (err) {
      setAppointmentError(err.response?.data?.message || 'Failed to submit appointment request.');
    } finally {
      setAppointmentSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setReviewError('Please log in to submit a patient review.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await hospitalService.addHospitalReview(hospital._id, reviewForm);
      if (res.success) {
        setReviews([res.review, ...reviews]);
        setHospital((prev) => ({
          ...prev,
          rating: res.newAverageRating,
          reviewCount: res.reviewCount,
        }));
        setReviewModalOpen(false);
        setReviewForm({ rating: 5, title: '', comment: '', waitTimeMinutes: 15 });
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white pb-20">
      {/* Hospital Hero Banner */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-[#111111]">
        <img
          src={
            hospital.images?.[0] ||
            'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1200&auto=format&fit=crop&q=80'
          }
          alt={hospital.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-black/60 to-black/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 absolute inset-0 flex flex-col justify-end pb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-3">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/hospitals" className="hover:text-white">Hospitals</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white truncate">{hospital.name}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {hospital.isVerified && <VerifiedBadge />}
            {hospital.dataSource === 'openstreetmap' && (
              <span className="community-source-badge">OpenStreetMap community listing · unverified</span>
            )}
            {hospital.hasEmergency && (
              <EmergencyBadge
                label={hospital.is24x7 ? '24/7 Emergency' : 'Emergency Care'}
              />
            )}
            <Badge variant={hospital.type === 'Government' ? 'govt' : 'private'}>
              {hospital.type === 'Unknown' ? 'Ownership not listed' : `${hospital.type} Healthcare`}
            </Badge>
            {hospital.operatingHours && hospital.operatingHours !== 'Hours not listed' && (
              <Badge variant="default">
                <Clock className="w-3 h-3 text-red-500" />
                {hospital.operatingHours}
              </Badge>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                {hospital.name}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <span>
                  {[hospital.address, hospital.locality, hospital.city, hospital.state, hospital.pincode].filter(Boolean).join(', ')
                    || 'Address not listed'}
                </span>
              </p>
            </div>

            {/* Quick action pill buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => (inCompare ? removeFromCompare(hospital._id) : addToCompare(hospital))}
                className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
                  inCompare
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-[#171717] border-[#303030] text-white hover:bg-[#202020]'
                }`}
                title="Compare"
              >
                <Scale className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleSaveHospital(hospital._id)}
                className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
                  isSaved
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-[#171717] border-[#303030] text-white hover:bg-[#202020]'
                }`}
                title="Save Hospital"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
              </button>
              {hospital.phone && (
                <a
                  href={`tel:${hospital.phone.replace(/[^\d+]/g, '')}`}
                  className="px-4 py-3 rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#303030] text-white text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-red-500" />
                  Call Desk
                </a>
              )}
              {hospital.isVerified && isVijayawadaHospital && (
                <Button
                  variant="primary"
                  size="md"
                  icon={Calendar}
                  onClick={() => setAppointmentModalOpen(true)}
                  className="shadow-lg shadow-red-500/30"
                >
                  Request Appointment
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {hospital.dataSource === 'openstreetmap' && (
          <div className="community-listing-notice mb-6">
            <p>
              This location is sourced from OpenStreetMap and has not been independently verified by MediSync.
              Confirm the address and services with the facility before travelling. Bed availability and appointments are not provided for community listings.
            </p>
            {hospital.sourceReference && (
              <a href={hospital.sourceReference} target="_blank" rel="noopener noreferrer">
                View OpenStreetMap source
              </a>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Center 2 Columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* About / Description */}
            <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-red-500" />
                About {hospital.name}
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {hospital.description || 'Hospital information is not available in this directory listing.'}
              </p>

              {/* Contact meta row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#303030] text-xs">
                {hospital.phone ? <div className="flex items-center gap-2 text-text-secondary">
                  <Phone className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Main: <strong className="text-white">{hospital.phone}</strong></span>
                </div> : <p className="text-text-secondary">Phone number not listed.</p>}
                {hospital.emergencyPhone && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Emergency Hotline: <strong className="text-red-400 font-bold">{hospital.emergencyPhone}</strong></span>
                  </div>
                )}
                {hospital.email && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Email: <span className="text-white">{hospital.email}</span></span>
                  </div>
                )}
                {hospital.website && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Globe className="w-4 h-4 text-red-500 shrink-0" />
                    <a
                      href={hospital.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:underline truncate"
                    >
                      {hospital.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Specialities & Departments */}
            <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Medical Specialities & Clinical Wings</h2>
              <div className="flex flex-wrap gap-2">
                {hospital.specialities?.map((spec, idx) => (
                  <Link
                    key={idx}
                    to={`/hospitals?speciality=${encodeURIComponent(spec)}`}
                    className="px-3 py-1.5 rounded-xl bg-[#202020] hover:bg-red-950/60 border border-[#303030] hover:border-red-500/60 text-xs font-medium text-white transition-colors"
                  >
                    {spec}
                  </Link>
                ))}
              </div>
            </div>

            {/* Available Facilities & Infrastructure */}
            <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Available Infrastructure & Facilities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hospital.facilities?.map((facility, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#202020] border border-[#2a2a2a] flex items-center gap-2 text-xs text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{facility}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient Reviews Section */}
            <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#303030]">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    Patient Reviews ({reviews.length})
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Average rating: <strong className="text-white">
                      {hospital.reviewCount && Number.isFinite(hospital.rating)
                        ? `${hospital.rating.toFixed(1)} / 5.0`
                        : 'Not rated'}
                    </strong>
                  </p>
                </div>
                {hospital.isVerified && isVijayawadaHospital && <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewModalOpen(true)}
                >
                  Write a Review
                </Button>}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-secondary">
                  {hospital.isVerified && isVijayawadaHospital
                    ? 'No verified patient reviews yet. Be the first to share your experience.'
                    : 'Patient reviews are unavailable until this hospital is verified.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-4 rounded-xl bg-[#202020] border border-[#2c2c2c] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{rev.patientName || 'Verified Patient'}</span>
                          {rev.isVerifiedVisit && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 font-semibold border border-emerald-900">
                              Verified Visit
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{rev.rating}</span>
                        </div>
                      </div>
                      <h4 className="font-semibold text-white text-xs">{rev.title}</h4>
                      <p className="text-text-secondary leading-relaxed">{rev.comment}</p>
                      {rev.waitTimeMinutes !== undefined && (
                        <p className="text-[11px] text-zinc-400 pt-1">
                          Reported triage / wait time: <strong className="text-white">{rev.waitTimeMinutes} mins</strong>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Beds & Emergency & Map */}
          <div className="space-y-6">
            {/* Live Bed Inventory Card */}
            {bedInfo && (
              <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bed className="w-4 h-4 text-red-500" />
                    Reported Bed Availability
                  </h3>
                  <span className="text-[10px] text-text-secondary">
                    Updated {new Date(bedInfo.lastUpdated).toLocaleDateString()}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#111111] border border-[#2a2a2a] text-center">
                  <span className="text-3xl font-extrabold text-emerald-400">
                    {bedInfo.availableBeds}
                  </span>
                  <span className="block text-xs text-text-secondary mt-1">
                    Beds Available out of <strong className="text-white">{bedInfo.totalBeds}</strong> total
                  </span>
                </div>

                {/* Sub-breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-[#202020] border border-[#2c2c2c]">
                    <span className="text-xs font-bold text-amber-400">{bedInfo.icuBeds?.available || 0}</span>
                    <span className="block text-[10px] text-text-secondary">ICU Avail.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#202020] border border-[#2c2c2c]">
                    <span className="text-xs font-bold text-blue-400">{bedInfo.oxygenBeds?.available || 0}</span>
                    <span className="block text-[10px] text-text-secondary">Oxygen Beds</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#202020] border border-[#2c2c2c]">
                    <span className="text-xs font-bold text-purple-400">{bedInfo.ventilatorBeds?.available || 0}</span>
                    <span className="block text-[10px] text-text-secondary">Ventilators</span>
                  </div>
                </div>

                <p className="text-[10px] text-text-secondary italic leading-tight pt-2 border-t border-[#303030]">
                  * {bedInfo.disclaimer || 'Hospital-reported bed inventory. Capacity and availability are subject to rapid change. In emergencies, contact the facility directly.'}
                </p>
              </div>
            )}

            {/* Emergency Details Card */}
            {emergencyInfo && (
              <div className="bg-red-950/40 border border-red-900/60 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    24/7 Emergency Readiness
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-600 text-white font-bold">
                    {emergencyInfo.traumaLevel || 'Level 1 Trauma'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-red-900/30">
                    <span className="text-text-secondary">Emergency Hotline:</span>
                    <a href={`tel:${emergencyInfo.directEmergencyHotline}`} className="font-bold text-red-400 hover:underline">
                      {emergencyInfo.directEmergencyHotline}
                    </a>
                  </div>
                  <div className="flex justify-between py-1 border-b border-red-900/30">
                    <span className="text-text-secondary">Direct Ambulance:</span>
                    <a href={`tel:${emergencyInfo.ambulanceNumber}`} className="font-bold text-white hover:underline">
                      {emergencyInfo.ambulanceNumber}
                    </a>
                  </div>
                  <div className="flex justify-between py-1 border-b border-red-900/30">
                    <span className="text-text-secondary">Blood Bank on Premise:</span>
                    <span className="font-semibold text-emerald-400">{emergencyInfo.bloodBankAvailable ? 'Available' : 'No'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-red-900/30">
                    <span className="text-text-secondary">Helipad Ready:</span>
                    <span className="font-semibold text-white">{emergencyInfo.helipadAvailable ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <a
                  href={`tel:${emergencyInfo.directEmergencyHotline}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-red-500/20"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Emergency Room
                </a>
              </div>
            )}

            {/* Interactive Location Map */}
            <div className="bg-[#171717] border border-[#303030] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-red-500" />
                  Facility Location
                </h3>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-red-400 hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>

              <HospitalMap
                hospitals={[hospital]}
                center={[lat, lng]}
                zoom={14}
                height="240px"
              />

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 rounded-xl bg-[#202020] hover:bg-[#282828] text-white text-xs font-semibold text-center flex items-center justify-center gap-1.5 border border-[#303030] transition-colors"
              >
                <Navigation className="w-3 h-3 text-red-500 fill-red-500" />
                Turn-by-turn Navigation
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Request Modal */}
      <Modal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        title={`Request Appointment at ${hospital.name}`}
      >
        {appointmentSuccess ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">Appointment Request Submitted</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Your appointment request has been routed to {hospital.name} administration for confirmation. You can monitor status in your Patient Dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleAppointmentSubmit} className="space-y-4 text-xs">
            {appointmentError && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-900 text-red-300">
                {appointmentError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-secondary mb-1">Select Department *</label>
                <select
                  required
                  value={appointmentForm.department}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, department: e.target.value })}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  {hospital.specialities?.map((dept, i) => (
                    <option key={i} value={dept} className="bg-[#171717]">
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-secondary mb-1">Preferred Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentForm.preferredDate}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, preferredDate: e.target.value })}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-secondary mb-1">Preferred Time Slot *</label>
                <select
                  value={appointmentForm.preferredTime}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, preferredTime: e.target.value })}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="06:00 PM">06:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-text-secondary mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  value={appointmentForm.patientName}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, patientName: e.target.value })}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-secondary mb-1">Patient Phone *</label>
                <input
                  type="tel"
                  required
                  value={appointmentForm.patientPhone}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, patientPhone: e.target.value })}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-text-secondary mb-1">Patient Email *</label>
                <input
                  type="email"
                  required
                  value={appointmentForm.patientEmail}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, patientEmail: e.target.value })}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-text-secondary mb-1">Reason for Visit / Symptoms *</label>
              <textarea
                required
                rows="3"
                value={appointmentForm.reasonForVisit}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, reasonForVisit: e.target.value })}
                placeholder="Briefly state symptoms, prior diagnoses or consultations requested..."
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500 placeholder-zinc-500"
              />
            </div>

            <p className="text-[11px] text-zinc-400">
              * Note: Submission registers a formal request. Appointments are confirmed upon hospital administration review.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAppointmentModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={appointmentSubmitting}>
                Submit Request
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Review ${hospital.name}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          {reviewError && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-900 text-red-300">
              {reviewError}
            </div>
          )}

          <div>
            <label className="block text-text-secondary mb-1">Rating (1 to 5 Stars)</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-white font-bold ml-2">{reviewForm.rating} / 5</span>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary mb-1">Review Headline *</label>
            <input
              type="text"
              required
              placeholder="e.g. Compassionate staff and clean triage area"
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-text-secondary mb-1">Detailed Feedback *</label>
            <textarea
              required
              rows="4"
              placeholder="Describe your consultation, doctor responsiveness, emergency triage or hospital cleanliness..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-text-secondary mb-1">Approximate Wait Time (Minutes)</label>
            <input
              type="number"
              min="0"
              value={reviewForm.waitTimeMinutes}
              onChange={(e) => setReviewForm({ ...reviewForm, waitTimeMinutes: e.target.value })}
              className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={reviewSubmitting}>
              Publish Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HospitalDetailPage;
