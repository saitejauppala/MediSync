const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAdminHospitals,
  updateHospitalVerification,
  getAdminUsers,
  updateUserStatus,
  getAuditLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes strictly protected and restricted to platform_admin
router.use(protect);
router.use(authorize('platform_admin'));

router.get('/analytics', getAnalytics);
router.get('/hospitals', getAdminHospitals);
router.patch('/hospitals/:id/verification', updateHospitalVerification);
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/audit-logs', getAuditLogs);

module.exports = router;

