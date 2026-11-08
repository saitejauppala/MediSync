import api from './api';

export const authService = {
  async register(userData) {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async updateProfile(profileData) {
    const res = await api.put('/auth/profile', profileData);
    return res.data;
  },

  async updatePassword(passwordData) {
    const res = await api.put('/auth/password', passwordData);
    return res.data;
  },

  async toggleSaveHospital(hospitalId) {
    const res = await api.post(`/auth/saved-hospitals/${hospitalId}`);
    return res.data;
  },
};

export default authService;
