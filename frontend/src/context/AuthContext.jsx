import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('medisync_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('medisync_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem('medisync_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('medisync_token', res.data.token);
      localStorage.setItem('medisync_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('medisync_token', res.data.token);
      localStorage.setItem('medisync_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue client cleanup even if request fails
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('medisync_token');
      localStorage.removeItem('medisync_user');
    }
  };

  const toggleSaveHospital = async (hospitalId) => {
    if (!user) return false;
    try {
      const res = await api.post(`/auth/saved-hospitals/${hospitalId}`);
      if (res.data.success) {
        const updatedSaved = res.data.savedHospitals;
        const updatedUser = { ...user, savedHospitals: updatedSaved };
        setUser(updatedUser);
        localStorage.setItem('medisync_user', JSON.stringify(updatedUser));
        return res.data.saved;
      }
    } catch (err) {
      console.error('Toggle save error:', err);
    }
    return false;
  };

  const isHospitalSaved = (hospitalId) => {
    if (!user || !user.savedHospitals) return false;
    return user.savedHospitals.some((h) => (typeof h === 'string' ? h === hospitalId : h._id === hospitalId));
  };

  // Demo accounts quick-switch helper
  const demoLogin = async (role) => {
    const credentials = {
      patient: { email: 'patient@medisync.io', password: 'Password123!' },
      hospital_admin: { email: 'hospitaladmin@medisync.io', password: 'Password123!' },
      platform_admin: { email: 'admin@medisync.io', password: 'Password123!' },
    };

    if (credentials[role]) {
      return login(credentials[role].email, credentials[role].password);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    role: user?.role || null,
    login,
    register,
    logout,
    toggleSaveHospital,
    isHospitalSaved,
    demoLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

