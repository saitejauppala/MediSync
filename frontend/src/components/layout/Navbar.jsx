import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Heart,
  Search,
  AlertTriangle,
  Layers,
  Bookmark,
  Scale,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';

const Navbar = () => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const { selectedHospitals } = useCompare();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  const handleDemoSwitch = async (role) => {
    await demoLogin(role);
    setDemoMenuOpen(false);
    if (role === 'platform_admin') navigate('/admin');
    else if (role === 'hospital_admin') navigate('/hospital-dashboard');
    else navigate('/patient-dashboard');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#090909]/95 backdrop-blur-md border-b border-[#303030]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center transition-transform group-hover:scale-105">
              <Heart className="w-4 h-4 text-black fill-black" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                Medi<span className="text-[#a3a3a3]">Sync</span>
              </span>
              <span className="block text-[10px] text-text-secondary -mt-1 tracking-wider uppercase font-medium">
                Healthcare Discovery
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'text-white bg-[#262626]' : 'text-text-secondary hover:text-white hover:bg-[#171717]'
              }`}
            >
              Home
            </Link>

            <Link
              to="/hospitals"
              className={`px-2.5 py-2 rounded-lg text-xs xl:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/hospitals') ? 'text-white bg-[#262626]' : 'text-text-secondary hover:text-white hover:bg-[#171717]'
              }`}
            >
              <Search className="w-4 h-4" />
              Explore Hospitals
            </Link>

            <Link
              to="/specialities"
              className={`px-2.5 py-2 rounded-lg text-xs xl:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/specialities') ? 'text-white bg-[#262626]' : 'text-text-secondary hover:text-white hover:bg-[#171717]'
              }`}
            >
              <Layers className="w-4 h-4" />
              Specialities
            </Link>

            <Link
              to="/emergency"
              className={`px-2.5 py-2 rounded-lg text-xs xl:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/emergency')
                  ? 'bg-[#262626] text-white'
                  : 'text-text-secondary hover:text-white hover:bg-[#171717]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Emergency Care
            </Link>

            <Link
              to="/compare"
              className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/compare') ? 'text-white bg-[#262626]' : 'text-text-secondary hover:text-white hover:bg-[#171717]'
              }`}
            >
              <Scale className="w-4 h-4" />
              Compare
              {selectedHospitals.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {selectedHospitals.length}
                </span>
              )}
            </Link>
          </div>

          {/* Right Action / Auth */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Quick Demo Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-[#171717] hover:bg-[#202020] text-text-secondary hover:text-white flex items-center gap-1.5 transition-colors"
                title="Switch demo role instantly"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#a3a3a3]" />
                <span>Demo Roles</span>
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#171717] border border-[#303030] shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider border-b border-[#303030]">
                    Switch Demo Account
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('patient')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#202020] flex items-center justify-between group"
                  >
                    <span className="text-white group-hover:text-[#a3a3a3]">Patient User</span>
                    <span className="text-[10px] text-text-secondary">Rohan</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('hospital_admin')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#202020] flex items-center justify-between group"
                  >
                    <span className="text-white group-hover:text-[#a3a3a3]">Hospital Admin</span>
                    <span className="text-[10px] text-text-secondary">Apollo City</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('platform_admin')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#202020] flex items-center justify-between group"
                  >
                    <span className="text-white group-hover:text-[#a3a3a3]">Platform Admin</span>
                    <span className="text-[10px] text-text-secondary">Full Control</span>
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border border-[#303030] bg-[#171717] hover:bg-[#202020] text-white transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#262626] border border-[#404040] flex items-center justify-center text-white font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-semibold text-white leading-tight">{user?.name?.split(' ')[0]}</p>
                    <p className="text-[10px] text-text-secondary capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[#171717] border border-[#303030] shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#303030]">
                      <p className="text-xs text-text-secondary">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-red-950 text-red-400 border border-red-900">
                        {user?.role?.replace('_', ' ')}
                      </span>
                    </div>

                    {user?.role === 'patient' && (
                      <Link
                        to="/patient-dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-xs text-text-secondary hover:text-white hover:bg-[#202020]"
                      >
                        <Calendar className="w-4 h-4 text-red-500" />
                        <span>My Dashboard & Appointments</span>
                      </Link>
                    )}

                    {user?.role === 'hospital_admin' && (
                      <Link
                        to="/hospital-dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-xs text-text-secondary hover:text-white hover:bg-[#202020]"
                      >
                        <Building2 className="w-4 h-4 text-red-500" />
                        <span>Hospital Admin Dashboard</span>
                      </Link>
                    )}

                    {user?.role === 'platform_admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-xs text-text-secondary hover:text-white hover:bg-[#202020]"
                      >
                        <Shield className="w-4 h-4 text-red-500" />
                        <span>Platform Administration</span>
                      </Link>
                    )}

                    <Link
                      to="/saved-hospitals"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-xs text-text-secondary hover:text-white hover:bg-[#202020]"
                    >
                      <Bookmark className="w-4 h-4 text-red-500" />
                      <span>Saved Hospitals</span>
                    </Link>

                    <div className="border-t border-[#303030] my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-[#202020]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-[#171717] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white hover:bg-[#d4d4d4] text-black transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-[#171717]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#303030] bg-[#111111] px-4 pt-2 pb-6 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${isActive('/') ? 'bg-[#262626] text-white' : 'text-text-secondary hover:bg-[#171717] hover:text-white'}`}
          >
            Home
          </Link>
          <Link
            to="/hospitals"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${isActive('/hospitals') ? 'bg-[#262626] text-white' : 'text-text-secondary hover:bg-[#171717] hover:text-white'}`}
          >
            Explore Hospitals
          </Link>
          <Link
            to="/specialities"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${isActive('/specialities') ? 'bg-[#262626] text-white' : 'text-text-secondary hover:bg-[#171717] hover:text-white'}`}
          >
            Specialities
          </Link>
          <Link
            to="/emergency"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${isActive('/emergency') ? 'bg-[#262626] text-white' : 'text-text-secondary hover:bg-[#171717] hover:text-white'}`}
          >
            Emergency Care
          </Link>
          <Link
            to="/compare"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${isActive('/compare') ? 'bg-[#262626] text-white' : 'text-text-secondary hover:bg-[#171717] hover:text-white'}`}
          >
            Compare Hospitals ({selectedHospitals.length})
          </Link>

          <div className="pt-3 border-t border-[#303030] space-y-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Demo accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['patient', 'Patient'],
                ['hospital_admin', 'Hospital admin'],
                ['platform_admin', 'Platform admin'],
              ].map(([role, label]) => (
                <button
                  key={role}
                  onClick={() => {
                    handleDemoSwitch(role);
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-lg border border-[#333333] bg-[#171717] px-2 py-2 text-xs text-text-secondary transition-colors hover:bg-[#262626] hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="pt-2">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-xs text-text-secondary">
                  Logged in as <span className="text-white font-semibold">{user?.name}</span>
                </div>
                {user?.role === 'patient' && (
                  <Link
                    to="/patient-dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-text-secondary hover:text-white"
                  >
                    Patient Dashboard
                  </Link>
                )}
                {user?.role === 'hospital_admin' && (
                  <Link
                    to="/hospital-dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-text-secondary hover:text-white"
                  >
                    Hospital Dashboard
                  </Link>
                )}
                {user?.role === 'platform_admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-text-secondary hover:text-white"
                  >
                    Platform Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-white"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-lg border border-[#303030] text-sm text-white"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-lg bg-white text-sm text-black font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
