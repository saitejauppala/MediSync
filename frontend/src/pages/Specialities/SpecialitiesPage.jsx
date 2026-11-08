import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Brain,
  Bone,
  Baby,
  Sparkles,
  ShieldAlert,
  HeartHandshake,
  Stethoscope,
  Eye,
  Ear,
  Smile,
  Activity,
  ArrowRight,
  Search,
} from 'lucide-react';
import hospitalService from '../../services/hospitalService';
import Button from '../../components/common/Button';

const ICON_MAP = {
  Cardiology: HeartPulse,
  Neurology: Brain,
  Orthopaedics: Bone,
  Paediatrics: Baby,
  Dermatology: Sparkles,
  Oncology: ShieldAlert,
  Gynaecology: HeartHandshake,
  'General Medicine': Stethoscope,
  Ophthalmology: Eye,
  ENT: Ear,
  Dentistry: Smile,
  Urology: Activity,
};

export const SpecialitiesPage = () => {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await hospitalService.getDepartments();
        if (res.success) {
          setDepartments(res.departments);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDepartments();
  }, []);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.description.toLowerCase().includes(search.toLowerCase()) ||
    d.commonTreatments?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#090909] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/60 text-red-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Specialized Clinical Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Medical Specialities & Clinical Wings
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Locate premier hospitals equipped with specialized diagnostic infrastructure, dedicated operating theatres, and certified clinicians.
          </p>

          {/* Quick filter input */}
          <div className="max-w-md mx-auto pt-2">
            <div className="flex items-center gap-2 bg-[#171717] border border-[#303030] rounded-xl px-3 py-2 focus-within:border-red-500">
              <Search className="w-4 h-4 text-red-500 shrink-0" />
              <input
                type="text"
                placeholder="Search speciality or medical treatment (e.g. Bypass, NICU, Dialysis)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-white text-xs w-full focus:outline-none placeholder-text-secondary"
              />
            </div>
          </div>
        </div>

        {/* Specialities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-[#171717] border border-[#303030] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((dept) => {
              const Icon = ICON_MAP[dept.name] || Activity;
              return (
                <div
                  key={dept._id}
                  className="bg-[#171717] hover:bg-[#1a1a1a] border border-[#303030] hover:border-red-500/50 rounded-2xl p-6 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-900/60 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all">
                        <Icon className="w-6 h-6" />
                      </div>
                      {dept.isEmergencySupported && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-900">
                          24/7 Acute Ready
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                        {dept.name}
                      </h3>
                      <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                        {dept.description}
                      </p>
                    </div>

                    {dept.commonTreatments && dept.commonTreatments.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#2a2a2a]">
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Key Treatments & Procedures:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {dept.commonTreatments.map((treatment, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-[#202020] text-zinc-300 border border-[#303030]"
                            >
                              {treatment}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6">
                    <Link
                      to={`/hospitals?speciality=${encodeURIComponent(dept.name)}`}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#202020] group-hover:bg-red-600 text-white text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-all border border-[#303030] group-hover:border-red-600 shadow-sm"
                    >
                      <span>Find {dept.name} Hospitals</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialitiesPage;
