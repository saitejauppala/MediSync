import api from './api';

export const hospitalService = {
  // Discovery & listing
  async getHospitals(params = {}) {
    const res = await api.get('/hospitals', { params });
    return res.data;
  },

  async getNearbyHospitals(params = {}) {
    const res = await api.get('/hospitals/nearby', { params });
    return res.data;
  },

  async searchLocations(q) {
    const res = await api.get('/location/search', { params: { q } });
    return res.data;
  },

  async reverseGeocode(latitude, longitude) {
    const res = await api.get('/location/reverse', {
      params: { latitude, longitude },
    });
    return res.data;
  },

  async searchHospitals(q) {
    const res = await api.get('/hospitals/search', { params: { q } });
    return res.data;
  },

  async getHospitalById(id) {
    const res = await api.get(`/hospitals/${id}`);
    return res.data;
  },

  async compareHospitals(ids) {
    const res = await api.get('/hospitals/compare', { params: { ids } });
    return res.data;
  },

  async createHospital(data) {
    const res = await api.post('/hospitals', data);
    return res.data;
  },

  async updateHospital(id, data) {
    const res = await api.patch(`/hospitals/${id}`, data);
    return res.data;
  },

  // Bed inventory
  async getHospitalBeds(id) {
    const res = await api.get(`/hospitals/${id}/beds`);
    return res.data;
  },

  async updateHospitalBeds(id, data) {
    const res = await api.patch(`/beds/${id}`, data);
    return res.data;
  },

  // Reviews
  async getHospitalReviews(id, params = {}) {
    const res = await api.get(`/hospitals/${id}/reviews`, { params });
    return res.data;
  },

  async addHospitalReview(id, data) {
    const res = await api.post(`/hospitals/${id}/reviews`, data);
    return res.data;
  },

  // Departments
  async getDepartments() {
    const res = await api.get('/departments');
    return res.data;
  },

  // Emergency
  async getNearbyEmergency(params = {}) {
    const res = await api.get('/emergency/nearby', { params });
    return res.data;
  },

  // Appointments
  async createAppointment(data) {
    const res = await api.post('/appointments', data);
    return res.data;
  },

  async getMyAppointments(params = {}) {
    const res = await api.get('/appointments/my', { params });
    return res.data;
  },

  async getHospitalAppointments(hospitalId, params = {}) {
    const res = await api.get(`/appointments/hospital/${hospitalId}`, { params });
    return res.data;
  },

  async updateAppointmentStatus(id, data) {
    const res = await api.patch(`/appointments/${id}/status`, data);
    return res.data;
  },

  async cancelAppointment(id, reason) {
    const res = await api.delete(`/appointments/${id}`, { data: { reason } });
    return res.data;
  },

  // Admin
  async getAdminAnalytics() {
    const res = await api.get('/admin/analytics');
    return res.data;
  },

  async getAdminHospitals(params = {}) {
    const res = await api.get('/admin/hospitals', { params });
    return res.data;
  },

  async updateHospitalVerification(id, status) {
    const res = await api.patch(`/admin/hospitals/${id}/verification`, { status });
    return res.data;
  },

  async getAdminUsers(params = {}) {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  async updateUserStatus(id, data) {
    const res = await api.patch(`/admin/users/${id}/status`, data);
    return res.data;
  },

  async getAuditLogs(params = {}) {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },

  // Notifications
  async getNotifications() {
    const res = await api.get('/notifications');
    return res.data;
  },

  async markNotificationRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllNotificationsRead() {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};

export default hospitalService;
