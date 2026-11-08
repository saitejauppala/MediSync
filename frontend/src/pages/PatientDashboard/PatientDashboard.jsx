import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Bell,
  User,
  XCircle,
  Building2,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import hospitalService from '../../services/hospitalService';
import { StatusBadge } from '../../components/common/Badge';
import HospitalCard from '../../components/hospitals/HospitalCard';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [savedHospitals, setSavedHospitals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Cancellation Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [apptsRes, notifsRes, userRes] = await Promise.all([
        hospitalService.getMyAppointments(statusFilter !== 'All' ? { status: statusFilter } : {}),
        hospitalService.getNotifications(),
        hospitalService.getHospitals(),
      ]);

      if (apptsRes.success) {
        setAppointments(apptsRes.appointments);
      }
      if (notifsRes.success) {
        setNotifications(notifsRes.notifications);
      }
      if (user?.savedHospitals && userRes.success) {
        const savedIds = user.savedHospitals.map((h) => (typeof h === 'string' ? h : h._id));
        const matched = userRes.hospitals.filter((h) => savedIds.includes(h._id));
        setSavedHospitals(matched);
      }
    } catch (err) {
      console.error('Failed to load patient dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [statusFilter, user]);

  const handleOpenCancel = (appt) => {
    setSelectedAppt(appt);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setCancelling(true);
    try {
      const res = await hospitalService.cancelAppointment(selectedAppt._id, cancelReason);
      if (res.success) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === selectedAppt._id ? res.appointment : a))
        );
        setCancelModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    } finally {
      setCancelling(false);
    }
  };

  const handleMarkNotifsRead = async () => {
    await hospitalService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Profile Card Header */}
        <div className="p-6 rounded-3xl bg-[#171717] border border-[#303030] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-red-500/20">
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{user?.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-900 uppercase">
                  Patient Portal
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{user?.email} • {user?.phone || 'No phone set'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/hospitals">
              <Button variant="primary" size="sm" icon={Building2}>
                Find & Book Care
              </Button>
            </Link>
          </div>
        </div>

        {/* 2 Column Layout: Appointments & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main 2 Cols: Appointments */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-red-500" />
                    My Appointments & Requests
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Track hospital acceptance, confirmations, and visit dates
                  </p>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-[#202020] p-1 rounded-xl border border-[#303030]">
                  {['All', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-all ${
                        statusFilter === tab
                          ? 'bg-red-500 text-white font-bold'
                          : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-[#202020] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-secondary space-y-3">
                  <Calendar className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="font-semibold text-white">No Appointments Found</p>
                  <p>You have not submitted any appointment requests matching the filter.</p>
                  <Link to="/hospitals">
                    <Button variant="outline" size="sm" className="mt-2">
                      Explore Hospitals
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appt) => (
                    <div
                      key={appt._id}
                      className="p-5 rounded-xl bg-[#202020] border border-[#2e2e2e] hover:border-red-500/40 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-red-500" />
                            {appt.hospitalId?.name || 'Medical Facility'}
                          </h3>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Department: <strong className="text-white">{appt.department}</strong>
                          </p>
                        </div>
                        <StatusBadge status={appt.status} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs py-2 border-y border-[#2b2b2b]">
                        <div>
                          <span className="text-text-secondary block">Date & Slot:</span>
                          <span className="font-semibold text-white">
                            {new Date(appt.preferredDate).toLocaleDateString()} at {appt.preferredTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary block">Patient:</span>
                          <span className="font-semibold text-white">{appt.patientName}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary block">Contact Phone:</span>
                          <span className="font-semibold text-white">{appt.patientPhone}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-text-secondary">Reason for Consultation:</span>
                        <p className="text-xs text-zinc-300 mt-0.5 italic">"{appt.reasonForVisit}"</p>
                      </div>

                      {/* Hospital Notes if any */}
                      {appt.hospitalNotes && (
                        <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-xs text-red-200">
                          <strong>Hospital Message:</strong> {appt.hospitalNotes}
                        </div>
                      )}

                      {/* Cancellation Action */}
                      {(appt.status === 'pending' || appt.status === 'confirmed') && (
                        <div className="flex justify-end pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 text-xs"
                            onClick={() => handleOpenCancel(appt)}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Cancel Appointment
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Hospitals Section */}
            <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                Saved Facilities ({savedHospitals.length})
              </h2>

              {savedHospitals.length === 0 ? (
                <p className="text-xs text-text-secondary">No saved hospitals yet. Click the heart icon on any hospital card to save it for quick reference.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedHospitals.map((h) => (
                    <HospitalCard key={h._id} hospital={h} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Notifications Center */}
          <div className="space-y-6">
            <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#303030]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-500" />
                  Notifications
                </h3>
                {notifications.some((n) => !n.isRead) && (
                  <button
                    onClick={handleMarkNotifsRead}
                    className="text-[11px] text-red-400 hover:underline font-semibold"
                  >
                    Mark All Read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-text-secondary text-center py-6">No notifications yet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        n.isRead
                          ? 'bg-[#202020] border-[#2c2c2c] text-text-secondary'
                          : 'bg-red-950/30 border-red-900/60 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{n.title}</span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Appointment"
      >
        <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
          <p className="text-text-secondary">
            Are you sure you wish to cancel your appointment at{' '}
            <strong className="text-white">{selectedAppt?.hospitalId?.name}</strong> on{' '}
            {selectedAppt && new Date(selectedAppt.preferredDate).toLocaleDateString()}?
          </p>

          <div>
            <label className="block text-text-secondary mb-1">Reason for Cancellation</label>
            <textarea
              rows="3"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule conflict, feeling better, or rescheduled elsewhere..."
              className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Appointment
            </Button>
            <Button variant="danger" size="sm" type="submit" loading={cancelling}>
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientDashboard;
