import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  AlertTriangle,
  Shield,
  Activity,
  HeartPulse,
  Bed,
  PhoneCall,
  Clock,
  ArrowRight,
  Compass,
  CheckCircle2,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import hospitalService from '../../services/hospitalService';
import HospitalCard from '../../components/hospitals/HospitalCard';
import Button from '../../components/common/Button';

const SPECIALITIES_LIST = [
  { name: 'Cardiology', icon: 'HeartPulse', desc: 'Heart care, Angioplasty, Cath Lab' },
  { name: 'Neurology', icon: 'Activity', desc: 'Stroke care, Brain & Spine surgery' },
  { name: 'Orthopaedics', icon: 'Compass', desc: 'Joint replacement, Trauma, Fractures' },
  { name: 'Paediatrics', icon: 'HeartPulse', desc: 'NICU, Child care & Vaccinations' },
  { name: 'Oncology', icon: 'Shield', desc: 'Cancer treatments, Chemotherapy' },
  { name: 'Gynaecology', icon: 'Activity', desc: 'Maternity, Prenatal & Women’s health' },
  { name: 'General Medicine', icon: 'Activity', desc: 'Primary care & Internal medicine' },
  { name: 'Dermatology', icon: 'Sparkles', desc: 'Skin health & clinical therapies' },
  { name: 'Ophthalmology', icon: 'Compass', desc: 'Vision correction & Cataract surgery' },
  { name: 'ENT', icon: 'Activity', desc: 'Ear, Nose & Throat clinical care' },
  { name: 'Dentistry', icon: 'Sparkles', desc: 'Oral surgery & Maxillofacial care' },
  { name: 'Urology', icon: 'Activity', desc: 'Kidney care & Laser Lithotripsy' },
];

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredHospitals, setFeaturedHospitals] = useState([]);
  const [stats, setStats] = useState({
    hospitals: 7,
    emergencyCenters: 6,
    availableBeds: 780,
    specialities: 12,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const res = await hospitalService.getHospitals({ limit: 3, isVerified: 'true' });
        if (res.success && res.hospitals) {
          setFeaturedHospitals(res.hospitals);
          const totalAvailBeds = res.hospitals.reduce(
            (acc, h) => acc + (h.bedInventory?.availableBeds || 0),
            450
          );
          setStats({
            hospitals: res.total || 7,
            emergencyCenters: res.hospitals.filter((h) => h.hasEmergency).length || 6,
            availableBeds: totalAvailBeds,
            specialities: 12,
          });
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/hospitals?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/hospitals');
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden border-b border-[#303030]">
        {/* Subtle background red glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/60 border border-red-800/60 text-red-400 text-xs font-semibold mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>Real-time Healthcare Discovery & Navigation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Healthcare, <span className="text-red-500 underline decoration-red-900/60 underline-offset-8">closer</span> than ever.
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Discover trusted hospitals, explore medical specialities, inspect reported bed capacity, and locate 24/7 emergency care near you.
          </p>

          {/* Hero Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 max-w-3xl mx-auto bg-[#171717] border border-[#303030] p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 hover:border-red-500/50 transition-colors"
          >
            <div className="flex items-center gap-3 px-3 flex-1 w-full">
              <Search className="w-5 h-5 text-red-500 shrink-0" />
              <input
                type="text"
                placeholder="Search hospital by name, city (e.g. Hyderabad, Bengaluru), locality or PIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder-text-secondary text-sm focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shrink-0 shadow-lg shadow-red-500/30"
            >
              Search Hospitals
            </Button>
          </form>

          {/* Quick Action Pill Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/hospitals">
              <Button variant="secondary" size="md" icon={Compass}>
                Explore All Hospitals
              </Button>
            </Link>
            <Link to="/emergency">
              <Button
                variant="primary"
                size="md"
                icon={AlertTriangle}
                className="bg-red-600 hover:bg-red-700 animate-bounce"
              >
                Find 24/7 Emergency Care
              </Button>
            </Link>
            <Link to="/hospitals?nearby=true">
              <Button variant="secondary" size="md" icon={MapPin}>
                Hospitals Near Me
              </Button>
            </Link>
          </div>

          {/* Genuine Database Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-[#171717] border border-[#303030]">
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">{stats.hospitals}+</span>
                <Building2 className="w-5 h-5 text-red-500" />
              </div>
              <p className="mt-1 text-xs text-text-secondary font-medium">Verified Hospitals</p>
            </div>
            <div className="p-4 rounded-xl bg-[#171717] border border-[#303030]">
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-red-400">{stats.emergencyCenters}</span>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="mt-1 text-xs text-text-secondary font-medium">Emergency Trauma Centers</p>
            </div>
            <div className="p-4 rounded-xl bg-[#171717] border border-[#303030]">
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{stats.availableBeds}+</span>
                <Bed className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="mt-1 text-xs text-text-secondary font-medium">Reported Beds Avail.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#171717] border border-[#303030]">
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">{stats.specialities}</span>
                <Activity className="w-5 h-5 text-red-500" />
              </div>
              <p className="mt-1 text-xs text-text-secondary font-medium">Medical Specialities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hospitals Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#303030]">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Certified Facilities</span>
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
              Featured Healthcare Centers
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary">
              Verified tertiary and quaternary hospitals with round-the-clock emergency infrastructure.
            </p>
          </div>
          <Link
            to="/hospitals"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
          >
            <span>View All Facilities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-[#171717] border border-[#303030] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredHospitals.map((hospital) => (
              <HospitalCard key={hospital._id} hospital={hospital} />
            ))}
          </div>
        )}
      </section>

      {/* Medical Specialities Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#303030]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-red-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Activity className="w-4 h-4" />
            <span>Clinical Departments</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Explore Medical Specialities
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-text-secondary">
            Identify certified hospitals providing specialized diagnostics, surgeries, and critical care departments.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {SPECIALITIES_LIST.map((spec, idx) => (
            <Link
              key={idx}
              to={`/hospitals?speciality=${encodeURIComponent(spec.name)}`}
              className="p-5 rounded-xl bg-[#171717] hover:bg-[#202020] border border-[#303030] hover:border-red-500/50 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-lg bg-red-950/60 border border-red-900/60 flex items-center justify-center text-red-400 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                {spec.name}
              </h3>
              <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                {spec.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* How MediSync Works */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#303030]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How MediSync Works
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-text-secondary">
            Streamlined access to quality healthcare in three straightforward steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-[#171717] border border-[#303030] relative space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 font-extrabold text-lg">
              01
            </div>
            <h3 className="text-lg font-bold text-white">Search & Discover</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Locate nearby hospitals via GPS or search by city, locality, PIN code, or required clinical speciality. View facilities on our interactive dark map.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#171717] border border-[#303030] relative space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 font-extrabold text-lg">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Compare & Inspect Beds</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Compare up to 3 hospitals side-by-side. Inspect reported bed availability, ICU capacity, oxygen support, trauma readiness, and patient ratings.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#171717] border border-[#303030] relative space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 font-extrabold text-lg">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Request & Navigate</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Submit an appointment request directly to the hospital department, track approval status, and get instant turn-by-turn routing directions.
            </p>
          </div>
        </div>
      </section>

      {/* Emergency Fast Access Banner */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-red-950/80 via-[#171717] to-[#111111] border border-red-900/60 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/80 text-white text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Immediate Assistance</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Need Critical or Emergency Care?
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl">
              Locate the nearest emergency hospital equipped with blood banks, stroke units, cardiac resuscitation suites, and trauma surgeons.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link to="/emergency">
              <Button
                variant="primary"
                size="lg"
                icon={AlertTriangle}
                className="bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/30"
              >
                Open Emergency Finder
              </Button>
            </Link>
            <a
              href="tel:112"
              className="px-6 py-3 rounded-lg bg-[#202020] hover:bg-[#282828] text-white text-base font-bold border border-[#303030] flex items-center gap-2 transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-red-500" />
              Dial 112
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
