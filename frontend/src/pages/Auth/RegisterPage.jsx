import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Lock, Mail, User, Phone, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export const RegisterPage = () => {
  const [role, setRole] = useState('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await register({
        name,
        email,
        phone,
        password,
        role,
      });
      if (role === 'hospital_admin') {
        navigate('/hospital-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Medi<span className="text-red-500">Sync</span>
          </span>
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-white">Create MediSync Account</h2>
        <p className="mt-1 text-xs text-text-secondary">
          Register as a patient or hospital facility administrator
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-900 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Role Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  role === 'patient'
                    ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20'
                    : 'bg-[#202020] border-[#303030] text-text-secondary hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient User</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('hospital_admin')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  role === 'hospital_admin'
                    ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20'
                    : 'bg-[#202020] border-[#303030] text-text-secondary hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Hospital Admin</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-text-secondary mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder={role === 'patient' ? 'e.g. John Doe' : 'e.g. Dr. Jane Smith'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-text-secondary mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-text-secondary mb-1">Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-secondary mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#202020] border border-[#303030] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-text-secondary mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#202020] border border-[#303030] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full shadow-lg shadow-red-500/20 mt-2"
            >
              Complete Registration
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-[#303030] text-xs text-text-secondary">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-red-400 hover:text-red-300">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

