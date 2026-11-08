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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                Medi<span className="text-red-500">Sync</span>
              </span>
              <span className="block text-[10px] text-text-secondary -mt-1 tracking-wider uppercase font-medium">
                Healthcare Discovery
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'text-red-500 bg-red-950/30' : 'text-text-secondary hover:text-white hover:bg-[#171717]'
              }`}
            >
              Home
            </Link>

            <Link
              to="/hospitals"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/hospitals') ? 'text-red-500 bg-red-950/30' : 'text-text-secondary hover:text-white hover:bg-[#171717]'
              }`}
            >
              <Search className="w-4 h-4" />
              Explore Hospitals
            </Link>

            <Link
              to="/specialities"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/specialities') ? 'text-red-500 bg-red-950/30' : 'text-text-secondary hover:text-white hover:bg-[#171717]'
              }`}
            >
              <Layers className="w-4 h-4" />
              Specialities
            </Link>

            <Link
              to="/emergency"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/emergency')
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'text-red-400 hover:text-white hover:bg-red-950/40 border border-red-500/30'
              }`}
            >
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              Emergency Care
            </Link>

            <Link
              to="/compare"
              className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/compare') ? 'text-red-500 bg-red-950/30' : 'text-text-secondary hover:text-white hover:bg-[#171717]'
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
          <div className="hidden md:flex items-center space-x-3">
            {/* Quick Demo Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-[#171717] hover:bg-[#202020] text-text-secondary hover:text-white flex items-center gap-1.5 transition-colors"
                title="Switch demo role instantly"
              >
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
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
                    <span className="text-white group-hover:text-red-400">Patient User</span>
                    <span className="text-[10px] text-text-secondary">Rohan</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('hospital_admin')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#202020] flex items-center justify-between group"
                  >
                    <span className="text-white group-hover:text-red-400">Hospital Admin</span>
                    <span className="text-[10px] text-text-secondary">Apollo City</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('platform_admin')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#202020] flex items-center justify-between group"
                  >
                    <span className="text-white group-hover:text-red-400">Platform Admin</span>
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
                  <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-semibold text-white leading-tight">{user?.name?.split(' ')[0]}</p>
                    <p className="text-[10px] text-red-400 capitalize">{user?.role?.replace('_', ' ')}</p>
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
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-[#171717] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-md shadow-red-500/20"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-[#171717]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#303030] bg-[#111111] px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-[#171717]"
          >
            Home
          </Link>
          <Link
            to="/hospitals"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-[#171717]"
          >
            Explore Hospitals
          </Link>
          <Link
            to="/specialities"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-[#171717]"
          >
            Specialities
          </Link>
          <Link
            to="/emergency"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-950/30"
          >
            Emergency Care
          </Link>
          <Link
            to="/compare"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-[#171717]"
          >
            Compare Hospitals ({selectedHospitals.length})
          </Link>

          <div className="pt-2 border-t border-[#303030] space-y-2">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-xs text-text-secondary">
                  Logged in as <span className="text-white font-semibold">{user?.name}</span>
                </div>
                {user?.role === 'patient' && (
                  <Link
                    to="/patient-dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-red-400"
                  >
                    Patient Dashboard
                  </Link>
                )}
                {user?.role === 'hospital_admin' && (
                  <Link
                    to="/hospital-dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-red-400"
                  >
                    Hospital Dashboard
                  </Link>
                )}
                {user?.role === 'platform_admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-red-400"
                  >
                    Platform Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400"
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
                  className="flex-1 py-2 text-center rounded-lg bg-red-500 text-sm text-white font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
