import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      if (data.user.role === 'platform_admin') navigate('/admin');
      else if (data.user.role === 'hospital_admin') navigate('/hospital-dashboard');
      else navigate(from === '/login' ? '/patient-dashboard' : from);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setLoading(true);
    setError('');
    try {
      const data = await demoLogin(role);
      if (role === 'platform_admin') navigate('/admin');
      else if (role === 'hospital_admin') navigate('/hospital-dashboard');
      else navigate('/patient-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-105 transition-transform">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Medi<span className="text-red-500">Sync</span>
          </span>
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-white">Sign In to Your Account</h2>
        <p className="mt-1 text-xs text-text-secondary">
          Access your appointment records, facility management, or verification console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Fast Demo Accounts Panel */}
        <div className="bg-[#171717] border border-red-900/50 rounded-2xl p-4 mb-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
            <Sparkles className="w-4 h-4" />
            <span>Fast Evaluator Login (One-Click)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('patient')}
              className="py-2 px-2 rounded-xl bg-[#202020] hover:bg-red-950/60 border border-[#303030] hover:border-red-500 text-center transition-all"
            >
              <span className="block text-[11px] font-bold text-white">Patient</span>
              <span className="block text-[9px] text-text-secondary">Rohan</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('hospital_admin')}
              className="py-2 px-2 rounded-xl bg-[#202020] hover:bg-red-950/60 border border-[#303030] hover:border-red-500 text-center transition-all"
            >
              <span className="block text-[11px] font-bold text-white">Hospital</span>
              <span className="block text-[9px] text-text-secondary">Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('platform_admin')}
              className="py-2 px-2 rounded-xl bg-[#202020] hover:bg-red-950/60 border border-[#303030] hover:border-red-500 text-center transition-all"
            >
              <span className="block text-[11px] font-bold text-white">Platform</span>
              <span className="block text-[9px] text-text-secondary">Super Admin</span>
            </button>
          </div>
        </div>

        {/* Standard Form */}
        <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-900 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full shadow-lg shadow-red-500/20"
            >
              Sign In
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-[#303030] text-xs text-text-secondary">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-red-400 hover:text-red-300">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
