const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const BedInventory = require('../models/BedInventory');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { recordAuditLog } = require('../middleware/audit');

// @desc    Get platform administrative analytics
// @route   GET /api/admin/analytics
// @access  Private (platform_admin)
const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalHospitals,
      verifiedHospitals,
      pendingHospitals,
      totalUsers,
      patientCount,
      hospitalAdminCount,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      bedStats,
      recentAuditLogs,
    ] = await Promise.all([
      Hospital.countDocuments(),
      Hospital.countDocuments({ isVerified: true }),
      Hospital.countDocuments({ isVerified: false, verificationStatus: 'pending' }),
      User.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'hospital_admin' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      BedInventory.aggregate([
        {
          $group: {
            _id: null,
            totalBeds: { $sum: '$totalBeds' },
            occupiedBeds: { $sum: '$occupiedBeds' },
            availableBeds: { $sum: '$availableBeds' },
          },
        },
      ]),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const bedTotals = bedStats[0] || { totalBeds: 0, occupiedBeds: 0, availableBeds: 0 };

    res.json({
      success: true,
      stats: {
        hospitals: {
          total: totalHospitals,
          verified: verifiedHospitals,
          pending: pendingHospitals,
        },
        users: {
          total: totalUsers,
          patients: patientCount,
          hospitalAdmins: hospitalAdminCount,
        },
        appointments: {
          total: totalAppointments,
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
        },
        beds: bedTotals,
      },
      recentAuditLogs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all hospitals for admin review
// @route   GET /api/admin/hospitals
// @access  Private (platform_admin)
const getAdminHospitals = async (req, res, next) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      if (status === 'verified') query.isVerified = true;
      else if (status === 'pending') query.verificationStatus = 'pending';
      else if (status === 'rejected') query.verificationStatus = 'rejected';
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [hospitals, total] = await Promise.all([
      Hospital.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('adminId', 'name email phone')
        .populate('bedInventory')
        .lean(),
      Hospital.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: hospitals.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      hospitals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hospital verification status (Approve / Reject)
// @route   PATCH /api/admin/hospitals/:id/verification
// @access  Private (platform_admin)
const updateHospitalVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or pending.',
      });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found.' });
    }

    hospital.verificationStatus = status;
    hospital.isVerified = status === 'approved';
    await hospital.save();

    // Notify hospital admin if one is assigned
    if (hospital.adminId) {
      await Notification.create({
        userId: hospital.adminId,
        title: `Hospital ${status === 'approved' ? 'Verified & Listed' : 'Verification Status Updated'}`,
        message: `Your hospital registration for "${hospital.name}" has been marked as ${status} by the platform administrator.`,
        type: 'hospital_verified',
        link: '/hospital/dashboard',
      });
    }

    await recordAuditLog({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: `HOSPITAL_VERIFICATION_${status.toUpperCase()}`,
      entityType: 'Hospital',
      entityId: hospital._id,
      details: { hospitalName: hospital.name, status, isVerified: hospital.isVerified },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Hospital verification status updated to ${status}.`,
      hospital,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users for platform management
// @route   GET /api/admin/users
// @access  Private (platform_admin)
const getAdminUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('managedHospital', 'name city')
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (platform_admin)
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Platform administrators cannot deactivate their own account.',
      });
    }

    if (isActive !== undefined) user.isActive = !!isActive;
    if (role && ['patient', 'hospital_admin', 'platform_admin'].includes(role)) {
      user.role = role;
    }

    await user.save();

    await recordAuditLog({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'USER_STATUS_UPDATED',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email, isActive: user.isActive, role: user.role },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'User status updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (platform_admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const { entityType, page = 1, limit = 30 } = req.query;
    const query = {};

    if (entityType && entityType !== 'All') {
      query.entityType = entityType;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 30;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
  getAdminHospitals,
  updateHospitalVerification,
  getAdminUsers,
  updateUserStatus,
  getAuditLogs,
};

