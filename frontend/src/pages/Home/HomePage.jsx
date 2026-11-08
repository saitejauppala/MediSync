import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  AlertTriangle,
  Bed,
  Building2,
  Clock3,
  Compass,
  HeartPulse,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
} from 'lucide-react';
import hospitalService from '../../services/hospitalService';
import HospitalCard from '../../components/hospitals/HospitalCard';
import Button from '../../components/common/Button';

const SPECIALITIES_LIST = [
  { name: 'Cardiology', desc: 'Heart care, angioplasty and cath lab' },
  { name: 'Neurology', desc: 'Stroke care, brain and spine surgery' },
  { name: 'Orthopaedics', desc: 'Joint replacement, trauma and fractures' },
  { name: 'Paediatrics', desc: 'NICU, child care and vaccinations' },
  { name: 'Oncology', desc: 'Cancer treatments and chemotherapy' },
  { name: 'Gynaecology', desc: 'Maternity and women’s health' },
  { name: 'General Medicine', desc: 'Primary and internal medicine' },
  { name: 'Dermatology', desc: 'Skin health and clinical therapies' },
  { name: 'Ophthalmology', desc: 'Vision care and cataract surgery' },
  { name: 'ENT', desc: 'Ear, nose and throat care' },
  { name: 'Dentistry', desc: 'Oral and maxillofacial care' },
  { name: 'Urology', desc: 'Kidney care and urological treatment' },
];

const steps = [
  {
    number: '01',
    title: 'Search and discover',
    description: 'Find nearby hospitals by name, location or speciality, and explore facilities on the map.',
  },
  {
    number: '02',
    title: 'Compare your options',
    description: 'Review hospital services, reported bed availability and patient ratings side by side.',
  },
  {
    number: '03',
    title: 'Plan your next step',
    description: 'Request an appointment with a hospital and get directions when you are ready.',
  },
];

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredHospitals, setFeaturedHospitals] = useState([]);
  const [stats, setStats] = useState({
    hospitals: 0,
    emergencyCenters: 0,
    availableBeds: 0,
    specialities: 12,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const res = await hospitalService.getHospitals({ limit: 100 });
        if (res.success && res.hospitals) {
          setFeaturedHospitals(res.hospitals);
          const totalAvailBeds = res.hospitals.reduce(
            (acc, hospital) => acc + (hospital.bedInventory?.availableBeds || 0),
            0
          );
          setStats({
            hospitals: res.total,
            emergencyCenters: res.hospitals.filter((hospital) => hospital.hasEmergency).length,
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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/hospitals?search=${encodeURIComponent(query)}` : '/hospitals');
  };

  const featuredHospital = featuredHospitals[0];

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      <section className="border-b border-[#303030]">
        <div className="relative isolate mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:py-20">
          <div className="home-hero-glow" aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative z-10"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#333333] bg-[#171717] px-3 py-1.5 text-xs font-medium text-[#A3A3A3]">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Vijayawada healthcare discovery
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Healthcare, closer than ever.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#A3A3A3] sm:text-lg">
              Discover verified hospitals in Vijayawada, compare medical specialities and find nearby care.
            </p>

            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="mt-7 flex flex-col gap-2 rounded-2xl border border-[#333333] bg-[#171717] p-2 transition-colors focus-within:border-[#737373] sm:flex-row sm:items-center"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-[#A3A3A3]" />
                <input
                  type="search"
                  aria-label="Search hospitals"
                  placeholder="Search Vijayawada hospitals by name, locality or PIN code"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-11 w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-[#737373]"
                />
              </label>
              <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
                Search hospitals
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link to="/hospitals">
                <Button variant="secondary" size="md" icon={Compass}>Explore hospitals</Button>
              </Link>
              <Link to="/emergency">
                <Button variant="outline" size="md" icon={AlertTriangle}>Emergency care</Button>
              </Link>
              <Link to="/hospitals?nearby=true">
                <Button variant="ghost" size="md" icon={MapPin}>Hospitals near me</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
            className="relative z-10 min-h-[260px] overflow-hidden rounded-3xl border border-[#333333] bg-[#171717] sm:min-h-[340px]"
          >
            {featuredHospital?.images?.[0] ? (
              <img
                src={featuredHospital.images[0]}
                alt={featuredHospital.name}
                className="absolute inset-0 h-full w-full object-cover grayscale"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_55%_35%,#333333_0%,#171717_52%,#0a0a0a_100%)]">
                <HeartPulse aria-hidden="true" className="h-24 w-24 text-[#737373]" strokeWidth={0.8} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/5" />
            <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              {featuredHospital?.dataSource === 'openstreetmap'
                ? 'Community listing · unverified'
                : featuredHospital
                  ? 'Trusted care, closer to home'
                  : 'Vijayawada hospital discovery'}
            </div>
            {featuredHospital && (
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 sm:inset-x-7 sm:bottom-7">
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-white/70">
                    {featuredHospital.dataSource === 'openstreetmap'
                      ? 'Community listing · verify before travel'
                      : 'Featured hospital'}
                  </p>
                  <p className="truncate text-xl font-semibold text-white sm:text-2xl">{featuredHospital.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
                    <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span className="truncate">{featuredHospital.city}</span>
                  </p>
                </div>
                <Link
                  to={`/hospitals/${featuredHospital._id}`}
                  aria-label={`View ${featuredHospital.name}`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-black/40 text-white transition-colors hover:bg-white hover:text-black"
                >
                  <ArrowRight aria-hidden="true" className="h-5 w-5" />
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section aria-label="MediSync platform statistics" className="border-b border-[#303030] bg-[#0A0A0A]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            { value: stats.hospitals, label: 'Hospitals listed', icon: Building2 },
            { value: stats.emergencyCenters, label: 'Emergency listings', icon: AlertTriangle },
            { value: `${stats.availableBeds}+`, label: 'Reported beds available', icon: Bed },
            { value: stats.specialities, label: 'Medical specialities', icon: Activity },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 py-5 sm:py-7 md:justify-center">
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-[#737373]" />
              <div>
                <p className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{value}</p>
                <p className="mt-0.5 text-xs text-[#A3A3A3] sm:text-sm">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-b border-[#303030] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#A3A3A3]">Find your care</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Explore medical specialities</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#A3A3A3]">
              Browse hospitals by the care and clinical services you need.
            </p>
          </div>
          <Link to="/specialities" className="inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-[#A3A3A3]">
            All specialities <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SPECIALITIES_LIST.map((speciality) => (
            <Link
              key={speciality.name}
              to={`/hospitals?speciality=${encodeURIComponent(speciality.name)}`}
              className="group rounded-xl border border-[#333333] bg-[#171717] p-4 transition-colors hover:border-[#737373] hover:bg-[#1c1c1c]"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">{speciality.name}</h3>
                <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#737373] transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
              </div>
              <p className="mt-2 text-xs leading-5 text-[#A3A3A3]">{speciality.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-b border-[#303030] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#A3A3A3]">Certified facilities</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Featured hospitals</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#A3A3A3]">
              Explore verified hospitals and the services they provide.
            </p>
          </div>
          <Link to="/hospitals" className="inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-[#A3A3A3]">
            View all hospitals <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-[420px] animate-pulse rounded-2xl border border-[#333333] bg-[#171717]" />
            ))}
          </div>
        ) : featuredHospitals.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {featuredHospitals.map((hospital) => (
              <motion.div
                key={hospital._id}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <HospitalCard hospital={hospital} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-[#333333] bg-[#171717] px-5 py-10 text-center">
            <p className="text-sm text-[#A3A3A3]">No featured hospitals are available right now.</p>
            <Link to="/hospitals" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#A3A3A3]">
              Browse hospitals <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl border-b border-[#303030] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#A3A3A3]">A clearer path to care</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">How MediSync works</h2>
          <p className="mt-2 text-sm leading-6 text-[#A3A3A3]">Useful information for each step, from finding a hospital to planning a visit.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="rounded-2xl border border-[#333333] bg-[#171717] p-5 sm:p-6">
              <p className="text-xs font-medium tracking-[0.16em] text-[#737373]">{step.number}</p>
              <h3 className="mt-5 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#A3A3A3]">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-[#333333] bg-[#171717] p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#A3A3A3]">
              <AlertTriangle aria-hidden="true" className="h-4 w-4" /> Emergency care
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">Need urgent medical care?</h2>
            <p className="mt-2 text-sm leading-6 text-[#A3A3A3]">
              Find nearby emergency facilities, or contact official emergency services if someone is in immediate danger.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link to="/emergency" className="w-full sm:w-auto">
              <Button variant="primary" size="md" icon={AlertTriangle} className="w-full">Open emergency finder</Button>
            </Link>
            <a
              href="tel:112"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#404040] bg-[#0A0A0A] px-4 text-sm font-medium text-white transition-colors hover:bg-[#262626]"
            >
              <PhoneCall aria-hidden="true" className="h-4 w-4" /> Call 112
            </a>
          </div>
        </div>
        <p className="mt-3 inline-flex items-center gap-2 text-xs text-[#737373]">
          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" /> Hospital information and bed availability are reported by facilities.
        </p>
      </section>
    </div>
  );
};

export default HomePage;
