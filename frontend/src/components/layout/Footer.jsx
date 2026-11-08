import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, AlertTriangle, PhoneCall, ShieldCheck, MapPin, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#111111] border-t border-[#303030] text-text-secondary">
      {/* Emergency Hotline Alert Strip */}
      <div className="bg-red-950/40 border-b border-red-900/40 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>
              <strong>Life-Threatening Emergency?</strong> MediSync is an informational discovery platform. In immediate danger, call official emergency dispatch services.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="tel:112"
              className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <PhoneCall className="w-3 h-3" /> Call 112 (National)
            </a>
            <a
              href="tel:108"
              className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <PhoneCall className="w-3 h-3" /> Call 108 (Ambulance)
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Medi<span className="text-red-500">Sync</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Healthcare, closer than ever. Full-stack healthcare discovery and hospital navigation platform connecting patients to certified facilities, emergency units, and bed availability.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#171717] border border-[#303030] text-[11px] text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Patient Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/hospitals" className="hover:text-red-400 transition-colors">
                  Explore Hospitals
                </Link>
              </li>
              <li>
                <Link to="/emergency" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
                  Emergency Care Finder
                </Link>
              </li>
              <li>
                <Link to="/specialities" className="hover:text-red-400 transition-colors">
                  Medical Specialities
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-red-400 transition-colors">
                  Compare Facilities
                </Link>
              </li>
              <li>
                <Link to="/patient-dashboard" className="hover:text-red-400 transition-colors">
                  Appointment Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Specialities */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Key Specialities
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/hospitals?speciality=Cardiology" className="hover:text-red-400 transition-colors">
                  Cardiology & Cath Lab
                </Link>
              </li>
              <li>
                <Link to="/hospitals?speciality=Neurology" className="hover:text-red-400 transition-colors">
                  Neurology & Stroke Unit
                </Link>
              </li>
              <li>
                <Link to="/hospitals?speciality=Orthopaedics" className="hover:text-red-400 transition-colors">
                  Orthopaedics & Joint Care
                </Link>
              </li>
              <li>
                <Link to="/hospitals?speciality=Paediatrics" className="hover:text-red-400 transition-colors">
                  Paediatrics & NICU
                </Link>
              </li>
              <li>
                <Link to="/hospitals?speciality=Oncology" className="hover:text-red-400 transition-colors">
                  Comprehensive Oncology
                </Link>
              </li>
            </ul>
          </div>

          {/* Administration & Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Administration & Portal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/hospital-dashboard" className="hover:text-red-400 transition-colors">
                  Hospital Admin Portal
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-red-400 transition-colors">
                  Platform Verification Admin
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-red-400 transition-colors">
                  Account Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-red-400 transition-colors">
                  Hospital Partner Registration
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#303030] flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} MediSync Platform. All healthcare data strictly verified and reported.</p>
          <div className="flex items-center space-x-4 text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Built on MERN (MongoDB Atlas • Express • React • Node.js)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
