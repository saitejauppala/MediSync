import React, { useState, useEffect } from 'react';
import {
  Shield,
  Building2,
  Users,
  Calendar,
  Bed,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import hospitalService from '../../services/hospitalService';
import { VerifiedBadge, Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'hospitals' | 'users' | 'audit'
  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, hospRes, usersRes, auditRes] = await Promise.all([
        hospitalService.getAdminAnalytics(),
        hospitalService.getAdminHospitals({ limit: 50 }),
        hospitalService.getAdminUsers({ limit: 50 }),
        hospitalService.getAuditLogs({ limit: 30 }),
      ]);

      if (analyticsRes.success) setStats(analyticsRes.stats);
      if (hospRes.success) setHospitals(hospRes.hospitals);
      if (usersRes.success) setUsers(usersRes.users);
      if (auditRes.success) setAuditLogs(auditRes.logs);
    } catch (err) {
      console.error('Failed to load platform admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleVerification = async (hospitalId, currentStatus) => {
    const nextStatus = currentStatus === 'approved' ? 'rejected' : 'approved';
    try {
      const res = await hospitalService.updateHospitalVerification(hospitalId, nextStatus);
      if (res.success) {
        setHospitals((prev) =>
          prev.map((h) => (h._id === hospitalId ? { ...h, isVerified: nextStatus === 'approved', verificationStatus: nextStatus } : h))
        );
        // Refresh analytics
        const aRes = await hospitalService.getAdminAnalytics();
        if (aRes.success) setStats(aRes.stats);
      }
    } catch (err) {
      console.error('Failed to update verification:', err);
    }
  };

  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      const res = await hospitalService.updateUserStatus(userId, { isActive: !currentActive });
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive: !currentActive } : u))
        );
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Admin Header */}
        <div className="p-6 rounded-3xl bg-[#171717] border border-[#303030] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-red-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">Platform Administration</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-900 uppercase">
                  Apex Access
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Centralized oversight for hospital verification, bed inventory audit trails, and user management.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#202020] p-1.5 rounded-2xl border border-[#303030]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'overview' ? 'bg-red-500 text-white shadow-md' : 'text-text-secondary hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('hospitals')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 ${
                activeTab === 'hospitals' ? 'bg-red-500 text-white shadow-md' : 'text-text-secondary hover:text-white'
              }`}
            >
              <span>Hospitals Verification</span>
              {stats?.hospitals?.pending > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {stats.hospitals.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'users' ? 'bg-red-500 text-white shadow-md' : 'text-text-secondary hover:text-white'
              }`}
            >
              Users & Roles
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'audit' ? 'bg-red-500 text-white shadow-md' : 'text-text-secondary hover:text-white'
              }`}
            >
              Audit Trail
            </button>
          </div>
        </div>

        {/* Tab 1: Overview KPIs */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#171717] border border-[#303030] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">Hospitals Listed</span>
                  <Building2 className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{stats.hospitals.total}</span>
                  <span className="text-xs text-emerald-400 font-semibold">{stats.hospitals.verified} verified</span>
                </div>
                <p className="text-[11px] text-amber-400 font-medium">
                  {stats.hospitals.pending} registration(s) pending review
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#171717] border border-[#303030] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">Registered Users</span>
                  <Users className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{stats.users.total}</span>
                  <span className="text-xs text-text-secondary">({stats.users.patients} patients)</span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  {stats.users.hospitalAdmins} facility administrator accounts
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#171717] border border-[#303030] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">Appointment Requests</span>
                  <Calendar className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{stats.appointments.total}</span>
                  <span className="text-xs text-emerald-400 font-semibold">{stats.appointments.confirmed} confirmed</span>
                </div>
                <p className="text-[11px] text-amber-400 font-medium">
                  {stats.appointments.pending} pending facility review
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#171717] border border-[#303030] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">Live Bed Complement</span>
                  <Bed className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400">{stats.beds.availableBeds}</span>
                  <span className="text-xs text-text-secondary">/ {stats.beds.totalBeds} total</span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  {stats.beds.occupiedBeds} occupied inpatient beds
                </p>
              </div>
            </div>

            {/* Recent Audit Activity Snapshot */}
            <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                Recent Platform Audit Logs
              </h3>
              <div className="divide-y divide-[#262626] text-xs">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log._id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white mr-2">{log.action}</span>
                      <span className="text-text-secondary">
                        by {log.actorEmail} ({log.actorRole})
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Hospitals Approval Queue */}
        {activeTab === 'hospitals' && (
          <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
              <div>
                <h2 className="text-lg font-bold text-white">Hospital Registration Verification Queue</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Review submitted healthcare facilities and approve them for public listing.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#202020] border border-[#303030] rounded-xl px-3 py-1.5">
                <Search className="w-4 h-4 text-red-500" />
                <input
                  type="text"
                  placeholder="Filter by hospital name or city..."
                  value={hospitalSearch}
                  onChange={(e) => setHospitalSearch(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none placeholder-text-secondary"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#303030]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#202020] text-text-secondary uppercase font-bold text-[10px] border-b border-[#303030]">
                  <tr>
                    <th className="p-3">Hospital Name</th>
                    <th className="p-3">City & Locality</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Emergency</th>
                    <th className="p-3">Verification Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {hospitals
                    .filter((h) =>
                      h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
                      h.city.toLowerCase().includes(hospitalSearch.toLowerCase())
                    )
                    .map((h) => (
                      <tr key={h._id} className="hover:bg-[#1f1f1f] transition-colors">
                        <td className="p-3 font-bold text-white">
                          <Link to={`/hospitals/${h._id}`} className="hover:text-red-400">
                            {h.name}
                          </Link>
                          <span className="block text-[10px] text-text-secondary font-normal">
                            Phone: {h.phone}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-300">
                          {h.locality ? `${h.locality}, ` : ''}{h.city}
                        </td>
                        <td className="p-3">
                          <Badge variant={h.type === 'Government' ? 'govt' : 'private'}>{h.type}</Badge>
                        </td>
                        <td className="p-3">
                          {h.hasEmergency ? (
                            <span className="text-red-400 font-bold">24/7 Acute</span>
                          ) : (
                            <span className="text-text-secondary">Standard</span>
                          )}
                        </td>
                        <td className="p-3">
                          {h.isVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Listed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                              <AlertCircle className="w-3.5 h-3.5" /> Pending Review
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant={h.isVerified ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleToggleVerification(h._id, h.verificationStatus)}
                          >
                            {h.isVerified ? 'Revoke Approval' : 'Approve & List'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: User Management */}
        {activeTab === 'users' && (
          <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
              <div>
                <h2 className="text-lg font-bold text-white">Platform User Management</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Inspect user accounts and toggle active account status.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#202020] border border-[#303030] rounded-xl px-3 py-1.5">
                <Search className="w-4 h-4 text-red-500" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none placeholder-text-secondary"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#303030]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#202020] text-text-secondary uppercase font-bold text-[10px] border-b border-[#303030]">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Contact Phone</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {users
                    .filter((u) =>
                      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map((u) => (
                      <tr key={u._id} className="hover:bg-[#1f1f1f] transition-colors">
                        <td className="p-3">
                          <strong className="text-white block">{u.name}</strong>
                          <span className="text-[11px] text-text-secondary">{u.email}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950 text-red-400 border border-red-900">
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-300">{u.phone || '—'}</td>
                        <td className="p-3">
                          {u.isActive ? (
                            <span className="text-emerald-400 font-semibold">Active</span>
                          ) : (
                            <span className="text-red-400 font-semibold">Disabled</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                            className="px-2.5 py-1 rounded-lg border border-[#303030] text-xs hover:bg-[#282828] text-white"
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                Immutable System Audit Logs
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Full cryptographic history of administrative verifications, user logins, and bed updates.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#303030]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#202020] text-text-secondary uppercase font-bold text-[10px] border-b border-[#303030]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Entity Type</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="p-3 text-zinc-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-red-400">{log.action}</td>
                      <td className="p-3 text-white">
                        {log.actorEmail}
                        <span className="block text-[10px] text-text-secondary uppercase">{log.actorRole}</span>
                      </td>
                      <td className="p-3 text-zinc-300">{log.entityType}</td>
                      <td className="p-3 text-[11px] text-text-secondary font-mono max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

