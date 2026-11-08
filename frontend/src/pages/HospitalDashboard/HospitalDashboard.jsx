import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bed,
  Calendar,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Phone,
  MapPin,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import hospitalService from '../../services/hospitalService';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export const HospitalDashboard = () => {
  const { user } = useAuth();
  const notify = useToast();
  const [hospital, setHospital] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [bedForm, setBedForm] = useState({
    totalBeds: '',
    occupiedBeds: '',
    availableBeds: '',
    icuTotal: '',
    icuAvailable: '',
    oxygenTotal: '',
    oxygenAvailable: '',
    ventilatorTotal: '',
    ventilatorAvailable: '',
  });

  const [activeTab, setActiveTab] = useState('beds'); // 'beds' | 'appointments' | 'profile'
  const [loading, setLoading] = useState(true);
  const [bedSaving, setBedSaving] = useState(false);
  const [bedMessage, setBedMessage] = useState({ type: '', text: '' });

  // Appointment status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [targetStatus, setTargetStatus] = useState('confirmed');
  const [hospitalNotes, setHospitalNotes] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadHospitalData = async () => {
    setLoading(true);
    try {
      const managedHospitalId = typeof user?.managedHospital === 'string'
        ? user.managedHospital
        : user?.managedHospital?._id;
      const res = managedHospitalId
        ? await hospitalService.getHospitalById(managedHospitalId)
        : await hospitalService.getHospitals({ limit: 1, isVerified: 'true' });
      const targetHosp = managedHospitalId ? res.hospital : res.hospitals?.[0];

      if (res.success && targetHosp) {
        setHospital(targetHosp);

        if (targetHosp.bedInventory) {
          const b = targetHosp.bedInventory;
          setBedForm({
            totalBeds: b.totalBeds,
            occupiedBeds: b.occupiedBeds,
            availableBeds: b.availableBeds,
            icuTotal: b.icuBeds?.total ?? '',
            icuAvailable: b.icuBeds?.available ?? '',
            oxygenTotal: b.oxygenBeds?.total ?? '',
            oxygenAvailable: b.oxygenBeds?.available ?? '',
            ventilatorTotal: b.ventilatorBeds?.total ?? '',
            ventilatorAvailable: b.ventilatorBeds?.available ?? '',
          });
        } else {
          setBedForm({
            totalBeds: '',
            occupiedBeds: '',
            availableBeds: '',
            icuTotal: '',
            icuAvailable: '',
            oxygenTotal: '',
            oxygenAvailable: '',
            ventilatorTotal: '',
            ventilatorAvailable: '',
          });
        }

        // Fetch appointments for this hospital
        const apptRes = await hospitalService.getHospitalAppointments(targetHosp._id);
        if (apptRes.success) {
          setAppointments(apptRes.appointments);
        }
      }
    } catch (err) {
      console.error('Failed to load hospital dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitalData();
  }, [user]);

  const handleBedUpdate = async (e) => {
    e.preventDefault();
    setBedSaving(true);
    setBedMessage({ type: '', text: '' });

    const counts = Object.values(bedForm);
    if (counts.some((count) => !Number.isSafeInteger(count) || count < 0)) {
      setBedMessage({
        type: 'error',
        text: 'Enter a non-negative whole number for every bed count before publishing availability.',
      });
      setBedSaving(false);
      return;
    }

    if (bedForm.occupiedBeds + bedForm.availableBeds > bedForm.totalBeds) {
      setBedMessage({
        type: 'error',
        text: 'Validation Error: Sum of occupied and available beds cannot exceed total capacity.',
      });
      setBedSaving(false);
      return;
    }

    if (
      bedForm.icuAvailable > bedForm.icuTotal
      || bedForm.oxygenAvailable > bedForm.oxygenTotal
      || bedForm.ventilatorAvailable > bedForm.ventilatorTotal
    ) {
      setBedMessage({
        type: 'error',
        text: 'Available ICU, oxygen, and ventilator beds cannot exceed their respective totals.',
      });
      setBedSaving(false);
      return;
    }

    try {
      const res = await hospitalService.updateHospitalBeds(hospital._id, bedForm);
      if (res.success) {
        setBedMessage({ type: '', text: '' });
        notify(res.message || 'Bed availability updated successfully.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Bed inventory update failed.';
      setBedMessage({ type: 'error', text: message });
      notify(message, 'error');
    } finally {
      setBedSaving(false);
    }
  };

  const openStatusModal = (appt, status) => {
    setSelectedAppt(appt);
    setTargetStatus(status);
    setHospitalNotes('');
    setStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setStatusUpdating(true);
    try {
      const res = await hospitalService.updateAppointmentStatus(selectedAppt._id, {
        status: targetStatus,
        hospitalNotes,
      });
      if (res.success) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === selectedAppt._id ? res.appointment : a))
        );
        setStatusModalOpen(false);
        notify(res.message || `Appointment successfully marked as ${targetStatus}.`);
      }
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update appointment status.', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hospital Header Overview */}
        <div className="p-6 rounded-3xl bg-[#171717] border border-[#303030] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-red-500/20">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">
                  {hospital?.name || 'Hospital Administration'}
                </h1>
                {hospital?.isVerified ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-900">
                    Verified Facility
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-900">
                    Pending Platform Approval
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                {hospital?.city} • Admin Operator: <strong className="text-white">{user?.name}</strong> ({user?.email})
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 bg-[#202020] p-1.5 rounded-2xl border border-[#303030]">
            <button
              onClick={() => setActiveTab('beds')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'beds' ? 'bg-red-500 text-white shadow-md' : 'text-text-secondary hover:text-white'
              }`}
            >
              Bed Inventory
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'appointments' ? 'bg-red-500 text-white shadow-md' : 'text-text-secondary hover:text-white'
              }`}
            >
              <span>Appointments</span>
              {appointments.filter((a) => a.status === 'pending').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-red-600 text-[10px] font-extrabold flex items-center justify-center">
                  {appointments.filter((a) => a.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Bed Inventory Manager */}
        {activeTab === 'beds' && (
          <div className="bg-[#171717] border border-[#303030] rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#303030]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bed className="w-5 h-5 text-red-500" />
                  Live Bed Capacity & Critical Inventory Management
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Update your hospital-reported bed availability. Calculations are mathematically verified before saving.
                </p>
                {!hospital?.bedInventory && (
                  <p className="text-xs text-amber-300 mt-2">
                    No bed availability has been published yet. Enter current hospital-reported counts; no sample values are prefilled.
                  </p>
                )}
              </div>
            </div>

            {bedMessage.text && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  bedMessage.type === 'error'
                    ? 'bg-red-950/80 border border-red-900 text-red-300'
                    : 'bg-emerald-950/80 border border-emerald-900 text-emerald-300'
                }`}
              >
                {bedMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{bedMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleBedUpdate} className="space-y-6 text-xs">
              {/* Primary Bed Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#202020] border border-[#303030] space-y-1.5">
                  <label className="block text-text-secondary font-medium">Total Sanctioned Beds *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={bedForm.totalBeds}
                    onChange={(e) => {
                      const total = e.target.value === '' ? '' : Number(e.target.value);
                      setBedForm({
                        ...bedForm,
                        totalBeds: total,
                        availableBeds: total === '' || bedForm.occupiedBeds === ''
                          ? ''
                          : Math.max(0, total - bedForm.occupiedBeds),
                      });
                    }}
                    className="w-full bg-[#171717] border border-[#303030] rounded-xl px-3 py-2 text-white font-bold text-lg focus:outline-none focus:border-red-500"
                  />
                  <p className="text-[10px] text-text-secondary">Official certified bed complement</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#202020] border border-[#303030] space-y-1.5">
                  <label className="block text-text-secondary font-medium">Occupied Beds *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={bedForm.occupiedBeds}
                    onChange={(e) => {
                      const occ = e.target.value === '' ? '' : Number(e.target.value);
                      setBedForm({
                        ...bedForm,
                        occupiedBeds: occ,
                        availableBeds: bedForm.totalBeds === '' || occ === ''
                          ? ''
                          : Math.max(0, bedForm.totalBeds - occ),
                      });
                    }}
                    className="w-full bg-[#171717] border border-[#303030] rounded-xl px-3 py-2 text-amber-400 font-bold text-lg focus:outline-none focus:border-red-500"
                  />
                  <p className="text-[10px] text-text-secondary">Currently admitted inpatients</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#202020] border border-[#303030] space-y-1.5">
                  <label className="block text-text-secondary font-medium">Available Vacant Beds</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={bedForm.availableBeds}
                    onChange={(e) => setBedForm({
                      ...bedForm,
                      availableBeds: e.target.value === '' ? '' : Number(e.target.value),
                    })}
                    className="w-full bg-[#171717] border border-[#303030] rounded-xl px-3 py-2 text-emerald-400 font-bold text-lg focus:outline-none focus:border-red-500"
                  />
                  <p className="text-[10px] text-text-secondary">Immediately available for admissions</p>
                </div>
              </div>

              {/* Specialized ICU, Oxygen & Ventilator Wings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#303030]">
                {/* ICU */}
                <div className="p-4 rounded-2xl bg-[#202020] border border-[#303030] space-y-3">
                  <span className="font-bold text-white block">ICU Critical Care Beds</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-text-secondary block">Total ICU</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={bedForm.icuTotal}
                        onChange={(e) => setBedForm({ ...bedForm, icuTotal: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full bg-[#171717] border border-[#303030] rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-secondary block">Avail. ICU</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={bedForm.icuAvailable}
                        onChange={(e) => setBedForm({ ...bedForm, icuAvailable: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full bg-[#171717] border border-[#303030] rounded-lg p-2 text-emerald-400 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Oxygen */}
                <div className="p-4 rounded-2xl bg-[#202020] border border-[#303030] space-y-3">
                  <span className="font-bold text-white block">Oxygen Supported Beds</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-text-secondary block">Total Oxygen</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={bedForm.oxygenTotal}
                        onChange={(e) => setBedForm({ ...bedForm, oxygenTotal: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full bg-[#171717] border border-[#303030] rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-secondary block">Avail. Oxygen</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={bedForm.oxygenAvailable}
                        onChange={(e) => setBedForm({ ...bedForm, oxygenAvailable: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full bg-[#171717] border border-[#303030] rounded-lg p-2 text-emerald-400 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Ventilators */}
                <div className="p-4 rounded-2xl bg-[#202020] border border-[#303030] space-y-3">
                  <span className="font-bold text-white block">Ventilators</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-text-secondary block">Total Units</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={bedForm.ventilatorTotal}
                        onChange={(e) => setBedForm({ ...bedForm, ventilatorTotal: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full bg-[#171717] border border-[#303030] rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-secondary block">Avail. Units</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={bedForm.ventilatorAvailable}
                        onChange={(e) => setBedForm({ ...bedForm, ventilatorAvailable: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full bg-[#171717] border border-[#303030] rounded-lg p-2 text-emerald-400 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="primary" size="md" type="submit" loading={bedSaving} icon={Save}>
                  Save & Broadcast Bed Inventory
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Appointment Requests */}
        {activeTab === 'appointments' && (
          <div className="bg-[#171717] border border-[#303030] rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                Patient Appointment Requests ({appointments.length})
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Review and confirm or decline incoming patient appointments.
              </p>
            </div>

            {appointments.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-10">No incoming appointments yet.</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <div
                    key={appt._id}
                    className="p-5 rounded-2xl bg-[#202020] border border-[#303030] space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-white text-sm">{appt.patientName}</span>
                        <span className="text-text-secondary ml-2">({appt.patientGender}, {appt.patientAge || 30} yrs)</span>
                        <span className="block text-[11px] text-text-secondary mt-0.5">
                          Department: <strong className="text-white">{appt.department}</strong>
                        </span>
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 border-y border-[#2a2a2a] text-zinc-300">
                      <div>
                        <span className="text-[10px] text-text-secondary block">Date & Slot:</span>
                        <strong>{new Date(appt.preferredDate).toLocaleDateString()} at {appt.preferredTime}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-secondary block">Phone:</span>
                        <a href={`tel:${appt.patientPhone}`} className="text-red-400 hover:underline">{appt.patientPhone}</a>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-secondary block">Email:</span>
                        <span className="truncate">{appt.patientEmail}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-text-secondary block">Reason / Chief Complaint:</span>
                      <p className="text-white italic mt-0.5">"{appt.reasonForVisit}"</p>
                    </div>

                    {appt.hospitalNotes && (
                      <div className="p-2.5 rounded-lg bg-[#171717] border border-[#303030] text-[11px] text-zinc-300">
                        <strong>Hospital Note:</strong> {appt.hospitalNotes}
                      </div>
                    )}

                    {appt.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          variant="danger"
                          size="sm"
                          icon={XCircle}
                          onClick={() => openStatusModal(appt, 'rejected')}
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={() => openStatusModal(appt, 'confirmed')}
                        >
                          Confirm Appointment
                        </Button>
                      </div>
                    )}

                    {appt.status === 'confirmed' && (
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={() => openStatusModal(appt, 'completed')}
                        >
                          Mark Completed
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`${targetStatus === 'confirmed' ? 'Confirm' : targetStatus === 'completed' ? 'Complete' : 'Decline'} Appointment`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
          <p className="text-text-secondary">
            You are setting appointment status for <strong className="text-white">{selectedAppt?.patientName}</strong> to{' '}
            <span className="font-bold uppercase text-red-400">{targetStatus}</span>.
          </p>

          <div>
            <label className="block text-text-secondary mb-1">Optional Hospital Instructions / Note to Patient</label>
            <textarea
              rows="3"
              value={hospitalNotes}
              onChange={(e) => setHospitalNotes(e.target.value)}
              placeholder="e.g. Please bring previous records, report at OPD Room 12, fasting required..."
              className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={targetStatus === 'rejected' ? 'danger' : 'primary'}
              size="sm"
              type="submit"
              loading={statusUpdating}
            >
              Update Status
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HospitalDashboard;
